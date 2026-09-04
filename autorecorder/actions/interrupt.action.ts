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
 * The second is the page's "Condition UI executions" section, also verbatim.
 * It carried a `knownIssue` until 04 Sep 2026 — `enabled` destructures an
 * `eventValue` that no longer exists on the event, so neither registration
 * claimed the interrupt and no card was drawn — and that entry has been removed
 * on a report that the tab now behaves. The take below therefore no longer
 * writes a Notepad note; what it does instead is say plainly in the run log
 * whether a card rendered, so a return of the old behaviour is not filed as a
 * green clip.
 *
 * They stay two takes rather than one because one clip per doc section is what
 * lets a reader open the footage for the section they are reading.
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
 * Two registrations dispatched by `enabled`.
 *
 * Switch tab, ask, and answer whichever card the dispatch draws -- the approval
 * pair or the question box, both of which the page renders from the same hook.
 * The take is driven the same way the single-interrupt one is, because that is
 * what a reader following the section would do.
 *
 * `AgentSilentError` is caught rather than allowed to propagate. This entry no
 * longer carries `knownIssue.expectsNoResponse`, so an escaping exception would
 * fail the take and lose the clip; catching it keeps the footage and puts the
 * fact in the log, where a run that goes quiet again is legible as a return of
 * the removed finding rather than as a recorder fault.
 */
export const runInterruptConditionalAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  await selectTab(page, 'conditional');

  console.log(`   [Interrupt conditional] Prompting to raise the dispatched interrupt...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  // Whichever registration claims the event: the approval pair renders a button,
  // the question box renders the same `response` field the single tab uses.
  const card = page
    .locator('button:has-text("Approve"), input[name="response"]')
    .first();
  const rendered = await card
    .waitFor({ state: 'visible', timeout: 30000 })
    .then(() => true)
    .catch(() => false);

  if (rendered) {
    const isApproval = await page
      .locator('button:has-text("Approve")')
      .first()
      .isVisible()
      .catch(() => false);

    if (isApproval) {
      const box = await page.locator('button:has-text("Approve")').first().boundingBox();
      if (box) {
        await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 20);
        await sleep(400);
        await humanClick(page);
      }
      await page.locator('button:has-text("Approve")').first().click({ timeout: 4000 }).catch(() => {});
      console.log(`   ✓ Approved the interrupt.`);
    } else {
      await answerInterrupt(page, AGENT_NAME);
    }
  } else {
    console.warn(
      `   ⚠️ [Interrupt conditional] No card rendered in 30s. This is the behaviour the ` +
        `removed \`knownIssue\` described -- neither registration claiming the event -- so ` +
        `check the tab by hand before trusting this clip as a pass.`,
    );
  }

  try {
    await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 5000, msgCount);
  } catch (e) {
    if (!(e instanceof AgentSilentError)) throw e;
    console.warn(
      `   ⚠️ [Interrupt conditional] The agent never answered. The clip shows an empty chat.`,
    );
  }

  await sleep(2500);

  if (config.knownIssue) {
    await writeIssueNote(page, config.id, config.knownIssue);
  }
};
