/**
 * Custom LangGraph graph backing the Input/Output Schemas route.
 *
 * https://docs.copilotkit.ai/deepagents/shared-state/state-inputs-outputs
 *
 * The page is Python-only and its callout sends TypeScript readers elsewhere:
 * the input/output split "applies when you're building a custom LangGraph
 * graph", `createDeepAgent` "uses middleware with a single state schema and
 * doesn't expose separate input/output schemas", and "for the Deep Agents
 * TypeScript equivalent of 'shared state between agent and frontend', see the
 * shared state guides".
 *
 * That advice is about Deep Agents, not about LangGraph — `StateGraph` in
 * @langchain/langgraph 1.4.9 takes `input` and `output` schemas just as the
 * Python one does. So this is the Python snippet ported: same three schemas,
 * same node, same wiring, expressed with `Annotation.Root` because that is the
 * JS idiom the other custom-graph routes in this repo already use.
 *
 * What the route demonstrates: `question` goes in and does not come back,
 * `answer` comes back, and `resources` never crosses the wire at all.
 *
 * One thing the page leaves undone in either language: `resources` is declared
 * as the field the UI must never see, and then never written —
 * `# ...add the rest of the agent implementation` sits where it would be
 * filled. An absent key proves nothing if the node never sets it, so
 * `answerNode` records what it really sent to the model. That stands in for the
 * retrieval step the page describes; it is not a guess at one.
 */

//#region state-schemas
import { Annotation } from "@langchain/langgraph";
import { CopilotKitStateAnnotation } from "@copilotkit/sdk-js/langgraph";

// Input schema for inputs you are willing to accept from the frontend
const InputState = Annotation.Root({
  ...CopilotKitStateAnnotation.spec,
  question: Annotation<string>,
});

// Output schema for output you are willing to pass to the frontend
const OutputState = Annotation.Root({
  ...CopilotKitStateAnnotation.spec,
  answer: Annotation<string>,
});

// The full schema, including the inputs, outputs and internal state
// ("resources" in our case)
const OverallState = Annotation.Root({
  ...InputState.spec,
  ...OutputState.spec,
  resources: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
});

type OverallStateType = typeof OverallState.State;
//#endregion

//#region answer-node
import type { RunnableConfig } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

import { OPENAI_MODEL } from "./shared.js";

/** Standard chat node, meant to answer general questions. */
async function answerNode(state: OverallStateType, config: RunnableConfig) {
  const model = new ChatOpenAI({ model: OPENAI_MODEL });

  // add the input question in the system prompt so it's passed to the LLM
  const systemMessage = new SystemMessage(
    `You are a helpful assistant. Answer the question: ${state.question}`,
  );

  // The internal half of the state. In a real agent this is where retrieved
  // documents would go; here it records what the node actually worked from,
  // so the UI has something concrete to fail to see.
  const resources = [
    `system_prompt: ${systemMessage.content}`,
    `model: ${OPENAI_MODEL}`,
    `prior_messages: ${state.messages?.length ?? 0}`,
  ];

  const response = await model.invoke([systemMessage, ...(state.messages ?? [])], config);

  // extract the answer, which will be assigned to the state soon
  const answer = response.content as string;

  return {
    messages: [response],
    // include the answer in the returned state
    answer,
    // written to OverallState, but absent from OutputState — so it stays
    // inside the graph and never reaches the browser
    resources,
  };
}
//#endregion

//#region graph
import { StateGraph, START, END } from "@langchain/langgraph";

// finally, before compiling the graph, we define the 3 state components
const workflow = new StateGraph({
  state: OverallState,
  input: InputState,
  output: OutputState,
})
  .addNode("answer_node", answerNode)
  .addEdge(START, "answer_node")
  .addEdge("answer_node", END);

export const graph = workflow.compile();
//#endregion
