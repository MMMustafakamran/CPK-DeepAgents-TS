/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS DIRECTORY
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * What the recorder *does* on each demo page once it is open.
 *
 * The registry lives here rather than in `core/` on purpose: adding or removing
 * a page must never mean editing frozen code. A page with no entry falls back
 * to `runStandardAction` — type the prompt, submit, wait for the reply — which
 * is right for most pages. Write a handler only when a page needs more than
 * that: switching tabs, clicking an approval button, opening a panel.
 *
 * Handlers should build on the helpers in `core/actions.ts`:
 *
 *   sendPrompt(page, prompt, opts)          types and submits, returns the
 *                                           assistant-message count from before
 *                                           submitting
 *   waitForAgentResponseCompletion(...)     waits for the reply to finish, and
 *                                           throws if none ever arrives
 *   promptsFor(config)                      the page's prompts[] , or [prompt]
 *
 * Pass that returned count into waitForAgentResponseCompletion on multi-turn
 * pages, or the previous turn's reply is mistaken for this one's.
 *
 * The fourth argument, `ctx`, is how a handler reports what it saw:
 *
 *   ctx.warn('the documented defect did not reproduce')  -> [PASS*]/[ISSUE] with the note
 *   ctx.fail('Approve button never rendered')             -> [FAIL], clip still saved
 *
 * A `console.warn` reaches nobody: the summary, RECORD_RESULTS.json and the
 * daily report only see what goes through `ctx`.
 *
 * ── Handlers for pages that reproduce a defect ─────────────────────────────
 * Three pages here carry a `knownIssue` — both shared-state routes and the
 * prebuilt tab of Predictive State Updates — and their handlers have one extra
 * obligation: make the defect visible, then write it down. Two of the three
 * also carry a narration track in `autorecorder/audio/`, muxed on after the
 * recording; nothing in the handler knows about that.
 *
 * The governing rule is that a take may only contain things a person testing
 * this app could actually have done. That rule cost this suite two helpers it
 * used to have — a caption bar and a replica of Chrome's DevTools console,
 * both painted over the page. Both were useful. Neither was something a tester
 * could produce, and an overlay nobody could have summoned turns a recording of
 * evidence into a recording of a presentation. What survives:
 *
 *   showWorkingVariant(page, opts)     core/compare.ts — the same page against
 *                                      code that works. Unused here: none of
 *                                      this repo's defects has a one-line fix a
 *                                      reader could apply, so there is no honest
 *                                      paired route to compare against.
 *   writeIssueNote(page, id, issue)    core/issue-note.ts — Notepad, opened
 *                                      from the taskbar and typed into, which
 *                                      is how a tester actually reports
 *   captureConsole(page)               core/console-capture.ts — invisible.
 *                                      Console errors reach the run log and the
 *                                      note, not the screen
 *
 * Anything a clip needs to *say* rather than show belongs on the demo route
 * itself: `QaNote` (`frontend/src/components/qa-note.tsx`) states what to try,
 * what should happen and what happens instead, which is a thing a tester could
 * plausibly have written on the page. It is on the three routes above, and it
 * is what makes "nothing happened" legible on video — an empty panel looks the
 * same as a slow model until something on screen says what should have been
 * there.
 */

import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { runStandardAction } from '../core/actions';
import { type Page } from 'playwright';

import { runFrontendToolsAction } from './frontend-tools.action';
import {
  runInterruptConditionalAction,
  runInterruptSingleAction,
} from './interrupt.action';
import {
  runPredictiveManualAction,
  runPredictivePrebuiltAction,
  runPredictiveToolAction,
} from './predictive.action';
import {
  runSharedStateReadAction,
  runSharedStateWriteAction,
} from './shared-state.action';
import { runStateRenderingAction } from './state-rendering.action';
import { runToolRenderingAction } from './tool-rendering.action';

/** Keys are page ids from `config/pages.config.ts`. Doctor flags any orphans. */
export const ACTION_MAP: Record<string, PageActionHandler> = {
  quickstart: runStandardAction,

  // The three thread routes are driven by `runStandardAction`: what they
  // demonstrate is the drawer, the list and the switcher, all of which are on
  // screen before a prompt is sent. Nothing there needs a handler of its own.

  'tool-rendering': runToolRenderingAction,
  'state-rendering': runStateRenderingAction,
  'interrupt-single': runInterruptSingleAction,
  'interrupt-conditional': runInterruptConditionalAction,

  'frontend-tools': runFrontendToolsAction,

  'in-app-agent-read': runSharedStateReadAction,
  'in-app-agent-write': runSharedStateWriteAction,
  'predictive-prebuilt': runPredictivePrebuiltAction,
  'predictive-manual': runPredictiveManualAction,
  'predictive-tool': runPredictiveToolAction,
};

export async function executePageAction(
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
): Promise<void> {
  const handler = ACTION_MAP[config.id] ?? runStandardAction;
  await handler(page, config, rootPath, ctx);
}
