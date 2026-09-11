import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

const CRASH = `Runtime Error
useAgent: Agent 'default' not found after runtime sync (runtimeUrl=/api/copilotkit).
Known agents: [sample_agent, tool_rendering_agent, state_rendering_agent, interrupt_agent,
interrupt_multi_agent, frontend_tools_agent, shared_state_agent, predictive_state_agent,
predictive_manual_graph, predictive_tool_graph, state_io_graph]
Verify your runtime /info and/or agents__unsafe_dev_only.

  at DeploymentWatcher (src/app/generative-ui/frontend-cards/deployment-watcher.tsx:17:29)
     const { agent } = useAgent();

→ the whole route: "This page couldn't load"`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/generative-ui/frontend-cards" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          A card your app puts in the chat on its own — a job finished, a
          socket pushed something — with no agent turn behind it. It is a
          message with <code>role: &quot;activity&quot;</code>: the transcript
          renders it through a registered renderer, and it is stripped from
          every run request, so the model never sees it.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The demo has two panes. The top one is steps 2 and 3 exactly as
          published; on this runtime it throws. The bottom one is the same
          provider with <code>agentId=&quot;sample_agent&quot;</code> added to{" "}
          <code>useAgent</code> and <code>&lt;CopilotChat&gt;</code> — the only
          change — and is where the page&apos;s two claims are checked.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "In the bottom pane, click “Simulate: deployment finished”, then ask: Have you been shown any deployment card?",
            ]}
            expect="The top pane prints “Agent 'default' not found after runtime sync” (this repo's finding). In the bottom pane the card appears in the transcript; after the turn the probe row reads agent.messages = activity, user(, assistant) and run payload = user — and, with a model key, the agent says it saw no card."
            fail="The bottom pane's card never renders, or the payload row lists activity (the agent received it)."
          />
        </div>
      </Panel>

      <Callout tone="warn" title="As published, the page's code crashes this route">
        Neither step 2&apos;s <code>&lt;CopilotChat /&gt;</code> nor step 3&apos;s{" "}
        <code>useAgent()</code> passes an <code>agentId</code>, so both ask for{" "}
        <code>&quot;default&quot;</code>. This runtime registers one agent per
        graph in <code>backend/langgraph.json</code> and none is called{" "}
        <code>default</code> — the Deep Agents Quickstart itself names its agent{" "}
        <code>sample_agent</code>. Until <code>/info</code> answers,{" "}
        <code>useAgent()</code> hands back a provisional agent; the moment it
        answers, it throws during render, and Next replaces the route with
        &quot;This page couldn&apos;t load&quot;. The page is byte-identical under
        every framework prefix and says nothing about which agent a bare{" "}
        <code>useAgent()</code> resolves to, so a reader who followed this
        integration&apos;s Quickstart gets a crash on the first render.
        Runtime and react-core 1.71.0.
        <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {CRASH}
        </pre>
      </Callout>

      <Callout tone="success" title="With the agent named, the central claim holds">
        Checked against the request that actually left the browser, not the
        library&apos;s own bookkeeping: with a card in the transcript,{" "}
        <code>agent.messages</code> read <code>activity, user</code> and the run
        payload to <code>/api/copilotkit/agent/sample_agent/run</code> carried
        only <code>user</code>. This works without a model key — the payload is
        read as it leaves. (Locally there is no <code>OPENAI_API_KEY</code>, so
        the run then ends in <code>RUN_ERROR: Missing credentials</code> and the
        agent never answers; CI has the key.)
      </Callout>

      <Callout tone="warn" title="A card added before the runtime connects is silently lost">
        Until <code>/info</code> answers, <code>useAgent()</code> returns a
        provisional agent (<code>isReady: false</code>). <code>addMessage</code>{" "}
        on it succeeds and even updates <code>agent.messages</code> — and when
        the real agent replaces it a moment later, the card is gone, with no
        error anywhere. Reproduced 3 of 3 in the bottom pane by clicking with{" "}
        <code>/info</code> held back 4 s: <code>agent.messages</code> read{" "}
        <code>activity</code> straight after the click and <code>—</code> once
        connected, with no card in the chat. The page&apos;s warning is about
        agents you construct yourself; it never mentions <code>isReady</code>,
        which is the only thing that tells you a socket event arriving at
        startup will be dropped.
      </Callout>

      <Callout tone="warn" title="Step 3 is never wired to step 2">
        Step 2&apos;s <code>Page</code> renders <code>&lt;CopilotChat /&gt;</code>{" "}
        and nothing else; step 3 builds <code>&lt;DeploymentWatcher /&gt;</code>{" "}
        and never says where it goes. It has to be under the provider for{" "}
        <code>useAgent()</code> to work — the top pane mounts it there, and it
        is the first component to throw. Its socket is{" "}
        <code>wss://example.com/deployments</code>, a placeholder whose
        handshake fails, so even on a runtime with a <code>default</code> agent
        it would never add a card. The demo&apos;s button calls the same{" "}
        <code>addMessage</code>, which the page names as an equivalent trigger.
      </Callout>

      <Panel title="Source">
        <SourceCodeGroup
          files={[
            { file: "frontend/src/app/generative-ui/frontend-cards/event-card.tsx" },
            { file: "frontend/src/app/generative-ui/frontend-cards/deployment-watcher.tsx" },
          ]}
        />
        <div className="mt-4">
          <SourceCode file="frontend/src/app/generative-ui/frontend-cards/demo-chat/page.tsx" />
        </div>
      </Panel>
    </>
  );
}
