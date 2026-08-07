"use client";

import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

const AGENT_ID = "state_rendering_agent";

//#region searches-panel
/**
 * The page's `YourMainContent`, styled.
 *
 * `agent.state` is reactive: the agent pushes each `copilotkitEmitState` call
 * over AG-UI as a state delta, this re-renders, and the ⏳ flips to ✅ a second
 * at a time. Nothing here polls or subscribes explicitly.
 */
function SearchesPanel() {
  const { agent } = useAgent({
    agentId: AGENT_ID,
  });

  const searches =
    (agent.state.searches as { query: string; done: boolean }[]) ?? [];

  return (
     <div>
      {searches.map((search, index) => (
        <div key={index}>
          {search.done ? "✅" : "⏳"} {search.query}
        </div>
      ))}
    </div>
  );
}
//#endregion

export default function Page() {
  return (
    <DemoFrame
      parentPath="/generative-ui/state-rendering"
      subtitle={`graph: ${AGENT_ID}`}
    >
      <div className="grid h-full grid-cols-1 md:grid-cols-2">
        <SearchesPanel />
        <div className="min-h-0 border-t border-slate-200 md:border-l md:border-t-0 dark:border-slate-800">
          <CopilotChat agentId={AGENT_ID} className="h-full" />
        </div>
      </div>
    </DemoFrame>
  );
}
