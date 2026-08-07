import Link from "next/link";

import { RouteHeader } from "@/components/route-header";
import { SourceCodeGroup } from "@/components/source-code";
import { Callout, CodeBlock, Panel } from "@/components/ui";

const DOC_PYTHON = `# the page — Python only, no TypeScript tab
class InputState(CopilotKitState):
  question: str

class OutputState(CopilotKitState):
  answer: str

class OverallState(InputState, OutputState):
  resources: List[str]

builder = StateGraph(OverallState, input=InputState, output=OutputState)`;

const HERE_TS = `// here
const InputState  = Annotation.Root({ ...CopilotKitStateAnnotation.spec, question: Annotation<string> });
const OutputState = Annotation.Root({ ...CopilotKitStateAnnotation.spec, answer:   Annotation<string> });
const OverallState = Annotation.Root({
  ...InputState.spec,
  ...OutputState.spec,
  resources: Annotation<string[]>({ reducer: (_p, n) => n, default: () => [] }),
});

const workflow = new StateGraph({ state: OverallState, input: InputState, output: OutputState });`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/shared-state/state-inputs-outputs" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Not every state field should cross the wire. Some are the UI&apos;s to
          send, some are the agent&apos;s to return, and some — a retrieved
          document, a scratchpad — are internal, and syncing them would be
          expensive and pointless. LangGraph lets you declare those three sets
          separately.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Three fields, three intended fates. The browser writes{" "}
          <code>question</code> and never gets it back, so the app stays the
          source of truth for it. <code>answer</code> comes back.{" "}
          <code>resources</code> is written by the node on every run and never
          reaches the browser at all.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <strong>Reference only — there is no demo on this route.</strong> Two
          reasons, both below: the doc page has no TypeScript at all, and the
          JS dev server does not honour the <code>output</code> schema, so a
          live surface would only ever show the split failing. The graph is
          written and it compiles; what it cannot do is demonstrate the feature
          end to end.
        </p>
      </Panel>

      <Callout tone="warn" title="The page sends TypeScript readers away — and it is half right">
        <p>
          Its callout says the split &ldquo;applies when you&apos;re building a
          custom LangGraph graph&rdquo;, that <code>createDeepAgent</code>{" "}
          &ldquo;uses middleware with a single state schema and doesn&apos;t
          expose separate input/output schemas&rdquo;, and that for &ldquo;the
          Deep Agents TypeScript equivalent&rdquo; you should read the{" "}
          <Link
            href="/shared-state/in-app-agent-read"
            className="underline underline-offset-4"
          >
            shared state guides
          </Link>{" "}
          instead.
        </p>
        <p className="mt-2">
          The first two claims are true. The third reads as &ldquo;this feature
          is not available in TypeScript&rdquo;, and that is not true —{" "}
          <code>StateGraph</code> in <code>@langchain/langgraph</code> 1.4.9
          takes <code>input</code> and <code>output</code> schemas exactly as the
          Python one does. What is unavailable is doing it with a{" "}
          <em>Deep Agent</em>, which is equally unavailable in Python. So this
          route is the page&apos;s Python ported, not a workaround.
        </p>
        <div className="mt-3 space-y-3">
          <CodeBlock code={DOC_PYTHON} language="python" filename="the doc page" />
          <CodeBlock code={HERE_TS} language="ts" filename="the port" />
        </div>
        <p className="mt-3">
          <code>Annotation.Root</code> rather than classes, and the object form
          of the <code>StateGraph</code> constructor rather than positional
          arguments — both are the JS idiom the other two custom-graph routes in
          this repo already use.
        </p>
      </Callout>

      <Panel
        title="The graph"
        description="The three schemas, the node, and the builder — in that order."
      >
        <SourceCodeGroup
          files={[
            { file: "backend/src/stateInputsOutputs.ts", region: "state-schemas" },
            { file: "backend/src/stateInputsOutputs.ts", region: "answer-node" },
            { file: "backend/src/stateInputsOutputs.ts", region: "graph" },
          ]}
        />
      </Panel>

      <Callout tone="warn" title="The JS dev server ignores the output schema">
        <p>
          <strong>
            This is why the route is reference-only, and it is not a mistake in
            the graph.
          </strong>{" "}
          Call it directly and the split works exactly as documented:
        </p>
        <div className="mt-3">
          <CodeBlock
            code={`await graph.invoke({ question: "Why is the sky blue?", messages: [...] })
// -> keys: [ 'answer', 'messages' ]        ✅ filtered`}
            language="ts"
          />
        </div>
        <p className="mt-3">
          Go through the dev server — with or without CopilotKit in the path —
          and the filter is gone:
        </p>
        <div className="mt-3">
          <CodeBlock
            code={`POST /threads/{id}/runs/wait   -> [ 'answer', 'messages', 'question', 'resources' ]   ❌
GET  /threads/{id}/state       -> [ 'answer', 'messages', 'question', 'resources' ]   ❌`}
            language="text"
            filename="@langchain/langgraph-cli dev, queried directly"
          />
        </div>
        <p className="mt-3">
          So the server serialises the raw checkpoint and drops{" "}
          <code>output</code> on the floor. Everything downstream — AG-UI&apos;s{" "}
          <code>STATE_SNAPSHOT</code>, then <code>agent.state</code> — inherits
          that, and the browser sees all four fields.
        </p>
        <p className="mt-2">
          The Python sibling repo does not have this problem. Through the same
          CopilotKit runtime path, its final <code>STATE_SNAPSHOT</code> carries
          exactly <code>[&quot;messages&quot;, &quot;copilotkit&quot;,
          &quot;answer&quot;]</code>. Same feature, same page, different server.
        </p>
      </Callout>

      <Callout tone="warn" title="resources is never filled in">
        <p>
          The page declares it as the field the UI must not see, then leaves{" "}
          <code># ...add the rest of the agent implementation</code> exactly
          where it would be written. Left empty there is nothing to demonstrate —
          an absent key proves nothing if the node never sets it. So{" "}
          <code>answerNode</code> records what it actually sent to the model.
          That stands in for the retrieval step the page describes; it is not a
          guess at one.
        </p>
      </Callout>

      <Callout tone="info" title="The page's frontend snippet is untestable on its own">
        <p>
          It only reads —{" "}
          <code>const answer = agent.state.answer as string</code> — and says you
          should &ldquo;expect seeing answer change, while the others are not
          returned&rdquo;. But with nothing writing <code>question</code>, all
          three fields are absent, and &ldquo;sent but not returned&rdquo; is
          indistinguishable from &ldquo;never sent&rdquo;. Proving the split
          needs a write as well as a read — which, given the server behaviour
          above, would fail here anyway.
        </p>
      </Callout>

      <Callout tone="warn" title="This page has a duplicate">
        <p>
          <Link
            href="/shared-state/workflow-execution"
            className="underline underline-offset-4"
          >
            Workflow Execution
          </Link>{" "}
          currently serves this page&apos;s content byte for byte — same title
          text, same prose, same code. See that route.
        </p>
      </Callout>
    </>
  );
}
