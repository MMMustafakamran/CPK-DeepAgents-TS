import { type Page } from 'playwright';
import { promptsFor, sendPrompt } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { evidenceThenIssueNote, glideClick, missingKeyLine, glideTo, replyOrNote, settle, visibleWithin, waitForText } from './glide-click';
import { markServerLogs } from './error-evidence';

/**
 * Memories & Recall -- the documented runtime, then the undocumented option.
 *
 * Pass one is the page as written, on the runtime the Quickstart builds. This
 * repo has no `CPK_INTELLIGENCE_API_KEY`, so that runtime is in SSE mode, and
 * the hook never gets a memory context at all: it reports `isAvailable true`
 * over an empty list, sends no `/memories` request, and the save fails in the
 * browser with "Runtime URL is not configured". Pass two switches to the same
 * runtime with `memory: { access }` added -- the option the page never
 * mentions -- which, with no key, answers 503 and leaves the hook in the same
 * state. The clip films both, and the finding is typed into Notepad from the
 * page's `knownIssue`.
 *
 * Nothing here fails the take on what the saves return: that is the finding.
 * The handler only fails when a surface it needs to film is missing.
 */

/** Memory routes, platform codes, and (backend origin line only) why the chat turn dies here. */
const RELEVANT = /memor|MEMORY_|^Error: Missing credentials/i;

/**
 * Waits until the hook has heard back from the runtime: `isAvailable` flips to
 * false (a 404) or an error shows up (ported from Agno-react). `isLoading` is
 * no signal -- it reads false before the memory store has started.
 *
 * Capped at 8s here, not Agno's 25s. This repo has no Intelligence key, so the
 * core never hands the memory store a context (that needs an Intelligence
 * `wsUrl` in `/info`): nothing is ever heard back, `isAvailable` stays true and
 * `error` null until a save, and the full cap would just be dead air, twice.
 */
async function settledMemory(page: Page, capMs = 8000): Promise<void> {
  const deadline = Date.now() + capMs;
  while (Date.now() < deadline) {
    const available = (await page.locator('[data-testid=memory-isAvailable]').textContent().catch(() => '')) ?? '';
    const error = (await page.locator('[data-testid=memory-error]').textContent().catch(() => '')) ?? '';
    if (available.trim() === 'false' || (error.trim() && error.trim() !== 'null')) return;
    await sleep(500);
  }
}

async function save(page: Page, ctx: ActionContext, label: string): Promise<string> {
  const button = page.locator('[data-testid=memory-save]');
  if (!(await visibleWithin(button, 8000))) {
    ctx.fail(`${label}: the save button never rendered`);
    return '';
  }
  await glideClick(page, button);
  const result = await waitForText(
    page.locator('[data-testid=memory-save-result]'),
    (t) => t.length > 0 && !t.startsWith('saving'),
    20_000,
  );
  await glideTo(page, page.locator('[data-testid=memory-probe]'), 2500);
  return result;
}

export const runMemoriesAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
) => {
  const logs = markServerLogs(rootPath);
  const prompts = promptsFor(config);

  // Pass 1 -- as documented.
  console.log('   [Memories] 1/2: the runtime the page describes...');
  await settledMemory(page);
  await glideTo(page, page.locator('[data-testid=memory-list]'), 1500);
  const documented = await save(page, ctx, 'documented runtime');
  console.log(`   [Memories] save on the documented runtime: ${documented}`);

  const msgCount = await sendPrompt(page, prompts[0]);
  await replyOrNote(page, ctx, msgCount, config.waitAfterPromptMs ?? 3000, 'Memories');

  // Pass 2 -- with the option the page leaves out.
  console.log('   [Memories] 2/2: the same runtime with memory.access...');
  await glideClick(page, page.locator('[data-testid=memory-runtime-memory-access]'));
  await sleep(500);
  await settle(page, 1500);
  await settledMemory(page);
  await glideTo(page, page.locator('[data-testid=memory-list]'), 1500);
  const opened = await save(page, ctx, 'memory.access runtime');
  console.log(`   [Memories] save with memory.access: ${opened}`);

  await evidenceThenIssueNote(page, config, logs, RELEVANT, (lines) => [
    `save, as documented: ${documented}`,
    `save, with memory.access: ${opened}`,
    ...missingKeyLine(lines),
  ]);
};
