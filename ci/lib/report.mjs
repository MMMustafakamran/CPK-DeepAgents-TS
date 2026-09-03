/**
 * RUN_REPORT.md / RUN_REPORT.json — the artifact a run is judged by.
 *
 * The markdown is appended to the GitHub step summary by the workflow, so it
 * has to read well on its own without the job log next to it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { FRONTEND_PORT, BACKEND_PORT, FRONTEND_DIR, BACKEND_DIR, VIDEOS_DIR } from './config.mjs';

/**
 * What actually ran -- not what package.json asks for.
 *
 * ci/automate.mjs drops the lockfile by default, so a run deliberately tests
 * the newest versions the declared ranges allow. Reading `pkg.dependencies`
 * therefore reported the FLOOR of a range rather than the version under test:
 * a run against @copilotkit/react-core 1.69.3 reported "^1.69.2". That made
 * the report misleading about the one thing the run exists to discover, and
 * the disagreement only surfaced when a separate resolved-version report was
 * put next to it.
 *
 * Read the installed tree instead, and keep the declared range alongside when
 * the two differ, so a range bump is still visible.
 */
function resolveVersion(dir, pkg, name) {
  const declared = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
  let installed;
  try {
    const manifest = path.join(dir, 'node_modules', ...name.split('/'), 'package.json');
    installed = JSON.parse(fs.readFileSync(manifest, 'utf8')).version;
  } catch {
    // Not installed: a report written before install, or after a failed one.
  }
  if (!declared && !installed) return 'n/a';
  if (!installed) return `${declared} (not installed)`;
  if (!declared) return installed;
  return declared === installed ? installed : `${installed} (declared ${declared})`;
}

/**
 * Backend versions, read from the installed tree rather than the specifiers.
 *
 * The same defect the frontend map had: package.json declares ranges
 * (`deepagents: ^1.12.2`) while ci/automate.mjs installs without the lockfile
 * by default, so a run deliberately resolves past them. Reporting the
 * specifier therefore named a version the run had moved off — and named it
 * "Version".
 *
 * This backend is Node, like the frontend, so `resolveVersion` already does the
 * right thing: read `backend/node_modules/<name>/package.json` and keep the
 * declared range alongside when the two differ.
 *
 * Derived from the manifest's own dependency list rather than a hardcoded set
 * of interesting names, so adding a dependency cannot silently leave it out of
 * every future report.
 */
function backendVersions(dir) {
  const out = {};
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  } catch {
    return out;
  }

  // The runtime the LangGraph CLI is told to use, which is not a dependency and
  // is the first thing to check when a graph fails to import.
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'langgraph.json'), 'utf8'));
    if (manifest.node_version) out['node (declared)'] = String(manifest.node_version);
  } catch {
    // No manifest: not a LangGraph CLI backend, or a bare checkout.
  }
  out['node (running)'] = process.version;

  for (const name of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) {
    out[name] = resolveVersion(dir, pkg, name);
  }
  return out;
}

export function getPackageVersions() {
  const versions = { frontend: {}, backend: {} };
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(FRONTEND_DIR, 'package.json'), 'utf8'));
    versions.frontend = {
      '@copilotkit/react-core': resolveVersion(FRONTEND_DIR, pkg, '@copilotkit/react-core'),
      '@copilotkit/runtime': resolveVersion(FRONTEND_DIR, pkg, '@copilotkit/runtime'),
      // Not @copilotkit/a2ui-renderer: the four A2UI pages are out of scope for
      // this repo, so it is not a dependency here.
      '@ag-ui/client': resolveVersion(FRONTEND_DIR, pkg, '@ag-ui/client'),
      next: resolveVersion(FRONTEND_DIR, pkg, 'next'),
      react: resolveVersion(FRONTEND_DIR, pkg, 'react'),
    };
  } catch {
    // ignore
  }
  try {
    versions.backend = backendVersions(BACKEND_DIR);
  } catch {
    // ignore
  }
  return versions;
}

/**
 * Per-page outcomes, written by the recorder (`autorecorder/cli.ts`).
 *
 * Without this the videos table said "Recorded" beside every file, which is
 * true and useless: several pages here are recorded precisely because they are
 * broken, and a green tick next to one of those is how a defect quietly stops
 * being news.
 *
 * Sharded runs leave one file per shard; all of them are read and merged.
 */
function readRecordResults() {
  const byFilename = new Map();
  try {
    for (const f of fs.readdirSync(VIDEOS_DIR)) {
      if (!f.startsWith('RECORD_RESULTS') || !f.endsWith('.json')) continue;
      const parsed = JSON.parse(fs.readFileSync(path.join(VIDEOS_DIR, f), 'utf8'));
      for (const r of parsed.results ?? []) {
        if (r.filename) byFilename.set(r.filename, r);
      }
    }
  } catch {
    // No results file: a run that failed before recording, or a bare checkout.
  }
  return byFilename;
}

