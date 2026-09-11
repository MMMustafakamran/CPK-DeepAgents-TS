import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

const SERVER_LOG = `⨯ Error: CopilotKitIntelligence \`apiKey\` is required and cannot be blank. It is the
  CopilotKit Intelligence project API key, normally read from the CPK_INTELLIGENCE_API_KEY
  environment variable. Run \`copilotkit project select\` to provision one for your project.
    at module evaluation (src/lib/learning-runtime.ts)
  > const intelligence = new CopilotKitIntelligence({
      apiKey: process.env.CPK_INTELLIGENCE_API_KEY!,

GET  /api/copilotkit-learning/info  → 500
POST /api/copilotkit-learning       → 500
browser: runtime_info_fetch_failed · "Agent expense-agent not found" · runtime row "error"`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/learning" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Learning groups Threads from one kind of work into a container,
          analyzes completed runs into Insights, and proposes Skills you review
          and publish. The only code the page asks for is one runtime callback,{" "}
          <code>getLearningContainerId</code>, that decides which container a
          new Thread joins. This route mounts that runtime verbatim at{" "}
          <code>/api/copilotkit-learning</code>, with this repo&apos;s Deep Agent
          registered twice: as <code>expense-agent</code>, which the selector
          assigns, and as <code>sample_agent</code>, which it does not.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "On expense-agent: Review this expense: $42 team lunch, receipt attached.",
              "On sample_agent: Say hello in five words.",
            ]}
            expect="Per the page: both agents answer, and expense-agent's Thread shows up in the expense-review container in the dashboard."
            fail="What actually happens in this repo: the runtime row reads error, the composer will not send, and neither tab answers — the mount is 500 because this repo has no CPK_INTELLIGENCE_API_KEY. See below."
          />
        </div>
      </Panel>

      <Callout tone="premium" title="Behind a key this repo does not have">
        The page&apos;s first real step is &quot;Complete the Intelligence
        quickstart&quot;, and its snippet builds{" "}
        <code>new CopilotKitIntelligence({"{ apiKey: process.env.CPK_INTELLIGENCE_API_KEY! }"})</code>{" "}
        at module load. There is no key here, locally or in CI, so the
        constructor throws and every request to the mount answers 500. That is
        the whole of what this route can show: the runtime row reads{" "}
        <code>error</code>, <code>agent ready</code> stays <code>false</code>,
        and the composer holds the prompt without sending it, on both tabs. The
        rest of the app is unaffected, which is why the page&apos;s code has a
        mount of its own.
        <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {SERVER_LOG}
        </pre>
      </Callout>

      <Callout tone="warn" title="The non-null assertion hides the one failure every reader hits first">
        <code>process.env.CPK_INTELLIGENCE_API_KEY!</code> tells the compiler the
        key is there and checks nothing. Missing, it is a module-load throw — a
        500 for the route, and under <code>next dev</code> a server-side stack
        the chat never shows. The throw itself is clear and names the variable;
        the page just never says that the snippet cannot load without it.
      </Callout>

      <Callout tone="warn" title="With a key: a container ID that does not exist breaks the chat (from the Agno sibling)">
        Not reproducible here. In the Agno sibling repo, which has a key, the
        page&apos;s example container <code>expense-review</code> did not exist
        in the project, and the result was not an unassigned Thread: the
        platform refused to create the Thread (
        <code>LEARNING_CONTAINER_NOT_FOUND</code>), the run returned 404
        &quot;Failed to initialize thread&quot;, and the chat showed the
        user&apos;s message and then nothing; the unassigned agent on the same
        runtime answered. The page&apos;s troubleshooting row for this case —
        &quot;A Thread never appears in the container&quot; — describes a much
        milder failure. This route&apos;s demo and recorder handler follow that
        path automatically if a key is ever added.
      </Callout>

      <Callout tone="warn" title="The snippet leans on two things it never defines">
        <code>new CopilotRuntime({"{ agents, intelligence, identifyUser }"})</code>{" "}
        — <code>agents</code> and <code>identifyUser</code> appear nowhere else
        on the page. They are supplied in <code>lib/learning-runtime.ts</code>,
        above the verbatim block, and marked as this harness&apos;s: the Deep
        Agent under two ids, and the same <code>x-user-id</code> /{" "}
        <code>x-user-name</code> identity the main runtime reads.
      </Callout>

      <Callout tone="warn" title="No version floor">
        <code>getLearningContainerId</code> exists on{" "}
        <code>CopilotKitIntelligence</code> from runtime 1.70. This repo&apos;s
        lockfile (1.70.1) and CI (1.71.0) both have it, so it typechecks here;
        on 1.69.x it is a type error. The page names no version, and its
        coding-agent prompt tells you not to use the deprecated{" "}
        <code>ɵlearning</code> option without saying that is what older
        runtimes have instead.
      </Callout>

      <Callout tone="premium" title="Not exercised here">
        Creating a container, Run Learning, reviewing Insights, approving a
        Skill, and <code>copilotkit skills download</code> are dashboard and CLI
        steps behind a login this harness does not drive. They are not on the
        clip, and nothing here says whether they work.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/lib/learning-runtime.ts" />
        <div className="mt-4">
          <SourceCode file="frontend/src/app/learning/demo-chat/page.tsx" />
        </div>
      </Panel>
    </>
  );
}
