"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";

/**
 * One provider for the whole app, so chat state survives navigation between
 * test routes.
 *
 * `<CopilotKit>`, not `<CopilotKitProvider>`, and `useSingleEndpoint={false}` —
 * both straight from the Quickstart, and both load-bearing here.
 *
 * `useSingleEndpoint={false}` is what the multi-route runtime needs. The v2
 * handler serves a subtree (`/info`, agent runs, thread list/rename/delete), so
 * a client pinned to the single-endpoint transport would POST the bare URL and
 * 404 everything while `/info` still returned 200 — the app would look
 * connected and do nothing. At 1.69.3 the wrapper honours the flag
 * (`useSingleEndpoint === false ? "rest"`); older releases pinned it to `true`
 * internally, which is why some guides tell you to reach for
 * `<CopilotKitProvider>` instead.
 *
 * Staying on `<CopilotKit>` also keeps something the bare provider drops: it
 * mounts `CopilotListeners`, which is where the `PredictState` subscriber
 * lives. Without it the Predictive State Updates route silently shows nothing —
 * the event arrives and no one is listening.
 *
 * The Quickstart also names its one agent here (`agent="sample_agent"`). This
 * repo registers a graph per doc route, so no agent is named and each route
 * passes the `agentId` it wants.
 *
 * `headers` carries the identity `identifyUser` reads on the runtime. Threads
 * are per-user, so without it every visitor of a deployed copy would share one
 * history. A real app would derive this from a verified session; a local test
 * harness has no session, so it sends a fixed demo identity you can override
 * with NEXT_PUBLIC_DEMO_USER_ID to watch thread lists diverge.
 */

const RUNTIME_URL = "/api/copilotkit";

const DEMO_USER_ID = process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "harness-local";
const DEMO_USER_NAME = process.env.NEXT_PUBLIC_DEMO_USER_NAME ?? "Harness User";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CopilotKit
      runtimeUrl={RUNTIME_URL}
      useSingleEndpoint={false}
      headers={{
        "x-user-id": DEMO_USER_ID,
        "x-user-name": DEMO_USER_NAME,
      }}
    >
      {children}
    </CopilotKit>
  );
}
