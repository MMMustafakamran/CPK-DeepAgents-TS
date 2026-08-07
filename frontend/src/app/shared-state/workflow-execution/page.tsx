import Link from "next/link";

import { RouteHeader } from "@/components/route-header";
import { Callout, CodeBlock, KeyValue, Panel } from "@/components/ui";

const BOTH_PAGES_OPEN = `# Workflow Execution

> Decide which state properties are received and returned to the frontend`;

const OTHER_PAGE_OPEN = `# Input/Output Schemas

> Decide which state properties are received and returned to the frontend`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/shared-state/workflow-execution" />

      <Panel title="There is nothing on this page to implement">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The nav lists Workflow Execution as its own entry, and the URL
          resolves. But the page it serves is the Input/Output Schemas page —
          the same subtitle, the same &ldquo;What is this?&rdquo;, the same three
          <code> Steps</code>, the same <code>question</code>/
          <code>answer</code>/<code>resources</code> example, the same{" "}
          <code>StateGraph(OverallState, input=..., output=...)</code>, the same
          closing <code>useAgent</code> snippet. Only the <code>h1</code>{" "}
          differs.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CodeBlock
            code={BOTH_PAGES_OPEN}
            language="text"
            filename="deepagents/shared-state/workflow-execution"
          />
          <CodeBlock
            code={OTHER_PAGE_OPEN}
            language="text"
            filename="deepagents/shared-state/state-inputs-outputs"
          />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Everything below those two lines is identical. The subtitle on this
          page describes the other page&apos;s topic, which is the giveaway: it
          reads &ldquo;Decide which state properties are received and returned to
          the frontend&rdquo;, not anything about workflow execution.
        </p>
      </Panel>

      <Panel title="What was checked">
        <KeyValue
          rows={[
            ["Checked on", "2026-08-06"],
            [
              "Method",
              <>
                Both pages fetched as raw markdown (
                <code>&lt;url&gt;.md</code>) and compared.
              </>,
            ],
            ["Result", "Identical except for the h1 heading."],
            [
              "Consequence",
              <>
                Marked <strong>Broken</strong> in the status table rather than
                guessed at. Per this repo&apos;s guardrails, a page that does not
                serve its own content is recorded, not invented.
              </>,
            ],
          ]}
        />
      </Panel>

      <Callout tone="info" title="Where the content actually lives">
        <p>
          Read{" "}
          <Link
            href="/shared-state/state-inputs-outputs"
            className="underline underline-offset-4"
          >
            Input/Output Schemas
          </Link>
          , which covers the same material under the title it belongs to and
          lists the problems with its code.
        </p>
      </Callout>

      <Callout tone="warn" title="If the page is fixed upstream">
        <p>
          Re-run the fetch and rebuild this route against whatever it then
          serves. Until then there is no way to tell what &ldquo;workflow
          execution&rdquo; was meant to mean for Deep Agents — inferring it from
          the title would be a guess, and guesses are what this repo is trying to
          avoid.
        </p>
      </Callout>
    </>
  );
}
