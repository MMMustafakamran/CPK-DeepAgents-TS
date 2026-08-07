"use client";

import { CopilotChat, useInterrupt } from "@copilotkit/react-core/v2";
import { useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

const SINGLE_AGENT_ID = "interrupt_agent";
const MULTI_AGENT_ID = "interrupt_multi_agent";

//#region single-interrupt
/**
 * The page's Implementation section, verbatim: one `useInterrupt`, no
 * `enabled`, unstyled markup.
 *
 * The agent's `beforeModel` hook calls `interrupt("…")` with a plain string, so
 * `event.value` is that string and the snippet is correct as printed.
 * `resolve` sends the reply back and the run picks up where it stopped.
 *
 * `agentId` is the one addition: the page sets its single agent on the
 * provider, while this harness serves thirteen graphs from one, so each
 * registration has to name the graph it belongs to.
 */
function SingleInterruptChat() {
  useInterrupt({
    agentId: SINGLE_AGENT_ID,
    render: ({ event, resolve }) => (
        <div>
            <p>{event.value}</p>
            <form onSubmit={(e) => {
                e.preventDefault();
                resolve((e.target as HTMLFormElement).response.value);
            }}>
                <input type="text" name="response" placeholder="Enter your response" />
                <button type="submit">Submit</button>
            </form>
        </div>
    )
});

  return <CopilotChat agentId={SINGLE_AGENT_ID} className="h-full" />;
}
//#endregion

//#region conditional-interrupts
/**
 * The page's "Condition UI executions" section.
 *
 * The agent raises two interrupts from one hook, each an object with a `type`.
 * Two `useInterrupt` registrations coexist because `enabled` is supposed to
 * decide which one claims a given event — without it they would fight over
 * both.
 */
const ApproveComponent = ({
  content,
  onAnswer,
}: {
  content: string;
  onAnswer: (approved: boolean) => void;
}) => (
  <div className="my-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950/40">
    <h1 className="font-semibold text-slate-900 dark:text-slate-100">
      Do you approve?
    </h1>
    <p className="mt-0.5 text-slate-600 dark:text-slate-300">{content}</p>
    <div className="mt-2 flex gap-2">
      <button
        onClick={() => onAnswer(true)}
        className="rounded-md bg-emerald-600 px-3 py-1 font-medium text-white"
      >
        Approve
      </button>
      <button
        onClick={() => onAnswer(false)}
        className="rounded-md bg-rose-600 px-3 py-1 font-medium text-white"
      >
        Reject
      </button>
    </div>
  </div>
);

const AskComponent = ({
  question,
  onAnswer,
}: {
  question: string;
  onAnswer: (answer: string) => void;
}) => (
  <div className="my-2 rounded-lg border border-sky-300 bg-sky-50 p-3 text-sm dark:border-sky-800 dark:bg-sky-950/40">
    <p className="text-slate-800 dark:text-slate-100">{question}</p>
    <form
      className="mt-2 flex gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onAnswer((e.target as HTMLFormElement).response.value);
      }}
    >
      <input
        type="text"
        name="response"
        placeholder="Enter your response"
        className="min-w-0 flex-1 rounded-md border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
      />
      <button
        type="submit"
        className="rounded-md bg-[var(--accent)] px-3 py-1 font-medium text-white"
      >
        Submit
      </button>
    </form>
  </div>
);

/**
 * Left exactly as the page prints it, so the two defects are visible in place
 * rather than described somewhere else. Both were checked against a live run:
 *
 * 1. `enabled` receives the whole event, `{ name, value }`. There is no
 *    `eventValue`. In TypeScript this is a compile error, not just a runtime
 *    one — hence the `@ts-expect-error` on each line. Those annotations are
 *    the proof: delete one and `tsc` reports
 *    `TS2339: Property 'eventValue' does not exist on type 'InterruptEvent<any>'`.
 *    At runtime the destructure yields `undefined` and reading `.type` throws,
 *    so neither handler ever claims an event.
 * 2. `event.value` is a JSON **string**, not the object the agent passed. A
 *    LangGraph `interrupt()` arrives as the legacy `on_interrupt` custom event
 *    and the runtime serialises its value on the way out, so
 *    `event.value.content` is `undefined` and the card renders blank. The
 *    compiler cannot catch this one: `TValue` defaults to `any`.
 *
 * Expect this tab to be broken. That is the finding, not a bug in the harness.
 */
function ConditionalInterruptChat() {
    useInterrupt({
        agentId: MULTI_AGENT_ID,
        // @ts-expect-error — the page's snippet; `enabled` has no `eventValue`.
        enabled: ({ eventValue }) => eventValue.type === 'ask',
        render: ({ event, resolve }) => (
            <AskComponent question={event.value.content} onAnswer={answer => resolve(answer)} />
        )
    });

useInterrupt({
        agentId: MULTI_AGENT_ID,
        // @ts-expect-error — the page's snippet; `enabled` has no `eventValue`.
        enabled: ({ eventValue }) => eventValue.type === 'approval',
        render: ({ event, resolve }) => (
            <ApproveComponent content={event.value.content} onAnswer={answer => resolve(answer)} />
        )
    });


  return <CopilotChat agentId={MULTI_AGENT_ID} className="h-full" />;
}
//#endregion

export default function Page() {
  const [variant, setVariant] = useState<"single" | "conditional">("single");

  return (
    <DemoFrame
      parentPath="/generative-ui/your-components/interrupt-based"
      subtitle={`graph: ${variant === "single" ? SINGLE_AGENT_ID : MULTI_AGENT_ID}`}
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
          {(
            [
              ["single", "One interrupt"],
              ["conditional", "Two, dispatched by type"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setVariant(id)}
              className={`rounded-md px-3 py-1 text-xs font-medium ${
                variant === id
                  ? "bg-[var(--accent)] text-white"
                  : "border border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1">
          {/* Keyed so switching tears the old chat down: the two variants
              register different `useInterrupt` handlers against different
              agents, and leaving both mounted would leave both registered. */}
          {variant === "single" ? (
            <SingleInterruptChat key="single" />
          ) : (
            <ConditionalInterruptChat key="conditional" />
          )}
        </div>
      </div>
    </DemoFrame>
  );
}
