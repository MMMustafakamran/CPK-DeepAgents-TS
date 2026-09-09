import { createCopilotRuntimeHandler } from "@copilotkit/runtime/v2";

import { buildRuntime } from "@/lib/intelligence-runtime";

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
 * That third point is exactly what the Intelligence Quickstart reversed on
 * 2026-09-09, for its own route. This mount stays multi-route: the Quickstart
 * still publishes `[[...slug]]` and four verbs, and the thread subtree is
 * dispatched in no other mode. The single-route version the Intelligence page
 * now prescribes is a separate mount at `/api/copilotkit-single`, over the same
 * runtime.
 */

const handler = createCopilotRuntimeHandler({
  runtime: buildRuntime(),
  basePath: "/api/copilotkit",
});

// Four verbs, not one. GET serves `/info` and the thread list, POST runs
// agents, and PATCH/DELETE are how threads are renamed, archived, and deleted.
export { handler as GET, handler as POST, handler as PATCH, handler as DELETE };
