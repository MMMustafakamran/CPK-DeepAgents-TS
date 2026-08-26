# Doc drift changelog

What the CopilotKit docs changed under this repo, written by the sync on
`/doc-sync`. Only pages that actually moved are recorded — a sync that finds
everything unchanged writes nothing here at all.

Holds the 3 most recent dated entries. When a change lands on a fourth
date, the oldest entry is dropped. Entries are counted, not aged, so a gap of
weeks between changes does not expire anything.

## 2026-08-26

### 10:26 UTC — 1 page, highest severity high

**High — Quickstart**

`/deepagents/quickstart` · route `/quickstart` · under “Quickstart”

58 code lines, 12 prose lines changed. The number of fenced code blocks changed.

````diff
- body="Add persistent threads and the inspector with the Enterprise Intelligence Platform."
+ body="Add persistent threads and the inspector with CopilotKit Intelligence."
- <SignupLink surface="docs_deepagents_quickstart_step1">Sign up for a free developer account</SignupLink> on our Enterprise Intelligence Platform to get a license key. You'll use it later to enable persistent threads and the inspector.
+ <SignupLink surface="docs_deepagents_quickstart_step1">Sign up for a free developer account</SignupLink> for CopilotKit Intelligence to get a license key. You'll use it later to enable persistent threads and the inspector.
- ```tsx title="app/api/copilotkit/route.ts"
+ ```tsx title="app/api/copilotkit/[[...slug]]/route.ts" doctest="component"
- CopilotRuntime,
- ExperimentalEmptyAdapter,
````

---

## 2026-08-21

### 09:55 UTC — 2 pages, highest severity high

**High — State Rendering**

`/deepagents/generative-ui/state-rendering` · route `/generative-ui/state-rendering` · under “Define your agent state”

51 code lines, 2 headings, 4 prose lines changed. The number of fenced code blocks changed.

````diff
- ### Define your agent state
+ ### Build an agent that produces state
- Add properties to your agent state that you want to render in the UI.
+ Define the `searches` state, then add a tool that returns each completed update.
- from copilotkit import CopilotKitState
+ from typing import Any, TypedDict
+ from copilotkit import (
+ CopilotKitMiddleware,
````

**Medium — Quickstart**

`/deepagents/quickstart` · route `/quickstart` · under “Start your UI”

1 heading, 11 prose lines changed.

````diff
+ </Step>
+ <Step>
+ ### Open Inspector and confirm setup
+ 
+ On localhost, click the Inspector button in the corner of the app.
+ 
+ 1. Open **Agents**, then **Agent**. Your agent is listed.
+ 2. Send a chat message. Open **Agents**, then **AG-UI Events**. Events are moving.
````

---

---

## 2026-08-17

### 13:25 UTC — 1 page, highest severity low

**Low — Writing agent state** · _local snapshot edit, not an upstream change_

`/deepagents/shared-state/in-app-agent-write` · route `/shared-state/in-app-agent-write` · under “When should I use this?”

1 prose line changed.

````diff
+ You can use this when you want to provide the user with feedback about what your agent is doing, specifically
````
