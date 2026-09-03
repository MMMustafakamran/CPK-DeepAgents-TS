import { type Page } from 'playwright';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { writeIssueNote } from '../core/issue-note';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';

/**
 * The two shared-state routes.
 *
 * Reading works here and is filmed as such. Writing does not: the toggle flips
 * the label and the raw state, the value ships with the next run, and the model
 * answers as though nothing happened. That second take is evidence, so the
 * route is left exactly as the doc prints it — nothing here should ever "just
 * fix" it.
 *
 * The Python sibling records both halves of each finding against a paired
 * `/fixed` route. This repo has no such pair: the fix for the writing defect is
 * a change to how `exposeState` resolves a field owned by another middleware,
 * which is not a line a reader could add to the page's snippet, so a "fixed"
 * route here would be a different experiment rather than a comparison. The
 * clip shows the failure and the note says what is missing.
 */

/**
 * Clicks the language toggle, with the cursor visibly travelling to it.
 */
async function clickLanguageToggle(page: Page): Promise<void> {
  const toggle = page.locator('button:has-text("Toggle Language")').first();
  if (!(await toggle.isVisible({ timeout: 8000 }).catch(() => false))) {
    console.warn(`   ⚠️ No "Toggle Language" button found -- the demo page may have changed.`);
    return;
  }

  const box = await toggle.boundingBox();
  if (!box) return;

  await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 20);
  await sleep(400);
  await humanClick(page);
  console.log(`   ✓ Toggled the language.`);
}

/**
 * Clicks the toggle and confirms the label actually ends up reading Spanish.
 *
 * A bare click is not reliable. The demo's fallback is `"Not set"`, so the
 * first click evaluates `"Not set" === "english"` as false and writes *english*
 * — one click short of Spanish. A Turbopack recompile landing mid-take does the
 * same thing from the other direction: it remounts the component, `agent.state`
 * comes back empty and the label falls back underneath a click that has already
 * happened.
 *
 * The whole finding is "the label says Spanish and the agent answers in
 * English". If the label is not actually on Spanish when the prompt goes out,
 * an English reply is the honest answer to English state and the clip proves
 * nothing.
 */
async function toggleToSpanish(page: Page): Promise<boolean> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    await clickLanguageToggle(page);
    await sleep(900);

    const text =
      (await page
        .locator('p:has-text("Language:")')
        .first()
        .textContent()
        .catch(() => null)) ?? '';

    if (/spanish/i.test(text)) {
      if (attempt > 1) console.log(`   ✓ Label reads spanish after ${attempt} clicks.`);
      return true;
    }

    console.warn(
      `   ⚠️ Click ${attempt} left the label on "${text.trim() || 'unknown'}", not spanish.` +
        ` Most likely a recompile reset the state; clicking again.`,
    );
  }

  // Not thrown. A take that reaches the chat on the wrong language is a weak
  // clip, not a broken recorder, and the run should still produce it and say so.
  console.warn(
    `   ⚠️ Could not get the label onto spanish in 3 clicks. The reply language in` +
      ` this take proves nothing -- re-record before using it as evidence.`,
  );
  return false;
}

/** Rests the cursor on an element and pauses, if it is there at all. */
async function restOn(
  page: Page,
  selector: string,
  dwellMs = 1500,
  label?: string,
): Promise<boolean> {
  const target = page.locator(selector).first();
  if (!(await target.isVisible({ timeout: 4000 }).catch(() => false))) return false;

  const box = await target.boundingBox();
  if (!box) return false;

  if (label) {
    console.log(`   🎯 ${label} at (${Math.round(box.x)}, ${Math.round(box.y)})`);
  }
  await humanGlide(
    page,
    box.x + Math.min(box.width / 2, 220),
    box.y + Math.min(box.height / 2, 60),
    22,
  );
  await sleep(dwellMs);
  return true;
}

/**
 * Reading agent state: the agent switches language and the app follows.
 *
 * Order matters. The prompt goes first and the reply is allowed to finish, so
 * that by the time the cursor reaches the left panel the state delta has landed
 * and the panel can be watched carrying the new value rather than waiting for
 * it.
 */
export const runSharedStateReadAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [Shared State Read] Asking the agent to switch language...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });
  await waitForAgentResponseCompletion(page, 2500, msgCount);

  await restOn(page, 'p:has-text("Language:")', 2400, 'Language panel');
  await restOn(page, 'pre', 2600, 'Raw agent.state');

  await sleep(config.waitAfterPromptMs ?? 3000);

  if (config.knownIssue) {
    await writeIssueNote(page, config.id, config.knownIssue);
  }
};

/**
 * Writing agent state: the toggle flips the label and changes nothing else.
 *
 * The button is clicked before the prompt, not after. `agent.setState` writes
 * locally and the value ships with the *next* run, so a prompt sent first would
 * be a fair run of the old value and would prove nothing.
 */
export const runSharedStateWriteAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  // Let the route finish compiling before anything is clicked. A Turbopack
  // rebuild arriving after the toggle remounts the component and drops the
  // write, which is exactly how a take ends up prompting in English.
  await page.waitForLoadState('networkidle').catch(() => {});
  await sleep(1200);

  console.log(`   [Shared State Write] Clicking "Toggle Language"...`);
  await toggleToSpanish(page);

  // The label and the raw state both flip here. That is the point: the write
  // lands on the frontend, so whatever fails next is not the button.
  await sleep(1000);
  await restOn(page, 'p:has-text("Language:")', 1800, 'Language now reads spanish');
  await restOn(page, 'pre', 2000, 'Raw agent.state carries the write');

  console.log(`   [Shared State Write] Prompting so the new value ships with a run...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });
  await waitForAgentResponseCompletion(page, 2500, msgCount);

  // The reply is the finding, so it gets a long enough look to be read off the
  // screen: an English answer sitting beside a panel that says spanish.
  await sleep(config.waitAfterPromptMs ?? 3500);
  await restOn(page, 'p:has-text("Language:")', 2500, 'Panel still reads spanish');

  if (config.knownIssue) {
    await writeIssueNote(page, config.id, config.knownIssue);
  }
};
