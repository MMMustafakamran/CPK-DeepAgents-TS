/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ADAPT THIS FILE — 3 of 3
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * One entry per doc page, in the order the doc nav lists them.
 *
 * Entries are deliberately short. `docUrl`, `demoUrl` and the output filename
 * are derived from `project.config.ts` plus the fields below, so no entry can
 * point at the wrong framework's docs and filenames stay in nav order without
 * anyone numbering them by hand.
 *
 * ── This repo's slice of the nav ───────────────────────────────────────────
 * Every page here was read in its **TypeScript** tab; the Python tabs are the
 * sibling repo's job. Two tracked doc pages are missing on purpose:
 * `shared-state/state-inputs-outputs` and `shared-state/workflow-execution`.
 * Both are reference-only routes in `frontend/src/lib/nav-config.ts` — the
 * first is a Python-only page whose output schema the JS dev server ignores,
 * the second is an upstream duplicate of it — so neither owns a `/demo-chat`
 * surface and there is nothing for the recorder to drive. That is a gap in the
 * coverage, not an oversight: see PROJECT_GOAL.md, "Gaps the pipeline misses".
 *
 * ── The line ranges ────────────────────────────────────────────────────────
 * `startLine`/`endLine` are what the simulated IDE highlights. They are
 * hardcoded, which means they drift the moment someone edits a demo page.
 * Doctor guards this: where a file carries `[!code highlight]` or `#region`
 * markers, it checks the range still covers one and names the marker's current
 * line when it does not. Keep those markers in the frontend and the guard keeps
 * working.
 *
 * ── `knownIssue` ───────────────────────────────────────────────────────────
 * Three of the pages below are on the QA report as broken, and their clips
 * exist to show that: Reading agent state, Writing agent state, and the
 * prebuilt tab of Predictive State Updates. The Python sibling files all three
 * identically — this repo had been recording the first and third as `[PASS]`
 * because nothing in their takes asserted the panel that stays empty. The
 * three pages added on 2026-09-11 (Frontend-Driven Cards, Memories, Learning)
 * carry one too, at the end of the list.
 * `knownIssue` is what makes the run say `[ISSUE]` rather than `[PASS]`, and it
 * is the same object `ci/build-report.mjs` renders into the daily report — so
 * the sentence typed into Notepad on video and the row that goes to the manager
 * are one string, written here, once.
 *
 * A page whose defect gets fixed upstream should have its `knownIssue` deleted
 * in the same change that confirms the fix. Leaving a stale one behind is worse
 * than having none: the clip keeps asserting a bug that is gone.
 */

import { definePages } from '../core/types';

