/**
 * Agent backing the State Rendering route.
 *
 * https://docs.copilotkit.ai/deepagents/generative-ui/state-rendering  (TypeScript tab)
 *
 * The page prints two things: `searchesStateMiddleware`, and a `chatNode` that
 * pushes three search items to the frontend one at a time with
 * `copilotkitEmitState`. It does not print how either reaches a Deep Agent —
 * the prose only says the function belongs "inside a custom graph node function
 * that has access to state and config", and a prebuilt Deep Agent has no nodes
 * you write.
 *
 * So the emit loop is called from a `tool`, which is the one place in a
 * prebuilt Deep Agent that is handed a `RunnableConfig` — and
 * `copilotkitEmitState` needs one. The tool returns a `Command` so the final
 * list survives the node boundary; emitted state alone is a prediction and is
 * overwritten when the node returns.
 */

//#region agent-state
import { createMiddleware } from "langchain";
import { copilotkitMiddleware, zodState } from "@copilotkit/sdk-js/langgraph";
import { z } from "zod";

export const searchesStateMiddleware = createMiddleware({
    name: "AgentState",
    stateSchema: z.object({
        searches: zodState(z.array(z.object({
            query: z.string(),
            done: z.boolean(),
        })).default([])),
    }),
});
//#endregion

//#region emit-state
import { copilotkitEmitState } from "@copilotkit/sdk-js/langgraph";
import type { RunnableConfig } from "@langchain/core/runnables";

type Search = { query: string; done: boolean };

async function chatNode(state: any, config: any) {
    state.searches = [
        { query: "Initial research", done: false },
        { query: "Retrieving sources", done: false },
        { query: "Forming an answer", done: false },
    ];
    await copilotkitEmitState(config, state); 
    for (const search of state.searches) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        search.done = true;
        await copilotkitEmitState(config, state); 
    }
    // ... rest of your node logic
}
//#endregion

//#region glue
import { createDeepAgent } from "deepagents";
import { tool } from "langchain";
import { Command } from "@langchain/langgraph";
import { ToolMessage } from "@langchain/core/messages";
import type { ToolRunnableConfig } from "@langchain/core/tools";

import { MODEL } from "./shared.js";


export const agent = createDeepAgent({
  model: MODEL,
  tools: [],
  middleware: [searchesStateMiddleware, copilotkitMiddleware],
  systemPrompt:
    "You are a research assistant. When the user asks you to research anything, " +
    "call the research tool once, then summarise what you found in a sentence or two.",
});
//#endregion
