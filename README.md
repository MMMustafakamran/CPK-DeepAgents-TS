# CopilotKit + Deep Agents TypeScript Test Suite

A navigable, working test harness for the CopilotKit ↔ Deep Agents (**TypeScript**) integration — one route per doc page, each running the real thing.

| | |
|---|---|
| **Doc-sync date** | 2026-09-03 — every page below was fetched live on this date |
| **Doc root tracked** | <https://docs.copilotkit.ai/deepagents> |
| **Language tab** | **TypeScript** throughout. The Python tabs are the sibling repo's job. |
| **Backend flavour** | LangGraph CLI (`langgraph.json`), the tab the TypeScript page tells you to pick |
| **CopilotKit (frontend)** | `@copilotkit/react-core` 1.69.3 · `@copilotkit/runtime` 1.69.3 |
| **CopilotKit (agent)** | `@copilotkit/sdk-js` 1.66.2 |
| **Agent framework** | `deepagents` 1.12.2 · `langchain` 1.5.5 · `@langchain/langgraph` 1.4.9 · `@langchain/langgraph-cli` 1.4.4 |
| **Frontend** | Next.js 16.3.0 · React 19.2.8 · TypeScript 5 · Tailwind 4 |
| **Agent server port** | **8124** (not the Quickstart's 8123 — see [§3](#3-architecture)) |
| **Recording pipeline** | `autorecorder/` + `ci/` — one narrated clip per doc page ([§10.5](#105-the-recording-pipeline)) |
| **CI** | `.github/workflows/daily-recorder.yml` — nightly at 05:27 UTC, 3 shards |

---

## 2. Overview

Deep Agents is LangChain's framework for long-horizon agents — `createDeepAgent` returns a compiled LangGraph graph with planning and virtual-filesystem tools already installed. CopilotKit connects one of those graphs to a React app over the AG-UI protocol, so the agent can render components, call browser-side tools, suspend for human input, and share state with your UI.

This repo implements every Deep Agents doc page in that list as a live route, built from each page's **TypeScript** tab. It is a QA tool, not a tutorial: each route shows what the page teaches actually running, alongside the repo's own source read off disk at render time, plus a plain statement of anywhere the page and the shipped packages disagree. Eleven doc pages, nine routes (three doc URLs are query-string variants of one page), **eleven graphs** — eight Deep Agents plus three hand-built `StateGraph`s. The four A2UI pages are deliberately out of scope for this repo.

There is a Python sibling repo covering the same pages from the Python tabs. Where the two languages genuinely diverge — and they do, in four places that matter — each route says so and the difference is recorded in [§9](#9-known-issues--docvsimplementation-discrepancies).

---

## 3. Architecture

```
browser
  └─ <CopilotKit runtimeUrl useSingleEndpoint={false}> frontend/src/components/providers.tsx
       └─ <CopilotChat agentId="…"> + hooks           frontend/src/app/**/demo-chat/page.tsx
            │  HTTP POST (single-route JSON envelope)
            ▼
       Next route handler (v2, catch-all)             frontend/src/app/api/copilotkit/[[...slug]]/route.ts
       CopilotRuntime { agents: { <graphId>: LangGraphAgent } }
            │  LangGraph Platform API
            ▼
       LangGraph JS dev server  :8124                 backend/langgraph.json
       ├─  8 graphs from createDeepAgent              backend/agent.ts, backend/src/*.ts
       └─  3 hand-built StateGraphs                   predictiveStateManual / predictiveStateTool
            │                                         / stateInputsOutputs
            ▼
       OpenAI
```

**Backend language: TypeScript/Node.** The Quickstart's TypeScript tab describes a `langgraph.json` manifest served by the LangGraph CLI, and a callout on that tab tells you to pick the **Deep Agent** runtime tab (not FastAPI). That is what this repo builds.

**Why port 8124.** The Quickstart says 8123 and so does the Python sibling. Both repos publish identical graph ids (`sample_agent`, `tool_rendering_agent`, …), so on a shared port whichever server bound first would silently answer for the other language — a nasty way to lose an afternoon. Everything else about the URL is the page's.

One runtime endpoint, `/api/copilotkit`, serving all eleven graphs — the Quickstart's snippet widened from a single `LangGraphAgent` to one per graph id. It is built on the **v2** runtime surface (`@copilotkit/runtime/v2`), mounted at `[[...slug]]/route.ts`, and exports GET/POST/PATCH/DELETE.

The catch-all path is required, not cosmetic: `createCopilotRuntimeHandler` serves a subtree (`/info`, agent runs, thread list/rename/delete), so a single-segment `route.ts` 404s everything except the bare URL. The provider passes `useSingleEndpoint={false}` for the same reason.

### CopilotKit Intelligence

The Quickstart's step 1 is now "create a free account", and the runtime it builds reads that key. This harness follows it:

| Env var | Where | Effect |
|---|---|---|
| `CPK_INTELLIGENCE_API_KEY` (was `INTELLIGENCE_API_KEY` before the docs renamed it on 2026-09-04; the old name is still read) | `frontend/.env.local` | Puts the runtime in Intelligence mode — `/info` reports `mode: "intelligence"` and threads persist on the platform. Unset, the runtime falls back to SSE with an `InMemoryAgentRunner`: chat works everywhere, thread list/inspect answer locally, mutations and realtime metadata stay off, nothing survives a restart. |
| `COPILOTKIT_LICENSE_TOKEN` | `frontend/.env.local` | A **separate** credential. `/info` reports `licenseStatus` from it, and `<CopilotThreadsDrawer>` renders its locked "Upgrade" view unless that status is `valid` or `expiring` — *regardless of whether threads actually work*. A runtime can serve threads perfectly and still show every drawer as locked. |
| `NEXT_PUBLIC_DEMO_USER_ID` / `_NAME` | `frontend/.env.local` | The identity `Providers` sends as `x-user-id` / `x-user-name`, which the runtime's `identifyUser` reads. Threads are per-user; change this and reload to watch the list diverge. |

Neither key is required to run the harness. `/quickstart` renders a **Live connection** panel that probes the agent server and `GET /api/copilotkit/info` during render and reports all three axes separately — mode, license status, and what the runtime says it can do with threads. That panel is the honest answer to "is Intelligence on": a key can be set and still unread, and SSE mode already reports `threadEndpoints.list: true` from its in-memory runner, so the flags alone read as a false positive.


---

## 4. Prerequisites

| Requirement | Version used | Notes |
|---|---|---|
| Node.js | 24.16.0 (20+ per the Quickstart) | |
| npm | 12.0.1 | or pnpm/yarn/bun |
| OpenAI API key | — | **Required.** Every agent uses it. |
| LangSmith / LangGraph Platform key | — | **Not** required locally. Only for a Platform deployment. |

No Python and no global CLI: `@langchain/langgraph-cli` is a dev dependency of `backend/`.

---

## 5. Setup

```bash
# 1. Clone
git clone <this-repo> deepagents-ts && cd deepagents-ts

# 2. Backend deps
cd backend && npm install && cd ..

# 3. Frontend deps
cd frontend && npm install && cd ..
```

> **`npm install` in `backend/` will fail if you follow the doc's dependency list literally.** See [§9 item 1](#9-known-issues--docvsimplementation-discrepancies) — `deepagents` wants zod v4 and `@copilotkit/sdk-js` peer-requires v3. This repo's `package.json` already pins the combination that resolves; just run `npm install`.

**4. Environment.** There are two processes, so two files:

```bash
cp .env.example backend/.env        # then keep the backend block
cp .env.example frontend/.env.local # then keep the frontend block
```

| Variable | Goes in | Required | What it does |
|---|---|---|---|
| `OPENAI_API_KEY` | `backend/.env` | **yes** | The model key. Every agent reads it. |
| `OPENAI_MODEL` | `backend/.env` | no | Model id for every agent. Defaults to `gpt-4o`. |
| `LANGGRAPH_DEPLOYMENT_URL` | `frontend/.env.local` | no | Where the runtime route forwards runs. Defaults to `http://localhost:8124`. |
| `LANGSMITH_API_KEY` | `frontend/.env.local` | no | Sent as `langsmithApiKey`. Ignored by a local dev server. |
| `CPK_INTELLIGENCE_API_KEY` (old name `INTELLIGENCE_API_KEY` still read) | `frontend/.env.local` | no | Puts the runtime in Intelligence mode so threads persist. Without it: SSE + in-memory runner. |
| `COPILOTKIT_LICENSE_TOKEN` | `frontend/.env.local` | no | Separate credential. What `<CopilotThreadsDrawer>` gates its unlocked view on. |
| `NEXT_PUBLIC_DEMO_USER_ID` / `_NAME` | `frontend/.env.local` | no | The demo identity `identifyUser` keys threads on. |
| `COPILOTKIT_TELEMETRY_DISABLED` | `frontend/.env.local` | no | Silences the runtime's telemetry notice. |

**Ports:** frontend `3000`, agent server `8124`. Change the agent port and you must change `LANGGRAPH_DEPLOYMENT_URL` to match.

---

## 6. Running the project

Two terminals — the CLI does not start both.

**Terminal 1 — the agent server:**

```bash
cd backend && npx @langchain/langgraph-cli dev --port 8124 --no-browser
```

Success looks like this:

```
          Welcome to
╦  ┌─┐┌┐┌┌─┐╔═╗┬─┐┌─┐┌─┐┬ ┬
║  ├─┤││││ ┬║ ╦├┬┘├─┤├─┘├─┤
╩═╝┴ ┴┘└┘└─┘╚═╝┴└─┴ ┴┴  ┴ ┴

- 🚀 API: http://localhost:8124
- 🎨 Studio UI: https://smith.langchain.com/studio/?baseUrl=http://localhost:8124
```

Confirm with `curl http://localhost:8124/ok` → `{"ok":true}`, and that all eleven graphs registered:

```bash
curl -s -X POST http://localhost:8124/assistants/search \
  -H 'content-type: application/json' -d '{"limit":50}' | jq -r '.[].graph_id' | sort
```

**Terminal 2 — the app:**

```bash
cd frontend && npm run dev
```

You should see `✓ Ready in …` and `- Local: http://localhost:3000`.

**Open <http://localhost:3000>.** Start at `/quickstart` — if that streams a reply, every other route's plumbing is fine.

---

## 7. What to expect — walkthrough per section

Every route has a notes page (source, discrepancies, a **Try it** box) and, where there is something to drive, a chrome-free demo at `<route>/demo-chat`.

### Getting Started

**`/`** — Introduction. Orientation and the live graph roster. Nothing to drive.

**`/quickstart`** → `sample_agent`
Proves the whole stack in one message: a Deep Agent with a single `tool()` call, published by the LangGraph server, reached through `CopilotRuntime`, driven by a `CopilotSidebar`.
*Try:* `What's the weather in Lisbon?`
*Pass:* tokens stream a word at a time; a collapsed `Called get_weather` row appears; the reply says Lisbon is sunny.
*Fail:* an error banner or no reply — the agent server is down, or `OPENAI_API_KEY` is missing from `backend/.env`.

### Basics

**`/prebuilt-components/copilot-threads-drawer`** → `sample_agent`
The drop-in conversation sidebar. A `CopilotThreadsDrawer` and a `CopilotChat` inside one `CopilotChatConfigurationProvider` — the shared configuration holds the active thread, so selecting a row connects the chat and replays its history with no `threadId` state of your own.
*Try:* send a message, then press **New Conversation** and send another.
*Pass:* two rows in the drawer; clicking between them swaps the transcript.
*Fail:* a locked "Threads are a CopilotKit Intelligence feature" panel — that is `licenseStatus`, not a bug. See the Quickstart's Live connection panel.

### Rich Threads

**`/headless-threads`** → `sample_agent`
The same thread data through `useThreads`, with a hand-built list — including **rename**, which the prebuilt drawer omits. The selected id is ordinary React state passed to `<CopilotChat threadId={...}>`.
*Try:* send a message, then Rename / Archive / Delete the row.
*Pass:* the row's label changes, the archived tag appears, the row disappears.
*Fail:* mutations no-op — in SSE mode `/info` reports `mutations: false`, so those endpoints do not exist.

**`/threads-lifecycle`** → `sample_agent`
Where a `threadId` comes from, and how switching differs from starting fresh. `setActiveThreadId(id, { explicit: true })` replays history; `{ explicit: false }` sets the same id and shows the welcome screen; `startNewThread()` mints a new one.
*Try:* watch the `threadId` readout while pressing **New chat**, then **Open conversation**.
*Pass:* the id changes on New chat, and `explicit` flips to `true` when you open a known conversation.
*Fail:* the setters log a warning and no-op — that happens when the `threadId` is prop-controlled, which this demo deliberately avoids.

### Generative UI

**`/generative-ui/tool-rendering`** → `tool_rendering_agent`
`useRenderTool` claims a backend tool by name and replaces its chat bubble; `useDefaultRenderTool` catches the rest.
*Try:* `What's the weather in Tokyo?` then `Write a short plan for a two-day trip to Tokyo`
*Pass:* the first draws a grey `Called the weather API for Tokyo.` line; the second makes the agent use its own planning tools, which fall through to the catch-all as `✓ write_todos` rows.
*Fail:* a default tool bubble instead of the grey line — the name in `useRenderTool` no longer matches the backend `tool()`.

**`/generative-ui/state-rendering`** → `state_rendering_agent`
`copilotkitEmitState` pushes state mid-node so a slow task reports progress; `useAgent` renders it outside the chat.
*Try:* `Research why the sky is blue`
*Pass:* three rows appear at once, all ⏳, then flip to ✅ one per second, and stay after the reply. Verified on the wire: four distinct `searches` states arrive in order.
*Fail:* rows that appear then vanish — the emitted state was never returned by the node.

**`/generative-ui/your-components/interrupt-based`** → `interrupt_agent`, `interrupt_multi_agent` ⚠️
LangGraph `interrupt()` in a `createMiddleware` `beforeModel` hook, answered by `useInterrupt`. Two tabs: one interrupt, and two dispatched by `type` via `enabled`. Both are the page's code **as printed** — the second one does not work, and demonstrating that is the point.
*Try:* send `Hello`.
*Pass:* on **One interrupt**, the first message is answered with a name form rather than a reply; submit a name and the run resumes using it. That half of the page is correct.
*Expected failure:* on **Two, dispatched by type**, no card appears at all — the `enabled` predicates throw on `eventValue`, so neither handler claims the event.
*Real failure:* the *first* tab not working — check the agent server is up.

### App Control

**`/frontend-tools`** → `frontend_tools_agent`
A tool whose body runs in the browser. The backend defines no tool at all.
*Try:* `Say hello to Ada`
*Pass:* a browser `alert()` reading `Hello, Ada!`; dismiss it and a green line appears in the left panel; the agent then reports it said hello.
*Fail:* the agent describing what it *would* do — check `copilotkitMiddleware` is in the middleware array.

### Shared State

**`/shared-state/in-app-agent-read`** → `shared_state_agent`
Reading agent state as ordinary reactive React state.
*Try:* `Hello`
*Pass:* after the first message the left panel reads `Language: english` and the JSON dump shows a `language` key.
*Fail:* a dump with everything except `language` — the field lost its `zodState` wrapper.

**`/shared-state/in-app-agent-write`** → `shared_state_agent` ⚠️
`agent.setState` from the app, plus `agent.runAgent` to re-run immediately.
*Try:* `Tell me a fun fact about octopuses`, hit **Toggle Language**, ask again.
*Pass:* the panel and JSON dump flip to `spanish` and the value survives the round trip — the write works.
*Known limit:* **the reply stays in English.** The model never sees the value, and `exposeState` cannot reach it. Measured; see [§9 item 2](#9-known-issues--docvsimplementation-discrepancies).

**`/shared-state/predictive-state-updates`** → `predictive_state_agent`, `predictive_manual_graph`, `predictive_tool_graph`
**All three of the page's variants are live here**, behind a toggle — the sharpest advantage this repo has over the Python sibling, whose tabs only sketch the custom graphs.
*Try:* `Plan and execute a website redesign` on each tab.
*Pass:* **Prebuilt** — step rows appear one at a time *before* the chat message completes. **Custom · manual** — exactly four fixed rows, one per second, then an ordinary answer (verified: four distinct states in order). **Custom · tool** — steps stream as the model writes the tool call, then a `ToolNode` runs it and the graph loops back.
*Fail:* nothing at all — the provider is `<CopilotKitProvider>` rather than `<CopilotKit>`; see [§9 item 5](#9-known-issues--docvsimplementation-discrepancies).

**`/shared-state/state-inputs-outputs`** — 📄 reference only, no demo.
A hand-built `StateGraph` with `input` / `output` schemas: `question` in and not back, `answer` back, `resources` never on the wire. The graph is written and compiles, and `invoke()` filters exactly as documented — but the **JS dev server** serialises the raw checkpoint and ignores `output`, so a live surface could only ever show the split failing. The route explains the mechanism and shows the measurement instead. See [§9 item 3](#9-known-issues--docvsimplementation-discrepancies).

**`/shared-state/workflow-execution`** — 📄 reference only, no demo. The page currently serves the Input/Output Schemas content verbatim, so it has no content of its own to implement.

---

## 8. Testing checklist / current status

Verified 2026-08-06 by driving every graph through the real `CopilotRuntime` route against a live `langgraph-cli dev` and an OpenAI key. All thirteen run without a `RUN_ERROR`; the ⚠️ rows are behavioural limitations, all measured.

| Doc page | Route | Graph | Status | Notes |
|---|---|---|---|---|
| [quickstart](https://docs.copilotkit.ai/deepagents/quickstart) | `/quickstart` | `sample_agent` | ✅ Working | TypeScript tab + Deep Agent runtime tab |
| [prebuilt-components/copilot-threads-drawer](https://docs.copilotkit.ai/deepagents/prebuilt-components/copilot-threads-drawer) | `/prebuilt-components/copilot-threads-drawer` | `sample_agent` | ✅ Working | Needs Intelligence mode; the unlocked view needs a license token |
| [headless-threads](https://docs.copilotkit.ai/deepagents/headless-threads) | `/headless-threads` | `sample_agent` | ✅ Working | Rename/archive/delete need `mutations: true`, i.e. Intelligence mode |
| [threads-lifecycle](https://docs.copilotkit.ai/deepagents/threads-lifecycle) | `/threads-lifecycle` | `sample_agent` | ✅ Working | Switch/start are live regardless; replay needs a server-side store |
| [generative-ui/tool-rendering](https://docs.copilotkit.ai/deepagents/generative-ui/tool-rendering) | `/generative-ui/tool-rendering` | `tool_rendering_agent` | ✅ Working | `useDefaultRenderTool` destructures a prop that doesn't exist |
| [generative-ui/state-rendering](https://docs.copilotkit.ai/deepagents/generative-ui/state-rendering) | `/generative-ui/state-rendering` | `state_rendering_agent` | ✅ Working | Emit loop's caller is not shown by the page |
| [.../your-components/interrupt-based](https://docs.copilotkit.ai/deepagents/generative-ui/your-components/interrupt-based) | `/generative-ui/your-components/interrupt-based` | `interrupt_agent`, `interrupt_multi_agent` | ⚠️ Partial | Single tab works; conditional tab left as printed and does not; the new state-note section is reproduced and does not build its note (item 2) |
| [frontend-tools](https://docs.copilotkit.ai/deepagents/frontend-tools) | `/frontend-tools` | `frontend_tools_agent` | ✅ Working | Page's TS is a comment; state field missing `zodState` |
| [shared-state/in-app-agent-read](https://docs.copilotkit.ai/deepagents/shared-state/in-app-agent-read) | `/shared-state/in-app-agent-read` | `shared_state_agent` | ✅ Working | `zodState` default really applies in TS (unlike Python) |
| [shared-state/in-app-agent-write](https://docs.copilotkit.ai/deepagents/shared-state/in-app-agent-write) | `/shared-state/in-app-agent-write` | `shared_state_agent` | ⚠️ Partial | Write round-trips; model never sees it; `exposeState` can't reach it |
| [...?agent-type=prebuilt](https://docs.copilotkit.ai/deepagents/shared-state/predictive-state-updates?agent-type=prebuilt) | `/shared-state/predictive-state-updates` | `predictive_state_agent` | ✅ Working | `stateStreamingMiddleware` + `stateItem` |
| [...&state-emission=manual-emission](https://docs.copilotkit.ai/deepagents/shared-state/predictive-state-updates?agent-type=custom-graph&state-emission=manual-emission) | same route, tab 2 | `predictive_manual_graph` | ✅ Working | **Live** — the TS tab prints the whole graph |
| [...&state-emission=tool-emission](https://docs.copilotkit.ai/deepagents/shared-state/predictive-state-updates?agent-type=custom-graph&state-emission=tool-emission) | same route, tab 3 | `predictive_tool_graph` | ✅ Working | **Live** — ditto; `shouldContinue as any` replaced |
| [shared-state/state-inputs-outputs](https://docs.copilotkit.ai/deepagents/shared-state/state-inputs-outputs) | `/shared-state/state-inputs-outputs` | — | 📄 Reference | Graph filters correctly; JS dev server ignores `output`, so nothing to show live |
| [shared-state/workflow-execution](https://docs.copilotkit.ai/deepagents/shared-state/workflow-execution) | `/shared-state/workflow-execution` | — | 📄 Reference | Upstream duplicate of the page above; nothing of its own to implement |

**Totals:** 11 ✅ Working · 2 ⚠️ Partial · 2 📄 Reference (Input/Output Schemas, Workflow Execution) · 0 ❌ Broken.

The same table is rendered in-app at `/status`, generated from `frontend/src/lib/nav-config.ts` — that file is the single source of truth for routes, statuses and doc links, so this table and the app cannot drift apart.

---

## 9. Known issues / doc-vs-implementation discrepancies

Every item was checked against the installed packages; the behavioural ones were reproduced against a live run.

### TypeScript-specific — these do not affect the Python sibling

**1. The Quickstart's dependency list does not install.**
[quickstart](https://docs.copilotkit.ai/deepagents/quickstart) says `npm install deepagents @langchain/langgraph @copilotkit/sdk-js @langchain/openai`. That fails with `ERESOLVE`: `deepagents@1.12.2` depends on `zod ^4.3.6`, while `@copilotkit/sdk-js@1.66.2` peer-requires `zod ^3.23.3 || ^3.24.0 || ^3.25.0` — v3 only. Fix used here: pin `zod@^3.25.76` at the root, which satisfies the peer range and lets npm give `deepagents` its own nested v4. The page also never mentions `langchain`, which its own snippets import `tool` and `createMiddleware` from.

**2. `exposeState` cannot see any user state field.**
The intended remedy for "the model doesn't see my state" — `createCopilotkitMiddleware({ exposeState })` — appends a "Current agent state:" note to the system prompt, built from `request.state` inside the CopilotKit middleware's own `wrapModelCall`. **That object is scoped to the declaring middleware's `stateSchema`**, so it contains only `messages` and `copilotkit`. Your `language` field lives on *your* middleware and is invisible to it. Verified with a spy middleware: the note is never appended, with `exposeState: ["language"]` *and* with `exposeState: true`. Since every user field is declared on a user middleware, `exposeState` has nothing it can reach. The Python `CopilotKitMiddleware(expose_state=[...])` reads whole graph state and works — same feature, opposite outcome.
The 2026-09-03 doc sync spread this further: [interrupt-based](https://docs.copilotkit.ai/deepagents/generative-ui/your-components/interrupt-based) gained a "Make your agent aware of interruptions" section built on `createCopilotkitMiddleware({ exposeState: ["agentName"] })`, with a system prompt that tells the model *Current agent state contains agentName*. `agentName` is declared on `agentNameMiddleware`, so the note is never built and the prompt describes something absent. Re-measured there with a fake model capturing the request: unchanged with the middleware first, last, and with `exposeState: true`; a probe middleware declaring `agentName` itself reads it at the same point, which pins it to schema scoping rather than ordering.
→ `/shared-state/in-app-agent-write` is ⚠️ Partial as a result, and the interrupt route now carries the same caveat.

**3. The JS dev server ignores `output` schemas.**
`StateGraph({ state, input, output })` filters correctly when called directly:
```
await graph.invoke({...})            -> [ 'answer', 'messages' ]                        ✅
```
Through the dev server — with or without CopilotKit in the path — it does not:
```
POST /threads/{id}/runs/wait          -> [ 'answer', 'messages', 'question', 'resources' ]  ❌
GET  /threads/{id}/state              -> [ 'answer', 'messages', 'question', 'resources' ]  ❌
```
So the server serialises the raw checkpoint, and AG-UI's `STATE_SNAPSHOT` inherits every field. The Python server does filter: the same route there yields exactly `["messages", "copilotkit", "answer"]`.
→ `/shared-state/state-inputs-outputs` is 📄 reference-only as a result: the graph is real, but there is nothing it can demonstrate live.

**4. `zodState` is mandatory and two pages omit it.**
Its docstring explains why: without it a Zod field carries no JSON-schema hook, LangGraph drops it from the graph's `output_schema`, and AG-UI filters it out of every `STATE_SNAPSHOT` — so `useAgent().state.x` stays `undefined` even though the thread state has the value. Both shared-state pages use it correctly, and the 2026-09-03 doc sync fixed [interrupt-based](https://docs.copilotkit.ai/deepagents/generative-ui/your-components/interrupt-based), which now wraps `agentName` and `approval` — this repo follows. [frontend-tools](https://docs.copilotkit.ai/deepagents/frontend-tools) still declares `yourAdditionalProperty` bare. That route does not read the field in the browser so nothing breaks — but copy it as a template for a field you *do* want to read and it silently never arrives.

### Shared with the Python sibling

**5. Predictions need `<CopilotKit>`, not `<CopilotKitProvider>`.**
Not stated on any page, and the worst failure mode here because it is completely silent. The backend emits a `PredictState` custom event; the *browser* applies it by watching `TOOL_CALL_ARGS` and calling `agent.setState`. Nothing appears in any `STATE_SNAPSHOT`. That subscriber lives in `CopilotListeners`, which `<CopilotKit>` mounts and `<CopilotKitProvider>` does not. With the bare provider the event arrives, nobody listens, the panel stays empty, and no error is logged.

**6. `enabled` has no `eventValue`, and `event.value` is a string.**
[interrupt-based](https://docs.copilotkit.ai/deepagents/generative-ui/your-components/interrupt-based)'s "Condition UI executions" section writes `enabled: ({ eventValue }) => …`. The parameter is typed `InterruptEvent<TValue>` — `{ name, value }` — so this is a hard `TS2339` compile error in TypeScript (the Python repo only finds it at runtime). Separately, a LangGraph `interrupt()` reaches the browser as the legacy `on_interrupt` custom event with its value **serialised**, so `event.value.type` is `undefined` on a string. **Both are left in the demo unedited**, with a `@ts-expect-error` on each `enabled` line so the repo still builds — and those annotations are the evidence rather than a patch, since an unused one is itself an error (`TS2578`). The page's *first* section is fine.

**7. `useDefaultRenderTool` render props have no `args`.**
[tool-rendering](https://docs.copilotkit.ai/deepagents/generative-ui/tool-rendering) destructures `{ name, args, status, result }`. The prop is `parameters` — as it is in the page's own `useRenderTool` snippet directly above. Reading `args` returns `undefined`, silently.

**8. `useRenderToolCall` is not the hook the prose means.**
Named three times as the counterpart to `useDefaultRenderTool`. It is a real export but a different hook — no arguments, returns a function that renders a given tool call from renderers already registered. The one meant is `useRenderTool`.

**9. `state-rendering` never calls its own emit loop.**
It prints `chatNode` and stops, saying only that it belongs "inside a custom graph node function". A `tool()` is the one place a prebuilt Deep Agent gets a `RunnableConfig`, so that is where it went. Two further unmentioned things: emitted state is a *prediction* and is overwritten when the node returns, and a tool returning a `Command` must include its own `ToolMessage`.

**10. `workflow-execution` serves the wrong page.**
It returns [state-inputs-outputs](https://docs.copilotkit.ai/deepagents/shared-state/state-inputs-outputs) byte for byte — same subtitle, prose, code. Only the `h1` differs, and even the subtitle describes the *other* page's topic. Marked 📄 reference rather than guessed at — there is no Workflow Execution content to implement until the page serves its own.

**11. The Quickstart installs a frontend package it never uses.**
`npm install @copilotkit/react-ui @copilotkit/react-core @copilotkit/runtime`, but every import it then writes is from `@copilotkit/react-core/v2`. `@copilotkit/react-ui` is the v1 UI package; not installed here.

**12. Model ids vary across pages.**
`openai:gpt-4o`, `gpt-5.4`, `gpt-4o-mini` all appear. Every agent here reads `OPENAI_MODEL`, defaulting to `gpt-4o`.

### Where the TypeScript tabs are *better* than the Python ones

Worth recording, since it is the reason this repo covers more than its sibling:

- **Both custom-graph variants of Predictive State Updates are printed in full** — annotation, node, wiring, `compile`. The 2026-09-03 doc sync closed half this gap: the tool-emission Python tab gained its own `StateGraph`, `ToolNode` and `compile`. The manual tab still shows a bare node returning to an undefined `cpk_action_node`, so that is now the one variant the Python repo can only quote.
- **Variant 1's `createDeepAgent` actually lists its state middleware.** The Python tab defines `AgentState` and never references it, so the key does not exist.
- **Variant 3 wraps frontend actions in `convertActionsToDynamicStructuredTools`** before `bindTools`. The Python tab passes `state["copilotkit"]["actions"]` straight in, and nothing in the Python package does that conversion.
- **`createMiddleware` carries schema and hook together** on the interrupt-based page, where Python needs a separate `AgentState`, an `AgentMiddleware` subclass and an explicit `state_schema` to tie them. The 2026-09-03 doc sync made the Python tab print all three (it used to print two of them), so both tabs are now complete — TypeScript just says it in fewer moving parts.
- **`zodState(z.enum([...]).default("english"))` really applies at runtime.** The Python `Literal[...] = "english"` on a `TypedDict` is a class attribute LangGraph never applies, so the Python repo has to seed the key by hand.

Two of the page's TypeScript snippets do not typecheck, and both are left as printed with a `@ts-expect-error` above them rather than edited — the annotation is the evidence, since an unused one is itself an error (`TS2578`):

- `Annotation<string[]>({ default: () => [] })` in the manual-emission variant. `TS2345`: the config requires a `value` reducer alongside `default`. **Runtime is unaffected** — LangGraph falls back to last-write-wins, and the four steps stream correctly. Type-only defect.
- `enabled: ({ eventValue }) => …` on the interrupt-based page (item 6 above). That one *does* break at runtime.

One genuine edit: `shouldContinue as any` in the tool-emission variant is replaced with a typed destination list on `addConditionalEdges`, which is the same thing expressed without the cast.

---

## 10. Troubleshooting

The Deep Agents doc tree has **no** Troubleshooting section as of 2026-08-06. What follows is this repo's own symptom list, from actually running it.

| Symptom | Cause | Fix |
|---|---|---|
| `npm install` in `backend/` fails with `ERESOLVE` / zod | `deepagents` wants zod v4, `@copilotkit/sdk-js` peers on v3. | Keep the pinned `zod@^3.25.76` in `package.json` — §9 item 1. |
| `Failed to create thread: HTTP 422: Invalid thread ID: must be a UUID` | Something posted a non-UUID `threadId`. | Use `crypto.randomUUID()`. |
| Chat shows an error banner; agent log is silent | The runtime cannot reach `:8124`. | Is the dev server running? `curl http://localhost:8124/ok`. Check `LANGGRAPH_DEPLOYMENT_URL`. |
| Agent runs but every reply is an auth error | `OPENAI_API_KEY` missing. | It goes in **`backend/.env`**, not `frontend/.env.local`. |
| A route 500s with "Agent … not found" | Graph id mismatch. | `frontend/src/lib/agents.ts` must list the same ids as `backend/langgraph.json`. |
| Wrong language's agent answers | Both repos on one port. | This repo is 8124, the Python sibling 8123. Don't cross them. |
| Predictive State Updates panel never fills | Root provider is `<CopilotKitProvider>`. | Use `<CopilotKit>` — §9 item 5. Fails silently. |
| A custom state field never reaches `useAgent().state` | Missing `zodState` wrapper. | Wrap it — §9 item 4. |
| Shared-state toggle flips but the agent ignores it | Known limitation. | Not fixable from userland — §9 item 2. |
| Input/Output Schemas shows `question`/`resources` present | Known limitation. | The graph is right; the JS server leaks — §9 item 3. |
| `Expected ... ToolMessage` / unanswered tool call | A tool returned a `Command` without one. | Include a `ToolMessage` with the injected `tool_call_id` — see `stateRendering.ts`. |
| Unexpected `✓ write_todos` / `✓ ls` rows in chat | Not a bug — `createDeepAgent` installs planning and filesystem tools. | — |
| Graph edits don't take effect | The CLI watches files but a syntax error aborts the reload. | Check the server log. |

---

## Doc drift detection

`/doc-sync` keeps this repo honest about the docs it mirrors. Press **Sync docs now** (on the landing page or on `/doc-sync`) and it fetches the markdown source behind all 11 tracked doc pages, diffs each against the copy stored in `doc-snapshot/`, replaces that copy, and reports what moved — ranked by whether the change can actually break an implementation.

Doc pages are fetched by appending `.md` to their URL, which returns the authored MDX rather than 250 KB of rendered HTML. Every response is checked for `text/markdown` before it is allowed near the snapshot: a URL that misses the markdown handler still answers `200` with the HTML app shell, and writing that in would destroy the baseline and report the whole corpus as rewritten on the next run. A run commits all pages or none.

**Severity is decided by where the edit landed**, not how big it was:

| Level | Trigger |
|---|---|
| **High** | a changed line inside a fenced code block, a changed fence count, or a page that now 404s and is gone from the sitemap |
| **Medium** | a changed heading, changed frontmatter `title`/`description`, or prose in the same section as changed code |
| **Low** | other prose |

**Sections checked** lists every tracked page in nav order with a mark — `✓` unchanged, `!` changed, `+` stored, `✗` 404, `~` unstable, `·` not checked. Expanding a row shows the comparison: for a changed page the diff (`−` existing snapshot, `+` newly fetched), and for an unchanged one the two matching hashes, which is the evidence the check ran.

**`doc-snapshot/CHANGELOG.md`** is the record that survives a re-sync. Because syncing replaces the copy it just compared against, the run *after* a change reports nothing — so the changelog is written at the moment of discovery and never rewritten later. Only changed pages are recorded; a clean run does not touch the file. It keeps the three most recent dated entries, counted rather than aged, so a change from six weeks ago still shows if nothing has happened since.

**One sync date.** `syncedAt` in `doc-snapshot/manifest.json`, rewritten on every run and shown on `/`, `/status` and `/doc-sync`. There is no hand-maintained date to keep in step with it.

**To test it**, edit any `doc-snapshot/pages/*.md` file and press the button — a line inside a code fence for High, a `##` heading for Medium, a sentence for Low. The comparison reads the stored file itself, so nothing else needs changing. Both `/doc-sync` and the changelog label the result as a local snapshot edit rather than upstream drift.

Commit `doc-snapshot/` — `pages/`, `manifest.json` and `CHANGELOG.md` are the baseline every diff is taken against. `reports/` is gitignored derived data.

---

## 10.5. The recording pipeline

The harness proves the docs run. The pipeline proves it *repeatedly*, and turns
each run into something watchable: one clip per doc page, showing the doc, then
the code in a simulated IDE, then that code working (or not) in the live route.
`PROJECT_GOAL.md` states what a run is for; this is how to drive one.

```bash
npm run automate            # everything: drift → preflight → deps → servers → record → report
npm run automate:issues     # only the pages carrying a known defect
npm run record -- --quickstart      # one page, against servers you already have up
npm run record:list                 # every page id, its doc URL and its demo URL
npm run record:doctor               # static check of the recorder's config
npm run record:doctor:online        # the same, plus every route, doc URL and selector, live
npm run drift                       # doc drift, headless
npm run report                      # rebuild DOCUMENTED_REPORT.md from the last run
```

`npm run record:doctor` is the definition of done for any change under
`autorecorder/`: it exits 0, or the change is not finished.

**Fourteen takes, eleven doc pages.** Three pages carry more than one take
because they carry more than one variant behind a tab strip — the two interrupt
tabs, and the three predictive-state variants. Two tracked doc pages have no
take at all: `state-inputs-outputs` and `workflow-execution` are reference-only
routes with no `/demo-chat` surface, so there is nothing to drive. That is a
known gap, listed in `PROJECT_GOAL.md`.

**`[ISSUE]` is not `[FAIL]`.** A page with a `knownIssue` in
`autorecorder/config/pages.config.ts` is *expected* to misbehave: the take
records the misbehaviour, types the finding into an on-screen Notepad, reports
`[ISSUE]` and exits 0. Two pages are on that list here — the conditional
interrupt tab and Writing agent state, both in [§9](#9-known-issues--docvsimplementation-discrepancies).
A route that 404s or a demo that renders no chat is still a `[FAIL]`: those are
breaks in this repo rather than in the thing under test.

**Ports.** The pipeline starts the agent server on **8124** and Next on 3000,
and refuses to start a second server on a port already served. Change the agent
port and three files move together: `ci/lib/config.mjs`,
`autorecorder/config/project.config.ts`, and `LANGGRAPH_DEPLOYMENT_URL` in
`frontend/.env.local`.

**Videos are not committed.** They are build output — reproducible from this
repo plus `npm run record` — and a few re-records of fourteen clips would put
hundreds of megabytes into `.git`. Publish them as release assets instead.

**Narration is parked.** `autorecorder/audio/` pairs an `.m4a` to a clip by
filename. Every track this repo inherited was recorded against the Python
sibling's findings, three of which do not hold here, so all of them sit in
`audio/on-hold/` where nothing scans them. Re-record before promoting one.

---

## 11. Project structure

```
deepagents-ts/
├── CLAUDE.md
├── README.md
├── PROJECT_GOAL.md                   what a run is for, and what "done" means
├── package.json                      workspace scripts (automate / record / drift / report)
├── .env.example                      both env blocks, annotated
├── .gitignore
│
├── .github/workflows/
│   ├── daily-recorder.yml            nightly drift gate → 3 recording shards → report
│   └── doc-sync.yml                  scheduled snapshot refresh
│
├── ci/                               the pipeline: drift → preflight → deps → servers → record → report
│   ├── automate.mjs                  the one entry point (`npm run automate`)
│   ├── build-report.mjs              DOCUMENTED_REPORT.md
│   ├── check-doc-drift.mjs           headless version of the /doc-sync button
│   ├── write-versions.mjs            frontend/VERSIONS.md, resolved after install
│   └── lib/                          ports, env loading, page groups, muxing, report
│
├── autorecorder/                     per-page screen capture (doc → code → live feature)
│   ├── ADAPT.md                      read before touching anything in here
│   ├── config/                       ← the whole adaptation surface: project, pages, selectors
│   ├── actions/                      what to do on a page that needs more than a prompt
│   ├── core/                         frozen: engine, IDE simulator, cursor, doctor
│   └── audio/on-hold/                narration, parked — see audio/README.md
│
├── backend/                          TypeScript — the agents
│   ├── package.json                  deps + @langchain/langgraph-cli; zod pinned to v3
│   ├── tsconfig.json
│   ├── langgraph.json                11 graph ids → module:export
│   ├── agent.ts                      sample_agent (the Quickstart, verbatim)
│   └── src/
│       ├── shared.ts                 MODEL / OPENAI_MODEL, read by every agent
│       ├── toolRendering.ts          tool_rendering_agent
│       ├── stateRendering.ts         state_rendering_agent
│       ├── interruptBased.ts         interrupt_agent + interrupt_multi_agent
│       ├── frontendTools.ts          frontend_tools_agent
│       ├── sharedState.ts            shared_state_agent (read + write routes)
│       ├── predictiveState.ts        predictive_state_agent      (prebuilt)
│       ├── predictiveStateManual.ts  predictive_manual_graph     ← StateGraph
│       ├── predictiveStateTool.ts    predictive_tool_graph       ← StateGraph
│       └── stateInputsOutputs.ts     state_io_graph              ← StateGraph
│
└── frontend/                         Next.js App Router
    └── src/
        ├── lib/
        │   ├── nav-config.ts         ← single source of truth: routes, statuses, doc links
        │   ├── agents.ts             graph ids, deployment URL (:8124)
        │   └── source.ts             reads repo files at render time
        ├── components/               harness chrome
        └── app/
            ├── layout.tsx            providers + chrome
            ├── page.tsx              Introduction
            ├── status/               the QA table
            ├── api/copilotkit/[[...slug]]/route.ts   v2 runtime, all 11 graphs
            └── <doc-path>/
                ├── page.tsx          notes, source, discrepancies, Try it
                └── demo-chat/page.tsx   the chrome-free live surface
```

Every route's `page.tsx` renders its source with `<SourceCode file="…">`, which reads the file off disk on the server at render time. What a route shows is therefore always what actually runs.

---

## 12. References

Grouped the way the doc nav groups them. Every link below was read in its **TypeScript** tab.

**Getting Started**
- [Introduction](https://docs.copilotkit.ai/deepagents)
- [Quickstart](https://docs.copilotkit.ai/deepagents/quickstart)

**Generative UI**
- [Tool Rendering](https://docs.copilotkit.ai/deepagents/generative-ui/tool-rendering)
- [State Rendering](https://docs.copilotkit.ai/deepagents/generative-ui/state-rendering)
- [Your Components · Interrupt-based](https://docs.copilotkit.ai/deepagents/generative-ui/your-components/interrupt-based)

**App Control**
- [Frontend Tools](https://docs.copilotkit.ai/deepagents/frontend-tools)

**Shared State**
- [Reading agent state](https://docs.copilotkit.ai/deepagents/shared-state/in-app-agent-read)
- [Writing agent state](https://docs.copilotkit.ai/deepagents/shared-state/in-app-agent-write)
- [Predictive State Updates — prebuilt](https://docs.copilotkit.ai/deepagents/shared-state/predictive-state-updates?agent-type=prebuilt)
- [Predictive State Updates — custom graph, manual emission](https://docs.copilotkit.ai/deepagents/shared-state/predictive-state-updates?agent-type=custom-graph&state-emission=manual-emission)
- [Predictive State Updates — custom graph, tool emission](https://docs.copilotkit.ai/deepagents/shared-state/predictive-state-updates?agent-type=custom-graph&state-emission=tool-emission)
- [Input/Output Schemas](https://docs.copilotkit.ai/deepagents/shared-state/state-inputs-outputs) *(no TypeScript tab)*
- [Workflow Execution](https://docs.copilotkit.ai/deepagents/shared-state/workflow-execution)

**Not covered by this repo.** The Deep Agents sidebar also lists Human in the Loop, and an Intelligence Platform group (Rich Threads, Headless Threads, Thread & History Lifecycle, Synchronize Thread History, and four premium pages). Those were outside the scope requested for this build.
