import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

export default function Page() {
  return (
    <>
      <RouteHeader path="/generative-ui/tool-rendering" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Replacing the chat&apos;s default tool-call bubble with your own
          component. The agent&apos;s <code>get_weather</code> is an ordinary
          ordinary <code>tool()</code> call and knows nothing about the UI;{" "}
          <code>useRenderTool</code> claims it in the browser by name.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The name match is exact and unforgiving — rename either side and the
          renderer silently stops firing, with the default bubble back in its
          place. <code>useDefaultRenderTool</code> is the catch-all for
          everything without a named renderer, so both are registered here and
          you can watch which one wins.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "What's the weather in Tokyo?",
              "Write a short plan for a two-day trip to Tokyo",
            ]}
            expect={
              <>
                The first draws a grey line reading{" "}
                <code>Called the weather API for Tokyo.</code> — the named
                renderer. The second makes the agent use its own planning tools,
                which fall through to the catch-all and render as{" "}
                <code>✓ write_todos</code> rows with a JSON result.
              </>
            }
            fail="A default tool bubble instead of the grey line means the name in useRenderTool no longer matches the backend tool()."
          />
        </div>
      </Panel>

      <Panel title="The demo's page">
        <SourceCode file="frontend/src/app/generative-ui/tool-rendering/demo-chat/page.tsx" />
      </Panel>

      <Panel title="The agent">
        <SourceCode
          file="backend/src/toolRendering.ts"
          region="tool-rendering-agent"
        />
      </Panel>

      <Panel
        title="The two hooks, isolated"
        description="Same code as the demo above, sliced out so each can be read on its own."
      >
        <SourceCodeGroup
          files={[
            {
              file: "frontend/src/app/generative-ui/tool-rendering/demo-chat/page.tsx",
              region: "use-render-tool",
            },
            {
              file: "frontend/src/app/generative-ui/tool-rendering/demo-chat/page.tsx",
              region: "use-default-render-tool",
            },
          ]}
        />
      </Panel>

      <Callout tone="info" title="Deep Agents bring their own tools">
        <p>
          <code>createDeepAgent</code> installs planning and virtual-filesystem
          tools of its own — <code>write_todos</code>, <code>ls</code>,{" "}
          <code>read_file</code>, <code>write_file</code>, and so on. They show
          up through the catch-all renderer on any non-trivial prompt. Nothing on
          the doc page mentions them, and they are worth recognising so you
          don&apos;t read them as a bug.
        </p>
      </Callout>
    </>
  );
}
