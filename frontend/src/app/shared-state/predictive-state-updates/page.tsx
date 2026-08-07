import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/shared-state/predictive-state-updates" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Showing the user what the agent is doing before it has finished doing
          it. Graph state only reaches the frontend at node boundaries, and a
          single node can run for many seconds — predictive state updates push a
          running approximation out in the meantime.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The page splits three ways and <strong>all three are live here</strong>
          , behind the toggle at the top of the demo. That is the sharpest
          difference between this repo and its Python sibling: the TypeScript
          tabs print both custom graphs in full — annotation, node, wiring,{" "}
          <code>compile</code> — while the Python tabs show a bare node with no
          graph around it, so the Python repo can only quote them.
        </p>
      </Panel>

      <Panel
        title="Variant 1 — Prebuilt agent"
        description="?agent-type=prebuilt · createDeepAgent + stateStreamingMiddleware"
      >
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <code>stateStreamingMiddleware</code> takes <code>stateItem</code>{" "}
          mappings from a tool argument to a state key. Nothing calls an emit
          function: the middleware parses the model&apos;s partial tool-call
          arguments as they stream and writes each completed element into state.
          The tool body is <code>async (args) =&gt; args</code> on purpose — it
          exists to give the model an argument shape to fill in.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Plan and execute a website redesign",
              "Do a competitive analysis of three note-taking apps",
            ]}
            expect={
              <>
                Step rows appear on the left one at a time, while the model is
                still writing them — noticeably before the chat message
                completes.
              </>
            }
            fail="All rows appearing at once, after the reply, means the streaming middleware did not intercept and you are seeing the ordinary end-of-node state sync."
          />
        </div>
        <div className="mt-4">
          <SourceCodeGroup
            files={[
              { file: "backend/src/predictiveState.ts", region: "agent-state" },
              { file: "backend/src/predictiveState.ts", region: "prebuilt-agent" },
            ]}
          />
        </div>
      </Panel>

      <Panel
        title="Variant 2 — Custom graph, manual emission"
        description="?agent-type=custom-graph&state-emission=manual-emission · a StateGraph you write"
      >
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Full control: you call <code>copilotkitEmitState</code> yourself
          wherever you want a checkpoint. Four fixed steps, one second apart, so
          the pacing is visible. No Deep Agent involved —{" "}
          <code>Annotation.Root</code> spread over{" "}
          <code>CopilotKitStateAnnotation.spec</code>, one node, two edges.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Summarise the last quarter"]}
            expect={
              <>
                Exactly four rows — &ldquo;Analyzing input data...&rdquo; through
                &ldquo;Formatting final output...&rdquo; — appearing one per
                second before any reply text, then an ordinary answer. The rows
                persist, because the node returns{" "}
                <code>observed_steps</code> as well as emitting it.
              </>
            }
            fail="Rows that appear and then vanish mean the node emitted without returning — the page is careful to do both, with the comment `// Persist the final state`."
          />
        </div>
        <div className="mt-4">
          <SourceCodeGroup
            files={[
              { file: "backend/src/predictiveStateManual.ts", region: "agent-state" },
              { file: "backend/src/predictiveStateManual.ts", region: "chat-node" },
              { file: "backend/src/predictiveStateManual.ts", region: "graph" },
            ]}
          />
        </div>
      </Panel>

      <Panel
        title="Variant 3 — Custom graph, tool emission"
        description="?agent-type=custom-graph&state-emission=tool-emission · the same mapping, on the config"
      >
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The same tool-argument-to-state-key mapping as Variant 1, but declared
          on the <code>RunnableConfig</code> with{" "}
          <code>copilotkitCustomizeConfig</code> instead of as middleware.{" "}
          <code>stateStreamingMiddleware</code> is the packaged version of
          exactly this.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Migrate a database to a new schema"]}
            expect={
              <>
                Steps stream into the panel as the model writes the{" "}
                <code>step_progress_tool</code> call, then a{" "}
                <code>ToolNode</code> runs it and the graph loops back for the
                final answer.
              </>
            }
            fail="An OpenAI error about an unanswered tool call means the ToolMessage guard fired — see the callout below."
          />
        </div>
        <div className="mt-4">
          <SourceCodeGroup
            files={[
              { file: "backend/src/predictiveStateTool.ts", region: "imports-and-state" },
              { file: "backend/src/predictiveStateTool.ts", region: "step-progress-tool" },
              { file: "backend/src/predictiveStateTool.ts", region: "chat-node" },
              { file: "backend/src/predictiveStateTool.ts", region: "routing-and-graph" },
            ]}
          />
        </div>
      </Panel>

      <Panel title="The demo's page">
        <SourceCode file="frontend/src/app/shared-state/predictive-state-updates/demo-chat/page.tsx" />
      </Panel>

    
    </>
  );
}
