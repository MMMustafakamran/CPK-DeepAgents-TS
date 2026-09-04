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
 * Two of the pages below are on the QA report as broken, and their clips exist
 * to show that. `knownIssue` is what makes the run say `[ISSUE]` rather than
 * `[PASS]`, and it is the same object `ci/build-report.mjs` renders into the
 * daily report — so the sentence typed into Notepad on video and the row that
 * goes to the manager are one string, written here, once.
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
    prompt: "What's the weather in Karachi?",
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
    prompt: 'Give me a one-sentence description of what a deep agent is.',
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
    prompt: 'Name one thing a long-horizon agent needs that a chatbot does not.',
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
    prompt: 'Remember this number: 4417. What number did I just give you?',
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
    prompt: "What's the weather in Tokyo?",
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
    prompt: 'Research renewable energy storage and show me your progress.',
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
    prompts: ['Hello, can you help me with something?', 'What should I call you?'],
    prompt: 'Hello, can you help me with something?',
    waitAfterPromptMs: 4000,
  },
  {
    // Same doc page, second tab. Recorded separately rather than tacked onto the
    // take above: the tab below is broken and that one is not, and a clip
    // carrying both findings is a clip nobody can file against either.
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
    prompt: 'Hello, can you help me with something?',
    waitAfterPromptMs: 5000,
    knownIssue: {
      area: 'Deep Agents - Generative UI - Your Components - Interrupt-based HITL (Condition UI executions)',
      problem:
        "The page's `enabled` callback destructures `eventValue`, which no longer exists on " +
        '`InterruptEvent` — it is `{ name, value }`. At runtime the destructure yields ' +
        '`undefined`, reading `.type` on it throws, and neither registration ever claims the ' +
        'event, so no approval or question card is drawn. `event.value` also arrives as a JSON ' +
        'string rather than the object the agent passed, so `event.value.content` is undefined.',
      impact:
        'Conditional interrupt UI cannot be built from this section as printed. The run stops at ' +
        'the interrupt with nothing on screen to answer it, so the agent never resumes.',
      likelyCause:
        "The snippet predates the `InterruptEvent` shape it is typed against: `enabled` receives " +
        'the whole event. In TypeScript this is a compile error, which is why each line in the ' +
        'harness carries `@ts-expect-error` — delete one and `tsc` reports TS2339.',
      note: [
        'conditional interrupts tab - no card renders',
        '',
        'asked the agent for something, run stops at the interrupt',
        'nothing to answer it with. no approve/reject, no question box',
        '',
        'enabled({ eventValue }) - there is no eventValue on the event,',
        'so it throws before either handler can claim it',
      ].join('\n'),
      expectsNoResponse: true,
    },
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
    prompt: 'Say hello to Fiqros.',
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
    startLine: 9,
    endLine: 38,
    extraTabs: [{ filePath: 'backend/src/sharedState.ts', startLine: 34, endLine: 63 }],
    prompt: 'Set the language to Spanish.',
    waitAfterPromptMs: 4000,
  },
  {
    id: 'in-app-agent-write',
    name: 'Shared State - Writing agent state',
    videoName: 'WritingAgentState',
    docPath: 'shared-state/in-app-agent-write',
    route: 'shared-state/in-app-agent-write',
    ideFile: 'frontend/src/app/shared-state/in-app-agent-write/demo-chat/page.tsx',
    startLine: 9,
    endLine: 54,
    extraTabs: [{ filePath: 'backend/src/sharedState.ts', startLine: 34, endLine: 63 }],
    prompt: 'Tell me one interesting fact about Karachi.',
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
    startLine: 31,
    endLine: 76,
    extraTabs: [{ filePath: 'backend/src/predictiveState.ts', startLine: 29, endLine: 62 }],
    prompt: 'Plan a three-step research task about solar panel recycling and report each step.',
    waitAfterPromptMs: 5000,
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
        startLine: 31,
        endLine: 76,
      },
    ],
    prompt: 'Plan a three-step research task about solar panel recycling and report each step.',
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
    prompt: 'Plan a three-step research task about solar panel recycling and report each step.',
    waitAfterPromptMs: 5000,
  },
]);
