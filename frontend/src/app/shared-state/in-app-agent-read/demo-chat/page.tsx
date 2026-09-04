"use client";

import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";
import { QaNote } from "@/components/qa-note";

const AGENT_ID = "shared_state_agent";

//#region read-state
/**
 * The page's `YourMainContent`, read-only.
 *
 * No subscription, no effect — `agent.state` is reactive, so this re-renders
 * whenever a state delta arrives over AG-UI.
 */
function YourMainContent() {
  const { agent } = useAgent({
    agentId: AGENT_ID,
  });

  const language = (agent.state.language as string) ?? "Not Set";

  return (
    <div className="p-6">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        Your main content
      </h1>
      <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
        Language: <strong>{language}</strong>
      </p>

      <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        {JSON.stringify(agent.state, null, 2)}
      </pre>
    </div>
  );
}
//#endregion

export default function Page() {
  return (
    <DemoFrame
      parentPath="/shared-state/in-app-agent-read"
      subtitle={`graph: ${AGENT_ID}`}
    >
      <div className="flex h-full flex-col">
        <QaNote
          try="Ask the agent to switch language, e.g. &ldquo;Set the language to Spanish.&rdquo;"
          expected="Language on the left updates to spanish as the agent writes it."
          actual="The agent answers in Spanish but the panel never updates."
        />
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
          <YourMainContent />
          <div className="min-h-0 border-t border-slate-200 md:border-l md:border-t-0 dark:border-slate-800">
            <CopilotChat agentId={AGENT_ID} className="h-full" />
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
