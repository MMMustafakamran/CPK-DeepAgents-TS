import { type Page } from 'playwright';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { writeIssueNote } from '../core/issue-note';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';

/**
 * Predictive State Updates — three variants, one route.
 *
 * The demo page carries a tab strip (`Prebuilt agent` / `Custom graph · manual`
 * / `Custom graph · tool`) because the doc page documents all three against the
 * same `observed_steps` key. Each take picks its tab and drives it, and nothing
 * else: prompting a second variant inside another variant's take puts a run of
 * one graph into a video filed against another, which is how one clip ends up
 * carrying two findings and being usable for neither.
 *
 * All three work in this repo, unlike the Python sibling — the TypeScript tabs
 * print the two custom graphs in full, so there is nothing left to infer and
 * nothing here reproduces a defect. The takes exist to show the steps filling
 * in, which is the behaviour the page is about.
 */

const TABS = {
  prebuilt: 'Prebuilt agent',
  manual: 'Custom graph · manual',
  tool: 'Custom graph · tool',
} as const;

type VariantKey = keyof typeof TABS;

/** Clicks one of the variant tabs, with the cursor visibly travelling to it. */
async function selectVariant(page: Page, key: VariantKey): Promise<void> {
  const label = TABS[key];
  const tab = page.locator(`button:has-text("${label}")`).first();

  if (!(await tab.isVisible({ timeout: 8000 }).catch(() => false))) {
    console.warn(`   ⚠️ Variant tab "${label}" not found -- the demo page may have changed.`);
    return;
  }

  const box = await tab.boundingBox();
  if (!box) return;

  await humanGlide(page, box.x + box.width / 2, box.y + box.height / 2, 20);
  await sleep(350);
  await humanClick(page);
  console.log(`   ✓ Selected variant "${label}".`);

  // The panel is keyed on the variant, so the click remounts both halves. Give
  // React the frame it needs before anything is typed into the new chat.
  await sleep(1400);
}

/** Rests the cursor on the steps panel, whether it has rows in it or not. */
async function restOnSteps(page: Page, dwellMs: number): Promise<void> {
  const panel = page
    .locator('h1:has-text("Agent Progress"), p:has-text("Empty. Give the agent"), ul')
    .first();
  if (!(await panel.isVisible({ timeout: 4000 }).catch(() => false))) return;

  const box = await panel.boundingBox();
  if (!box) return;
  await humanGlide(page, box.x + Math.min(box.width / 2, 200), box.y + 40, 22);
  await sleep(dwellMs);
}

/** Drives one variant end to end: pick the tab, ask, watch the steps panel. */
async function runVariant(
  page: Page,
  config: PageRecordConfig,
  key: VariantKey,
  startTimeoutMs = 30000,
  waitForStepsMs = 45000,
): Promise<void> {
  await selectVariant(page, key);

  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  // The steps are the evidence on every variant here, so the take waits for the
  // first row rather than for the reply: on the custom graphs the rows are
  // emitted a second apart well before anything is said.
  if (waitForStepsMs > 0) {
    const appeared = await page
      .locator('h3:has-text("Steps"), ul li')
      .first()
      .waitFor({ state: 'visible', timeout: waitForStepsMs })
      .then(() => true)
      .catch(() => false);
    console.log(
      appeared
        ? `   ✓ Steps rendered on "${TABS[key]}".`
        : `   ⚠️ No steps rendered on "${TABS[key]}" within ${waitForStepsMs / 1000}s.`,
    );
  }

  // Mid-stream is the only moment the steps are interesting: this is when rows
  // should be filling in. Waiting for the reply first and looking afterwards
  // shows the aftermath rather than the behaviour.
  await sleep(600);
  await restOnSteps(page, 2400);

  await waitForAgentResponseCompletion(
    page,
    config.waitAfterPromptMs ?? 4000,
    msgCount,
    undefined,
    startTimeoutMs,
  );

  await restOnSteps(page, 2600);

  if (config.knownIssue) {
    await writeIssueNote(page, config.id, config.knownIssue);
  }
}

/**
 * The two custom-graph variants get longer to start than the prebuilt one.
 *
 * They emit four steps a second apart before they say anything, and one has
 * been measured at 50s end to end; the default 30s reported a working graph as
 * dead.
 */
const CUSTOM_GRAPH_START_TIMEOUT_MS = 90000;

export const runPredictivePrebuiltAction: PageActionHandler = async (page, config) => {
  await runVariant(page, config, 'prebuilt');
};

export const runPredictiveManualAction: PageActionHandler = async (page, config) => {
  await runVariant(page, config, 'manual', CUSTOM_GRAPH_START_TIMEOUT_MS);
};

export const runPredictiveToolAction: PageActionHandler = async (page, config) => {
  await runVariant(page, config, 'tool', CUSTOM_GRAPH_START_TIMEOUT_MS);
};
