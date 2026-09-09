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
 * because nothing in their takes asserted the panel that stays empty.
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
]);
