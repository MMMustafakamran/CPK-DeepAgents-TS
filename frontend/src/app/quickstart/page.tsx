import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/quickstart" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The whole stack in one message. A Deep Agent with a single{" "}
          <code>tool()</code> call, published as the graph{" "}
          <code>sample_agent</code> by the LangGraph dev server, addressed by a{" "}
          <code>CopilotRuntime</code> route holding a <code>LangGraphAgent</code>
          , and driven by a <code>CopilotSidebar</code> in the browser.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The page offers three backend tabs — Python, TypeScript and FastAPI.
          This repo takes the <strong>TypeScript</strong> tab, and therefore the{" "}
          <strong>Deep Agent</strong> tab of the runtime step, which the page
          tells you to pick in a callout on the TypeScript tab itself.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "What's the weather in Lisbon?",
              "What tools do you have access to?",
            ]}
            expect={
              <>
                Tokens stream a word at a time. The first prompt opens a
                collapsed <code>Called get_weather</code> row — that is{" "}
                <code>useDefaultRenderTool</code> drawing the call — and the
                reply says Lisbon is sunny.
              </>
            }
            fail="An error banner in the chat, or no reply at all. Check that the agent server is up on :8124 and that backend/.env has OPENAI_API_KEY."
          />
        </div>
      </Panel>

      <Panel title="The demo's page">
        <SourceCode file="frontend/src/app/quickstart/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The agent"
        description="The page's agent.ts, and the manifest that publishes it."
      >
        <SourceCodeGroup
          files={[
            { file: "backend/agent.ts", region: "quickstart-agent" },
            { file: "backend/langgraph.json" },
          ]}
        />
      </Panel>

      <Panel
        title="The runtime route"
        description="Read from this repo, so it can be diffed against the page's snippet directly."
      >
        <SourceCode file="frontend/src/app/api/copilotkit/route.ts" />
      </Panel>

    </>
  );
}
