/**
 * Agent backing the Tool Rendering route.
 *
 * https://docs.copilotkit.ai/deepagents/generative-ui/tool-rendering  (TypeScript tab)
 *
 * The page's `agent.ts` verbatim. The tool is deliberately trivial — the whole
 * point of the page is on the frontend, where `useRenderTool({ name:
 * "get_weather" })` replaces the default tool-call bubble with a component.
 *
 * `copilotkitMiddleware` is not on the page's snippet and is not added here
 * either: this route renders a backend tool, it does not call frontend ones.
 */

//#region tool-rendering-agent
import { createDeepAgent } from "deepagents";
import { tool } from "langchain";
import { z } from "zod";

import { MODEL } from "./shared.js";

const getWeather = tool(
  (args) => {
    return `The weather for ${args.location} is 70 degrees.`;
  },
  {
    name: "get_weather",
    description: "Get the weather for a given location.",
    schema: z.object({
      location: z.string().describe("The location to get weather for"),
    }),
  },
);

export const agent = createDeepAgent({
  model: MODEL,
  tools: [getWeather],
  systemPrompt: "You are a helpful assistant.",
});
//#endregion
