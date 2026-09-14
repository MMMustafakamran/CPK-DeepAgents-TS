/**
 * Quickstart agent.
 *
 * https://docs.copilotkit.ai/deepagents/quickstart  (TypeScript tab)
 *
 * The page's `agent.ts` verbatim, with one substitution: `model` reads
 * `src/shared.ts`'s `MODEL` instead of the literal `"openai:gpt-4o"` the page
 * prints, so every agent in this backend can be pointed at one model from
 * `.env`.
 *
 * `langgraph.json` maps this module's `agent` to the graph id `sample_agent`,
 * which is the id the frontend addresses. The page's own `langgraph.json`
 * points at `./agent.ts:agent` — that file path is why the Quickstart's agent
 * lives at the backend root rather than under `src/`.
 */

//#region quickstart-agent
import { createDeepAgent } from "deepagents";
import { copilotkitMiddleware } from "@copilotkit/sdk-js/langgraph";
import { tool } from "langchain";
import { z } from "zod";

import { MODEL } from "./src/shared.js";

const getWeather = tool(
  async ({ location }) => `The weather in ${location} is sunny.`,
  {
    name: "get_weather",
    description: "Get the weather for a given location.",
    schema: z.object({
      location: z.string().describe("The location to get the weather for"),
    }),
  },
);

export const agent = createDeepAgent({
  model: MODEL,
  tools: [getWeather],
  middleware: [copilotkitMiddleware],
  systemPrompt: "You are a helpful research assistant.",
});
//#endregion
