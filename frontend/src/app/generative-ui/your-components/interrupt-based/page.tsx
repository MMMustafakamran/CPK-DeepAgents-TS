import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, CodeBlock, Panel, TryIt } from "@/components/ui";

const DOC_ENABLED = `$ npx tsc --noEmit        # with the @ts-expect-error lines removed

page.tsx(138,21): error TS2339: Property 'eventValue' does not exist
                  on type 'InterruptEvent<any>'.
page.tsx(147,21): error TS2339: Property 'eventValue' does not exist
                  on type 'InterruptEvent<any>'.`;

const WOULD_WORK = `// what the page would need to say
useInterrupt({
  enabled: (event) => payloadOf(event.value).type === "ask",
  render: ({ event, resolve }) => (
    <AskComponent question={payloadOf(event.value).content ?? ""} onAnswer={(a) => resolve(a)} />
  ),
});

// ...where payloadOf JSON.parses the string the runtime actually sends:
function payloadOf(value: unknown) {
  if (typeof value === "string") { try { return JSON.parse(value) } catch { return { content: value } } }
  return (typeof value === "object" && value !== null) ? value : {};
}`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/generative-ui/your-components/interrupt-based" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Human-in-the-loop by suspending the graph rather than by asking the
          model to wait. LangGraph&apos;s <code>interrupt()</code> stops
          execution mid-hook; the value it was given is streamed to the browser,{" "}
          <code>useInterrupt</code> renders it, and <code>resolve</code> sends an
          answer back as that call&apos;s return value.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The demo has both of the page&apos;s sections behind a toggle: one
          interrupt with a plain string, and two interrupts from a single hook
          dispatched to different components by their <code>type</code> field
          using <code>enabled</code>. Both are the page&apos;s code as printed —
          the second one does not work, and that is the point of the route.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Hello", "What is your name?"]}
            expect={
              <>
                On <strong>One interrupt</strong>: the first message you send is
                answered with a name prompt instead of a reply. Type a name,
                submit, and the run resumes — ask it its name afterwards and it
                uses the one you gave. This half of the page is correct.
                <br />
                <br />
                On <strong>Two, dispatched by type</strong>: <em>nothing</em>{" "}
                usable. The <code>enabled</code> predicates throw, no handler
                claims the event, and no card appears. Expected — see the
                callout below.
              </>
            }
            fail="The first tab failing is a real problem: check the agent server is up. The second tab failing is the documented result, not a setup issue."
          />
        </div>
      </Panel>

      <Panel title="The demo's page">
        <SourceCode file="frontend/src/app/generative-ui/your-components/interrupt-based/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The agent"
        description="The single-interrupt middleware, the two-interrupt one, and the two createDeepAgent calls."
      >
        <SourceCodeGroup
          files={[
            { file: "backend/src/interruptBased.ts", region: "single-interrupt" },
            { file: "backend/src/interruptBased.ts", region: "multi-interrupt" },
            { file: "backend/src/interruptBased.ts", region: "agents" },
          ]}
        />
      </Panel>

      <Callout tone="success" title="This is the tab TypeScript wins on">
        <p>
          The Python tab needs an <code>AgentMiddleware</code> subclass, a
          separate <code>AgentState</code> class, and an explicit{" "}
          <code>state_schema = AgentState</code> to tie them together — three
          pieces, only two of which the page prints.{" "}
          <code>createMiddleware</code> carries the state schema and the{" "}
          <code>beforeModel</code> hook in one object, so the TypeScript snippet
          is complete as written. The only thing still missing is the{" "}
          <code>createDeepAgent</code> call that consumes it.
        </p>
      </Callout>

      <Callout tone="warn" title="The conditional snippet does not compile">
        <p>
          Both problems are in the &ldquo;Condition UI executions&rdquo; section.
          The first is caught by the compiler; the second is not, and was
          confirmed against a live run.
        </p>
        <p className="mt-2">
          <strong>
            <code>enabled</code> has no <code>eventValue</code>.
          </strong>{" "}
          Its parameter is typed <code>InterruptEvent&lt;TValue&gt;</code> —{" "}
          <code>{"{ name, value }"}</code> — so{" "}
          <code>enabled: ({"{ eventValue }"}) =&gt; …</code> is{" "}
          <code>TS2339: Property &apos;eventValue&apos; does not exist</code>.
        </p>
        <p className="mt-2">
          <strong>
            <code>event.value</code> is a string, not an object.
          </strong>{" "}
          A LangGraph <code>interrupt()</code> reaches the browser as the legacy{" "}
          <code>on_interrupt</code> custom event, and the runtime serialises its
          value on the way out. The wire carries{" "}
          <code>&quot;value&quot;: &quot;{'{\\"type\\":\\"approval\\",…}'}&quot;</code>
          , so <code>event.value.content</code> is <code>undefined</code>. Since{" "}
          <code>TValue</code> defaults to <code>any</code> here, the compiler
          does not catch this one.
        </p>
        <p className="mt-3">
          <strong>The snippet is left in place, unedited.</strong> Each{" "}
          <code>enabled</code> line carries a <code>@ts-expect-error</code> so
          the repo still builds — and those annotations are the evidence, not a
          workaround: an unused one is itself an error (<code>TS2578</code>), so
          the fact that <code>tsc</code> passes proves the compiler is rejecting
          both lines. Delete them and you get:
        </p>
        <div className="mt-3">
          <CodeBlock code={DOC_ENABLED} language="text" />
        </div>
        <p className="mt-3">
          What the page would have to say instead — the predicate taking the
          whole event, and something that parses the string the runtime actually
          sends:
        </p>
        <div className="mt-3">
          <CodeBlock code={WOULD_WORK} language="tsx" />
        </div>
        <p className="mt-3">
          The page&apos;s <em>first</em> section is unaffected: it passes{" "}
          <code>interrupt()</code> a plain string, so <code>event.value</code> is
          that string and the snippet is right.
        </p>
      </Callout>

      <Callout tone="warn" title="The second state schema is elided">
        <p>
          <code>approvalAndNameMiddleware</code> is printed with both{" "}
          <code>agentName</code> and <code>approval</code> on its{" "}
          <code>stateSchema</code>, which is more than the Python tab manages —
          there the equivalent class is replaced by the comment{" "}
          <code>&quot;... your full state definition&quot;</code>. Nothing to fix
          on this side.
        </p>
      </Callout>

      <Callout tone="info" title="Not implemented from this page">
        <p>
          The final section, &ldquo;Preprocessing of an interrupt and
          programmatically handling an interrupt value&rdquo;, shows a{" "}
          <code>handler</code> that resolves some interrupts without rendering.
          Its example is a department-authorisation flow built on a{" "}
          <code>getUserByEmail</code> the page never defines and an agent-side
          interrupt it never shows, so there is nothing here to drive it. The{" "}
          <code>handler</code> property itself is real API.
        </p>
      </Callout>
    </>
  );
}
