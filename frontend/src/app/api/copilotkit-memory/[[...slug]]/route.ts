import {
  CopilotKitIntelligence,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

import {
  LANGGRAPH_DEPLOYMENT_URL,
  LANGSMITH_API_KEY,
} from "@/lib/agents";

/**
 * NOT FROM THE PAGE. The runtime option Memories & Recall never mentions.
 *
 * The page says memory "is not a feature flag" and that `isAvailable: false` is
 * what an unentitled deployment looks like. On runtime 1.71.0 there is a gate
 * before entitlement is ever consulted: every `/memories/*` request 404s at the
 * runtime unless it is constructed with `memory: { access }` (or the deprecated
 * `exposeMemoryRoutes: true`) — a "secure default", per the runtime's own
 * typings. `/api/copilotkit`, built the way the Quickstart builds it, has
 * neither, so with a key the page's `useMemories()` would report unavailable
 * there no matter what the organization is entitled to. (Without a key, which
 * is this repo, that runtime is in SSE mode and the hook never sends a memory
 * request at all — see `/intelligence/memories`.)
 *
 * This mount is an Intelligence runtime with that one option added, granting
 * the user read-write. Memory needs Intelligence, and this harness has no
 * `CPK_INTELLIGENCE_API_KEY` (locally or in CI), so here it answers 503 and
 * says why — the second pass of the demo shows that rather than a platform
 * verdict. Agno-react, which has a key, shows what sits behind the gate:
 * `403 MEMORY_NOT_ENTITLED` from the platform, with the hook reporting
 * `isAvailable: true` over an empty list.
 */

const INTELLIGENCE_API_KEY =
  process.env.CPK_INTELLIGENCE_API_KEY ?? process.env.INTELLIGENCE_API_KEY;

function build(): CopilotRuntime | null {
  if (!INTELLIGENCE_API_KEY) return null;
  return new CopilotRuntime({
    agents: {
      sample_agent: new LangGraphAgent({
        deploymentUrl: LANGGRAPH_DEPLOYMENT_URL,
        graphId: "sample_agent",
        langsmithApiKey: LANGSMITH_API_KEY,
      }),
    },
    intelligence: new CopilotKitIntelligence({ apiKey: INTELLIGENCE_API_KEY }),
    identifyUser: (request: Request) => ({
      id: request.headers.get("x-user-id") ?? "anonymous",
      name: request.headers.get("x-user-name") ?? "Anonymous",
    }),
    // The missing option.
    memory: {
      access: () => ({ user: "read-write", project: "none" }),
    },
  });
}

const runtime = build();

const handler = runtime
  ? createCopilotRuntimeHandler({ runtime, basePath: "/api/copilotkit-memory" })
  : async () =>
      Response.json(
        { error: "CPK_INTELLIGENCE_API_KEY is not set; memory needs an Intelligence runtime." },
        { status: 503 },
      );

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const DELETE = handler;
