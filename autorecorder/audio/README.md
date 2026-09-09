# audio/

Narration tracks, paired to videos by filename: `audio/<videoName>.m4a` is muxed
onto the clip whose name ends `-<videoName>.webm` (see `ci/lib/mux.mjs`).

Three tracks are live, one per page this repo files as broken:

| Track | Clip | Finding it narrates |
| --- | --- | --- |
| `ReadingAgentState.m4a` | `*-ReadingAgentState.webm` | agent answers in Spanish, the panel never follows |
| `WritingAgentState.m4a` | `*-WritingAgentState.webm` | toggle flips the label, the model never hears about it |
| `PrebuiltAgent.m4a` | `*-PrebuiltAgent.webm` | prebuilt tab renders no steps at all |

`WritingAgentState` and `PrebuiltAgent` came over from the Python sibling with
the rest of the pipeline and were parked in `on-hold/` while this repo's clips
were thought to show something else. They were re-checked against the 04 Sep
2026 footage, which reproduces both findings exactly as the Python repo files
them, so the commentary matches what the video shows and the tracks are back in
play. `ReadingAgentState.m4a` is this repo's own re-recording; the Python take
it replaces is the one that used to sit here under that name.

A track is allowed to be shorter than the clip it narrates — the mux pads it
with silence rather than truncating the video (`-af apad`, see `ci/lib/mux.mjs`).

**`on-hold/` is scanned by nothing.** It holds `InterruptBased.m4a`, which
describes the interrupt's answer not surviving the run — a finding this repo no
longer carries on either tab of that page, so muxing it would put a spoken
description of a defect over a clip of the feature working. Moving a file back
up one level is the whole of re-enabling it; do that only after re-recording the
track against what this repo's clip actually shows.
