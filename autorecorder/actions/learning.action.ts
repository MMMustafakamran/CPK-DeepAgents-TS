import { type Page } from 'playwright';
import { AgentSilentError, promptsFor, sendPrompt, waitForAgentResponseCompletion } from '../core/actions';
import { writeIssueNote } from '../core/issue-note';
import { sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { SELECTORS } from '../config/selectors.config';
import { glideClick, glideTo, replyOrNote, settle, waitForText } from './glide-click';

/**
 * Learning -- one turn on the agent the page's selector assigns, one on the
 * agent it does not.
 *
 * The page's runtime is mounted verbatim at `/api/copilotkit-learning`. It
 * builds `new CopilotKitIntelligence({ apiKey: process.env.CPK_INTELLIGENCE_API_KEY! })`
 * at module load, and this repo has no key -- locally or in CI -- so the
 * constructor throws ("apiKey is required and cannot be blank") and every
 * request to the mount answers 500. The panel's runtime row reads `error`, the
 * composer accepts text and will not send it, and neither tab ever answers.
 * That is what this take films in this repo; the note says so.
 *
 * If a key is ever added, the runtime connects and the take follows the path
 * the page describes: `expense-agent` is routed to the example container
 * `expense-review`; where that container does not exist the run fails with
 * "Failed to initialize thread" and the chat shows nothing, and `sample_agent`
 * (the control, which the selector assigns nowhere) answers.
 */

type RuntimeState = 'connected' | 'error' | string;

async function runtimeOn(page: Page, ctx: ActionContext, agentId: string): Promise<RuntimeState> {
  const status = await waitForText(
    page.locator('[data-testid=learning-runtime-status]'),
    (t) => t === 'connected' || t === 'error',
    60_000,
  );
  if (status !== 'connected' && status !== 'error') {
    ctx.fail(`${agentId}: the runtime never settled (last: "${status}")`);
  }
  await glideTo(page, page.locator('[data-testid=learning-assignment]'), 2000);
  await glideTo(page, page.locator('[data-testid=learning-runtime-status]'), 1500);
  return status;
}

/** Type the prompt and press send once. Returns whether the chat took it. */
async function tryToSend(page: Page, prompt: string): Promise<boolean> {
  await sendPrompt(page, prompt, { expectInputToEmpty: false });
  await sleep(2500);
  const left = await page
    .locator(SELECTORS.chatInput)
    .first()
    .inputValue()
    .catch(() => '');
  return left.trim().length === 0;
}

export const runLearningAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  _rootPath: string,
  ctx: ActionContext,
) => {
  const prompts = promptsFor(config);

  console.log('   [Learning] 1/2: expense-agent -> "expense-review"...');
  const runtime = await runtimeOn(page, ctx, 'expense-agent');

  if (runtime === 'error') {
    // No key: the page's constructor threw at module load; the mount is 500.
    const took = await tryToSend(page, prompts[0]);
    console.log(`   [Learning] runtime error; composer ${took ? 'cleared' : 'kept the text'} on expense-agent.`);
    await glideTo(page, page.locator('[data-testid=learning-runtime-status]'), 2000);

    console.log('   [Learning] 2/2: sample_agent -> no container...');
    await glideClick(page, page.locator('[data-testid=learning-tab-sample_agent]'));
    await settle(page, 800);
    await runtimeOn(page, ctx, 'sample_agent');
    const tookControl = await tryToSend(page, prompts[1] ?? prompts[0]);
    console.log(`   [Learning] composer ${tookControl ? 'cleared' : 'kept the text'} on sample_agent.`);
    await glideTo(page, page.locator('[data-testid=learning-runtime-status]'), 2500);
  } else {
    const assignedCount = await sendPrompt(page, prompts[0]);
    try {
      await waitForAgentResponseCompletion(page, 2000, assignedCount, undefined, {
        startTimeoutMs: 25_000,
      });
      ctx.warn(
        'expense-agent answered. The expense-review container may exist in the project now -- re-check the finding on /learning.',
      );
    } catch (error) {
      if (!(error instanceof AgentSilentError)) throw error;
      console.log('   [Learning] expense-agent stayed silent.');
      await sleep(1500);
    }

    console.log('   [Learning] 2/2: sample_agent -> no container...');
    await glideClick(page, page.locator('[data-testid=learning-tab-sample_agent]'));
    await settle(page, 800);
    await runtimeOn(page, ctx, 'sample_agent');
    const controlCount = await sendPrompt(page, prompts[1] ?? prompts[0]);
    await replyOrNote(page, ctx, controlCount, config.waitAfterPromptMs ?? 3000, 'Learning (sample_agent)');
  }

  if (config.knownIssue) {
    await writeIssueNote(page, config.id, config.knownIssue);
  }
};
