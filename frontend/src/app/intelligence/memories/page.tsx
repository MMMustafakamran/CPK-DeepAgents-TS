import { RouteHeader } from "@/components/route-header";
import { SourceCode } from "@/components/source-code";
import { Callout, Panel, TryIt } from "@/components/ui";

const TSC_OUTPUT = `$ npx tsc --noEmit        # memory-list.tsx with the @ts-expect-error lines removed
src/app/intelligence/memories/memory-list.tsx: error TS2305:
  Module '"@copilotkit/react-core"' has no exported member 'useMemories'.
src/app/intelligence/memories/memory-list.tsx: error TS7006:
  Parameter 'memory' implicitly has an 'any' type.`;

const PROBE = `As documented   /api/copilotkit (SSE mode — no CPK_INTELLIGENCE_API_KEY)
                GET  /api/copilotkit/info               → 200, mode "sse", no intelligence wsUrl
                no /memories request is ever sent
                useMemories(): isAvailable TRUE · isLoading false · memories 0 · list renders empty
                addMemory → rejects in the browser: "Runtime URL is not configured"

memory.access   /api/copilotkit-memory
                GET  /api/copilotkit-memory/info        → 503 (no key; this harness's fallback)
                POST /api/copilotkit-memory             → 503
                useMemories(): same as above · addMemory → "Runtime URL is not configured"

Both            realtimeStatus stays "connecting" for the whole session`;

export default function Page() {
  return (
    <>
      <RouteHeader path="/intelligence/memories" />

      <Panel title="What it demonstrates">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          Long-term memory: short statements about a user or project that
          outlive any one thread and are recalled into later ones. The page
          explains the model (three kinds, two scopes, supersede-not-patch,
          retire-not-delete), how access is entitled, and how to read and write
          memories from React, REST and MCP. This route runs its React half
          against this repo&apos;s real runtime — which, with no{" "}
          <code>CPK_INTELLIGENCE_API_KEY</code> here or in CI, is in SSE mode.
        </p>
        <div className="mt-4">
          <TryIt
            prompts={["Please remember that I prefer concise status updates."]}
            expect="Per the page: the list shows this user's memories, and Save adds one — or, unentitled, the list says memory is not available."
            fail="What actually happens here — see below: the list renders empty, isAvailable reads true, and Save fails in the browser with “Runtime URL is not configured” without ever sending a request."
          />
        </div>
      </Panel>

      <Callout tone="warn" title="The React snippet imports a hook that is not there">
        <code>import {"{ useMemories }"} from &quot;@copilotkit/react-core&quot;</code>{" "}
        — the package root is the v1 surface and has no such export, on the
        lockfile&apos;s 1.70.1 or CI&apos;s 1.71.0. It ships only from{" "}
        <code>@copilotkit/react-core/v2</code>. Under Next 16 a missing named
        export is a Turbopack compile error, so a route that imports the file
        does not build at all. The verbatim file is kept, errors acknowledged,
        and imported by nothing; the demo runs the same component with the
        import moved to <code>/v2</code>. The wrong path is not the page&apos;s
        invention: the hook&apos;s own JSDoc <code>@example</code> in react-core
        1.71.0 opens with the same root import.
        <pre className="mt-3 overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {TSC_OUTPUT}
        </pre>
      </Callout>

      <Callout tone="warn" title="Without Intelligence, memory looks like an empty list — not “unavailable”">
        The page says memory &quot;is not a feature flag&quot; and that{" "}
        <code>isAvailable: false</code> is what an unentitled deployment looks
        like. On a runtime without Intelligence — which is how this
        integration&apos;s Quickstart builds it, and how this repo runs — the
        hook never asks. <code>CopilotKitCore</code> gives the memory store a
        context only when <code>/info</code> reports an Intelligence{" "}
        <code>wsUrl</code>; with none, no <code>/memories</code> request is sent,{" "}
        <code>isAvailable</code> keeps its initial <code>true</code>, and the
        page&apos;s <code>MemoryList</code> renders an empty list. The only
        signal is <code>error</code> after a save — &quot;Runtime URL is not
        configured&quot;, which is wrong: the runtime URL is configured, what
        is missing is Intelligence. The page&apos;s component never reads{" "}
        <code>error</code>.
      </Callout>

      <Callout tone="warn" title="…and with Intelligence, the routes are still off (not reproducible here)">
        Since runtime 1.71.0 every <code>/memories/*</code> route 404s at the
        runtime unless it is built with <code>memory: {"{ access }"}</code> (or
        the deprecated <code>exposeMemoryRoutes: true</code>). The page mentions
        neither. The demo&apos;s second runtime, <code>/api/copilotkit-memory</code>,
        is the main runtime plus that option — but it needs a key to be
        anything, and without one it answers 503 and the hook shows exactly
        what the first runtime shows. What sits behind the gate was observed in
        the Agno sibling repo, which has a key: the platform answers{" "}
        <code>403 MEMORY_NOT_ENTITLED</code>, the hook (which flips{" "}
        <code>isAvailable</code> only on 404/501) reports{" "}
        <code>isAvailable: true</code>, and the list again renders empty.
      </Callout>

      <Callout tone="warn" title="Smaller gaps">
        <code>realtimeStatus</code> stayed <code>connecting</code> on both
        runtimes and never reached the <code>unavailable</code> the page
        describes. The page shows reading and forgetting from React but never
        saving, though the hook has <code>addMemory</code>; saving is shown only
        over REST and MCP. The REST examples post to{" "}
        <code>https://your-deployment</code> without saying that managed users
        call <code>api.intelligence.copilotkit.ai</code>.
      </Callout>

      <Panel title="What the demo observed (react-core / runtime 1.71.0, no key)">
        <pre className="overflow-x-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
          {PROBE}
        </pre>
      </Panel>

      <Panel title="Source">
        <SourceCode file="frontend/src/app/intelligence/memories/memory-list.tsx" />
        <div className="mt-4">
          <SourceCode file="frontend/src/app/api/copilotkit-memory/[[...slug]]/route.ts" />
        </div>
        <div className="mt-4">
          <SourceCode file="frontend/src/app/intelligence/memories/demo-chat/page.tsx" />
        </div>
      </Panel>
    </>
  );
}
