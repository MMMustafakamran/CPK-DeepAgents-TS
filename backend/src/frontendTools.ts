/**
 * Agent backing the Frontend Tools route.
 *
 * https://docs.copilotkit.ai/deepagents/frontend-tools  (TypeScript tab)
 *
 * The page's TypeScript contribution is one middleware — `yourStateMiddleware`
 * — plus a comment telling you to pass it alongside `copilotkitMiddleware`.
 * That second middleware is what puts the browser's registered tools in front
 * of the agent; the Quickstart annotates it as being there "for frontend tools
 * and context".
 *
 * The page's own comment line is the only place the agent appears, so the
 * `createDeepAgent` call below is written to the shape it describes.
 *
 * No tool is defined in this file. The only tool this agent can call is
 * `sayHello`, which lives in the browser — see
 * `frontend/src/app/frontend-tools/demo-chat/page.tsx`.
 */

//#region agent-state
import { createMiddleware } from "langchain";
import { copilotkitMiddleware } from "@copilotkit/sdk-js/langgraph";
import { z } from "zod";

export const yourStateMiddleware = createMiddleware({
  name: "YourAgentState",
  stateSchema: z.object({
    yourAdditionalProperty: z.string().optional(),
  }),
});

// Pass both middlewares when constructing the agent:
// createDeepAgent({ middleware: [yourStateMiddleware, copilotkitMiddleware], ... })
//#endregion

//#region agent
import { createDeepAgent } from "deepagents";

import { MODEL } from "./shared.js";

export const agent = createDeepAgent({
  model: MODEL,
  tools: [],
  middleware: [yourStateMiddleware, copilotkitMiddleware],
  systemPrompt:
    "You are a helpful assistant. You have tools that run in the user's " +
    "browser; call them when the user asks for something they cover.",
});
//#endregion
