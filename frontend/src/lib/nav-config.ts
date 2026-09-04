/**
 * The nav, the route headers, the status page and the README status table all
 * read from here, so a doc page and its implementation status are described
 * exactly once.
 *
 * Route paths mirror the doc URLs under docs.copilotkit.ai/deepagents. Every
 * page here was read in its **TypeScript** tab; the Python variants are the
 * sibling repo's job.
 *
 * `agentId` is the graph id in `backend/langgraph.json` that the route drives;
 * routes without one are reference-only and have no agent.
 */

/**
 * There is exactly one doc-sync date in this repo, and it is not here: it is
 * `syncedAt` in `doc-snapshot/manifest.json`, written every time the sync
 * button runs. A hand-maintained date alongside it only ever drifted out of
 * agreement with the machine one, so it was removed — `/doc-sync` is the
 * single place that answers "how current are these docs".
 */
export const DOCS_ROOT = "https://docs.copilotkit.ai/deepagents";

export type RouteStatus = "working" | "partial" | "reference" | "broken" | "not-started";

export interface RouteMeta {
  path: string;
  title: string;
  /** Path under docs.copilotkit.ai, including any query the page needs. */
  docPath: string;
  summary: string;
  status: RouteStatus;
  statusNote?: string;
  /** Present but absent from the doc sidebar as of DOC_SYNC_DATE. */
  offNav?: boolean;
  /** Owns a live surface at `<path>/demo-chat`. */
  hasDemo?: boolean;
  /** Graph id in backend/langgraph.json, when the route drives one. */
  agentId?: string;
  /** Extra graph ids the route's demo can switch between. */
  extraAgentIds?: string[];
}

export function demoPath(route: RouteMeta): string | undefined {
  if (!route.hasDemo) return undefined;
  return route.path === "/" ? "/demo-chat" : `${route.path}/demo-chat`;
}

export interface NavGroup {
  title: string;
  routes: RouteMeta[];
}

