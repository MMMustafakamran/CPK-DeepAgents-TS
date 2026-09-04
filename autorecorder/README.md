# Autorecorder

Automated screen-recording suite for CopilotKit framework integrations. It
produces one narrated-looking demo video per documentation page: read the doc,
switch to VS Code and show the code that implements it, switch to the browser and
drive the live feature.

Configured for **Deep Agents (Python) + React**.

This copy does one thing its siblings do not. Five of the fifteen pages here are
on the QA report as broken, and their clips exist to **show the defect**, not to
work around it. That changes what a run means and what it produces — see
[Known issues](#known-issues) below.

> **Porting this to another framework?** Read **[ADAPT.md](ADAPT.md)** first. It
> is written for the person or agent doing the port, and it is the contract the
> `doctor` command enforces.

---

## Run it

Both services must be up first — the recorder refuses to start otherwise, because
a video of a dead page is worse than no video.

```bash
cd backend  && uv run langgraph dev --port 8123 --no-browser   # :8123
cd frontend && npm run dev                                     # :3000
```

Then:

```bash
cd autorecorder
npm install
npx playwright install chromium

npm run doctor            # is the configuration sane?
npm run record -- --list  # what will be recorded
npm run record -- --quickstart
npm run record -- --pages=issues   # just the pages with known defects
npm run record            # all pages, in order
```

Or drive the whole thing — servers, installs, drift check, report — from the
repo root with `npm run automate`. See [`ci/README.md`](../ci/README.md).

| Flag | Effect |
|---|---|
| `--list`, `--help` | Print every registered route and exit |
| `--doctor` | Validate the configuration; exits 1 on error |
| `--doctor --online` | Also probe every doc/demo URL and the selectors |
| `--<page-id>` | Record one page — `--quickstart`, `--in-app-agent-write` |
| `--page=<id>` | Same thing, explicit form |
| `--pages=a,b,c` | Record several |
| `--pages=issues` | Record every page carrying a `knownIssue` |
| `--filter=<query>` | Record every page whose id or name contains the query |
| `--force` | Record even if the pre-flight health check fails |

Videos land in `videos/` as `<videoPrefix>-<NN>-<name>.webm`, 1920×1080, ~25fps
(Playwright's capture rate; it is not configurable). Per-page outcomes land
beside them in `RECORD_RESULTS.json`, which is what `ci/build-report.mjs` turns
into the QA report.

**`videos/` is gitignored on purpose.** Recordings are build output — reproducible
from this folder plus `npm run record` — and committing them is expensive: 17 clips
at ~5MB, rewritten on every re-record, took one repo's `.git` to 348MB before its
history had to be rewritten. Publish them as release assets or to a bucket.

---

## Reading the summary

```
   ✅ [PASS]  (24.1s) Quickstart -> DAPY-react-01-Quickstart.webm
   ⚠️  [PASS*] (31.7s) A2UI · Advanced -> DAPY-react-08-A2uiAdvanced.webm
        · Doc page (…/advanced): Timeout 25000ms exceeded
   🐞 [ISSUE] (61.3s) Writing agent state -> DAPY-react-11-SharedStateWrite.webm
   ❌ [FAIL]  (19.4s) A2UI · Styling -> DAPY-react-07-A2uiStyling.webm
        · Demo step failed: Demo route returned HTTP 500
```

- **PASS** — every step completed.
- **PASS\*** — recorded, with a note. Either the external doc page misbehaved
  (intro footage degraded, feature not implicated), or the page's handler
  reported something it did not see (`ctx.warn`), or the browser console
  logged errors during the demo step. The notes are on the summary line and
  in `RECORD_RESULTS.json`.
- **ISSUE** — recorded a page that carries a `knownIssue`. Not a failure: the
  clip is doing its job. **It does not mean the defect was confirmed today** —
  the recorder cannot judge that. Watch the clip.
- **FAIL** — the demo route 404'd, never rendered a chat surface, the agent never
  answered where an answer was expected, the IDE view could not be built, or the
  handler reported that the feature did not work (`ctx.fail`). The clip is still
  saved as evidence.

Only **FAIL** sets a non-zero exit code, so CI can be gated on it while five
documented defects record every night without turning the pipeline red.

---

## Known issues

A page that reproduces a defect declares it in `config/pages.config.ts`:

```ts
knownIssue: {
  area:        'Deep Agents - App control - Shared state - Writing agent state',
  problem:     'The toggle button does not change the language the agent answers in…',
  impact:      'UI elements cannot drive the agent…',
  likelyCause: 'The written state never reaches the model…',
}
```

That one object does three jobs, which is the whole point of it existing:

1. it flips the take's outcome to `[ISSUE]`,
2. it is typed into a simulated Notepad window at the end of the clip, over the
   still-visible failure, so the video carries its own report, and
3. `ci/build-report.mjs` renders it into `DOCUMENTED_REPORT.md`.

The sentence on screen and the row that reaches a manager are the same string.
There is no second place to update, so there is no second place to forget.

**Delete a `knownIssue` in the same change that confirms the fix.** A stale one
is worse than none: the clip keeps asserting a bug that is gone, and the doctor
cannot tell.

### Making a defect visible

Most defects here are an *absence* — a label that does not change, a list that
stays empty, a surface that never draws — and absence is genuinely hard to film.
An empty panel beside a working chat looks like a page nobody has asked anything
yet.

**The rule that governs how it is made legible: a take may only contain things a
person testing this app could actually have done.** This suite briefly had a
caption bar and a replica of Chrome's DevTools console painted over the page.
Both worked. Both were deleted, because a tester cannot summon an overlay, and
one frame of something nobody could have produced turns a recording of evidence
into a recording of a presentation.

What is used instead:

| Where | What |
|---|---|
| `QaNote` — `frontend/src/components/qa-note.tsx` | "Try / Expected / Actual", three lines on the demo route. Something a tester could plausibly have written on the page, and it makes an empty space legible without narration. |
| `writeIssueNote()` — `core/issue-note.ts` | Notepad, opened from the taskbar and typed into. The way a tester actually reports. |
| `showWorkingVariant()` — `core/compare.ts` | The same page against code that works — the only thing that answers "was the demo just wired up wrong?" |
| `captureConsole()` — `core/console-capture.ts` | Invisible. Console-only failures reach the run log and the note, never the screen. |

The comparison helper needs something to compare against. Where the fix is known
this repo carries **paired routes** — `/shared-state/in-app-agent-write` is the
doc's code verbatim, `/shared-state/in-app-agent-write/fixed` is the same page
against a graph built with `CopilotKitMiddleware(expose_state=["language"])`.
Only the agent id differs between them, which is exactly what makes the pair
worth recording.

**Only pair a route where the fix is actually known.** Two of these defects have
no established fix; a "fixed" route that quietly did something else would be
worse evidence than no second route at all. Where there is no fix, contrast
against a sibling that already works — the Predictive take switches from the
prebuilt tab to the custom-graph tab and asks the identical question.

### The note

The four `knownIssue` fields are the *filed* version: they go verbatim into
`DOCUMENTED_REPORT.md`, so they are written like a report. Typed into Notepad at
human speed, that register reads as staged — nobody writes "Expected impact:"
while the bug is still on screen in front of them.

So each issue also carries `note`: the same finding as a tester would scribble
it. Lower case, no labels, a handful of short lines. One object, two registers,
each suited to where it lands.

```
writing agent state - toggle does nothing

hit toggle language then sent a message
label says spanish and the agent keeps replying in english

the write lands on the frontend fine - raw state shows it
it just never reaches the model. expose_state isnt set and neither page mentions it

copilotkit 1.69.0 - a2ui-renderer react-core runtime
npm 12.0.2 / windows 11
```

The version and OS lines are read from the machine at record time, so they
cannot go stale the way a typed-in version number does.

---

## Layout

The split between what you edit and what you don't is the point of this folder.

```
autorecorder/
├── ADAPT.md                    ← how to port this; read before editing
├── cli.ts                      ← entrypoint, arg parsing, summary
│
├── config/                     ← ★ THE ADAPTATION SURFACE
│   ├── project.config.ts         framework slug, doc root, URLs, start commands
│   ├── pages.config.ts           one entry per doc page, plus its knownIssue
│   └── selectors.config.ts       how to find the chat surface
│
├── actions/                    ← ★ what to DO on each page
│   ├── index.ts                  page id → handler registry
│   └── *.action.ts               per-page interaction scripts
│
├── core/                       ← ✖ DO NOT EDIT — no framework knowledge here
│   ├── CORE_MANIFEST.json        hash per core file; `npm run core:check` enforces it
│   ├── engine.ts                 browser lifecycle, the 3-step sequence, outcomes
│   ├── actions.ts                sendPrompt, response detection, standard action
│   ├── select.ts                 which pages a `record` invocation means
│   ├── timeouts.ts               every fixed wait, with project/page overrides
│   ├── compare.ts                the same page on code that works
│   ├── issue-note.ts             the defect report, typed on screen
│   ├── doctor.ts                 the adaptation contract, as a command
│   ├── diagnostics.ts            pre-flight health check
│   ├── types.ts                  PageDefinition → PageRecordConfig, KnownIssue
│   ├── console-capture.ts        console errors, for the log and the note
│   ├── ide/generator.ts          VS Code simulator, Shiki-highlighted from disk
│   └── overlays/                 taskbar, cursor, Notepad, alert dialog, human pacing
│
├── scripts/core-manifest.mjs   ← core/ drift check (--check / --write / --diff)
├── test/                       ← unit tests for the pure modules (`npm test`)
│
└── videos/                     ← output, plus RECORD_RESULTS.json per run
```

---

## What a recording actually does

1. **Doc page** — opens the real documentation URL, waits for hydration, then
   scrolls at reading pace and rests the cursor on a code block. Clicks VS Code
   on the simulated taskbar.
2. **IDE** — renders the project's own source, read from disk and highlighted
   with Shiki, with the page's line range selected. Multi-tab pages switch tabs.
   Served from the frontend's origin via an intercepted route, so the doc page is
   fully unloaded rather than painted over. Clicks Chrome on the taskbar.
3. **Demo** — opens the chrome-free demo route, drives the feature, and pauses
   for reading. On an issue page this is also where the defect is provoked,
   labelled, compared against working code, and written down.

### What makes it read as a person

Every pace in a take comes from `core/overlays/human.ts`, seeded from the
page id. So two clips do not type, pause and scroll in the same rhythm — but
tonight's take of a page is identical to last night's, which keeps two
recordings of the same defect comparable.

- **Typing** has a person's rhythm: jittered keystrokes, a beat after
  punctuation, the odd mid-sentence pause — in the chat composer and in the
  Notepad note alike. A retry after a swallowed submit is typed quickly
  instead; that is the recorder recovering, not a performance.
- **Scrolling** is in bursts: a few wheel notches, a reading pause, a few more,
  sometimes a nudge back up.
- **Pauses** vary by about a quarter around their nominal length.
- **The cursor** overshoots slightly on long travel and settles, hovers a
  variable moment before a click, drifts while a reply streams instead of
  freezing, and starts each take somewhere plausible rather than dead centre.
- **Windows** fade in over 180ms (IDE, Notepad) instead of cutting.

Two details worth knowing, because both were bugs once:

- Overlays are injected as children of `<html>`, which React owns on any App
  Router page. `ensureOverlays` installs a MutationObserver that re-attaches them
  if a render pass deletes them, and step 1 waits for hydration before scrolling
  so a remount cannot snap the page back to the top. **A handler that navigates
  mid-take must call `ensureOverlays` again** — the new document replaces
  `<html>` wholesale, taskbar and all. `showWorkingVariant` does this for you.
- Native `window.alert` dialogs are browser chrome, so video capture never sees
  them (and Playwright auto-dismisses them). The Frontend Tools page needs its
  alert visible to prove the handler ran in the browser, so its action installs
  a DOM replica of Chrome's dialog via `core/overlays/alert-dialog.ts`. The same
  reasoning produced the simulated taskbar and Notepad — all of them things that
  exist on a real tester's screen. It is also the line the deleted caption bar
  crossed: a dialog the app itself raised is reconstruction; a caption is
  narration.

---

## Troubleshooting

**`Aborting before launching a browser`** — a service is down. The message names
which one and the command to start it. `--force` overrides. Note this backend is
`langgraph dev` on **:8123** answering `/ok`, not a FastAPI app on :8000.

**A page fails with "Agent never produced a response within 30s"** — either the
demo is genuinely broken, or `selectors.config.ts → assistantMessage` does not
match this app's messages. Run `npm run doctor --online` to tell the two apart.
If silence *is* the finding, set `knownIssue.expectsNoResponse` and the run
reports `[ISSUE]` instead.

**Every demo shows an error banner while the backend looks healthy** — the
frontend is forwarding runs to the wrong port. `LANGGRAPH_DEPLOYMENT_URL` in
`frontend/.env.local` has to match the port `langgraph dev` bound.

**The IDE highlights the wrong lines** — the line range drifted. `npm run doctor`
names the file and where its markers actually are now.

**A recording passes but the video is wrong** — the doctor cannot see cursor
placement, highlight correctness, or whether an issue clip actually showed its
issue. Watch it.
