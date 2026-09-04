# QA findings — 2026-09-04 sync

**Repo:** DeepAgentsjs-React · **Docs:** <https://docs.copilotkit.ai/deepagents>

One page drifted, and the sync exposed a gap in the drift tooling itself.

---

## 1. Quickstart renames the Intelligence key — HIGH

**Page:** `/deepagents/quickstart` → route `/quickstart`

Step 4's runtime snippet reads `CPK_INTELLIGENCE_API_KEY` where it read
`INTELLIGENCE_API_KEY`, in both the TypeScript and the FastAPI tab. The
`.env.local` placeholder went from `your_license_key` to `cpk-...`, and the
prose stopped calling it a license key — it is the project API key now.

That last change is the useful one: the old placeholder actively encouraged the
confusion between the runtime project key and the client-side license token.

The callout's link also moved from `/deepagents/premium/connect-your-runtime`
to `/deepagents/intelligence/connect-your-runtime`.

Nothing says whether the old variable name still works.

**Status:** implemented. The runtime route, `.env.example`, README and the
workflow already read and wrote the new name (done in a parallel session). This
sync finished the five places whose prose still told the reader to set the old
one — `/quickstart`, `/headless-threads`, the threads-drawer page,
`lib/runtime-info.ts` and `components/runtime-status.tsx` — and added a
`/quickstart` callout recording what changed.

The workflow secret deliberately keeps its old name and is written into
`frontend/.env.local` under both spellings, so nothing has to be re-entered.

---

## 2. `/premium/*` is delisted but still served — HIGH to detect

The `/premium/*` URLs are now **absent from the sitemap entirely** while still
returning 200 with byte-identical content. Not a redirect: a delisted live
duplicate.

A snapshot pinned to an old path therefore sees no 404 and no hash change, and
will report "no drift" however far the two copies diverge. This repo tracks none
of those pages directly, so nothing broke here — but the mechanism is worth
recording, because it defeats drift detection outright. Agno-react was pinned to
exactly such a page.

---

## 3. Tooling gap found while doing this sync — HIGH

`npm run drift:sync` compares hashes of pages already in the manifest. It never
fetches the sitemap, so a page appearing or disappearing upstream is invisible
to it — that comparison lives solely in the `/doc-sync` server action.

A clean CLI run prints **NO DOC DRIFT**, which reads as "the docs have not
moved" when it only means "the pages we already knew about have not moved".

Running the sitemap comparison by hand found **10 URLs** under `/deepagents`
neither tracked nor previously recorded: 8 `/intelligence/*` renames plus
`/webmcp` and `/human-in-the-loop/governed-actions`, both genuinely new.

**Fixed:** the CLI script now prints its own scope on every run, and the
manifest's `sitemap` block is rebuilt from what the sitemap actually lists.

---

## Coverage after this sync

| Area | State |
| --- | --- |
| 1 drifted page | implemented |
| Sitemap record | rebuilt, clean |
| `webmcp` | **not covered** — new top-level page, no route |
| `human-in-the-loop/governed-actions` | **not covered** — this repo tracks no HITL page |
| Recordings | **not re-run.** |

Clips: essentially unchanged. `/quickstart` gains a callout, and the
connection-panel warning string on the home page differs by a prefix.