export const NAV: NavGroup[] = [
  {
    title: "Getting Started",
    routes: [
      {
        path: "/",
        title: "Introduction",
        docPath: "/deepagents",
        summary: "What this harness covers and how the pieces fit together.",
        status: "reference",
        statusNote: "Landing page — orientation and the live graph roster.",
      },
      {
        path: "/quickstart",
        hasDemo: true,
        agentId: "sample_agent",
        title: "Quickstart",
        docPath: "/deepagents/quickstart",
        summary:
          "createDeepAgent with one TypeScript tool, served by the LangGraph dev server and reached through a CopilotRuntime route.",
        status: "working",
      },
    ],
  },
  {
    title: "Basics",
    routes: [
      {
        path: "/prebuilt-components/copilot-threads-drawer",
        hasDemo: true,
        agentId: "sample_agent",
        title: "Threads Drawer",
        docPath: "/deepagents/prebuilt-components/copilot-threads-drawer",
        summary:
          "The drop-in conversation sidebar, wired with no active-thread state of its own.",
        status: "working",
        statusNote:
          "Needs the runtime in Intelligence mode, and a license token for the unlocked view — see the Quickstart's connection panel.",
      },
    ],
  },
  {
    title: "Rich Threads",
    routes: [
      {
        path: "/headless-threads",
        hasDemo: true,
        agentId: "sample_agent",
        title: "Headless Threads",
        docPath: "/deepagents/headless-threads",
        summary:
          "The same thread data through useThreads, with a hand-built list — including rename, which the drawer omits.",
        status: "working",
        statusNote:
          "Needs Intelligence mode. In SSE mode /info reports mutations: false, so rename/archive/delete have no endpoint.",
      },
      {
        path: "/threads-lifecycle",
        hasDemo: true,
        agentId: "sample_agent",
        title: "Thread & History Lifecycle",
        docPath: "/deepagents/threads-lifecycle",
        summary:
          "Where a threadId comes from, how history replays, and how switching differs from starting fresh.",
        status: "working",
        statusNote:
          "Switch/start are live regardless; history replay needs a server-side store to replay from.",
      },
    ],
  },
  {
    title: "Generative UI",
    routes: [
      {
        path: "/generative-ui/tool-rendering",
        hasDemo: true,
        agentId: "tool_rendering_agent",
        title: "Tool Rendering",
        docPath: "/deepagents/generative-ui/tool-rendering",
        summary:
          "A backend tool call rendered as a custom component with useRenderTool, plus useDefaultRenderTool as the catch-all.",
        status: "working",
      },
      {
        path: "/generative-ui/state-rendering",
        hasDemo: true,
        agentId: "state_rendering_agent",
        title: "State Rendering",
        docPath: "/deepagents/generative-ui/state-rendering",
        summary:
          "A searches list pushed with copilotkitEmitState and read live in the app through useAgent.",
        status: "working",
        statusNote:
          "The page shows the emit loop but not what calls it; the tool wrapper here is written to the shape it describes.",
      },
      {
        path: "/generative-ui/your-components/interrupt-based",
        hasDemo: true,
        agentId: "interrupt_agent",
        extraAgentIds: ["interrupt_multi_agent"],
        title: "Interrupt-based HITL",
        docPath: "/deepagents/generative-ui/your-components/interrupt-based",
        summary:
          "LangGraph interrupt() inside a createMiddleware beforeModel hook, answered in the browser by useInterrupt.",
        status: "working",
        statusNote:
          "Both tabs are the page's code verbatim. The conditional tab was ⚠️ Partial until 04 Sep 2026 on an `enabled` callback destructuring an `eventValue` the event does not carry; that finding has been withdrawn.",
      },
    ],
  },
  {
    title: "App Control",
    routes: [
      {
        path: "/frontend-tools",
        hasDemo: true,
        agentId: "frontend_tools_agent",
        title: "Frontend Tools",
        docPath: "/deepagents/frontend-tools",
        summary:
          "A tool registered with useFrontendTool that executes in the browser when the agent calls it.",
        status: "working",
      },
      {
        path: "/webmcp",
        title: "WebMCP",
        docPath: "/deepagents/webmcp",
        summary:
          "Publishing an existing frontend tool to document.modelContext so WebMCP-aware browser agents can discover and call it.",
        status: "not-started",
        statusNote:
          "Tracked for drift only — no demo yet. The page’s own verification steps need Chrome 149+ with the WebMCP origin trial or chrome://flags/#enable-webmcp-testing, and CopilotKit no-ops wherever document.modelContext is absent, so there is nothing a headless Chromium run can show.",
      },
      {
        path: "/human-in-the-loop/governed-actions",
        title: "Governed Actions",
        docPath: "/deepagents/human-in-the-loop/governed-actions",
        summary:
          "Gating a side-effecting agent action behind an approval card, via useInterrupt or useHumanInTheLoop.",
        status: "not-started",
        statusNote:
          "Tracked for drift only — no demo in this repo yet. The identical page is implemented in Agno-react and Mastra-react; all five framework prefixes serve byte-identical content, so those findings apply here unchanged.",
      },
    ],
  },
  {
    title: "Shared State",
    routes: [
      {
        path: "/shared-state/in-app-agent-read",
        hasDemo: true,
        agentId: "shared_state_agent",
        title: "Reading agent state",
        docPath: "/deepagents/shared-state/in-app-agent-read",
        summary: "Reading the agent's language field in your own UI through useAgent.",
        status: "partial",
        statusNote:
          "The agent switches language and says so in Spanish, but the panel and the raw agent.state beside it stay on english — the delta never reaches the useAgent subscription.",
      },
      {
        path: "/shared-state/in-app-agent-write",
        hasDemo: true,
        agentId: "shared_state_agent",
        title: "Writing agent state",
        docPath: "/deepagents/shared-state/in-app-agent-write",
        summary:
          "Writing that same field back with agent.setState, then re-running with agent.runAgent.",
        status: "partial",
        statusNote:
          "State round-trips both ways, but the model never sees it: exposeState cannot read a field declared on another middleware.",
      },
      {
        path: "/shared-state/predictive-state-updates",
        hasDemo: true,
        agentId: "predictive_state_agent",
        extraAgentIds: ["predictive_manual_graph", "predictive_tool_graph"],
        title: "Predictive State Updates",
        docPath: "/deepagents/shared-state/predictive-state-updates?agent-type=prebuilt",
        summary:
          "All three of the page's variants running side by side: the prebuilt middleware, and both custom graphs.",
        status: "partial",
        statusNote:
          "Both custom graphs work — the TypeScript tabs print them in full, unlike the Python ones. The prebuilt tab does not: the chat answers with a full multi-step plan while Agent Progress stays empty for the whole run.",
      },
      {
        path: "/shared-state/state-inputs-outputs",
        title: "Input/Output Schemas",
        docPath: "/deepagents/shared-state/state-inputs-outputs",
        summary:
          "Splitting agent state into what the frontend may send, what it gets back, and what stays internal.",
        status: "reference",
        statusNote:
          "Reference only. The page is Python-only, and the JS dev server ignores the output schema, so there is nothing to demonstrate live.",
      },
      {
        path: "/shared-state/workflow-execution",
        title: "Workflow Execution",
        docPath: "/deepagents/shared-state/workflow-execution",
        summary:
          "Listed separately in the nav, but the page currently serves the Input/Output Schemas content verbatim.",
        status: "reference",
        statusNote:
          "Reference only — the page is an upstream duplicate of Input/Output Schemas, so there is nothing of its own to implement.",
      },
    ],
  },
  {
    title: "Intelligence",
    routes: [
      {
        path: "/intelligence/quickstart",
        title: "Intelligence · Quickstart",
        docPath: "/deepagents/intelligence/quickstart",
        summary:
          "Connecting an existing app to a hosted CopilotKit Intelligence project so threads persist.",
        status: "not-started",
        statusNote:
          "Tracked for drift only — no demo yet. Setup starts at `npx copilotkit login` and a `CPK_INTELLIGENCE_API_KEY` from a hosted Intelligence project, which is an account-scoped resource this harness does not have.",
      },
    ],
  },
  {
    title: "Doc Sync",
    routes: [
      {
        path: "/doc-sync",
        title: "Doc drift",
        docPath: "/deepagents",
        summary:
          "Re-fetches the markdown behind every tracked doc page and diffs it against the stored snapshot, flagging changes inside code blocks.",
        status: "reference",
      },
    ],
  },
];

export const ALL_ROUTES: RouteMeta[] = NAV.flatMap((g) => g.routes);

export function findRoute(path: string): RouteMeta | undefined {
  return ALL_ROUTES.find((r) => r.path === path);
}

export function docUrl(route: RouteMeta): string {
  return `https://docs.copilotkit.ai${route.docPath}`;
}

export const STATUS_LABEL: Record<RouteStatus, string> = {
  working: "Working",
  partial: "Partial",
  reference: "Reference",
  broken: "Broken",
  "not-started": "Not started",
};
