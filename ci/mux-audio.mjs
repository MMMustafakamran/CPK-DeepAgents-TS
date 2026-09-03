#!/usr/bin/env node
/**
 * Mux voiceovers onto already-recorded videos.
 *
 * `automate.mjs` already does this at the end of every run, so this is for the
 * videos that run left behind: a downloaded CI artifact folder, or a re-take
 * that was recorded before its narration existed.
 *
 *   node ci/mux-audio.mjs                       # autorecorder/videos/
 *   node ci/mux-audio.mjs videos/ci-1234567890  # a specific folder
 *
 * The pairing lives in `ci/lib/mux.mjs`; this file only chooses the folder.
 */
import fs from 'node:fs';
import path from 'node:path';
import { RECORDER_DIR, VIDEOS_DIR } from './lib/config.mjs';
import { muxAudioFiles } from './lib/mux.mjs';

const arg = process.argv[2];

// A bare `videos/...` is resolved against the recorder, not the shell's cwd, so
// the documented form above works from the repo root as well as from ci/.
const dir = !arg
  ? VIDEOS_DIR
  : path.isAbsolute(arg)
    ? arg
    : fs.existsSync(path.resolve(arg))
      ? path.resolve(arg)
      : path.join(RECORDER_DIR, arg);

if (!fs.existsSync(dir)) {
  console.error(`❌ No such folder: ${dir}`);
  process.exit(1);
}

console.log(`🎬 Muxing voiceovers in ${dir}`);
muxAudioFiles(dir);
