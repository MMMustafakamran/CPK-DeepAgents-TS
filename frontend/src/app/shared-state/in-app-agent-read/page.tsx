import Link from "next/link";

import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/shared-state/in-app-agent-read" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Agent state as ordinary React state. <code>useAgent</code> returns the
          agent; <code>agent.state</code> is a reactive object, so a component
          reading a field off it re-renders when the agent writes that field. No
          subscription and no effect.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          This route only reads.{" "}
          <Link
            href="/shared-state/in-app-agent-write"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            Writing agent state
          </Link>{" "}
          drives the same agent from the other direction — the two doc pages
          print identical TypeScript.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Hello", "What language are you answering in?"]}
            expect={
              <>
                The left panel reads <code>Language: english</code> after the
                first message, and the JSON dump below it shows the full state
                object with a <code>language</code> key.
              </>
            }
            fail="An empty JSON dump means the agent has not run yet — state is only synced once a run starts. A dump with everything except `language` means the field lost its zodState wrapper; see below."
          />
        </div>
      </Panel>

      <Panel title="The demo's page">
        <SourceCode file="frontend/src/app/shared-state/in-app-agent-read/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The agent"
        description="Shared with the Writing route. The middleware is the page's; the createDeepAgent call is the glue it omits."
      >
        <SourceCodeGroup
          files={[
            { file: "backend/src/sharedState.ts", region: "agent-state" },
            { file: "backend/src/sharedState.ts", region: "agent" },
          ]}
        />
      </Panel>

      <Callout tone="success" title="zodState is doing real work here">
        <p>
          Easy to read as noise around the schema, and it is not. Its own
          docstring in <code>@copilotkit/sdk-js</code> explains why: without it,
          a Zod field carries no JSON-schema hook, LangGraph&apos;s{" "}
          <code>getJsonSchemaFromSchema</code> drops it from the graph&apos;s{" "}
          <code>output_schema</code>, and AG-UI then filters the field out of
          every <code>STATE_SNAPSHOT</code> — so{" "}
          <code>useAgent().state.language</code> stays{" "}
          <code>undefined</code> in the browser even though the thread state has
          the value.
        </p>
        <p className="mt-2">
          Both shared-state pages use it correctly. Two other pages in this doc
          set do not: the{" "}
          <Link
            href="/generative-ui/your-components/interrupt-based"
            className="underline underline-offset-4"
          >
            interrupt-based
          </Link>{" "}
          middleware declares{" "}
          <code>agentName: z.string().optional()</code> bare, and{" "}
          <Link href="/frontend-tools" className="underline underline-offset-4">
            frontend-tools
          </Link>{" "}
          declares <code>yourAdditionalProperty</code> the same way. Neither
          route needs to read those fields in the browser, so nothing breaks —
          but copy either as a template for a field you <em>do</em> want to read
          and it will silently never arrive.
        </p>
      </Callout>

      <Callout tone="info" title="The Zod default really is a default here">
        <p>
          <code>zodState(z.enum([...]).default(&quot;english&quot;))</code>{" "}
          applies at runtime, so the panel shows{" "}
          <code>english</code> without anything seeding it. The Python page&apos;s
          equivalent —{" "}
          <code>language: Literal[...] = &quot;english&quot;</code> on a{" "}
          <code>TypedDict</code> — is a class attribute LangGraph never applies,
          so the Python sibling repo has to seed the key by hand. Same page, same
          claim, different truth per language.
        </p>
      </Callout>

      <Callout tone="info" title="Reading is not seeing">
        <p>
          The pages say the agent &ldquo;reads <code>language</code> as it
          runs&rdquo;. True of the graph — false of the <em>model</em>, which
          sees nothing that is not in the prompt. It does not matter on this
          route, which only displays the value, but it is what makes{" "}
          <Link
            href="/shared-state/in-app-agent-write"
            className="underline underline-offset-4"
          >
            Writing agent state
          </Link>{" "}
          only Partial: the toggle changes state the LLM never reads. The
          intended remedy, <code>exposeState</code>, cannot reach the field —
          measured on that route.
        </p>
      </Callout>

      <Callout tone="info" title="State only flows once a run starts">
        <p>
          The panel is empty on a cold load and fills in after the first message.
          AG-UI sends a state snapshot as part of a run, so there is nothing to
          read before one has happened. The page&apos;s screenshot skips this.
        </p>
      </Callout>
    </>
  );
}
