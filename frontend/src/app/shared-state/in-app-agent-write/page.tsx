import Link from "next/link";

import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, CodeBlock, Panel, TryIt } from "@/components/ui";

const DOC_SET_STATE = `// the page
agent.setState({ language: language === "english" ? "spanish" : "english" });

// here
agent.setState({
  ...agent.state,
  language: language === "english" ? "spanish" : "english",
});`;

const EXPOSE_STATE = `// looks like the fix — it is not
createDeepAgent({
  middleware: [
    languageStateMiddleware,                                  // declares \`language\`
    createCopilotkitMiddleware({ exposeState: ["language"] }), // wants to read it
  ],
});

// inside the CopilotKit middleware's own wrapModelCall:
//   request.state  ->  { messages, copilotkit }
//                      ^ no \`language\` — it belongs to the other middleware
// so buildStateNote() returns null and nothing is appended to the prompt.`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/shared-state/in-app-agent-write" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The other direction of{" "}
          <Link
            href="/shared-state/in-app-agent-read"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            Reading agent state
          </Link>{" "}
          — the two doc pages print identical TypeScript and share one agent
          here. <code>agent.setState</code> writes from the app; the value
          travels with the next run.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Two buttons, because the page has two variants.{" "}
          <strong>Toggle Language</strong> writes and waits — nothing happens
          until you send a message. <strong>Toggle + runAgent()</strong> is the
          page&apos;s &ldquo;Advanced Usage&rdquo; section: it starts a run
          immediately, and the agent replies in the new language without you
          typing anything.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Tell me a fun fact about octopuses",
              "(then hit Toggle Language and ask again)",
            ]}
            expect={
              <>
                The panel and the JSON dump flip to <code>spanish</code> and
                the value survives the round trip — that is the write working.{" "}
                <strong>Toggle + runAgent()</strong> produces a fresh reply on
                its own, no typing. The reply itself stays in English; see the
                callout below.
              </>
            }
            fail="Known limitation, not a setup problem: the label and the JSON dump change, but the reply stays in English. See the callout below — exposeState cannot reach the field."
          />
        </div>
      </Panel>

      <Panel title="The demo's page">
        <SourceCode file="frontend/src/app/shared-state/in-app-agent-write/demo-chat/page.tsx" />
      </Panel>

      <Panel title="The agent" description="Shared with the Reading route.">
        <SourceCodeGroup
          files={[
            { file: "backend/src/sharedState.ts", region: "agent-state" },
            { file: "backend/src/sharedState.ts", region: "agent" },
          ]}
        />
      </Panel>

   
    </>
  );
}
