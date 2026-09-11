"use client";

import {
  CopilotChat,
  CopilotKit,
  useAgent,
  useCopilotKit,
} from "@copilotkit/react-core/v2";
import { Component, type ReactNode, useEffect, useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

import { DeploymentWatcher } from "../deployment-watcher";
import { eventCardRenderer } from "../event-card";

/**
 * Frontend-Driven Cards — two panes, because in this repo the page's code
 * cannot run as published.
 *
 * TOP, "As published": step 2's provider, props unchanged
 * (`runtimeUrl="/api/copilotkit"` and `renderActivityMessages`, nothing else —
 * no `agent`, no `useSingleEndpoint`, no headers), with step 3's
 * `<DeploymentWatcher />` and step 2's `<CopilotChat />` inside it, verbatim.
 * Neither names an agent, so both resolve to `"default"`. This runtime has no
 * `default` — it registers one agent per graph in `backend/langgraph.json`,
 * the way the Deep Agents Quickstart names its agent `sample_agent` — so the
 * moment `/info` answers, `useAgent()` throws "Agent 'default' not found after
 * runtime sync" during render. Unguarded, that takes the whole route down
 * (Next's "This page couldn't load"). The pane is wrapped in an error boundary
 * so the throw is printed where it happened and the rest of the route
 * survives; the boundary is harness chrome and changes nothing inside it.
 *
 * BOTTOM, "Harness": the same provider props, with `agentId="sample_agent"`
 * added to `useAgent` and `<CopilotChat>` — the one change the page's code
 * needs to run on this runtime, and the only thing that differs from the top
 * pane. Everything the page teaches is exercised here:
 *
 *   - A button that adds the same activity message step 3 adds. Step 3's
 *     trigger is a WebSocket at a placeholder host that never sends anything;
 *     the page names "a button `onClick`" as an equivalent trigger.
 *   - A probe for the page's "What the agent receives" table: the roles in
 *     `agent.messages`, beside the roles in the run request that actually left
 *     the browser. The page says `activity` is in the first and never in the
 *     second. The probe reads the request body itself rather than trusting the
 *     library's own accounting. It works without a model key: the request is
 *     read as it leaves, whatever the backend then does with it.
 */

type Probe = { roles: string[]; at: string } | null;

/** The agent id this runtime actually registers (see `lib/agents.ts`). */
const HARNESS_AGENT_ID = "sample_agent";

/** Pulls the message roles out of an outgoing agent-run request body. */
function rolesInRunBody(raw: string): string[] | null {
  try {
    const body = JSON.parse(raw);
    const messages = body?.messages ?? body?.body?.messages ?? body?.params?.messages;
    if (!Array.isArray(messages)) return null;
    return messages.map((m: { role?: string }) => m.role ?? "?");
  } catch {
    return null;
  }
}

/** Catches the top pane's render-time throw and prints it in place. */
class CrashBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div
          data-testid="cards-crash"
          className="h-full overflow-auto bg-rose-50 p-3 font-mono text-xs text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
        >
          <p className="font-sans font-semibold">The page&apos;s code threw during render:</p>
          <p className="mt-1 break-words">{this.state.error.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function CardControls({ agentId }: { agentId: string }) {
  const { agent, isReady } = useAgent({ agentId });
  const { copilotkit } = useCopilotKit();
  const [payload, setPayload] = useState<Probe>(null);

  // Taps every POST this route sends to the runtime, and records the roles in
  // any body that carries a message list — which is exactly the run payload.
  useEffect(() => {
    const original = window.fetch;
    window.fetch = async (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("/api/copilotkit") && typeof init?.body === "string") {
        const roles = rolesInRunBody(init.body);
        if (roles) setPayload({ roles, at: new Date().toLocaleTimeString() });
      }
      return original(input, init);
    };
    return () => {
      window.fetch = original;
    };
  }, []);

  function addCard() {
    // Step 3's `addMessage` call, fired from a click instead of a socket.
    agent.addMessage({
      id: crypto.randomUUID(),
      role: "activity",
      activityType: "app-event-card",
      content: {
        title: "Deployment finished",
        detail: `sha ${Math.random().toString(16).slice(2, 9)}`,
      },
    });
  }

  const transcriptRoles = agent.messages.map((m) => m.role);
  const leaked = payload?.roles.includes("activity") ?? false;

  return (
    <div className="shrink-0 border-b border-slate-200 p-3 dark:border-slate-800">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          data-testid="add-activity-card"
          onClick={addCard}
          className="rounded-md border border-[var(--accent)] px-3 py-1.5 text-sm text-[var(--accent)]"
        >
          Simulate: deployment finished
        </button>
        <p className="text-xs text-slate-500">
          Adds a <code>role: &quot;activity&quot;</code> message with{" "}
          <code>activityType: &quot;app-event-card&quot;</code> — step 3&apos;s{" "}
          <code>addMessage</code>, from a click.
        </p>
      </div>

      <table className="mt-3 w-full text-left text-xs">
        <tbody className="align-top">
          <tr>
            <th className="w-64 py-1 pr-3 font-medium text-slate-500">
              <code>useAgent()</code> → agent
            </th>
            <td data-testid="agent-state" className="py-1 font-mono">
              {`${agent.agentId ?? "?"} · isReady ${String(isReady)} · runtime ${copilotkit.runtimeConnectionStatus}`}
            </td>
          </tr>
          <tr className="border-t border-slate-200 dark:border-slate-800">
            <th className="w-64 py-1 pr-3 font-medium text-slate-500">
              <code>agent.messages</code> (what the chat renders)
            </th>
            <td data-testid="roles-transcript" className="py-1 font-mono">
              {transcriptRoles.length ? transcriptRoles.join(", ") : "—"}
            </td>
          </tr>
          <tr className="border-t border-slate-200 dark:border-slate-800">
            <th className="py-1 pr-3 font-medium text-slate-500">
              Last run payload (what the agent receives)
            </th>
            <td
              data-testid="roles-payload"
              className={`py-1 font-mono ${
                leaked
                  ? "text-rose-700 dark:text-rose-400"
                  : "text-emerald-700 dark:text-emerald-400"
              }`}
            >
              {payload
                ? `${payload.roles.join(", ")}  (${payload.at})${leaked ? "  ← activity reached the agent" : ""}`
                : "no run sent yet"}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function PaneLabel({ children }: { children: ReactNode }) {
  return (
    <p className="shrink-0 border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      {children}
    </p>
  );
}

export default function Page() {
  return (
    <DemoFrame
      parentPath="/generative-ui/frontend-cards"
      subtitle="activity messages · never sent to the agent"
    >
      <div className="flex h-full flex-col">
        <section data-testid="cards-as-published" className="flex h-36 shrink-0 flex-col border-b-4 border-slate-200 dark:border-slate-800">
          <PaneLabel>
            <strong>As published</strong> — steps 2 and 3 verbatim. No <code>agentId</code>, so{" "}
            <code>useAgent()</code> and <code>&lt;CopilotChat /&gt;</code> ask for{" "}
            <code>&quot;default&quot;</code>.
          </PaneLabel>
          <div className="min-h-0 flex-1 overflow-hidden">
            <CrashBoundary>
              {/* [2] frontend cards: register the renderer on the provider */}
              <CopilotKit
                runtimeUrl="/api/copilotkit"
                renderActivityMessages={[eventCardRenderer]} // [!code highlight]
              >
                <DeploymentWatcher />
                <CopilotChat />
              </CopilotKit>
            </CrashBoundary>
          </div>
        </section>

        <section className="flex min-h-0 flex-1 flex-col">
          <PaneLabel>
            <strong>Harness</strong> — the same provider props, plus{" "}
            <code>agentId=&quot;{HARNESS_AGENT_ID}&quot;</code> on <code>useAgent</code> and{" "}
            <code>&lt;CopilotChat&gt;</code>: the one id this runtime registers.
          </PaneLabel>
          <div className="min-h-0 flex-1">
            <CopilotKit runtimeUrl="/api/copilotkit" renderActivityMessages={[eventCardRenderer]}>
              <div className="flex h-full flex-col">
                <CardControls agentId={HARNESS_AGENT_ID} />
                <div className="min-h-0 flex-1">
                  <CopilotChat agentId={HARNESS_AGENT_ID} />
                </div>
              </div>
            </CopilotKit>
          </div>
        </section>
      </div>
    </DemoFrame>
  );
}
