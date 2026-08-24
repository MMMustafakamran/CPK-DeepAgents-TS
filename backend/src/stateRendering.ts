
//#region agent-state
import { ToolMessage } from "@langchain/core/messages";
import { tool, type ToolRuntime } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import {
  copilotkitMiddleware,
  zodState,
} from "@copilotkit/sdk-js/langgraph";
import {
  stateItem,
  stateStreamingMiddleware,
} from "@copilotkit/sdk-js/langgraph-middlewares";
import { createDeepAgent } from "deepagents";
import { createMiddleware } from "langchain";
import { z } from "zod";


const SearchSchema = z.object({
  query: z.string(),
  done: z.boolean(),
});
type Search = z.infer<typeof SearchSchema>;

const SearchesStateSchema = z.object({
  searches: z.array(SearchSchema),
});

const searchesStateMiddleware = createMiddleware({
  name: "SearchesState",
  stateSchema: z.object({
    searches: zodState(z.array(SearchSchema).default(() => [])),
  }),
});
//#endregion

//#region emit-state
const reportResearchProgress = tool(
  (
    input: { searches: Search[] },
    runtime: ToolRuntime<typeof SearchesStateSchema>,
  ) =>
    new Command({
      update: {
        searches: input.searches,
        messages: [
          new ToolMessage({
            content: "Research progress saved.",
            tool_call_id: runtime.toolCallId,
          }),
        ],
      },
    }),
  {
    name: "report_research_progress",
    description:
      "Report the current research tasks and completion status.",
    schema: z.object({ searches: z.array(SearchSchema) }),
  },
);

//#endregion

//#region glue

export const agent = createDeepAgent({
  model: "openai:gpt-5.4",
  tools: [reportResearchProgress],
  middleware: [
    searchesStateMiddleware,
    copilotkitMiddleware,
    stateStreamingMiddleware(
      stateItem({
        stateKey: "searches",
        tool: "report_research_progress",
        toolArgument: "searches",
      }),
    ),
  ],
  systemPrompt:
    "You are a research assistant. Use report_research_progress " +
    "to show each task and mark it done when complete.",
});

//#endregion