const OUTCOME_LABEL = {
  pass: '✅ Recorded',
  issue: '🐞 Documents a known issue',
  fail: '❌ Failed',
};

function listVideos() {
  const videos = [];
  try {
    for (const f of fs.readdirSync(VIDEOS_DIR)) {
      if (!f.endsWith('.webm') || f.startsWith('temp_')) continue;
      const stats = fs.statSync(path.join(VIDEOS_DIR, f));
      videos.push({ filename: f, sizeMB: `${(stats.size / (1024 * 1024)).toFixed(2)} MB` });
    }
  } catch {
    // ignore
  }
  return videos;
}

export function generateReport(data) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });

  const videos = listVideos();
  const report = {
    timestamp: new Date().toISOString(),
    status: data.success ? 'SUCCESS' : 'FAILED',
    args: data.args?.length > 0 ? data.args.join(' ') : 'all',
    refreshedDeps: Boolean(data.refreshed),
    docDrift: {
      checkedPages: data.driftResult?.total || 0,
      driftDetected: data.driftResult?.drifted || false,
      driftedPages: data.driftResult?.driftedPages || [],
    },
    packages: getPackageVersions(),
    healthChecks: data.health || {},
    videos,
    error: data.error || null,
  };

  fs.writeFileSync(
    path.join(VIDEOS_DIR, 'RUN_REPORT.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  );

  const lines = [];
  lines.push('# 📊 CopilotKit Automation & Recording Report\n');
  lines.push(`- **Status:** ${report.status === 'SUCCESS' ? '✅ **SUCCESS**' : '❌ **FAILED**'}`);
  lines.push(`- **Generated At:** \`${report.timestamp}\``);
  lines.push(`- **Execution Mode:** \`${report.args}\``);
  lines.push(`- **Dependencies:** \`${report.refreshedDeps ? 'Re-resolved (--refresh)' : 'From lockfile'}\`\n`);

  lines.push('## 1. 🔍 Doc Drift Check');
  if (report.docDrift.driftDetected) {
    lines.push(`⚠️ **Drift Detected** on ${report.docDrift.driftedPages.length} page(s):`);
    for (const p of report.docDrift.driftedPages) {
      lines.push(`- **[${p.severity}]** \`${p.docPath}\` (${p.file})`);
    }
  } else {
    lines.push(
      `✅ **No Doc Drift Detected:** All ${report.docDrift.checkedPages} pages match \`doc-snapshot/\`.`,
    );
  }
  lines.push('');

  lines.push('## 2. 📦 Package Versions');
  lines.push('### Frontend (`frontend/package.json`):');
  for (const [k, v] of Object.entries(report.packages.frontend)) {
    lines.push(`- **\`${k}\`**: \`${v}\``);
  }
  lines.push('\n### Backend (`backend/package.json`):');
  for (const [k, v] of Object.entries(report.packages.backend)) {
    lines.push(`- **\`${k}\`**: \`${v}\``);
  }
  lines.push('');

  lines.push('## 3. 🚀 Services & Health Checks');
  lines.push(
    `- **Backend Agent (\`:${BACKEND_PORT}/ok\`):** ${
      report.healthChecks.backend ? `✅ Healthy (${report.healthChecks.backend}s)` : '❌ Offline'
    }`,
  );
  lines.push(
    `- **Frontend Next.js (\`:${FRONTEND_PORT}\`):** ${
      report.healthChecks.frontend ? `✅ Healthy (${report.healthChecks.frontend}s)` : '❌ Offline'
    }\n`,
  );

  lines.push('## 4. 🎬 Generated Demo Videos');
  if (videos.length > 0) {
    const outcomes = readRecordResults();
    lines.push('| Video File | Status | Area | File Size |');
    lines.push('|---|---|---|---|');
    for (const v of videos) {
      const r = outcomes.get(v.filename);
      const status = r ? (OUTCOME_LABEL[r.outcome] ?? r.outcome) : '✅ Recorded';
      lines.push(`| \`${v.filename}\` | ${status} | ${r?.knownIssue?.area ?? ''} | ${v.sizeMB} |`);
    }
  } else {
    lines.push('*No videos recorded in this run.*');
  }
  lines.push('');

  if (report.error) {
    lines.push('## ⚠️ Failure Details');
    lines.push(`\`\`\`\n${report.error}\n\`\`\`\n`);
    lines.push('Server logs for this run are attached under `videos/logs/`.');
  }

  fs.writeFileSync(path.join(VIDEOS_DIR, 'RUN_REPORT.md'), lines.join('\n'), 'utf8');
  console.log(`\n📄 Execution report saved to: ${path.join(VIDEOS_DIR, 'RUN_REPORT.md')}`);
}
