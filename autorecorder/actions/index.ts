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
 * ── Handlers for pages that reproduce a defect ─────────────────────────────
 * Two pages here carry a `knownIssue`, and their handlers have one extra
 * obligation: make the defect visible, then write it down.
 *
 * The governing rule is that a take may only contain things a person testing
 * this app could actually have done. That rule cost this suite two helpers it
 * used to have — a caption bar and a replica of Chrome's DevTools console,
 * both painted over the page. Both were useful. Neither was something a tester
 * could produce, and an overlay nobody could have summoned turns a recording of
 * evidence into a recording of a presentation. What survives:
 *
 *   showWorkingVariant(page, opts)     core/compare.ts — the same page against
 *                                      code that works. Unused here: neither of
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
 * itself: `QaNote` in the frontend states what to try and what should happen,
 * which is a thing a tester could plausibly have written on the page.
 */

import { type PageActionHandler, type PageRecordConfig } from '../core/types';
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
): Promise<void> {
  const handler = ACTION_MAP[config.id] ?? runStandardAction;
  await handler(page, config, rootPath);
}
