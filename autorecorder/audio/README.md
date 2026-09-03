# audio/

Narration tracks, paired to videos by filename: `audio/<videoName>.m4a` is muxed
onto the clip whose name ends `-<videoName>.webm` (see `ci/lib/mux.mjs`).

**Everything is in `on-hold/` right now, and nothing is muxed.** The four tracks
here came over from the Python sibling repo with the rest of the pipeline, and
they were recorded against *its* findings. Three of the pages they narrate
behave differently in this repo — Reading agent state and both custom-graph
predictive variants work here — so muxing them would put a spoken description of
a defect over a clip of the feature working, which is worse than silence.

`on-hold/` is scanned by nothing. Move a track up one level only after
re-recording it against what this repo's clip actually shows.
