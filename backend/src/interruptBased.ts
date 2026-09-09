/**
 * Agents backing the Interrupt-based route.
 *
 * https://docs.copilotkit.ai/deepagents/generative-ui/your-components/interrupt-based
 * (TypeScript tab)
 *
 * Two agents, one per section of the page:
 *
 * - `agent` — the Implementation walkthrough. `agentNameMiddleware.beforeModel`
 *   calls `interrupt` once, with a plain string, until the state carries a name.
 * - `multiAgent` — the "Condition UI executions" section. Two interrupts in one
 *   hook, each carrying a `type` the frontend's `useInterrupt({ enabled })`
 *   predicates dispatch on.
 *
 * Both middlewares are the page's TypeScript verbatim, and the page now prints
 * the `createDeepAgent(...)` call that consumes the first one, so only
 * `multiAgent` is still written to the shape the page describes rather than
 * copied from it.
 *
 * Note the TypeScript tab is the cleaner of the two languages here: the Python
 * tab needs an `AgentMiddleware` subclass with an explicit `state_schema`,
 * while `createMiddleware` carries the schema and the hook together.
 *
 * The page's "Make your agent aware of interruptions" section does not work at
 * @copilotkit/sdk-js 1.66.2, and it is reproduced here rather than corrected so
 * the route shows what the page currently teaches. Measured, with a fake model
 * capturing the request the model would have received:
 *
 *   `exposeState` is applied in the CopilotKit middleware's own
 *   `wrapModelCall`, reading `request.state`. That object is scoped to the
 *   *declaring* middleware's `stateSchema`, so the CopilotKit middleware —
 *   which declares `copilotKitStateSchema` — sees `messages` and `copilotkit`
 *   and nothing else. `agentName` is declared on `agentNameMiddleware`, a
 *   different middleware, so it is invisible and no state note is built. A
 *   probe middleware declaring `agentName` itself reads it fine at the same
 *   point, which is what pins the cause to schema scoping rather than ordering:
 *   the system prompt is unchanged with the middleware first, last, and with
 *   `exposeState: true`.
 *
 * So the run resumes with the name in thread state and the frontend renders it,
 * but the model is not told what it is. `sharedState.ts` hit the same wall from
 * the other direction and carries the same note.
 */

//#region single-interrupt
import { createCopilotkitMiddleware, zodState } from "@copilotkit/sdk-js/langgraph";
import { createMiddleware } from "langchain";
import { interrupt } from "@langchain/langgraph";
import { z } from "zod";

export const agentNameMiddleware = createMiddleware({
  name: "AgentState",
  stateSchema: z.object({
    // zodState keeps this custom field in AG-UI state snapshots.
    agentName: zodState(z.string().optional()),
  }),
  beforeModel: (state) => {
    if (!state.agentName) {
      // Interrupt and wait for the user to respond with a name
      const name: string = interrupt("Before we start, what would you like to call me?");
      return { agentName: name };
    }
    return undefined;
  },
});

const stateAwareCopilotKitMiddleware = createCopilotkitMiddleware({
  exposeState: ["agentName"],
});
//#endregion

//#region multi-interrupt
export const approvalAndNameMiddleware = createMiddleware({
  name: "AgentState",
  stateSchema: z.object({
    agentName: zodState(z.string().optional()),
    approval: zodState(z.unknown().optional()),
  }),
  beforeModel: (state) => {
    const approval = interrupt({ type: "approval", content: "please approve" });
    const updates: Record<string, unknown> = { approval };

    if (!state.agentName) {
      updates.agentName = interrupt({
        type: "ask",
        content: "Before we start, what would you like to call me?",
      });
    }

    return updates;
  },
});
//#endregion

//#region agents
import { createDeepAgent } from "deepagents";

import { MODEL } from "./shared.js";

// The page's prompt, which leans on the state note `exposeState` is meant to
// add. It does not arrive — see the note at the top of this file — so the model
// only knows the name from the conversation, not from state.
const SYSTEM_PROMPT =
  "You are a helpful assistant. After the user chooses a name, " +
  "Current agent state contains agentName. Use that value as your own name.";

export const agent = createDeepAgent({
  model: MODEL,
  tools: [],
  middleware: [agentNameMiddleware, stateAwareCopilotKitMiddleware],
  systemPrompt: SYSTEM_PROMPT,
});

export const multiAgent = createDeepAgent({
  model: MODEL,
  tools: [],
  middleware: [approvalAndNameMiddleware],
  systemPrompt: SYSTEM_PROMPT,
});
//#endregion
