import "server-only";

import { LANGGRAPH_DEPLOYMENT_URL } from "./agents";

/**
 * Reachability + configuration snapshot for the Quickstart's connection panel.
 *
 * Server-side by necessity on both counts: the browser has no route to the
 * agent process (and should not have one), and `INTELLIGENCE_API_KEY` is a
 * server secret that must never reach the bundle.
 *
 * Two things are probed:
 *
 *   - `GET {LANGGRAPH_DEPLOYMENT_URL}/ok` — the LangGraph dev server's own
 *     liveness endpoint, which answers `{"ok": true}`.
 *   - `GET /api/copilotkit/info` — the runtime's discovery route. It is how the
 *     frontend negotiates its transport, so a 200 here is what proves the
 *     multi-route handler is mounted at the catch-all path. Its `mode` field
 *     ("sse" | "intelligence") is also the honest answer to "is Intelligence
 *     actually on": a key can be set and still unread, and SSE mode already
 *     reports `threadEndpoints.list: true` from its in-memory runner, so the
 *     flags alone would read as a false positive.
 */

export interface ThreadEndpoints {
  list?: boolean;
  inspect?: boolean;
  mutations?: boolean;
  realtimeMetadata?: boolean;
}

/** What the runtime reports it is running as. */
export type RuntimeMode = "sse" | "intelligence";

export interface RuntimeInfoReport {
  agent: { ok: boolean; detail: string };
  runtime: { ok: boolean; detail: string };
  agentUrl: string;
  /** Whether a project key is configured on the server. */
  intelligenceKeySet: boolean;
  /** The runtime's own answer, from `/info`. Absent when the probe failed. */
  mode?: RuntimeMode;
  /**
   * `/info`'s `licenseStatus`. A SEPARATE axis from `mode`: it reflects the
   * runtime's `licenseToken`, not its Intelligence key, and it is what
   * client-side feature UIs (the Threads Drawer) gate on.
   */
  licenseStatus?: string;
  /** Whether a license token is configured on the server. */
  licenseTokenSet: boolean;
  /** What `/info` says the runtime can actually do with threads. */
  threadEndpoints?: ThreadEndpoints;
  /** Graph ids the runtime reported. */
  agentIds: string[];
}

/** The app's own origin, for the server-side `/info` probe. */
function selfOrigin(): string {
  const port = process.env.PORT ?? "3000";
  return process.env.NEXT_PUBLIC_SITE_ORIGIN ?? `http://127.0.0.1:${port}`;
}

async function probeAgent(): Promise<RuntimeInfoReport["agent"]> {
  const url = `${LANGGRAPH_DEPLOYMENT_URL}/ok`;
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, detail: `${url} returned ${res.status}` };
    return { ok: true, detail: `200 from ${url} — the LangGraph dev server is up.` };
  } catch (error) {
    return {
      ok: false,
      detail:
        error instanceof Error
          ? `${url} unreachable — ${error.message}`
          : `${url} unreachable`,
    };
  }
}

async function probeRuntime(): Promise<
  Omit<RuntimeInfoReport, "agent" | "agentUrl" | "intelligenceKeySet" | "licenseTokenSet">
> {
  const infoUrl = `${selfOrigin()}/api/copilotkit/info`;
  try {
    const res = await fetch(infoUrl, {
      signal: AbortSignal.timeout(4000),
      cache: "no-store",
    });
    if (!res.ok) {
      return {
        runtime: {
          ok: false,
          detail: `${infoUrl} returned ${res.status} — the handler is probably still at route.ts rather than [[...slug]]/route.ts.`,
        },
        agentIds: [],
      };
    }
    const body = (await res.json()) as {
      agents?: Record<string, unknown> | { id?: string; name?: string }[];
      mode?: RuntimeMode;
      licenseStatus?: string;
      threadEndpoints?: ThreadEndpoints;
    };
    const agentIds = Array.isArray(body.agents)
      ? body.agents.map((a) => a?.id ?? a?.name ?? "?")
      : Object.keys(body.agents ?? {});
    return {
      runtime: {
        ok: true,
        detail: `200 from /api/copilotkit/info — mode "${body.mode}", ${agentIds.length} graph(s) registered.`,
      },
      mode: body.mode,
      licenseStatus: body.licenseStatus,
      threadEndpoints: body.threadEndpoints,
      agentIds,
    };
  } catch (error) {
    return {
      runtime: {
        ok: false,
        detail:
          error instanceof Error
            ? `${infoUrl} unreachable — ${error.message}`
            : `${infoUrl} unreachable`,
      },
      agentIds: [],
    };
  }
}

export async function getRuntimeInfo(): Promise<RuntimeInfoReport> {
  const [agent, runtimeProbe] = await Promise.all([probeAgent(), probeRuntime()]);

  return {
    agent,
    agentUrl: LANGGRAPH_DEPLOYMENT_URL,
    intelligenceKeySet: Boolean(process.env.INTELLIGENCE_API_KEY),
    licenseTokenSet: Boolean(process.env.COPILOTKIT_LICENSE_TOKEN),
    ...runtimeProbe,
  };
}
