import { type Page } from 'playwright';
import { promptsFor, sendPrompt } from '../core/actions';
import { writeIssueNote } from '../core/issue-note';
import { sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { glideClick, glideTo, replyOrNote, settle, visibleWithin, waitForText } from './glide-click';

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
  _rootPath: string,
  ctx: ActionContext,
) => {
  const prompts = promptsFor(config);

  // Pass 1 -- as documented.
  console.log('   [Memories] 1/2: the runtime the page describes...');
  await waitForText(page.locator('[data-testid=memory-isLoading]'), (t) => t === 'false', 20_000);
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
  await waitForText(page.locator('[data-testid=memory-isLoading]'), (t) => t === 'false', 20_000);
  await glideTo(page, page.locator('[data-testid=memory-list]'), 1500);
  const opened = await save(page, ctx, 'memory.access runtime');
  console.log(`   [Memories] save with memory.access: ${opened}`);

  if (config.knownIssue) {
    await writeIssueNote(page, config.id, config.knownIssue);
  }
};
