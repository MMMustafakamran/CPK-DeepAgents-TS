/**
 * The graph ids this app can address.
 *
 * Mirrors the `graphs` object in `backend/langgraph.json` — id `sample_agent`
 * is the key the LangGraph dev server publishes it under, and the same string
 * a route passes as `agentId`. Keeping the list here rather than fetching it
 * lets the runtime route build its agent map synchronously at module load.
 *
 * If you add a graph to `langgraph.json`, add its id here too.
 */

export const GRAPH_IDS = [
  "sample_agent",
  "tool_rendering_agent",
  "state_rendering_agent",
  "interrupt_agent",
  "interrupt_multi_agent",
  "frontend_tools_agent",
  "shared_state_agent",
  "predictive_state_agent",
  // The two custom-graph variants of Predictive State Updates. They exist here
  // because the page's TypeScript tab prints them in full, graph wiring
  // included — its Python tab shows only a bare node.
  "predictive_manual_graph",
  "predictive_tool_graph",
  "state_io_graph",
] as const;

export type GraphId = (typeof GRAPH_IDS)[number];

/**
 * Where the LangGraph dev server is listening.
 *
 * The Quickstart says 8123. This repo defaults to **8124** so it can run beside
 * the Python sibling without a port fight — both publish the same graph ids, so
 * whichever server bound first would silently answer for the other language.
 * Override with `LANGGRAPH_DEPLOYMENT_URL`.
 */
export const LANGGRAPH_DEPLOYMENT_URL =
  process.env.LANGGRAPH_DEPLOYMENT_URL ?? "http://localhost:8124";

/**
 * Sent as `langsmithApiKey`. A locally running dev server does not check it, so
 * it is empty in local development — the Quickstart's snippet defaults it to
 * `""` for the same reason. A LangGraph Platform deployment does need one.
 */
export const LANGSMITH_API_KEY = process.env.LANGSMITH_API_KEY ?? "";
