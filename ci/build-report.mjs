/**
 * DOCUMENTED_REPORT.md — the QA report that gets sent on, built from the run.
 *
 * This is the deliverable. Everything else in `ci/` exists to produce a folder
 * of videos; this turns that folder into the document those videos are evidence
 * for, in the format the report has always been filed in.
 *
 * The reason it is generated rather than written is that the alternative has a
 * specific, predictable failure: a status table maintained by hand drifts away
 * from the recordings beside it, and the drift is invisible because both halves
 * still look right on their own. Here a page's status comes from what the
 * recorder actually observed, and its issue text comes from the same
 * `knownIssue` object the recorder typed into Notepad on video. The report and
 * the footage cannot disagree, because they are the same source.
 *
 * What it cannot do is judge. `[ISSUE]` means "this page is on the known-issues
 * list and recorded cleanly" — not "the defect was confirmed today". Confirming
 * that is what watching the clip is for, and the report says so where a reader
 * will see it.
 *
 *   node ci/build-report.mjs [--out <path>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { VIDEOS_DIR } from './lib/config.mjs';
import { getPackageVersions } from './lib/report.mjs';
import { PAGE_GROUPS } from './lib/pages.mjs';

/** Section headings, in doc-nav order. Keys are the groups in `lib/pages.mjs`. */
const GROUP_TITLES = {
  getting_started: 'Getting Started',
  generative_ui: 'Generative UI',
  a2ui: 'Generative UI · A2UI',
  app_control: 'App Control',
  shared_state: 'Shared State',
  predictive: 'Shared State · Predictive State Updates',
};

const STATUS = {
  pass: '✅ Passed',
  issue: '❌ Failed',
  fail: '⚠️ Not recorded',
};

/**
 * `issue` renders as "Failed", not as its own third status.
 *
 * The recorder distinguishes the two because a pipeline has to: a reproduced
 * defect must not turn CI red. A reader of this report does not care about that
 * distinction — the page is broken either way — and inventing a third status
 * for it would only invite the question of what it means.
 *
 * `fail` is the genuinely different one. It means the recording itself did not
 * work, so this report has nothing to say about the page and must not pretend
 * otherwise.
 */
function readResults() {
  const byId = new Map();
  let meta = null;

  let files = [];
  try {
    files = fs
      .readdirSync(VIDEOS_DIR)
      .filter((f) => f.startsWith('RECORD_RESULTS') && f.endsWith('.json'));
  } catch {
    return { results: [], meta: null };
  }

  for (const f of files) {
    let parsed;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(VIDEOS_DIR, f), 'utf8'));
    } catch {
      console.warn(`⚠️  Skipping unreadable results file: ${f}`);
      continue;
    }
    meta ??= parsed;

    // Staleness is decided per file, against that file's own `generatedAt`.
    //
    // Comparing every row to the newest stamp in the whole set was wrong, and
    // wrong in the worst direction: three shards finish minutes apart, so a
    // fifteen-page run produced three timestamps and the report told the reader
    // that ten freshly-recorded pages were carried over from an earlier run.
    //
    // A file's `generatedAt` is exactly the stamp its own run wrote, so a row
    // older than it is carried forward and a row equal to it is fresh. No
    // heuristics, no time windows, and it holds whether there is one file or
    // twenty.
    for (const r of parsed.results ?? []) {
      byId.set(r.id, { ...r, stale: !r.recordedAt || r.recordedAt !== parsed.generatedAt });
    }
  }

  // Registry order, so the report reads in doc-nav order however the shards
  // happened to be split.
  const results = [...byId.values()].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return { results, meta };
}

/** The "Tested context" block, from the tree the run installed. */
function testedContext() {
  const { frontend, backend } = getPackageVersions();
  const lines = [];
  for (const [k, v] of Object.entries(frontend ?? {})) lines.push(`- \`${k}\`: ${v}`);
  for (const [k, v] of Object.entries(backend ?? {})) lines.push(`- \`${k}\`: ${v}`);
  return lines;
}

/** The detail cell: prose for a clean page, the full report for a broken one. */
function detailCell(r, contextLines) {
  if (r.outcome === 'fail') {
    return `Recording did not complete, so this page was not assessed. ${r.error ?? ''}`.trim();
  }
  if (!r.knownIssue) {
    return r.warnings?.length ? r.warnings.join(' ') : 'Working as expected.';
  }

  const i = r.knownIssue;
  return [
    `**Area/Surface:** ${i.area}`,
    '',
    `**Problem:** ${i.problem}`,
    '',
    `**Expected impact:** ${i.impact}`,
    '',
    `**Likely Cause:** ${i.likelyCause}`,
    '',
    '**Tested context:**',
    ...contextLines,
    '',
    `**Recording:** \`${r.filename}\``,
  ]
    // A markdown table cell cannot contain newlines, and a pipe inside one ends
    // the cell early — which silently mangled every row carrying a code sample.
    .join('<br>')
    .replaceAll('|', '\\|');
}

