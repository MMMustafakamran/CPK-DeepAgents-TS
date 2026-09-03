import { execSync } from 'node:child_process';
import os from 'node:os';
import { type Page } from 'playwright';
import { closeNotepad, openNotepad, typeInNotepad } from './overlays/notepad';
import { sleep } from './overlays/cursor';
import { readCopilotKitVersions } from './versions';
import { type KnownIssue } from './types';

/**
 * The scribbled note at the end of a defect take.
 *
 * Every issue clip ends the same way: the tester opens Notepad over the still
 * visible failure and writes down what just happened.
 *
 * It is written the way a person writes at the end of a test, not the way a
 * report is filed. Lower case, no headings, no "Expected impact:" labels --
 * just what was done, what happened, and what it probably means. The formal
 * version of the same finding is what `ci/build-report.mjs` renders into
 * DOCUMENTED_REPORT.md from the very same `KnownIssue`; that one is for the
 * manager, this one is a person thinking out loud on camera. A neatly formatted
 * memo appearing in Notepad at human typing speed reads as staged, which is the
 * one thing these clips cannot afford.
 */

/** `npm -v`, or null. Cached: it costs a process spawn and never changes mid-run. */
let npmVersion: string | null | undefined;

function readNpmVersion(): string | null {
  if (npmVersion !== undefined) return npmVersion;
  try {
    // One command string through the shell, with no args array.
    //
    // Both obvious alternatives fail here. `execFileSync('npm', ['-v'])` is
    // ENOENT on Windows, where npm is a .cmd rather than an executable, and
    // `execFileSync('npm.cmd', ['-v'])` is EINVAL on Node 26, which refuses to
    // run a batch file without a shell. Adding `shell: true` to either fixes
    // the spawn and then trips DEP0190 -- the deprecation for passing an argv
    // array through a shell -- printing a warning over the recorder's output on
    // every take. A single string has no argv to escape, so none of that
    // applies.
    npmVersion = execSync('npm -v', {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    npmVersion = null;
  }
  return npmVersion;
}

/**
 * Two short lines of environment, read from the machine doing the recording.
 *
 * Hand-typed version numbers in a bug report go stale within a release and
 * nobody notices, because the number still looks like a number.
 */
function contextLines(): string[] {
  const lines: string[] = [];

  const versions = readCopilotKitVersions();
  if (versions.length > 0) {
    const distinct = [...new Set(versions.map((v) => v.version))];
    lines.push(
      distinct.length === 1
        ? `copilotkit ${distinct[0]} - ${versions.map((v) => v.pkg).join(' ')}`
        : versions.map((v) => `${v.pkg} ${v.version}`).join(' / '),
    );
  }

  const npm = readNpmVersion();
  lines.push(npm ? `npm ${npm} / ${osLabel()}` : osLabel());

  return lines;
}

/**
 * The OS the way a person would write it, not the way the kernel reports it.
 *
 * `os.release()` says 10.0.26200 on Windows 11, because 11 never bumped the
 * major version. Nobody writing a bug report types that, and a reader who sees
 * "windows 10" on a Windows 11 machine has been told something false.
 */
function osLabel(): string {
  if (process.platform === 'win32') {
    const build = Number(os.release().split('.')[2] ?? 0);
    return build >= 22000 ? 'windows 11' : 'windows 10';
  }
  if (process.platform === 'darwin') return `macos ${os.release()}`;
  return `${os.type().toLowerCase()} ${os.release()}`;
}

/**
 * Falls back to the structured fields when a page has no hand-written `note`.
 *
 * Deliberately lossy -- it drops the labels, lower-cases the openings and keeps
 * only what a person would bother writing down. Still stiffer than a real note,
 * which is why `note` exists and why the pages that matter set it.
 */
function derivedNote(issue: KnownIssue): string {
  const soften = (s: string) =>
    s
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/^./, (c) => c.toLowerCase())
      .replace(/\.$/, '');

  return [
    issue.area.toLowerCase(),
    '',
    soften(issue.problem),
    '',
    soften(issue.likelyCause),
  ].join('\n');
}

export interface IssueNoteOptions {
  /** Filename on the Notepad tab. Defaults to `<page-id>-issue.txt`. */
  fileName?: string;
  /** Beat before Notepad opens, so the failure is on screen a moment first. */
  leadInMs?: number;
  /** Per-character delay. Fast enough that a short note does not outstay it. */
  charDelayMs?: number;
  /**
   * Anything the take learned at runtime that belongs in the note -- the actual
   * console line, say. Appended before the version lines.
   */
  extraLines?: string[];
}

/** Renders a KnownIssue as the text that gets typed into Notepad. */
export function formatIssueNote(issue: KnownIssue, extraLines: string[] = []): string {
  const parts = [issue.note?.trim() || derivedNote(issue)];

  if (extraLines.length > 0) parts.push('', ...extraLines);
  parts.push('', ...contextLines());

  return parts.join('\n');
}

/**
 * Opens Notepad from the taskbar, types the note, and closes it.
 *
 * The failure stays on screen behind the window on purpose -- the note and the
 * thing it describes are in the same frame, so the clip does not depend on the
 * viewer remembering what happened thirty seconds ago.
 */
export async function writeIssueNote(
  page: Page,
  pageId: string,
  issue: KnownIssue,
  opts: IssueNoteOptions = {},
): Promise<void> {
  const {
    fileName = `${pageId}.txt`,
    leadInMs = 1200,
    charDelayMs = 30,
    extraLines = [],
  } = opts;

  console.log(`   📝 [${pageId}] Writing the note in Notepad...`);
  await sleep(leadInMs);
  await openNotepad(page, fileName);
  await typeInNotepad(page, formatIssueNote(issue, extraLines), {
    charDelayMs,
    thinkChance: 0.05,
  });
  await closeNotepad(page);
}