export const PAGES = definePages([
  // -- Getting Started ---------------------------------------------------------
  {
    id: 'quickstart',
    name: 'Quickstart',
    videoName: 'Quickstart',
    docPath: 'quickstart',
    route: 'quickstart',
    // Leads with the versions rather than package.json, which declares RANGES:
    // a clip showing "^1.69.3" while the run installed 1.69.4 documents a floor
    // nobody tested. VERSIONS.md is generated after install
    // (`node ci/write-versions.mjs`) and names what actually resolved.
    ideFile: 'frontend/VERSIONS.md',
    startLine: 6,
    endLine: 23,
    extraTabs: [
      // The manifest next to the resolved versions. VERSIONS.md says what this
      // run installed; package.json says what a reader would write in their own
      // project, which is the thing the Quickstart is actually teaching. Both,
      // in that order, because the range alone was what used to mislead.
      { filePath: 'frontend/package.json', startLine: 11, endLine: 22 },
      // The TypeScript tab's backend: `createDeepAgent` with one tool, exported
      // as `agent` and registered in langgraph.json — not a FastAPI app.
      { filePath: 'backend/agent.ts', startLine: 17, endLine: 42 },
      {
        filePath: 'frontend/src/app/quickstart/demo-chat/page.tsx',
        startLine: 21,
        endLine: 39,
      },
    ],
    prompt: 'Hey, are you connected? What is the weather like in Karachi right now?',
    waitAfterPromptMs: 4000,
  },

  // -- Basics ------------------------------------------------------------------
  {
    id: 'threads-drawer',
    name: 'Prebuilt Components - Threads Drawer',
    videoName: 'ThreadsDrawer',
    docPath: 'prebuilt-components/copilot-threads-drawer',
    route: 'prebuilt-components/copilot-threads-drawer',
    ideFile:
      'frontend/src/app/prebuilt-components/copilot-threads-drawer/demo-chat/page.tsx',
    startLine: 35,
    endLine: 51,
    prompt: 'In one sentence, what is a deep agent?',
    waitAfterPromptMs: 4000,
  },

  // -- Rich Threads ------------------------------------------------------------
  {
    id: 'headless-threads',
    name: 'Headless Threads',
    videoName: 'HeadlessThreads',
    docPath: 'headless-threads',
    route: 'headless-threads',
    ideFile: 'frontend/src/app/headless-threads/demo-chat/page.tsx',
    startLine: 52,
    endLine: 95,
    prompt: 'What is one thing a long-horizon agent needs that a plain chatbot does not?',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'threads-lifecycle',
    name: 'Thread & History Lifecycle',
    videoName: 'ThreadsLifecycle',
    docPath: 'threads-lifecycle',
    route: 'threads-lifecycle',
    ideFile: 'frontend/src/app/threads-lifecycle/demo-chat/page.tsx',
    startLine: 27,
    endLine: 60,
    prompt: 'Remember this number for me: 4417. Now, what number did I just give you?',
    waitAfterPromptMs: 4000,
  },

  // -- Generative UI -----------------------------------------------------------
  {
    id: 'tool-rendering',
    name: 'Generative UI - Tool Rendering',
    videoName: 'ToolRendering',
    docPath: 'generative-ui/tool-rendering',
    route: 'generative-ui/tool-rendering',
    ideFile: 'frontend/src/app/generative-ui/tool-rendering/demo-chat/page.tsx',
    startLine: 30,
    endLine: 44,
    extraTabs: [{ filePath: 'backend/src/toolRendering.ts', startLine: 14, endLine: 39 }],
    prompt: 'Check the weather in Tokyo for me.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'state-rendering',
    name: 'Generative UI - State Rendering',
    videoName: 'StateRendering',
    docPath: 'generative-ui/state-rendering',
    route: 'generative-ui/state-rendering',
    ideFile: 'frontend/src/app/generative-ui/state-rendering/demo-chat/page.tsx',
    startLine: 9,
    endLine: 35,
    // `copilotkitEmitState` is the half the frontend cannot show: the panel only
    // re-renders because the graph pushes a delta from here.
    extraTabs: [{ filePath: 'backend/src/stateRendering.ts', startLine: 37, endLine: 62 }],
    prompt: 'Research renewable energy storage for me, and show me your progress as you go.',
    waitAfterPromptMs: 5000,
  },
  {
    id: 'interrupt-single',
    name: 'Generative UI - Your Components - Interrupt-based HITL',
    videoName: 'InterruptBased',
    docPath: 'generative-ui/your-components/interrupt-based',
    route: 'generative-ui/your-components/interrupt-based',
    ideFile:
      'frontend/src/app/generative-ui/your-components/interrupt-based/demo-chat/page.tsx',
    startLine: 11,
    endLine: 43,
    extraTabs: [{ filePath: 'backend/src/interruptBased.ts', startLine: 45, endLine: 70 }],
    prompts: ['Hi there. Could you help me with something?', 'What should I call you?'],
    prompt: 'Hi there. Could you help me with something?',
    waitAfterPromptMs: 4000,
  },
  {
    // Same doc page, second tab, recorded apart from the take above: one clip
    // per section is what lets a reader of the report open the footage for the
    // section they are reading rather than scrubbing for it.
    //
    // No `knownIssue`, as of 04 Sep 2026. The entry that was here filed the
    // `enabled({ eventValue })` destructure -- neither registration claimed the
    // event, so no card was drawn and the run stopped at the interrupt with
    // nothing to answer it. It was removed on a report that the tab now behaves.
    //
    // Removing it is what stops the Notepad report being typed at the end of the
    // take: the action writes that note only when this field is present. It also
    // drops `expectsNoResponse`, so silence here is no longer excused -- see the
    // handler in `actions/interrupt.action.ts`, which now says so in the log.
    //
    // `git log -S 'eventValue' -- autorecorder/config/pages.config.ts` brings
    // the full text back if it turns out to be intermittent.
    id: 'interrupt-conditional',
    name: 'Generative UI - Your Components - Interrupt-based HITL (conditional)',
    videoName: 'ConditionalInterrupts',
    docPath: 'generative-ui/your-components/interrupt-based',
    route: 'generative-ui/your-components/interrupt-based',
    ideFile:
      'frontend/src/app/generative-ui/your-components/interrupt-based/demo-chat/page.tsx',
    startLine: 134,
    endLine: 157,
    extraTabs: [{ filePath: 'backend/src/interruptBased.ts', startLine: 45, endLine: 66 }],
    prompt: 'Hi there. Could you help me with something?',
    waitAfterPromptMs: 5000,
  },

  // -- App Control -------------------------------------------------------------
  {
    id: 'frontend-tools',
    name: 'Frontend Tools',
    videoName: 'FrontendTools',
    docPath: 'frontend-tools',
    route: 'frontend-tools',
    ideFile: 'frontend/src/app/frontend-tools/demo-chat/page.tsx',
    startLine: 16,
    endLine: 29,
    extraTabs: [{ filePath: 'backend/src/frontendTools.ts', startLine: 36, endLine: 49 }],
    prompt: 'Can you say hello to Fiqros for me?',
    waitAfterPromptMs: 4000,
  },

  // -- Shared State ------------------------------------------------------------
  {
    id: 'in-app-agent-read',
    name: 'Shared State - Reading agent state',
    videoName: 'ReadingAgentState',
    docPath: 'shared-state/in-app-agent-read',
    route: 'shared-state/in-app-agent-read',
    ideFile: 'frontend/src/app/shared-state/in-app-agent-read/demo-chat/page.tsx',
    startLine: 10,
    endLine: 39,
    extraTabs: [{ filePath: 'backend/src/sharedState.ts', startLine: 34, endLine: 63 }],
    prompt: 'Please set the language to Spanish.',
    waitAfterPromptMs: 4000,
    // Reproduced here on 04 Sep 2026, the same way the Python sibling files it.
    // The 04-Sep clip has the agent answering "El idioma se ha establecido en
    // espanol." beside a panel still reading `Language: english`, and the raw
    // `agent.state` under it still carrying `"language": "english"`. It had been
    // recorded as a [PASS] because nothing in the take asserted the panel.
    knownIssue: {
      area: 'Deep Agents - Shared State - Reading agent state',
      problem:
        'The agent switches to Spanish when asked, but the `language` value shown in the app ' +
        'never updates -- the panel stays on its previous value while the chat answers in Spanish.',
      impact:
        'State written by the agent cannot be read back in the app, so no UI can reflect what ' +
        'the agent is currently doing.',
      likelyCause:
        'The state delta is not reaching the frontend `useAgent` subscription, so `agent.state` ' +
        'never carries the value the agent is acting on.',
      note: [
        'reading agent state - ui never updates',
        '',
        'told it to set language to spanish',
        'it answers in spanish so the agent got it',
        '',
        'but the language field on the left never changes,',
        'and the raw agent.state under it still says english',
      ].join('\n'),
    },
  },
  {
    id: 'in-app-agent-write',
    name: 'Shared State - Writing agent state',
    videoName: 'WritingAgentState',
    docPath: 'shared-state/in-app-agent-write',
    route: 'shared-state/in-app-agent-write',
    ideFile: 'frontend/src/app/shared-state/in-app-agent-write/demo-chat/page.tsx',
    startLine: 10,
    endLine: 55,
    extraTabs: [{ filePath: 'backend/src/sharedState.ts', startLine: 34, endLine: 63 }],
    prompt: 'Tell me one interesting fact about Karachi, please.',
    waitAfterPromptMs: 4500,
    knownIssue: {
      area: 'Deep Agents - Shared state - Writing agent state',
      problem:
        '`agent.setState({ language })` updates the frontend and the value ships with the next ' +
        'run, but the model never sees it: the agent answers in English however the toggle is ' +
        'set. The state round-trips; the prompt does not carry it.',
      impact:
        "The page's whole claim — that writing state from the app changes what the agent does — " +
        'does not hold for the code as printed. A reader following it gets a label that changes ' +
        'and an agent that ignores it.',
      likelyCause:
        '`exposeState` cannot read a field declared on a different middleware. `language` lives ' +
        "on the state-schema middleware, so the CopilotKit middleware's exposeState resolves it " +
        'to nothing and no system message is added for it.',
      note: [
        'writing agent state - the toggle does not reach the model',
        '',
        'clicked Toggle Language, label + raw state both say spanish',
        'asked for a fact about karachi. answer came back in english',
        '',
        'so the write lands on the frontend and ships,',
        'the model just never gets told about it',
      ].join('\n'),
    },
  },
  {
    id: 'predictive-prebuilt',
    name: 'Shared State - Predictive State Updates (prebuilt agent)',
    videoName: 'PrebuiltAgent',
    docPath: 'shared-state/predictive-state-updates?agent-type=prebuilt',
    route: 'shared-state/predictive-state-updates',
    ideFile: 'frontend/src/app/shared-state/predictive-state-updates/demo-chat/page.tsx',
    startLine: 32,
    endLine: 77,
    extraTabs: [{ filePath: 'backend/src/predictiveState.ts', startLine: 29, endLine: 62 }],
    prompt: 'Plan a three-step research task on solar panel recycling, and report each step as you go.',
    waitAfterPromptMs: 5000,
    // The same finding the Python sibling files against this tab, reproduced
    // here on 04 Sep 2026: the 04-Sep clip answers with a full three-step plan
    // beside an "Agent Progress" panel that reads "Empty. Give the agent a
    // multi-step task." for the whole run. It had been recorded as a [PASS]
    // because nothing in the take asserted the panel, which is what the
    // `knownIssue` and the longer dwell in the handler now fix.
    knownIssue: {
      area: 'Deep Agents - Shared State - Predictive State Updates (prebuilt agent)',
      problem:
        'No agent progress appears in the app. The steps list stays empty for the whole run ' +
        'while the chat answers normally.',
      impact:
        'Agent progress cannot be shown in real time, which is the entire purpose of this page.',
      likelyCause:
        'The streamed state never reaches the UI variables, so `observedSteps` stays empty in ' +
        '`agent.state` even though the tool call carrying it completes.',
      note: [
        'predictive state - prebuilt renders no steps',
        '',
        'asked for a multi step task on the prebuilt tab',
        'agent progress stayed empty the whole run',
        '',
        'chat answered fine so the agent ran, the steps just never reach the panel',
        'switched to custom graph - manual after and the same ask fills all four rows',
      ].join('\n'),
    },
  },
  {
    // Same doc page, `agent-type=custom-graph`, first of its two variants. The
    // TypeScript tabs print both custom graphs in full, unlike the Python ones,
    // so each gets its own take against the code the page actually shows.
    id: 'predictive-manual',
    name: 'Shared State - Predictive State Updates (custom graph, manual)',
    videoName: 'ManuallyPredictive',
    docPath: 'shared-state/predictive-state-updates?agent-type=custom-graph',
    route: 'shared-state/predictive-state-updates',
    ideFile: 'backend/src/predictiveStateManual.ts',
    startLine: 41,
    endLine: 75,
    extraTabs: [
      {
        filePath: 'frontend/src/app/shared-state/predictive-state-updates/demo-chat/page.tsx',
        startLine: 32,
        endLine: 77,
      },
    ],
    prompt: 'Plan a three-step research task on solar panel recycling, and report each step as you go.',
    waitAfterPromptMs: 5000,
  },
  {
    id: 'predictive-tool',
    name: 'Shared State - Predictive State Updates (custom graph, tool)',
    videoName: 'ToolBasedPredictive',
    docPath: 'shared-state/predictive-state-updates?agent-type=custom-graph',
    route: 'shared-state/predictive-state-updates',
    ideFile: 'backend/src/predictiveStateTool.ts',
    startLine: 51,
    endLine: 86,
    extraTabs: [
      { filePath: 'backend/src/predictiveStateTool.ts', startLine: 88, endLine: 125 },
    ],
    prompt: 'Plan a three-step research task on solar panel recycling, and report each step as you go.',
    waitAfterPromptMs: 5000,
  },
  {
    id: 'intelligence-quickstart',
    name: 'Intelligence - Connect Intelligence in 5 minutes',
    videoName: 'IntelligenceQuickstart',
    docPath: 'intelligence/quickstart',
    route: 'intelligence/quickstart',
    // The doc's step 3: a plain `route.ts` with `mode: "single-route"` and one
    // verb, where the page used to publish `[[...slug]]` and four.
    ideFile: 'frontend/src/app/api/copilotkit-single/route.ts',
    startLine: 1,
    endLine: 37,
    extraTabs: [
      // Step 4: the matching provider flag.
      {
        filePath: 'frontend/src/components/single-endpoint-provider.tsx',
        startLine: 29,
        endLine: 46,
      },
    ],
    prompt: 'Tell me a one-line joke.',
    // The only page in this suite whose runtime route is never touched by any
    // other take, so its first request is also the first time `next dev`
    // compiles `/api/copilotkit-single`. On a cold CI runner that lands past
    // the 30s default and the take fails with the agent apparently silent.
    // `core/timeouts.ts` says the defaults suit a warm dev server and that a
    // legitimately slow page should say so here; this is that page.
    timeouts: { replyStartMs: 90_000 },
    waitAfterPromptMs: 4000,
  },
  {
    id: 'human-in-the-loop-governed-actions',
    name: 'App Control - Governed Action Approval',
    videoName: 'GovernedActions',
    docPath: 'human-in-the-loop/governed-actions',
    route: 'human-in-the-loop/governed-actions',
    // The tool registration -- the half that makes the run stop.
    ideFile: 'frontend/src/app/human-in-the-loop/governed-actions/demo-chat/page.tsx',
    startLine: 109,
    endLine: 148,
    extraTabs: [
      // The approval card the tool renders.
      {
        filePath: 'frontend/src/app/human-in-the-loop/governed-actions/demo-chat/page.tsx',
        startLine: 42,
        endLine: 103,
      },
    ],
    prompt:
      'Please send an invoice reminder to acme@example.com, but check with me before it goes out.',
    // Two turns, because the card has two answers and only one of them was
    // ever filmed. The first request is harmless and gets approved; the second
    // is destructive and gets rejected, which is the half that shows the
    // policy actually stopping something.
    prompts: [
      'Please send an invoice reminder to acme@example.com, but check with me before it goes out.',
      'Now permanently delete the acme@example.com customer record, but check with me before it goes through.',
    ],
    waitAfterPromptMs: 6000,
  },

  // -- Added 2026-09-11: three pages new upstream, identical under every
  // framework prefix. After every existing doc page so no clip is renumbered.
  // All three reproduce a defect in this repo, so all three carry a
  // `knownIssue`. None of the three is about the reply: where the backend has
  // no OPENAI_API_KEY (a local run) the handlers note the silence and go on.
  {
    id: 'frontend-cards',
    name: 'Generative UI - Frontend-Driven Cards',
    videoName: 'FrontendCards',
    docPath: 'generative-ui/frontend-cards',
    route: 'generative-ui/frontend-cards',
    // Step 1: the renderer, verbatim.
    ideFile: 'frontend/src/app/generative-ui/frontend-cards/event-card.tsx',
    startLine: 7,
    endLine: 27,
    extraTabs: [
      // Step 2: registered on the provider, props as published -- the pane
      // that throws, because nothing in it names an agent.
      {
        filePath: 'frontend/src/app/generative-ui/frontend-cards/demo-chat/page.tsx',
        startLine: 210,
        endLine: 218,
      },
      // Step 3: addMessage with role "activity", verbatim. Its bare
      // `useAgent()` is the first thing to throw.
      {
        filePath: 'frontend/src/app/generative-ui/frontend-cards/deployment-watcher.tsx',
        startLine: 16,
        endLine: 38,
      },
    ],
    prompt:
      'Have you been shown any deployment card in this conversation? List the roles of every message you received.',
    waitAfterPromptMs: 4000,
    // Reproduced 11 Sep 2026 on react-core/runtime 1.71.0. Integration-specific:
    // Agno's runtime registers `default`, so the same code runs there.
    knownIssue: {
      area: 'Deep Agents - Generative UI - Frontend-Driven Cards',
      problem:
        "The page's code, as published, crashes the route. Step 2's `<CopilotChat />` and step 3's " +
        '`useAgent()` name no agent, so both ask for `default`; this runtime registers `sample_agent` ' +
        "(as the Deep Agents Quickstart does) and no `default`, and once `/info` answers `useAgent` throws " +
        "\"Agent 'default' not found after runtime sync\" during render. With `agentId=\"sample_agent\"` added " +
        'the card renders and the run payload carries only `user`, as documented.',
      impact:
        'A reader who followed this integration\'s Quickstart gets a blank "This page couldn\'t load" on the ' +
        'first render, from a page that never mentions agent ids. Separately, a card added before the ' +
        'runtime connects is silently dropped (reproduced 3/3 with `/info` delayed).',
      likelyCause:
        'The page is shared verbatim across every integration and assumes a runtime with a `default` ' +
        'agent. Nothing on it says what a bare `useAgent()` / `<CopilotChat />` resolves to.',
      note: [
        'frontend cards - the page code crashes on this runtime',
        '',
        "top pane is steps 2 + 3 as published. no agentId anywhere",
        "-> Agent 'default' not found after runtime sync. whole route dies without the boundary",
        '',
        'bottom pane = same thing + agentId sample_agent',
        'card renders, payload row says only user went out. so the idea works,',
        'the snippet just assumes a default agent',
      ].join('\n'),
    },
  },
  {
    id: 'intelligence-memories',
    name: 'Intelligence - Memories & Recall',
    videoName: 'Memories',
    docPath: 'intelligence/memories',
    route: 'intelligence/memories',
    // The page's React component, verbatim -- with the two compiler errors its
    // import produces acknowledged in place.
    ideFile: 'frontend/src/app/intelligence/memories/memory-list.tsx',
    startLine: 22,
    endLine: 45,
    extraTabs: [
      // The option the page never mentions, and without which every memory
      // route 404s at the runtime once Intelligence is on.
      {
        filePath: 'frontend/src/app/api/copilotkit-memory/[[...slug]]/route.ts',
        startLine: 39,
        endLine: 59,
      },
    ],
    prompt: 'Please remember that I prefer concise status updates.',
    waitAfterPromptMs: 3000,
    knownIssue: {
      area: 'Deep Agents - Intelligence - Memories & Recall',
      problem:
        "The page's React snippet does not compile: it imports `useMemories` from `@copilotkit/react-core`, " +
        'which has no such export (only `/v2` does). With the import fixed, on this repo\'s runtime (no ' +
        'Intelligence key, SSE mode) the hook never sends a memory request: it reports `isAvailable: true` ' +
        'over an empty list, and saving fails in the browser with "Runtime URL is not configured".',
      impact:
        'Memory cannot be used from React as documented, and a runtime without memory looks exactly like ' +
        'a user with no memories -- the page says it should read `isAvailable: false`. The error message ' +
        'points at the runtime URL, which is configured.',
      likelyCause:
        'Wrong entry point on the page (copied from the hook\'s own JSDoc example). The core only gives the ' +
        'memory store a context when `/info` reports an Intelligence `wsUrl`, and the hook only flips ' +
        '`isAvailable` on 404/501. With a key, runtime 1.71.0 additionally hides memory routes unless ' +
        '`memory: { access }` is set, which the page never mentions (observed in Agno-react; not ' +
        'reproducible here without a key).',
      note: [
        'memories - wrong import, then an empty list that means nothing',
        '',
        'page imports useMemories from react-core root. not exported there, only /v2',
        'with /v2: isAvailable true, 0 memories, realtime stuck on connecting',
        'save -> "Runtime URL is not configured". no request ever left the browser',
        '',
        'memory.access runtime (the option the page never mentions) is 503 here, no key',
      ].join('\n'),
    },
  },
  {
    id: 'learning',
    name: 'Intelligence - Learning',
    videoName: 'Learning',
    docPath: 'learning',
    route: 'learning',
    // The page's runtime snippet, verbatim, and the two identifiers it leaves
    // undefined supplied above it.
    ideFile: 'frontend/src/lib/learning-runtime.ts',
    startLine: 37,
    endLine: 69,
    extraTabs: [
      // Where it is mounted: its own route, so the page's code cannot take
      // down the app's main runtime.
      {
        filePath: 'frontend/src/app/api/copilotkit-learning/[[...slug]]/route.ts',
        startLine: 1,
        endLine: 24,
      },
    ],
    prompt: 'Review this expense: $42 team lunch at Cafe Rio, receipt attached. Approve or flag it?',
    // Turn 2 is the control on `sample_agent`, which the selector assigns nowhere.
    prompts: [
      'Review this expense: $42 team lunch at Cafe Rio, receipt attached. Approve or flag it?',
      'Say hello in five words.',
    ],
    waitAfterPromptMs: 3000,
    knownIssue: {
      area: 'Deep Agents - Intelligence - Learning',
      problem:
        "The page's runtime snippet cannot load in this repo: `new CopilotKitIntelligence({ apiKey: " +
        'process.env.CPK_INTELLIGENCE_API_KEY! })` throws at module load ("apiKey is required and cannot ' +
        'be blank") because there is no Intelligence key, so `/api/copilotkit-learning` answers 500 and ' +
        'neither agent can run. The snippet also uses `agents` and `identifyUser` without defining them.',
      impact:
        'Nothing past the constructor is testable here -- assignment, the container, Insights and Skills ' +
        'all sit behind a key this harness does not have. The non-null assertion hides the requirement ' +
        'from the compiler.',
      likelyCause:
        'Expected without a key; the page does send you to the Intelligence quickstart first. What sits ' +
        'behind it was observed in Agno-react: the example container `expense-review` does not exist, and ' +
        'every run on the assigned agent fails with "Failed to initialize thread" while the chat shows nothing.',
      note: [
        'learning - page runtime never loads here',
        '',
        'mounted the snippet verbatim on its own route',
        'no CPK_INTELLIGENCE_API_KEY -> constructor throws -> route is 500',
        'runtime row says error, prompt sits in the box, neither tab answers',
        '',
        'also: agents + identifyUser are never defined on the page',
      ].join('\n'),
      expectsNoResponse: true,
    },
  },
]);
