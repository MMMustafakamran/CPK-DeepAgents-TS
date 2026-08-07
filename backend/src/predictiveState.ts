/**
 * Agent backing the Predictive State Updates route — prebuilt-agent variant.
 *
 * https://docs.copilotkit.ai/deepagents/shared-state/predictive-state-updates?agent-type=prebuilt
 *
 * `stateStreamingMiddleware` takes `stateItem` mappings from a tool argument to
 * a state key and streams the argument into that key as the model writes it —
 * no `copilotkitEmitState` call and no `copilotkitCustomizeConfig` anywhere.
 *
 * Both blocks below are the page's TypeScript verbatim, bar the model id. This
 * is the one variant of this page that needs no glue at all: unlike the Python
 * tab, the page's `createDeepAgent` call already lists `observedStepsMiddleware`
 * in its `middleware` array, so the state schema is actually attached.
 */

//#region agent-state
import { createMiddleware } from "langchain";
import { copilotkitMiddleware, zodState } from "@copilotkit/sdk-js/langgraph";
import { z } from "zod";

export const observedStepsMiddleware = createMiddleware({
  name: "AgentState",
  stateSchema: z.object({
    observed_steps: zodState(z.array(z.string()).default([])),
  }),
});
//#endregion

//#region prebuilt-agent
import { createDeepAgent } from "deepagents";
import {
  stateStreamingMiddleware,
  stateItem,
} from "@copilotkit/sdk-js/langgraph-middlewares";
import { tool } from "langchain";

import { MODEL } from "./shared.js";

const stepProgressTool = tool(async (args) => args, {
  name: "step_progress_tool",
  description: "Reports the current steps being executed",
  schema: z.object({ steps: z.array(z.string()) }),
});

export const agent = createDeepAgent({
  model: MODEL,
  tools: [stepProgressTool],
  middleware: [
    observedStepsMiddleware,
    copilotkitMiddleware,
    stateStreamingMiddleware(
      // Map the tool's `steps` argument into the `observed_steps` state field.
      stateItem({
        stateKey: "observed_steps",
        tool: "step_progress_tool",
        toolArgument: "steps",
      }),
    ),
  ],
  systemPrompt: "You are a task performer. Report your steps using step_progress_tool.",
});
//#endregion
