import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, CodeBlock, Panel, TryIt } from "@/components/ui";

const HYDRATE_SNIPPET = `// Manual hydration — read messages off the agent and replace them yourself.
import { useAgent } from "@copilotkit/react-core/v2";

function MyComponent() {
  const { agent } = useAgent({ agentId: "my-agent" });

  const messages = agent.messages;
  // agent.setMessages(myPersistedMessages);

  return null;
}`;

const IMPERATIVE_SNIPPET = `// Set the id on the AGENT when a send follows immediately in the same handler.
// setActiveThreadId only reaches the agent on the next render, so a run kicked
// off right after it would still use the previous thread.
agent.threadId = id;
agent.addMessage({ role: "user", content: text });`;

const PRECEDENCE: [string, string][] = [
  [
    "1. An explicit threadId prop",
    "On <CopilotChat> or <CopilotChatConfigurationProvider>. Authoritative: drives replay and disables the welcome screen.",
  ],
  [
    "2. An active-thread override",
    "setActiveThreadId(...), a picked thread row, or startNewThread().",
  ],
  ["3. Inherited", "A threadId from a parent configuration provider."],
  ["4. A seed", "A non-authoritative threadId seed."],
  ["5. Minted", "Otherwise a fresh randomUUID(), computed at mount."],
];

const LAYERS: [string, string, string][] = [
  [
    "CopilotKit threads",
    "Conversation list + full AG-UI event history, with realtime sync",
    "CopilotKit Intelligence, via useThreads",
  ],
  [
    "Framework-native persistence",
    "Framework-internal state and checkpoints",
    "Your agent — for LlamaIndex, the workflow Context store",
  ],
];

export default function Page() {
  return (
    <>
      <RouteHeader path="/threads-lifecycle" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Where a <code>threadId</code> comes from, what happens when a chat
          mounts with one it already knows, and how switching to a known
          conversation differs from starting a fresh one. Four steps: mint, run,
          hydrate, switch.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={[
              "Send a message, note the threadId, press New chat",
              "Pick the first conversation and press Open conversation",
            ]}
            expect="New chat mints a different id and clears the view. Open conversation restores the earlier id, flips `explicit` to true, and replays that conversation's messages."
            fail="Open conversation changes the id but the chat stays empty — there is no server-side store to replay from. See the callout below."
          />
        </div>
      </Panel>

      <Panel title="How the id is resolved">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {PRECEDENCE.map(([rule, detail]) => (
                <tr key={rule} className="align-top">
                  <td className="w-56 py-2 pr-4 font-medium text-slate-800 dark:text-slate-100">
                    {rule}
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    {detail}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4">
          <Callout tone="warn" title="Auto-minted ids re-mint on remount">
            The fallback id is computed with <code>useMemo</code>, so a{" "}
            <em>remount</em> — a changed React <code>key</code>, a parent
            unmount, or StrictMode&apos;s double-mount in dev — produces a new id
            and silently starts a new conversation. For continuity, mint it
            yourself and pass it as the prop, or restore it via{" "}
            <code>setActiveThreadId</code>.
          </Callout>
        </div>
      </Panel>

      <Callout tone="warn" title="Replay needs a server-side store">
        This is the honest limit on this route. Setting a known{" "}
        <code>threadId</code> calls <code>connectAgent()</code>, which replays
        that thread&apos;s persisted history — but only if there is something to
        replay from: CopilotKit Intelligence, or a persisting{" "}
        <code>AgentRunner</code>. Against this repo&apos;s SSE-mode default the
        in-memory runner holds threads only for the life of the process, so
        replay works within a session and nothing survives a restart. If history
        is not restoring, the doc is explicit that the thing to check is the
        store, not the client code.
      </Callout>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/threads-lifecycle/demo-chat/page.tsx" />
      </Panel>

      <Panel
        title="Pick one source of truth"
        description="The single easiest way to make this route look broken."
      >
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Both setters <strong>no-op and log a warning</strong> when the{" "}
          <code>threadId</code> is prop-controlled. If you drive threads
          imperatively, do not also pass a <code>threadId</code> prop — which is
          why the demo above passes none, and why the{" "}
          <a
            href="/headless-threads"
            className="text-[var(--accent)] underline underline-offset-4"
          >
            Headless Threads
          </a>{" "}
          route does the opposite and uses no setters.
        </p>
        <div className="mt-4">
          <CodeBlock
            filename="Imperative sends set the id on the agent, not through the setter"
            language="tsx"
            code={IMPERATIVE_SNIPPET}
          />
        </div>
      </Panel>

      <Panel
        title="There is no initialMessages in v2"
        description="History is restored two ways, and neither is a prop."
      >
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Server-side replay is the first, and the one this route demonstrates.
          The second is manual: read messages off the agent and replace them.
          There is no v2 <code>useCopilotChat</code> hook and no{" "}
          <code>initialMessages</code> prop — both belong to v1.
        </p>
        <div className="mt-4">
          <CodeBlock
            filename="Manual hydration"
            language="tsx"
            code={HYDRATE_SNIPPET}
          />
        </div>
      </Panel>

      <Panel
        title="CopilotKit threads vs. the framework's own persistence"
        description="Two layers, correlated only by the shared threadId."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700">
                <th className="pb-2 pr-4 font-medium">Layer</th>
                <th className="pb-2 pr-4 font-medium">What it stores</th>
                <th className="pb-2 font-medium">Managed by</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {LAYERS.map(([layer, stores, managed]) => (
                <tr key={layer} className="align-top">
                  <td className="py-2 pr-4 font-medium text-slate-800 dark:text-slate-100">
                    {layer}
                  </td>
                  <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">
                    {stores}
                  </td>
                  <td className="py-2 text-slate-600 dark:text-slate-400">
                    {managed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <code>useThreads</code> rename, archive, and delete operate on platform
          threads and do not reach into the framework&apos;s own store unless
          your backend explicitly bridges them. The bridge is the id: an explicit
          CopilotKit <code>threadId</code> is forwarded to the backend as the
          AG-UI <code>threadId</code>, which the framework can use as its own.
        </p>
      </Panel>

      <Callout tone="info" title="Scoping threads to a real user">
        The doc&apos;s <code>identifyUser</code> sample resolves a
        server-verified session and throws on an unauthenticated request. This
        repo returns a fixed demo identity from a request header instead, which
        the doc is clear is &ldquo;suitable only for a single-user demo&rdquo;.
        The{" "}
        <a
          href="/copilot-runtime"
          className="text-[var(--accent)] underline underline-offset-4"
        >
          Copilot Runtime
        </a>{" "}
        route shows the callback this harness actually runs.
      </Callout>
    </>
  );
}
