import "server-only";

import {
  CopilotKitIntelligence,
  CopilotRuntime,
  InMemoryAgentRunner,
} from "@copilotkit/runtime/v2";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";

import type { GraphId } from "@/lib/agents";
import {
  GRAPH_IDS,
  LANGGRAPH_DEPLOYMENT_URL,
  LANGSMITH_API_KEY,
} from "@/lib/agents";

/**
 * The runtime, built once and mounted twice.
 *
 * It used to live inside `app/api/copilotkit/[[...slug]]/route.ts`. It moved
 * here when the Intelligence Quickstart switched its "Expose one Runtime route"
 * step from the multi-route handler to `mode: "single-route"` on 2026-09-09:
 * that made a second mount necessary, and the point of the second mount is that
 * the runtime behind it is identical, so the only variable under test is the
 * transport.
 *
 *   `/api/copilotkit`        — multi-route. Still what the Quickstart publishes,
 *                              and the only mount that can serve this repo's
 *                              thread list, rename, archive, and delete.
 *   `/api/copilotkit-single` — single-route. What the Intelligence Quickstart
 *                              now publishes, and what
 *                              `/intelligence/quickstart` exercises.
 *
 * A factory rather than a shared instance: each route builds its own so neither
 * mount can be affected by the other's channel activation.
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
 *
 * The Quickstart renamed this on 2026-09-04: it is `CPK_INTELLIGENCE_API_KEY`
 * now, holding a `cpk-...` project key, where it used to be
 * `INTELLIGENCE_API_KEY` holding what the page called a license key. The old
 * name is still read as a fallback — the value and its meaning did not change,
 * only what the page calls it, and silently ignoring an existing `.env.local`
 * would drop the runtime to SSE with no error to explain why.
 */
const INTELLIGENCE_API_KEY =
  process.env.CPK_INTELLIGENCE_API_KEY ?? process.env.INTELLIGENCE_API_KEY;

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

/** True when the project key is present, so Intelligence is actually wired. */
export const INTELLIGENCE_CONFIGURED = Boolean(INTELLIGENCE_API_KEY);

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
export function buildRuntime(): CopilotRuntime {
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
    // [1] intelligence quickstart: identifyUser
    // [!code highlight]
    identifyUser: (request) => ({
      id: request.headers.get("x-user-id") ?? "anonymous",
      name: request.headers.get("x-user-name") ?? "Anonymous",
    }),
  });
}
