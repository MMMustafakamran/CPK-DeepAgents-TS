"use client";

import { CopilotChat, useAgent } from "@copilotkit/react-core/v2";
import { useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

const VARIANTS = [
  {
    id: "prebuilt",
    agentId: "predictive_state_agent",
    label: "Prebuilt agent",
    blurb: "stateStreamingMiddleware + stateItem on createDeepAgent.",
  },
  {
    id: "manual",
    agentId: "predictive_manual_graph",
    label: "Custom graph · manual",
    blurb: "A StateGraph node calling copilotkitEmitState in a loop.",
  },
  {
    id: "tool",
    agentId: "predictive_tool_graph",
    label: "Custom graph · tool",
    blurb: "copilotkitCustomizeConfig({ emitIntermediateState }) on the config.",
  },
] as const;

type VariantId = (typeof VARIANTS)[number]["id"];

//#region observe-predictions
/**
 * The page's `YourMainContent`, unchanged apart from styling. The same
 * component reads all three variants — the whole point of the page is that
 * they are three routes to the same `observed_steps` key.
 */
function YourMainContent({ agentId }: { agentId: string }) {
  const { agent } = useAgent({ agentId });

  const observedSteps = (agent.state.observed_steps as string[]) ?? [];

  return (
    <div className="flex h-full flex-col p-6">
      <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
        Agent Progress
      </h1>

      {observedSteps.length > 0 ? (
        <div className="mt-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Steps
          </h3>
          <ul className="mt-2 space-y-2">
            {observedSteps.map((step, i) => (
              <li
                key={i}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
              >
                {step}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          Empty. Give the agent a multi-step task.
        </p>
      )}

      <pre className="mt-auto overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        {JSON.stringify(observedSteps, null, 2)}
      </pre>
    </div>
  );
}
//#endregion

export default function Page() {
  const [variantId, setVariantId] = useState<VariantId>("prebuilt");
  const variant = VARIANTS.find((v) => v.id === variantId)!;

  return (
    <DemoFrame
      parentPath="/shared-state/predictive-state-updates"
      subtitle={`graph: ${variant.agentId}`}
    >
      <div className="flex h-full flex-col">
        <div className="shrink-0 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantId(v.id)}
                className={`rounded-md px-3 py-1 text-xs font-medium ${
                  variantId === v.id
                    ? "bg-[var(--accent)] text-white"
                    : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">{variant.blurb}</p>
        </div>

        {/* Keyed on the variant so switching drops the previous agent's
            subscription rather than leaving two live at once. */}
        <div key={variant.id} className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2">
          <YourMainContent agentId={variant.agentId} />
          <div className="min-h-0 border-t border-slate-200 md:border-l md:border-t-0 dark:border-slate-800">
            <CopilotChat agentId={variant.agentId} className="h-full" />
          </div>
        </div>
      </div>
    </DemoFrame>
  );
}
