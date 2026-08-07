import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import { NextRequest } from "next/server";

import {
  GRAPH_IDS,
  LANGGRAPH_DEPLOYMENT_URL,
  LANGSMITH_API_KEY,
} from "@/lib/agents";

// The Quickstart's Deep Agent runtime, widened from one graph to the whole
// manifest.
//
// The page registers a single `sample_agent: new LangGraphAgent({...})`. This
// harness has one graph per doc route, so every id in `langgraph.json` gets a
// `LangGraphAgent` pointed at the same dev server with its own `graphId`. The
// constructor arguments are otherwise exactly the page's.
const serviceAdapter = new ExperimentalEmptyAdapter();

const agents = Object.fromEntries(
  GRAPH_IDS.map((graphId) => [
    graphId,
    new LangGraphAgent({
      deploymentUrl: LANGGRAPH_DEPLOYMENT_URL,
      graphId,
      langsmithApiKey: LANGSMITH_API_KEY,
    }),
  ]),
);

const runtime = new CopilotRuntime({
  agents,
});

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
};
