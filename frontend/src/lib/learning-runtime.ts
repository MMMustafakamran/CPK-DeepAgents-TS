import "server-only";

import {
  CopilotKitIntelligence,
  CopilotRuntime,
} from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

import { LANGGRAPH_DEPLOYMENT_URL, LANGSMITH_API_KEY } from "@/lib/agents";

/**
 * Learning, step "Assign Threads from your Runtime" — the page's runtime,
 * mounted on its own route at `/api/copilotkit-learning`.
 *
 * The snippet below the rule is verbatim. It uses two identifiers it never
 * defines, `agents` and `identifyUser`, and says nothing about them; the page
 * is identical under every framework prefix, so it cannot. They are supplied
 * here, above the rule, and they are this harness's, not the page's:
 *
 *   agents        The Quickstart's Deep Agent (graph `sample_agent`) under the
 *                 id the page's selector tests for, `expense-agent`, and again
 *                 under this repo's own id, `sample_agent`, which the selector
 *                 sends to no container. One graph, two ids: which one a run
 *                 uses is the only thing that decides whether it is assigned.
 *   identifyUser  The same `x-user-id` / `x-user-name` identity the main
 *                 runtime's `identifyUser` reads.
 *
 * A separate mount rather than an edit to `/api/copilotkit`, because the page's
 * constructor throws on a blank key, so its code belongs where a failure takes
 * down one route and not every chat in the app. This harness has no
 * `CPK_INTELLIGENCE_API_KEY`, locally or in CI, so that is exactly what happens
 * here: the module throws at load and the route answers 500.
 * `getLearningContainerId` itself exists from runtime 1.70 — the page names no
 * version floor; this repo's lockfile (1.70.1) and CI (1.71.0) both have it.
 */

const deepAgent = () =>
  new LangGraphAgent({
    deploymentUrl: LANGGRAPH_DEPLOYMENT_URL,
    graphId: "sample_agent",
    langsmithApiKey: LANGSMITH_API_KEY,
  });

const agents = {
  "expense-agent": deepAgent(),
  sample_agent: deepAgent(),
};

const identifyUser = (request: Request) => ({
  id: request.headers.get("x-user-id") ?? "anonymous",
  name: request.headers.get("x-user-name") ?? "Anonymous",
});

// ── the page's snippet ─────────────────────────────────────────────────────

// [1] learning: assign Threads from your Runtime
const intelligence = new CopilotKitIntelligence({
  apiKey: process.env.CPK_INTELLIGENCE_API_KEY!,
  getLearningContainerId: ({ agentId }) =>
    agentId === "expense-agent" ? "expense-review" : undefined,
});

const runtime = new CopilotRuntime({
  agents,
  intelligence,
  identifyUser,
});

export { runtime as learningRuntime };
