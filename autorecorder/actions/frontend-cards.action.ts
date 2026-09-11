import { type Page } from 'playwright';
import { promptsFor, sendPrompt } from '../core/actions';
import { sleep } from '../core/overlays/cursor';
import { type ActionContext, type PageActionHandler, type PageRecordConfig } from '../core/types';
import { evidenceThenIssueNote, glideClick, missingKeyLine, glideTo, replyOrNote, visibleWithin, waitForText } from './glide-click';
import { markServerLogs } from './error-evidence';

/**
 * Frontend-Driven Cards -- the page as published, then the page with the one
 * id this runtime has.
 *
 * The demo route has two panes. The top one is steps 2 and 3 verbatim: no
 * `agentId`, so `useAgent()` and `<CopilotChat />` ask for `"default"`, which
 * this runtime does not register. It throws during render as soon as `/info`
 * answers, and the route prints the error in place. The take rests on that
 * first -- it is this repo's finding.
 *
 * The bottom pane adds `agentId="sample_agent"` and nothing else, and the take
 * then films the page's two claims there: the card renders in the transcript
 * (click "Simulate: deployment finished"), and the agent never receives it
 * (send a turn, then read the probe row that prints the roles in the run
 * request that actually left the browser). The payload row does not need a
 * model key: it is read off the request as it leaves.
 *
 * The click waits for `isReady true` on purpose. A card added while the runtime
 * is still connecting goes to a provisional agent and is silently dropped when
 * the real one arrives -- a finding on the route page, reproduced 3/3 here, but
 * not what this take is about. Clicking early would film that instead, randomly.
 */

/**
 * Server lines that belong to this take. The crash itself is not among them:
 * it happens at page load, before the take marks the logs, and Next forwards
 * only a `[browser] Agent default not found` warning, which carries no error
 * word -- the overlay is where it shows. What the servers do log is why the
 * run then dies here: the LangGraph backend's own `Error: Missing credentials`
 * (no OpenAI key). Only that origin line, not the half-dozen browser echoes.
 */
const RELEVANT = /activity|app-event-card|frontend-cards|\/agent\/[^/]+\/run|^Error: Missing credentials/;

const CARD = '.rounded-lg.border.p-4:has-text("Deployment finished")';

export const runFrontendCardsAction: PageActionHandler = async (
  page: Page,
  config: PageRecordConfig,
  rootPath: string,
  ctx: ActionContext,
) => {
  const logs = markServerLogs(rootPath);
  // 1 -- as published.
  console.log('   [Frontend Cards] 1/2: the page as published (agent "default")...');
  const crash = page.locator('[data-testid=cards-crash]');
  if (await visibleWithin(crash, 60_000)) {
    await glideTo(page, crash, 3500);
  } else {
    ctx.warn(
      'The as-published pane did not throw. If this runtime now registers a `default` agent, ' +
        'the finding on /generative-ui/frontend-cards needs revisiting.',
    );
  }

  // 2 -- the same code with agentId="sample_agent".
  console.log('   [Frontend Cards] 2/2: the harness pane (agent "sample_agent")...');
  const state = page.locator('[data-testid=agent-state]');
  const ready = await waitForText(state, (t) => t.includes('isReady true'), 60_000);
  if (!ready.includes('isReady true')) {
    ctx.fail(`useAgent() never became ready (last: "${ready}") -- the card would go to a provisional agent`);
  }
  await glideTo(page, state, 1200);

  console.log('   [Frontend Cards] adding the activity card...');
  await glideClick(page, page.locator('[data-testid=add-activity-card]'));
  await sleep(1200);
  const card = page.locator(CARD).first();
  if (!(await visibleWithin(card, 5000))) {
    ctx.fail('The activity card never rendered in the transcript');
  } else {
    await glideTo(page, card, 1500);
  }

  const [prompt] = promptsFor(config);
  const msgCount = await sendPrompt(page, prompt);
  await replyOrNote(page, ctx, msgCount, config.waitAfterPromptMs ?? 4000, 'Frontend Cards');

  const payload = page.locator('[data-testid=roles-payload]');
  const roles = await waitForText(payload, (t) => !t.startsWith('no run'), 10_000);
  if (roles.startsWith('no run')) {
    ctx.warn('No run payload was captured, so the "agent never sees it" claim went unchecked');
  } else if (/\bactivity\b/.test(roles.split('(')[0])) {
    ctx.fail(`The activity message reached the agent: payload roles were "${roles}"`);
  } else {
    console.log(`   [Frontend Cards] run payload roles: ${roles}`);
  }
  await glideTo(page, payload, 2500);

  await evidenceThenIssueNote(page, config, logs, RELEVANT, missingKeyLine);
};
