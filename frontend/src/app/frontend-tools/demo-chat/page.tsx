"use client";

import { CopilotChat, useFrontendTool } from "@copilotkit/react-core/v2";
import { useState } from "react";
import { z } from "zod";

import { DemoFrame } from "@/components/demo-frame";

const AGENT_ID = "frontend_tools_agent";

export default function Page() {
  // Not the page's — a visible log, so the effect of the call survives
  // dismissing the alert and can be checked afterwards.
  const [log, setLog] = useState<string[]>([]);

  //#region use-frontend-tool
  useFrontendTool({
    name: "sayHello",
    description: "Say hello to the user",
    parameters: z.object({
      name: z.string().describe("The name of the user to say hello to"),
    }),
    handler: async ({ name }) => {
      alert(`Hello, ${name}!`);
      setLog((prev) => [...prev, `alert("Hello, ${name}!")`]);
      return `Said hello to ${name}!`;
    },
  });
  //#endregion

  return (
    <DemoFrame parentPath="/frontend-tools" subtitle={`graph: ${AGENT_ID}`}>
      <div className="grid h-full grid-cols-1 md:grid-cols-2">
        <div className="flex h-full flex-col p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Browser-side effects
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            The agent has no <code>sayHello</code>. It is registered in this
            component and forwarded to the agent for the duration of the run;
            the handler runs here, in the tab.
          </p>

          {log.length === 0 ? (
            <p className="mt-4 text-sm text-slate-400">
              Nothing yet. Ask the agent to say hello to someone.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {log.map((entry, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 font-mono text-xs text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                >
                  {entry}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-h-0 border-t border-slate-200 md:border-l md:border-t-0 dark:border-slate-800">
          <CopilotChat agentId={AGENT_ID} className="h-full" />
        </div>
      </div>
    </DemoFrame>
  );
}
