import { type Page } from 'playwright';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { writeIssueNote } from '../core/issue-note';
import { humanClick, humanGlide, sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';

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
 * The two custom graphs work here, unlike the Python sibling — the TypeScript
 * tabs print both in full, so there is nothing left to infer and their takes
 * exist to show the steps filling in, which is the behaviour the page is about.
 *
 * The prebuilt tab does not, and it fails exactly the way the Python one does:
 * the chat answers with a complete multi-step plan while `Agent Progress` reads
 * "Empty. Give the agent a multi-step task." from the first frame to the last.
 * That take is evidence, so it is driven differently from the other two — see
 * `runPredictivePrebuiltAction`.
 */

const TABS = {
  prebuilt: 'Prebuilt agent',
  manual: 'Custom graph · manual',
  tool: 'Custom graph · tool',
} as const;

type VariantKey = keyof typeof TABS;

/** Clicks one of the variant tabs, with the cursor visibly travelling to it. */
async function selectVariant(ctx: ActionContext, page: Page, key: VariantKey): Promise<void> {
  const label = TABS[key];
  const tab = page.locator(`button:has-text("${label}")`).first();

  if (!(await tab.isVisible({ timeout: 8000 }).catch(() => false))) {
    ctx.warn(`Variant tab "${label}" not found -- the demo page may have changed.`);
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
  ctx: ActionContext,
  page: Page,
  config: PageRecordConfig,
  key: VariantKey,
  startTimeoutMs = 30000,
  waitForStepsMs = 0,
): Promise<void> {
  await selectVariant(ctx, page, key);

  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  // On the custom graphs the steps are the evidence, and they are emitted a
  // second apart well before anything is said -- so those takes wait for the
  // first row rather than for the reply.
  //
  // Not done on `prebuilt`: its finding is that no step ever appears, so a wait
  // there buys 45s of dead video to prove what an empty panel already says.
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
  await sleep(waitForStepsMs > 0 ? 600 : 2200);
  await restOnSteps(page, 2200);

  await waitForAgentResponseCompletion(
    page,
    config.waitAfterPromptMs ?? 4000,
    msgCount,
    undefined,
    { startTimeoutMs },
  );

  await restOnSteps(page, 2600);
}

/**
 * The two custom-graph variants get longer to start than the prebuilt one.
 *
 * They emit four steps a second apart before they say anything, and one has
 * been measured at 50s end to end; the default 30s reported a working graph as
 * dead.
 */
const CUSTOM_GRAPH_START_TIMEOUT_MS = 90000;

/**
 * Prebuilt agent -- its own tab, start to finish. Nothing else is driven.
 *
 * The take used to switch to the manual tab afterwards and ask the identical
 * question, so the steps filling in on one tab beside an empty panel on the
 * other made the absence legible. That is not done: a run of the manual graph
 * inside a video filed against the prebuilt one is a clip that carries two
 * findings and can be filed against neither. The manual variant is recorded
 * separately and can be watched beside this one.
 *
 * What replaces it is a long, deliberate look at the panel that should have
 * filled in and did not, and a row count in the log so the run says in words
 * what the video shows.
 */
export const runPredictivePrebuiltAction: PageActionHandler = async (page, config, _rootPath, ctx) => {
  await runVariant(ctx, page, config, 'prebuilt');

  // The panel's own empty state, not a bare `ul li` count. The reply on this
  // tab is a multi-step plan and the chat renders it as nested markdown lists,
  // so counting every list item on the page reports rows that belong to the
  // answer rather than to Agent Progress -- which reads as the defect having
  // been fixed on precisely the runs where it reproduced.
  const stillEmpty = await page
    .locator('p:has-text("Empty. Give the agent a multi-step task.")')
    .first()
    .isVisible()
    .catch(() => false);
  const rows = await page
    .locator('h3:has-text("Steps") + ul li')
    .count()
    .catch(() => 0);

  if (stillEmpty && rows === 0) {
    console.log(
      `   🐞 [Predictive prebuilt] Agent Progress is still empty after the reply -- as reported.`,
    );
  } else {
    ctx.warn(`[Predictive prebuilt] ${rows} step row(s) rendered -- the documented defect did ` +
        `not reproduce. Check whether it has been fixed before filing it again.`,
    );
  }

  await restOnSteps(page, 5200);

  if (config.knownIssue) {
    await writeIssueNote(page, config.id, config.knownIssue);
  }
};

export const runPredictiveManualAction: PageActionHandler = async (page, config, _rootPath, ctx) => {
  await runVariant(ctx, page, config, 'manual', CUSTOM_GRAPH_START_TIMEOUT_MS, 45000);
};

export const runPredictiveToolAction: PageActionHandler = async (page, config, _rootPath, ctx) => {
  await runVariant(ctx, page, config, 'tool', CUSTOM_GRAPH_START_TIMEOUT_MS, 45000);
};
