"use client";

import { CopilotSidebar, useDefaultRenderTool } from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

const AGENT_ID = "sample_agent";

/**
 * The Quickstart's `app/page.tsx`.
 *
 * Two departures, both because this is a harness rather than a one-agent app:
 * the `<details>` renderer is styled, and `agentId` is passed explicitly. The
 * page sets the agent once on the provider (`<CopilotKit agent="sample_agent">`)
 * because it has exactly one; here ten graphs share a provider, so each route
 * names the one it wants.
 *
 * `useDefaultRenderTool` is the page's — a catch-all that draws every tool call
 * the agent makes, which is how you see `get_weather` fire at all.
 */
export default function Page() {
  useDefaultRenderTool({
    render: ({ name, status, parameters, result }) => (
      <details className="my-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800/60">
        <summary className="cursor-pointer font-medium text-slate-800 dark:text-slate-200">
          {status === "complete" ? `Called ${name}` : `Calling ${name}`}
        </summary>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          Status: {status}
        </p>
        <p className="mt-1 break-all font-mono text-xs text-slate-600 dark:text-slate-400">
          Args: {JSON.stringify(parameters)}
        </p>
        <p className="mt-1 break-all font-mono text-xs text-slate-600 dark:text-slate-400">
          Result: {JSON.stringify(result)}
        </p>
      </details>
    ),
  });

  return (
    <DemoFrame parentPath="/quickstart" subtitle={`graph: ${AGENT_ID}`}>
      <main className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
          Your App
        </h1>
        <p className="max-w-md text-sm text-slate-500">
          The sidebar is docked at the right edge. Ask it for the weather
          somewhere to confirm the whole stack — browser, runtime route,
          LangGraph server, model — is connected.
        </p>
      </main>

      <CopilotSidebar agentId={AGENT_ID} />
    </DemoFrame>
  );
}
