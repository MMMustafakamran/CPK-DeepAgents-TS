import { type Locator, type Page } from 'playwright';
import { AgentSilentError, waitForAgentResponseCompletion } from '../core/actions';
import { writeIssueNote } from '../core/issue-note';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageRecordConfig } from '../core/types';
import { type LogMark, serverLogSince, showNextIssues, showServerTerminal } from './error-evidence';

/**
 * Small helpers shared by the three handlers added on 2026-09-11 (Frontend-
 * Driven Cards, Memories, Learning). They live in `actions/` because `core/`
 * is frozen.
 */

/**
 * Glide the on-screen cursor to an element and click it, the way the other
 * handlers do by hand. Falls back to a plain click when the element has no box
 * yet (mid-layout), so a take never stalls on the cursor overlay.
 */
export async function glideClick(page: Page, target: Locator): Promise<void> {
  await target.scrollIntoViewIfNeeded().catch(() => {});
  const box = await target.boundingBox();
  if (box) {
    await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 20);
    await humanClick(page);
  } else {
    await target.click();
  }
}

/** Rest the cursor on an element so the viewer's eye lands there. */
export async function glideTo(page: Page, target: Locator, pauseMs = 1500): Promise<void> {
  const box = await target.boundingBox().catch(() => null);
  if (box) await humanGlide(page, box.x + Math.min(box.width / 2, 240), box.y + box.height / 2, 25);
  await sleep(pauseMs);
}

/**
 * Poll an element's text until `test` passes or the time runs out. Returns the
 * last text seen either way, so the caller decides what a miss means.
 */
export async function waitForText(
  target: Locator,
  test: (text: string) => boolean,
  timeoutMs: number,
): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  let last = '';
  while (Date.now() < deadline) {
    last = ((await target.textContent({ timeout: 1000 }).catch(() => '')) ?? '').trim();
    if (test(last)) return last;
    await sleep(500);
  }
  return last;
}

/**
 * Whether an element becomes visible within `timeoutMs`.
 *
 * Not `locator.isVisible({ timeout })`: Playwright ignores that timeout and
 * answers immediately, which on a cold `next dev` route reads "not there yet"
 * as "never there". Seen on the first Frontend-Cards take, where the crash
 * pane appeared seconds after the check had already given up.
 */
export async function visibleWithin(target: Locator, timeoutMs: number): Promise<boolean> {
  return target
    .waitFor({ state: 'visible', timeout: timeoutMs })
    .then(() => true)
    .catch(() => false);
}

/** Wait for the network to go quiet after a remount, then a short settle. */
export async function settle(page: Page, ms = 1200): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  await sleep(ms);
}

/**
 * The end of every defect take here: the real Next.js issues overlay, then the
 * dev servers' own lines from this take, then the ONE note -- the page's
 * `knownIssue.note`, typed by core `writeIssueNote`. Same order as Agno-react's
 * `showEvidence`, but the explanation comes from the config rather than a
 * second note, because this repo's report and Notepad share that object.
 *
 * `extraLines(serverLines)` adds what only this take knows (a save result, a
 * missing model key) to the note, before the version lines.
 */
export async function evidenceThenIssueNote(
  page: Page,
  config: PageRecordConfig,
  logs: LogMark,
  relevant: RegExp,
  extraLines: (serverLines: string[]) => string[] = () => [],
): Promise<void> {
  const overlay = await showNextIssues(page);
  console.log(`   [evidence] Next overlay: ${overlay ?? '(no issues badge)'}`);
  const serverLines = serverLogSince(logs, { relevant });
  console.log(`   [evidence] ${serverLines.length} server line(s) on screen`);
  for (const l of serverLines) console.log(`      | ${l}`);
  await showServerTerminal(page, serverLines);
  if (config.knownIssue) {
    await writeIssueNote(page, config.id, config.knownIssue, { extraLines: extraLines(serverLines) });
  }
}

/** Take-specific note line for a run that died on the model key. */
export function missingKeyLine(serverLines: string[]): string[] {
  return serverLines.some((l) => /Missing credentials/.test(l))
    ? ['(red toast = backend has no OPENAI_API_KEY here, the reply dies. not the finding)']
    : [];
}

/**
 * Wait for a reply, and treat silence as a note rather than a break.
 *
 * Every graph in this backend runs on OpenAI. Where the backend has no
 * `OPENAI_API_KEY` -- a local run of this repo, as it ships -- the run ends in
 * `RUN_ERROR: Missing credentials` and the chat never answers. On the three
 * pages below the reply is not the thing under test (the payload probe, the
 * hook's panel and the runtime row are), so a silent agent is reported on the
 * result and the take goes on. In CI, which has the key, a warning here is a
 * real break and should be read as one.
 */
export async function replyOrNote(
  page: Page,
  ctx: ActionContext,
  msgCount: number,
  postWaitMs: number,
  label: string,
): Promise<void> {
  try {
    await waitForAgentResponseCompletion(page, postWaitMs, msgCount, undefined, {
      startTimeoutMs: ctx.timeouts.replyStartMs,
      streamTimeoutMs: ctx.timeouts.replyStreamMs,
    });
  } catch (error) {
    if (!(error instanceof AgentSilentError)) throw error;
    ctx.warn(
      `${label}: the agent never answered. Expected only where backend/.env has no OPENAI_API_KEY ` +
        '(RUN_ERROR "Missing credentials"); with a key this is a break.',
    );
    await sleep(1500);
  }
}
