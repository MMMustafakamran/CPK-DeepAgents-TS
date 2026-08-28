import {
  CopilotKitIntelligence,
  CopilotRuntime,
  InMemoryAgentRunner,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

import type { GraphId } from "@/lib/agents";
import {
  GRAPH_IDS,
  LANGGRAPH_DEPLOYMENT_URL,
  LANGSMITH_API_KEY,
} from "@/lib/agents";

/**
 * The Copilot Runtime, as the Quickstart now builds it.
 *
 * Three things moved when the docs switched to the v2 runtime surface, and all
 * three are load-bearing:
 *
 *   - The import is `@copilotkit/runtime/v2`, not `@copilotkit/runtime`. There
 *     is no `serviceAdapter` on this surface at all — `ExperimentalEmptyAdapter`
 *     belonged to the v1 GraphQL runtime and has no counterpart here.
 *   - `createCopilotRuntimeHandler` returns a plain fetch handler rather than a
 *     `{ handleRequest }` wrapper, so the route is just the verb exports below.
 *   - The file lives at `[[...slug]]/route.ts`, not `route.ts`. The handler
 *     serves a subtree — `/info`, agent runs, thread list/rename/delete — so a
 *     single-segment route would 404 everything except the bare URL.
 *
 * The agent map is unchanged from before: the Quickstart registers one
 * `LangGraphAgent`, and this harness registers one per graph in
 * `backend/langgraph.json` with the same constructor arguments.
 */
//
// Typed as `Record<GraphId, ...>` rather than left to inference:
// `Object.fromEntries` widens to `{ [k: string]: ... }`, and the runtime's
// `agents` option is a `NonEmptyRecord`, which an index signature can never
// satisfy. The cast restores the literal key union that `GRAPH_IDS as const`
// already guarantees.
const agents = Object.fromEntries(
  GRAPH_IDS.map((graphId) => [
    graphId,
    new LangGraphAgent({
      deploymentUrl: LANGGRAPH_DEPLOYMENT_URL,
      graphId,
      langsmithApiKey: LANGSMITH_API_KEY,
    }),
  ]),
) as Record<GraphId, LangGraphAgent>;

/**
 * Server-side only, and deliberately not `NEXT_PUBLIC_`. A project key prefixed
 * for the browser would ship in the bundle.
 */
const INTELLIGENCE_API_KEY = process.env.INTELLIGENCE_API_KEY;

/**
 * A SECOND, SEPARATE credential — and the one that unlocks the Threads Drawer.
 *
 * `INTELLIGENCE_API_KEY` authorizes the runtime against the platform: it is what
 * makes `/info` report `mode: "intelligence"` and what makes the thread REST
 * endpoints return real rows. It does NOT advertise a license.
 *
 * `licenseToken` is what does. The runtime builds a `licenseChecker` from it (or
 * from `COPILOTKIT_LICENSE_TOKEN`), and `/info` reports `licenseStatus` off that
 * checker — `"none"` when there is no checker at all. Client-side feature UIs
 * read that field: `<CopilotThreadsDrawer>` renders its locked "Threads are a
 * CopilotKit Intelligence feature" view unless the status is `valid` or
 * `expiring`, regardless of whether threads actually work.
 *
 * So a runtime can serve threads perfectly while every drawer in the app shows
 * an Upgrade button. Set both to avoid that.
 */
const LICENSE_TOKEN = process.env.COPILOTKIT_LICENSE_TOKEN;

/**
 * `CopilotRuntimeOptions` is a union, not one object with optional fields:
 * Intelligence mode requires both `intelligence` and `identifyUser`, and SSE
 * mode permits neither. So the two shapes are built separately rather than
 * spread conditionally into one literal.
 *
 * Without a key the runtime falls back to SSE with an in-memory runner. Chat
 * still works everywhere in this harness; Threads and the Inspector's thread
 * tab stay locked, and the key is never read.
 */
function buildRuntime(): CopilotRuntime {
  if (!INTELLIGENCE_API_KEY) {
    return new CopilotRuntime({
      agents,
      runner: new InMemoryAgentRunner(),
      ...(LICENSE_TOKEN ? { licenseToken: LICENSE_TOKEN } : {}),
    });
  }

  return new CopilotRuntime({
    agents,
    ...(LICENSE_TOKEN ? { licenseToken: LICENSE_TOKEN } : {}),
    intelligence: new CopilotKitIntelligence({
      // apiUrl and wsUrl default to the managed platform — leave them unset.
      apiKey: INTELLIGENCE_API_KEY,
    }),
    // Threads are per-user. Without this, every visitor shares one history.
    // `Providers` sends these headers so the harness has a stable identity to
    // key threads on; a real app would read them from a verified session.
    identifyUser: (request) => ({
      id: request.headers.get("x-user-id") ?? "anonymous",
      name: request.headers.get("x-user-name") ?? "Anonymous",
    }),
  });
}

const handler = createCopilotRuntimeHandler({
  runtime: buildRuntime(),
  basePath: "/api/copilotkit",
});

// Four verbs, not one. GET serves `/info` and the thread list, POST runs
// agents, and PATCH/DELETE are how threads are renamed, archived, and deleted.
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
