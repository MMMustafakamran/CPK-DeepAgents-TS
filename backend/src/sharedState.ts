/**
 * Agent backing the Reading / Writing agent state routes.
 *
 * https://docs.copilotkit.ai/deepagents/shared-state/in-app-agent-read
 * https://docs.copilotkit.ai/deepagents/shared-state/in-app-agent-write
 *
 * Both pages print the same TypeScript — one middleware with a `language`
 * field — and differ only in what the frontend does with it: read it, or write
 * it back with `agent.setState`. One agent serves both routes.
 *
 * `zodState`, which these pages DO use, is load-bearing. Its own docstring
 * explains why: without it a field is dropped from the graph's `output_schema`
 * and AG-UI filters it out of `STATE_SNAPSHOT`, so `useAgent().state.language`
 * would stay undefined in the browser even though the thread state has it.
 *
 * What neither page addresses is that reading state is not the same as the
 * model seeing it. `createCopilotkitMiddleware({ exposeState })` looks like the
 * answer — it serialises named state keys into the system prompt — but it
 * cannot work in this composition, verified against a live run:
 *
 *   `exposeState` is applied inside the CopilotKit middleware's own
 *   `wrapModelCall`, from `request.state`. That object is scoped to the
 *   *declaring* middleware's `stateSchema`, so it holds only `messages` and
 *   `copilotkit` here — `language` is declared on `languageStateMiddleware`,
 *   a different middleware, and is therefore invisible to it. The note is
 *   never built, with `exposeState: ["language"]` or `exposeState: true`.
 *
 * So this file uses the plain `copilotkitMiddleware` singleton the pages name.
 * State round-trips correctly in both directions — which is what the two pages
 * are actually about — but the model does not change language. See the Writing
 * route for the measurement.
 */

//#region agent-state
import { createMiddleware } from "langchain";
import { copilotkitMiddleware, zodState } from "@copilotkit/sdk-js/langgraph";
import { z } from "zod";

export const languageStateMiddleware = createMiddleware({
  name: "AgentState",
  stateSchema: z.object({
    language: zodState(z.enum(["english", "spanish"]).default("english")),
  }),
});

// Compose with copilotkitMiddleware when constructing the agent:
// createDeepAgent({ middleware: [languageStateMiddleware, copilotkitMiddleware], ... })
//#endregion

//#region agent
import { createDeepAgent } from "deepagents";

import { MODEL } from "./shared.js";

export const agent = createDeepAgent({
  model: MODEL,
  tools: [],
  middleware: [languageStateMiddleware, copilotkitMiddleware],
  systemPrompt:
    "You are a helpful assistant. Always answer in the language named by " +
    "the `language` value in the current agent state.",
});
//#endregion
