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
 * Both middlewares are the page's TypeScript verbatim. What the page never
 * shows is the `createDeepAgent(...)` call that consumes them, so those two
 * calls at the bottom are written to the shape it describes.
 *
 * Note the TypeScript tab is the cleaner of the two languages here: the Python
 * tab needs an `AgentMiddleware` subclass with an explicit `state_schema`,
 * while `createMiddleware` carries the schema and the hook together.
 */

//#region single-interrupt
import { createMiddleware } from "langchain";
import { interrupt } from "@langchain/langgraph";
import { z } from "zod";

export const agentNameMiddleware = createMiddleware({
  name: "AgentState",
  stateSchema: z.object({
    agentName: z.string().optional(),
  }),
  beforeModel: async (state) => {
    if (!state.agentName) {
      // Interrupt and wait for the user to respond with a name
      const name = await interrupt("Before we start, what would you like to call me?");
      return { agentName: name as string };
    }
    return undefined;
  },
});
//#endregion

//#region multi-interrupt
export const approvalAndNameMiddleware = createMiddleware({
  name: "AgentState",
  stateSchema: z.object({
    agentName: z.string().optional(),
    approval: z.unknown().optional(),
  }),
  beforeModel: async (state) => {
    const approval = await interrupt({ type: "approval", content: "please approve" });
    const updates: Record<string, unknown> = { approval };

    if (!state.agentName) {
      updates.agentName = await interrupt({
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

const SYSTEM_PROMPT =
  "You are a helpful assistant. Once the user has given you a name, use it " +
  "when you refer to yourself.";

export const agent = createDeepAgent({
  model: MODEL,
  tools: [],
  middleware: [agentNameMiddleware],
  systemPrompt: SYSTEM_PROMPT,
});

export const multiAgent = createDeepAgent({
  model: MODEL,
  tools: [],
  middleware: [approvalAndNameMiddleware],
  systemPrompt: SYSTEM_PROMPT,
});
//#endregion
