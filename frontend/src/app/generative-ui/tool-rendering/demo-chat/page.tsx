"use client";

import {
  CopilotChat,
  useDefaultRenderTool,
  useRenderTool,
} from "@copilotkit/react-core/v2";
import { z } from "zod";

import { DemoFrame } from "@/components/demo-frame";

const AGENT_ID = "tool_rendering_agent";

//#region weather-params
const weatherParams = z.object({
  location: z.string().describe("The location to get weather for"),
});
//#endregion

/**
 * Both halves of the Tool Rendering page in one surface.
 *
 * `useRenderTool` claims `get_weather` by name — the name has to match the
 * backend `tool()` exactly or nothing is intercepted. `useDefaultRenderTool` then
 * catches everything else, which for a Deep Agent means the file-system and
 * planning tools `createDeepAgent` installs on its own. Having both here
 * makes the difference between them visible in a single conversation.
 */
export default function Page() {
  //#region use-render-tool
  useRenderTool({
    name: "get_weather",
    parameters: weatherParams,
    render: ({ status, parameters }) => {
      return (
        <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
          {status !== "complete" && "Calling weather API..."}
          {status === "complete" &&
            `Called the weather API for ${parameters.location}.`}
        </p>
      );
    },
  });
  //#endregion

  //#region use-default-render-tool
  useDefaultRenderTool({
    render: ({ name, status, result }) => {
      return (
        <div className="my-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {status === "complete" ? "✓ " : "⏳ "}
            {name}
          </span>
          {status === "complete" && result && (
            <pre className="mt-1 overflow-x-auto text-xs text-slate-600 dark:text-slate-400">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      );
    },
  });
  //#endregion

  return (
    <DemoFrame
      parentPath="/generative-ui/tool-rendering"
      subtitle={`graph: ${AGENT_ID}`}
    >
      <CopilotChat agentId={AGENT_ID} className="h-full" />
    </DemoFrame>
  );
}
