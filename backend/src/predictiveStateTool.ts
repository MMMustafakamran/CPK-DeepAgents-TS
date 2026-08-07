/**
 * Custom graph backing Predictive State Updates — tool-emission variant.
 *
 * https://docs.copilotkit.ai/deepagents/shared-state/predictive-state-updates?agent-type=custom-graph&state-emission=tool-emission
 *
 * Also not a Deep Agent, and also printed in full on the TypeScript tab —
 * imports, tool, node, routing, compile. The Python tab for this same variant
 * shows only a bare node, so the Python sibling repo can only quote it.
 *
 * The mapping is the same one `stateStreamingMiddleware` packages in the
 * prebuilt variant, declared here on the `RunnableConfig` with
 * `copilotkitCustomizeConfig({ emitIntermediateState })` instead.
 *
 * Note the page's own care in the tool body: a tool returning a `Command` must
 * carry its own `ToolMessage`, and it throws rather than emit one with an empty
 * `tool_call_id` because OpenAI rejects those. That check is the page's, kept
 * verbatim — and it is the same trap the State Rendering route hits.
 *
 * Two changes: the model id reads OPENAI_MODEL, and `shouldContinue` returns
 * the typed node names LangGraph 1.4.9 expects rather than being cast to `any`.
 */

//#region imports-and-state
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { RunnableConfig } from "@langchain/core/runnables";
import { tool } from "@langchain/core/tools";
import type { ToolRunnableConfig } from "@langchain/core/tools";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import type { AIMessage } from "@langchain/core/messages";
import { SystemMessage, ToolMessage } from "@langchain/core/messages";
import { Annotation, Command, MemorySaver, START, StateGraph } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import {
  copilotkitCustomizeConfig,
  convertActionsToDynamicStructuredTools,
  CopilotKitStateAnnotation,
} from "@copilotkit/sdk-js/langgraph";

import { OPENAI_MODEL } from "./shared.js";

// 1. Define shared state with CopilotKit annotations
const AgentStateAnnotation = Annotation.Root({
  ...CopilotKitStateAnnotation.spec,
  observed_steps: Annotation<string[]>,
});

type AgentState = typeof AgentStateAnnotation.State;
//#endregion

//#region step-progress-tool
// 2. Define the tool with proper ToolMessage handling
const stepProgressTool = tool(
  async ({ steps }, config: ToolRunnableConfig) => {
    const toolCallId = config.toolCall?.id;
    if (typeof toolCallId !== "string" || toolCallId.length === 0) {
      throw new Error(
        "step_progress_tool: missing tool_call_id — tool was invoked outside a " +
          "ToolNode context. Refusing to emit a ToolMessage with an empty " +
          "tool_call_id (OpenAI rejects those).",
      );
    }

    return new Command({
      update: {
        observed_steps: steps,
        messages: [
          new ToolMessage({
            content: "Steps recorded to shared state.",
            name: "step_progress_tool",
            id: randomUUID(),
            tool_call_id: toolCallId,
          }),
        ],
      },
    });
  },
  {
    name: "step_progress_tool",
    description: "Reports the current steps being executed",
    schema: z.object({ steps: z.array(z.string()) }),
  },
);

const tools = [stepProgressTool];
//#endregion

//#region chat-node
// 3. Define the chat node
async function chatNode(state: AgentState, config: RunnableConfig) {
  const model = new ChatOpenAI({
    model: OPENAI_MODEL,
    modelKwargs: { parallel_tool_calls: false },
  });

  const modelWithTools = model.bindTools!([
    ...convertActionsToDynamicStructuredTools(state.copilotkit?.actions ?? []),
    ...tools,
  ]);

  // Configure CopilotKit to stream tool arguments into state
  const streamingConfig = copilotkitCustomizeConfig(config, {
    emitIntermediateState: [
      {
        stateKey: "observed_steps",
        tool: "step_progress_tool",
        toolArgument: "steps",
      },
    ],
  });

  const response = await modelWithTools.invoke(
    [
      new SystemMessage(
        "You are a task performer. Pretend doing tasks you are given, " +
          "report the steps using step_progress_tool.",
      ),
      ...state.messages,
    ],
    streamingConfig,
  );

  return { messages: response };
}
//#endregion

//#region routing-and-graph
// 4. Define routing logic
function shouldContinue({ messages, copilotkit }: AgentState) {
  const lastMessage = messages[messages.length - 1] as AIMessage;

  if (lastMessage.tool_calls?.length) {
    const actions = copilotkit?.actions;
    const hasBackendToolCall = lastMessage.tool_calls.some((toolCall) => {
      return !actions || actions.every((action) => action.name !== toolCall.name);
    });

    if (hasBackendToolCall) {
      return "tool_node";
    }
  }

  return "__end__";
}

// 5. Compile the graph
const workflow = new StateGraph(AgentStateAnnotation)
  .addNode("chat_node", chatNode)
  .addNode("tool_node", new ToolNode(tools))
  .addEdge(START, "chat_node")
  .addEdge("tool_node", "chat_node")
  .addConditionalEdges("chat_node", shouldContinue, ["tool_node", "__end__"]);

const memory = new MemorySaver();

export const graph = workflow.compile({
  checkpointer: memory,
});
//#endregion
