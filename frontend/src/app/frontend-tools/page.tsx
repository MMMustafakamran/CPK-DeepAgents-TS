import Link from "next/link";

import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/frontend-tools" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          A tool the agent can call whose body never leaves the browser. The
          backend defines no tool at all — <code>copilotkitMiddleware</code> puts
          whatever the browser registered onto the agent&apos;s state under a{" "}
          <code>copilotkit</code> key, and the model sees it as an ordinary tool.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          So <code>sayHello</code> exists only in{" "}
          <code>demo-chat/page.tsx</code>. Restart the agent server and it is
          still there; close the tab and the agent loses it.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Say hello to Ada", "Say hello to me — my name is Grace"]}
            expect={
              <>
                A browser <code>alert()</code> reading <code>Hello, Ada!</code>.
                Dismiss it and a green line appears in the left panel, then the
                agent replies that it said hello — that reply is the
                handler&apos;s return value going back to the model.
              </>
            }
            fail="The agent describing what it would do rather than doing it means the tool never reached it — check that copilotkitMiddleware is in the agent's middleware array."
          />
        </div>
      </Panel>

      <Panel title="The demo's page">
        <SourceCode file="frontend/src/app/frontend-tools/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="The tool, isolated"
        description="The page's page.tsx snippet, as it actually runs here."
      >
        <SourceCode
          file="frontend/src/app/frontend-tools/demo-chat/page.tsx"
          region="use-frontend-tool"
        />
      </Panel>

      <Panel
        title="The agent"
        description="The page's TypeScript is the middleware and a comment; the createDeepAgent call below is written to the shape that comment describes."
      >
        <SourceCodeGroup
          files={[
            { file: "backend/src/frontendTools.ts", region: "agent-state" },
            { file: "backend/src/frontendTools.ts", region: "agent" },
          ]}
        />
      </Panel>

      <Callout tone="info" title="The page's TypeScript is a comment, not code">
        <p>
          Its whole backend contribution is <code>yourStateMiddleware</code> plus
          the line{" "}
          <code>
            {"// createDeepAgent({ middleware: [yourStateMiddleware, copilotkitMiddleware], ... })"}
          </code>
          . That comment is the only place the agent appears anywhere on the
          page, so it is what the <code>agent</code> block above was written
          from.
        </p>
        <p className="mt-2">
          <code>yourStateMiddleware</code> itself is not load-bearing here: it
          declares a <code>yourAdditionalProperty</code> nothing reads. The
          middleware that matters is <code>copilotkitMiddleware</code>, which the
          Quickstart annotates as being there &ldquo;for frontend tools and
          context&rdquo;. Both are kept so the file matches the page.
        </p>
      </Callout>

      <Callout tone="warn" title="Its state field would not reach the browser">
        <p>
          <code>yourAdditionalProperty: z.string().optional()</code> has no{" "}
          <code>zodState</code> wrapper, so it is dropped from the graph&apos;s{" "}
          <code>output_schema</code> and filtered out of every{" "}
          <code>STATE_SNAPSHOT</code>. Nothing on this route reads it, so nothing
          breaks — but copy this middleware as a template for a field you want to
          show in the UI and it will silently never arrive. The two shared-state
          pages get this right; see{" "}
          <Link
            href="/shared-state/in-app-agent-read"
            className="underline underline-offset-4"
          >
            Reading agent state
          </Link>
          .
        </p>
      </Callout>

      <Callout tone="warn" title="The page repeats itself and links elsewhere">
        <p>
          Its Step 1 links to <code>/langgraph/quickstart</code>, not the Deep
          Agents one, and points at the <code>coagents-starter</code> example.
          Steps 4 and 5 then repeat &ldquo;What is this?&rdquo;, &ldquo;When
          should I use this?&rdquo; and the whole <code>useFrontendTool</code>{" "}
          snippet verbatim — the same block appears twice on one page.
        </p>
      </Callout>
    </>
  );
}
