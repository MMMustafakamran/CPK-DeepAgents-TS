import { RouteHeader } from "@/components/route-header";
import { SourceCode, SourceCodeGroup } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

const RETURNS: [string, string][] = [
  ["threads", "The list, sorted most-recently-updated first, synced in realtime."],
  ["isLoading", "First load only."],
  ["renameThread(id, name)", "The action the prebuilt drawer does not surface."],
  ["archiveThread(id)", "Soft delete — hidden from the list unless includeArchived."],
  ["unarchiveThread(id)", "The inverse."],
  ["deleteThread(id)", "Permanent and irreversible. No built-in confirmation."],
  ["startNewThread()", "Resets to a freshly minted, non-explicit id."],
  ["hasMoreThreads / fetchMoreThreads", "Cursor pagination, enabled by passing limit."],
];

export default function Page() {
  return (
    <>
      <RouteHeader path="/headless-threads" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The same data the{" "}
          <a
            href="/prebuilt-components/copilot-threads-drawer"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            drawer
          </a>{" "}
          renders, reached directly through <code>useThreads</code> and drawn by
          hand. CopilotKit still owns persistence, replay, and realtime sync —
          you are only replacing the UI.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The wiring differs from the drawer in one visible way. The drawer
          shares an active thread through{" "}
          <code>CopilotChatConfigurationProvider</code>, so nothing is passed
          between components. Here the selected id is ordinary React state handed
          to <code>&lt;CopilotChat threadId={"{...}"}&gt;</code> — which is the
          doc&apos;s own <code>App.tsx</code> sample, and the thing the drawer
          page describes as the wiring you skip.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Send a message, then press New conversation and send another",
              "Press Rename on the first row",
            ]}
            expect="Two rows appear. Selecting one replays its history into the chat, Rename relabels a row without a refresh, and New conversation clears to a fresh welcome screen with a newly minted threadId."
            fail="The list stays empty after several messages, or Rename throws — both are the no-Intelligence state. See the callout below."
          />
        </div>
      </Panel>

      <Callout tone="warn" title="Rename, archive, and delete are mutations">
        Worth knowing before you test it: <code>list</code> and{" "}
        <code>mutations</code> are separate capabilities. With the runtime in SSE
        mode, <code>/info</code> reports{" "}
        <code>list: true, inspect: true</code> but{" "}
        <code>mutations: false</code> — the in-memory runner backs reads only, so
        the list can populate while the three buttons have no endpoint to reach.
        Set <code>CPK_INTELLIGENCE_API_KEY</code> and all four flags flip on;
        the
        home page&apos;s connection panel prints them.
      </Callout>

      <Panel
        title="Why &ldquo;New conversation&rdquo; takes two steps"
        description="The single least obvious thing on this route."
      >
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          The prebuilt drawer&apos;s own handler calls two different things, and
          the names collide confusingly:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li>
            · <code>useThreads().startNewThread()</code> dispatches{" "}
            <code>newThreadStarted()</code> to the <em>thread store</em>. It
            clears the selected row and nothing else — it never touches the
            chat&apos;s <code>threadId</code>.
          </li>
          <li>
            · <code>useCopilotChatConfiguration().startNewThread()</code> mints
            the new id and shows the welcome screen. That is the one that moves
            the chat.
          </li>
        </ul>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Only the first is reachable here: this route mounts no configuration
          provider, and its chat is prop-controlled, which makes those setters
          no-op. So the second step is ours — and clearing the{" "}
          <code>threadId</code> prop to <code>undefined</code> is{" "}
          <strong>not</strong> enough. With no prop the chat falls through to its
          minted fallback, which is computed with <code>useMemo</code> at mount,
          so clearing returns to the <em>same</em> id every time and the button
          looks dead. Bumping a React <code>key</code> forces the remount that
          re-runs that memo — the exact behaviour the{" "}
          <a
            href="/threads-lifecycle"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            Lifecycle
          </a>{" "}
          page warns about as a footgun, used deliberately here.
        </p>
      </Panel>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/headless-threads/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="What useThreads returns"
        description="Verified against @copilotkit/react-core 1.66.x, not transcribed from the page."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th className="pb-2 pr-4 font-medium">Member</th>
                <th className="pb-2 font-medium">What it is</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {RETURNS.map(([member, desc]) => (
                <tr key={member} className="align-top">
                  <td className="py-2 pr-4 font-mono text-xs text-slate-800 dark:text-slate-100">
                    {member}
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    {desc}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          <code>agentId</code> is required, not optional — the hook lists one
          agent&apos;s threads. The other inputs are{" "}
          <code>includeArchived</code>, <code>limit</code>, and{" "}
          <code>enabled</code>.
        </p>
      </Panel>

      <Panel
        title="The runtime half"
        description="Threads need the runtime in Intelligence mode; this repo already builds it that way when a key is present."
      >
        <SourceCodeGroup
          files={[
            { file: "frontend/src/app/api/copilotkit/[[...slug]]/route.ts" },
          ]}
          note={
            <>
              The doc&apos;s server sample also shows{" "}
              <code>generateThreadNames</code> and three lock options (
              <code>lockTtlSeconds</code>,{" "}
              <code>lockHeartbeatIntervalSeconds</code>,{" "}
              <code>lockKeyPrefix</code>). This repo leaves all four at their
              defaults, so thread names are LLM-generated after the first
              message.
            </>
          }
        />
      </Panel>
    </>
  );
}
