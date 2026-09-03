import { type Page } from 'playwright';
import { AgentSilentError, promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { writeIssueNote } from '../core/issue-note';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';

/**
 * Interrupt-based HITL — one doc page, two tabs, two different outcomes.
 *
 * The first tab is the page's Implementation section verbatim: one
 * `useInterrupt`, no `enabled`. It works, and the take films it working.
 *
 * The second is the page's "Condition UI executions" section, also verbatim,
 * and it does not: `enabled` destructures an `eventValue` that no longer exists
 * on the event, so neither registration claims the interrupt and no card is
 * drawn. That take films an absence, which is why it is recorded separately —
 * a clip carrying a working interrupt and a broken one is a clip nobody can
 * file against either.
 */

/** A name distinctive enough that the reply cannot be a coincidence. */
const AGENT_NAME = 'Fiqros';

const TABS = {
  single: 'One interrupt',
  conditional: 'Two, dispatched by type',
} as const;

/** Clicks one of the variant tabs, with the cursor visibly travelling to it. */
async function selectTab(page: Page, key: keyof typeof TABS): Promise<void> {
  const label = TABS[key];
  const tab = page.locator(`button:has-text("${label}")`).first();

  if (!(await tab.isVisible({ timeout: 8000 }).catch(() => false))) {
    console.warn(`   ⚠️ Tab "${label}" not found -- the demo page may have changed.`);
    return;
  }

  const box = await tab.boundingBox();
  if (!box) return;

  await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 20);
  await sleep(350);
  await humanClick(page);
  console.log(`   ✓ Selected tab "${label}".`);

  // The two variants are keyed, so the click tears the old chat down and mounts
  // a new one. Give React the frame before anything is typed into it.
  await sleep(1400);
}

/**
 * Answers the interrupt's form.
 *
 * `input[name="response"]` and its submit button are the demo page's own markup
 * -- the doc prints exactly this form -- so they are targeted directly rather
 * than through the chat selectors, which do not match a component rendered
 * inside an interrupt.
 */
async function answerInterrupt(page: Page, answer: string): Promise<boolean> {
  const field = page.locator('input[name="response"]').first();

  // `waitFor`, not `isVisible({ timeout })`. Playwright's isVisible is a
  // non-retrying snapshot -- its `timeout` bounds the call, it does not poll --
  // so it answered "no form" the instant the prompt was sent, before the agent
  // had even started. Anything that appears *after* an agent run has to be
  // waited for; isVisible is only safe for things already on the page.
  const appeared = await field
    .waitFor({ state: 'visible', timeout: 30000 })
    .then(() => true)
    .catch(() => false);

  if (!appeared) {
    console.warn(`   ⚠️ The interrupt form never appeared.`);
    return false;
  }

  const box = await field.boundingBox();
  if (box) {
    await humanGlide(page, box.x + Math.min(box.width / 2, 120), box.y + box.height / 2, 20);
    await sleep(300);
    await humanClick(page);
  }

  await field.click({ timeout: 5000 }).catch(() => {});
  await field.type(answer, { delay: 105 });
  await sleep(600);

  const submit = page.locator('button[type="submit"]:visible').first();
  if (await submit.isVisible({ timeout: 4000 }).catch(() => false)) {
    const sBox = await submit.boundingBox();
    if (sBox) {
      await humanGlide(page, sBox.x + sBox.width / 2, sBox.y + sBox.height / 2, 18);
      await sleep(250);
      await humanClick(page);
    }
    await submit.click({ timeout: 4000 }).catch(() => {});
  } else {
    await field.press('Enter');
  }

  console.log(`   ✓ Answered the interrupt with "${answer}".`);
  return true;
}

/**
 * One interrupt, three turns, each load-bearing:
 *
 *   1. anything at all           -- `beforeModel` fires and the interrupt renders
 *   2. a name, in the form       -- `resolve()` sends it, the run continues
 *   3. "what should I call you?" -- and the agent uses it
 *
 * Turn 3 is what proves the resolved value reached the model rather than being
 * swallowed on the way back. The name is deliberately one no model would
 * produce on its own, so nobody can argue the agent guessed it.
 */
export const runInterruptSingleAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  const [opening, followUp] = promptsFor(config);

  console.log(`   [Interrupt] Opening turn to trigger beforeModel...`);
  await sendPrompt(page, opening, { timeoutMs: 12000 });

  const answered = await answerInterrupt(page, AGENT_NAME);
  if (!answered) {
    throw new Error(
      'The interrupt form never rendered. This tab is the one that is supposed to ' +
        'work, so this is a new failure rather than the documented one on the ' +
        'conditional tab -- do not file it as that.',
    );
  }

  await waitForAgentResponseCompletion(page, 2500);

  const msgCount = await sendPrompt(page, followUp ?? 'What should I call you?', {
    timeoutMs: 12000,
  });
  await waitForAgentResponseCompletion(page, 1500, msgCount);

  await sleep(config.waitAfterPromptMs ?? 4000);

  if (config.knownIssue) {
    await writeIssueNote(page, config.id, config.knownIssue);
  }
};

/**
 * Two registrations dispatched by `enabled`, and neither one fires.
 *
 * The take is short because the defect is: switch tab, ask, and watch the run
 * stop at an interrupt with nothing on screen to answer it. `expectsNoResponse`
 * on the page entry is what keeps that silence an `[ISSUE]` rather than a
 * recorder failure.
 *
 * `AgentSilentError` is caught rather than allowed to propagate: the engine
 * reports `[ISSUE]` either way, but an exception escaping here would skip the
 * Notepad note, and a defect take that does not write its own report is half a
 * take.
 */
export const runInterruptConditionalAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  await selectTab(page, 'conditional');

  console.log(`   [Interrupt conditional] Prompting to raise the dispatched interrupt...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  try {
    await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 5000, msgCount);
    console.warn(
      `   ⚠️ [Interrupt conditional] The agent replied -- the documented defect did not ` +
        `reproduce. Check whether it has been fixed before filing it again.`,
    );
  } catch (e) {
    if (!(e instanceof AgentSilentError)) throw e;
    console.log(`   🐞 [Interrupt conditional] Run stopped at the interrupt, no card -- as reported.`);
  }

  // The absence, stated: no approve/reject pair, no question box. Counted so
  // the run log says so in words as well as showing an empty chat on video.
  const cards = await page
    .locator('h1:has-text("Do you approve?"), input[name="response"]')
    .count();
  console.log(
    cards === 0
      ? `   🐞 [Interrupt conditional] Neither handler claimed the event: no card rendered.`
      : `   ⚠️ [Interrupt conditional] ${cards} interrupt card(s) rendered -- unexpected.`,
  );

  await sleep(2500);

  if (config.knownIssue) {
    await writeIssueNote(page, config.id, config.knownIssue);
  }
};
