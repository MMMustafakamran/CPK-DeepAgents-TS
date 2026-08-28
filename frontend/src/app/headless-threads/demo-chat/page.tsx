"use client";

import { CopilotChat, useThreads } from "@copilotkit/react-core/v2";
import { useState } from "react";

import { DemoFrame } from "@/components/demo-frame";

/** The runtime id this demo binds to. Also shown in the demo header. */
const AGENT_ID = "sample_agent";

/**
 * The doc's `ThreadSidebar` and its `App` wiring, in one file.
 *
 * Two things the prebuilt drawer does not give you and this does:
 *
 *   - **Rename.** `renameThread` is a `useThreads` action the drawer's row menu
 *     omits entirely, which the doc names as the main reason to go headless.
 *   - **The `threadId` handoff.** The drawer shares state through a
 *     `CopilotChatConfigurationProvider`; here the selected id is ordinary React
 *     state passed to `<CopilotChat threadId={...}>`, which is the doc's own
 *     `App.tsx` sample.
 *
 * `limit` turns on cursor pagination, so `hasMoreThreads` /
 * `fetchMoreThreads` have something to do.
 *
 * "New conversation" is the fiddly part, and it takes two steps because the
 * prebuilt drawer takes two steps. Its `handleNewThread` is:
 *
 *     startNewThread();            // the useThreads store: clears the selection
 *     startNewThreadConfig?.();    // the chat configuration: mints a new id
 *
 * Only the first is available to us. `useThreads().startNewThread()` dispatches
 * `newThreadStarted()` to the thread store, which deselects the list row and
 * nothing else — it never touches the chat's `threadId`. The second is
 * `CopilotChatConfigurationValue.startNewThread`, and it is unavailable here on
 * two counts: this demo mounts no `CopilotChatConfigurationProvider`, and the
 * chat is prop-controlled, which the Lifecycle page says makes those setters
 * no-op and log a warning.
 *
 * So the second step has to be ours, and clearing the prop to `undefined` is NOT
 * enough on its own: with no prop the chat falls through to its minted fallback,
 * which is computed with `useMemo` at mount. Clearing the prop therefore returns
 * to the SAME id every time — the button appears to do nothing. Bumping a React
 * `key` forces the remount that re-runs that memo, which the Lifecycle page
 * documents exactly (as a footgun): "a changed React `key` ... produces a new id
 * and silently starts a new conversation". Here that is the intended effect.
 *
 * The provider-driven equivalent is on the Lifecycle route, which passes no prop
 * and uses the setters instead — the two routes are the two halves of that
 * "pick one source of truth" rule.
 */
function ThreadSidebar({
  onSelectThread,
  onNewThread,
  activeThreadId,
}: {
  onSelectThread: (threadId: string) => void;
  onNewThread: () => void;
  activeThreadId?: string;
}) {
  const {
    threads,
    isLoading,
    error,
    renameThread,
    archiveThread,
    deleteThread,
    startNewThread,
    hasMoreThreads,
    isFetchingMoreThreads,
    fetchMoreThreads,
  } = useThreads({ agentId: AGENT_ID, limit: 20 });

  // Step 1 is the store's; step 2 is the parent's. Same split as the drawer.
  const handleNewThread = () => {
    startNewThread();
    onNewThread();
  };

  if (isLoading) return <div className="p-4 text-sm text-slate-500">Loading...</div>;

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-slate-200 p-3 dark:border-slate-800">
        <button
          type="button"
          onClick={handleNewThread}
          className="w-full rounded-md bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white"
        >
          New conversation
        </button>
      </div>

      {error && (
        <p className="shrink-0 border-b border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200">
          {error.message}
        </p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {threads.length === 0 && (
          <p className="p-2 text-sm text-slate-500">
            No threads yet. Send a message in the chat.
          </p>
        )}

        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`mb-1 rounded-md border p-2 ${
              thread.id === activeThreadId
                ? "border-[var(--accent)]"
                : "border-transparent hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <button
              type="button"
              onClick={() => onSelectThread(thread.id)}
              className="block w-full truncate text-left text-sm text-slate-800 dark:text-slate-100"
            >
              {thread.name ?? "New conversation"}
              {thread.archived && (
                <span className="ml-1 text-xs text-slate-500">(archived)</span>
              )}
            </button>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => renameThread(thread.id, "Renamed")}
                className="rounded border border-slate-300 px-1.5 py-0.5 text-xs dark:border-slate-600"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => archiveThread(thread.id)}
                className="rounded border border-slate-300 px-1.5 py-0.5 text-xs dark:border-slate-600"
              >
                Archive
              </button>
              <button
                type="button"
                onClick={() => deleteThread(thread.id)}
                className="rounded border border-rose-300 px-1.5 py-0.5 text-xs text-rose-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {hasMoreThreads && (
          <button
            type="button"
            onClick={fetchMoreThreads}
            disabled={isFetchingMoreThreads}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm disabled:opacity-40 dark:border-slate-600"
          >
            {isFetchingMoreThreads ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  const [activeThreadId, setActiveThreadId] = useState<string | undefined>();
  // Bumped by "New conversation" to remount the chat, which is what re-runs its
  // minted-id memo. Clearing `activeThreadId` alone reuses the mount-time id.
  const [chatEpoch, setChatEpoch] = useState(0);

  const startFreshConversation = () => {
    setActiveThreadId(undefined);
    setChatEpoch((n) => n + 1);
  };

  return (
    <DemoFrame
      parentPath="/headless-threads"
      subtitle={`agent: ${AGENT_ID} · useThreads + threadId handoff`}
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-[18rem_1fr]">
        <div className="min-h-0 border-b border-slate-200 lg:border-b-0 lg:border-r dark:border-slate-800">
          <ThreadSidebar
            onSelectThread={setActiveThreadId}
            onNewThread={startFreshConversation}
            activeThreadId={activeThreadId}
          />
        </div>

        <div className="min-h-0">
          <CopilotChat
            key={chatEpoch}
            agentId={AGENT_ID}
            threadId={activeThreadId}
          />
        </div>
      </div>
    </DemoFrame>
  );
}
