"use client";

import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  useCopilotChatConfiguration,
  useThreads,
} from "@copilotkit/react-core/v2";
import { useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

/** The runtime id this demo binds to. Also shown in the demo header. */
const AGENT_ID = "sample_agent";

/**
 * The doc's `ThreadControls`, plus a readout of the id they are moving.
 *
 * Both setters come from `useCopilotChatConfiguration`, so this component has to
 * sit *inside* the provider — which is also why the chat below it responds to
 * the buttons without being passed anything.
 *
 * The doc's warning is the thing to watch here: these setters no-op and log when
 * the `threadId` is prop-controlled. This demo therefore never passes a
 * `threadId` prop, so the setters are the single source of truth.
 */
function ThreadControls() {
  const config = useCopilotChatConfiguration();
  const { threads } = useThreads({ agentId: AGENT_ID });
  const [picked, setPicked] = useState<string>("");

  const existingId = picked || threads[0]?.id;

  return (
    <div className="space-y-4 p-4">
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Active thread
        </h2>
        <dl className="mt-2 grid grid-cols-[minmax(0,9rem)_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-slate-500">threadId</dt>
          <dd className="break-all">
            <code>{config?.threadId ?? "—"}</code>
          </dd>
          <dt className="text-slate-500">explicit?</dt>
          <dd>
            <code>{String(config?.hasExplicitThreadId ?? false)}</code>
          </dd>
          <dt className="text-slate-500">agentId</dt>
          <dd>
            <code>{config?.agentId ?? "—"}</code>
          </dd>
        </dl>
        <p className="mt-2 text-xs text-slate-500">
          A fresh id is minted on mount when none is supplied. Watch it change
          when you press New chat, and watch <code>explicit</code> flip when you
          open a known conversation.
        </p>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Switch or start
        </h2>

        <label className="mt-2 block text-xs text-slate-500" htmlFor="thread-pick">
          Known conversation
        </label>
        <select
          id="thread-pick"
          value={existingId ?? ""}
          onChange={(e) => setPicked(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
        >
          {threads.length === 0 && <option value="">No threads yet</option>}
          {threads.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name ?? "New conversation"}
            </option>
          ))}
        </select>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!existingId}
            onClick={() =>
              existingId &&
              config?.setActiveThreadId(existingId, { explicit: true })
            }
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-slate-600"
          >
            Open conversation
          </button>
          <button
            type="button"
            disabled={!existingId}
            onClick={() =>
              existingId &&
              config?.setActiveThreadId(existingId, { explicit: false })
            }
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium disabled:opacity-40 dark:border-slate-600"
          >
            Set id, no replay
          </button>
          <button
            type="button"
            onClick={() => config?.startNewThread()}
            className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
          >
            New chat
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-500">
          <code>explicit: true</code> treats the id as a known thread and replays
          its history. <code>explicit: false</code> sets the same id but shows
          the welcome screen — the difference the doc draws between the two.
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <DemoFrame
      parentPath="/threads-lifecycle"
      subtitle={`agent: ${AGENT_ID} · setActiveThreadId vs startNewThread`}
    >
      <CopilotChatConfigurationProvider agentId={AGENT_ID}>
        <div className="grid h-full grid-cols-1 lg:grid-cols-[22rem_1fr]">
          <div className="min-h-0 overflow-y-auto border-b border-slate-200 lg:border-b-0 lg:border-r dark:border-slate-800">
            <ThreadControls />
          </div>
          <div className="min-h-0">
            <CopilotChat />
          </div>
        </div>
      </CopilotChatConfigurationProvider>
    </DemoFrame>
  );
}