export function buildDocumentedReport(outPath) {
  const { results, meta } = readResults();

  if (results.length === 0) {
    throw new Error(
      `No RECORD_RESULTS*.json found in ${VIDEOS_DIR}.\n` +
        'Record something first: `npm run automate`, or `npm run record` against running servers.',
    );
  }

  const contextLines = testedContext();
  const byId = new Map(results.map((r) => [r.id, r]));

  const counts = { pass: 0, issue: 0, fail: 0 };
  for (const r of results) counts[r.outcome] = (counts[r.outcome] ?? 0) + 1;

  const lines = [];
  lines.push('# Deep Agents (React / Python) — Status & QA Report');
  lines.push('');
  lines.push(`- **Run:** ${meta?.generatedAt ?? 'unknown'}`);
  lines.push(`- **Framework:** ${meta?.frameworkLabel ?? 'Deep Agents (Python)'}`);
  lines.push(
    `- **Pages recorded:** ${results.length} — ` +
      `${counts.pass ?? 0} passed, ${counts.issue ?? 0} failed, ` +
      `${counts.fail ?? 0} not recorded`,
  );
  lines.push('');
  lines.push(
    '> Generated by `ci/build-report.mjs` from this run\'s recordings. A row marked failed is a ' +
      'page on the known-issues list that recorded cleanly — watch its clip to confirm the ' +
      'defect still reproduces before sending this on.',
  );

  // Results carry forward across runs so that re-recording one page does not
  // erase the rest. The cost of that is a report whose rows can be of different
  // ages, and a stale row reads exactly like a fresh one. Say so when it
  // happens, and name the oldest, rather than letting the date at the top imply
  // every row was produced then.
  // `stale` is set per file in readResults. An undated row counts as stale:
  // the failure mode being guarded against is an old row that reads exactly
  // like a fresh one, and "no date" reads fresher than an old date does.
  const stale = results
    .filter((r) => r.stale)
    .map((r) => `${r.name} (${r.recordedAt ?? 'age unknown'})`);

  if (stale.length > 0) {
    lines.push('');
    lines.push(
      `> ⚠️ **Not all rows are from the same run.** ${stale.length} page(s) were carried ` +
        `forward from an earlier recording and have not been re-tested since: ` +
        `${stale.join('; ')}. Re-record them before sending if their status matters.`,
    );
  }

  lines.push('');

  for (const [key, ids] of Object.entries(PAGE_GROUPS)) {
    const rows = ids.map((id) => byId.get(id)).filter(Boolean);
    if (rows.length === 0) continue;

    lines.push(`## ${GROUP_TITLES[key] ?? key}`);
    lines.push('');
    lines.push('| Sub-Section | Status | Details & Issues |');
    lines.push('| :--- | :--- | :--- |');
    for (const r of rows) {
      const name = r.docUrl ? `[${r.name}](${r.docUrl})` : r.name;
      lines.push(`| **${name}** | ${STATUS[r.outcome] ?? r.outcome} | ${detailCell(r, contextLines)} |`);
    }
    lines.push('');
  }

  // A page in the registry but in no group would otherwise vanish from the
  // report while still being recorded. `assertGroupsCoverAllPages` is meant to
  // prevent that; this is the belt to its braces.
  const grouped = new Set(Object.values(PAGE_GROUPS).flat());
  const orphans = results.filter((r) => !grouped.has(r.id));
  if (orphans.length > 0) {
    lines.push('## Ungrouped');
    lines.push('');
    lines.push('| Sub-Section | Status | Details & Issues |');
    lines.push('| :--- | :--- | :--- |');
    for (const r of orphans) {
      lines.push(`| **${r.name}** | ${STATUS[r.outcome] ?? r.outcome} | ${detailCell(r, contextLines)} |`);
    }
    lines.push('');
  }

  const target = outPath ?? path.join(VIDEOS_DIR, 'DOCUMENTED_REPORT.md');
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, lines.join('\n'), 'utf8');
  return target;
}

// Guarded: this module is imported by automate.mjs, and argv[1] is undefined
// under `node -e` / `node --eval`, where an unguarded pathToFileURL throws
// during someone else's import.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--out');
  const out = i !== -1 ? process.argv[i + 1] : undefined;
  console.log(`Wrote ${buildDocumentedReport(out)}`);
}
