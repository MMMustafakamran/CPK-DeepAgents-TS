import { type Page } from 'playwright';
import { humanGlide, sleep } from '../core/overlays/cursor';
import { type PageActionHandler, type PageRecordConfig } from '../core/types';
import { sendPrompt, waitForAgentResponseCompletion } from '../core/actions';

export const runStateRenderingAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
) => {
  console.log(`   [State Rendering] Sending prompt to stream searches state...`);
  const msgCount = await sendPrompt(page, config.prompt, { timeoutMs: 12000 });

  // Glide cursor over the rendered searches list on the left as it streams.
  // This page's panel has no heading of its own -- it renders bare rows, each
  // prefixed with the hourglass or the tick -- so the rows are what to target.
  await sleep(2000);
  const searchesList = page
    .locator('div:has-text("⏳"), div:has-text("✅")')
    .first();

  // These rows do not exist until the first copilotkit_emit_state lands, so
  // they have to be waited for. `isVisible` takes a snapshot and never polls,
  // whatever timeout it is given.
  await searchesList.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});

  if (await searchesList.isVisible().catch(() => false)) {
    const slBox = await searchesList.boundingBox();
    if (slBox) {
      console.log(`   🎯 Detected streamed Searches UI at (${Math.round(slBox.x)}, ${Math.round(slBox.y)})`);
      await humanGlide(page, slBox.x + 120, slBox.y + 40, 22);
      await sleep(1500);
    }
  }

  // Glide cursor over the raw agent.state JSON pre block
  const rawPre = page.locator('pre').first();
  if (await rawPre.isVisible({ timeout: 3000 }).catch(() => false)) {
    const preBox = await rawPre.boundingBox();
    if (preBox) {
      await humanGlide(page, preBox.x + preBox.width / 2, preBox.y + preBox.height / 2, 22);
      await sleep(1500);
    }
  }

  // Actively wait for search_agent response and state streaming to complete
  await waitForAgentResponseCompletion(page, config.waitAfterPromptMs ?? 4000, msgCount);
};
