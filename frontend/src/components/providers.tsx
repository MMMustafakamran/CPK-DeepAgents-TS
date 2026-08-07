"use client";

import { CopilotKit } from "@copilotkit/react-core/v2";
import type { ReactNode } from "react";

/**
 * One provider for the whole app, pointed at the Quickstart's runtime route, so
 * a conversation survives navigation between test routes.
 *
 * `<CopilotKit>`, not `<CopilotKitProvider>`. The Quickstart uses the former and
 * the difference is load-bearing: `CopilotKit` wraps `CopilotKitProvider` and
 * additionally mounts `CopilotListeners`, which is where the `PredictState`
 * subscription lives. Without it the Predictive State Updates route silently
 * shows nothing — the `PredictState` event arrives and no one is listening.
 *
 * The Quickstart also names its one agent here (`agent="sample_agent"`). This
 * harness serves eleven graphs, so no agent is named and each route passes its
 * own `agentId` to the chat component instead.
 */

const RUNTIME_URL = "/api/copilotkit";

export function Providers({ children }: { children: ReactNode }) {
  return <CopilotKit runtimeUrl={RUNTIME_URL}>{children}</CopilotKit>;
}
