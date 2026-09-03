/**
 * Voiceover muxing — the only implementation.
 *
 * This used to exist twice: once here (run per shard) and again in the
 * workflow's consolidate job. In CI both fired, so a shard that recorded a
 * narrated page got its audio muxed, and consolidate then muxed the same track
 * onto the already-muxed file. Muxing now happens once, where the video is
 * produced; the workflow just installs ffmpeg and lets this run.
 *
 * WebM cannot carry AAC — the audio is re-encoded to libopus. Missing ffmpeg
 * is a skip, not a failure: a silent demo still beats no demo.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { AUDIO_DIR, VIDEOS_DIR } from './config.mjs';

/**
 * Pairing is by filename: `audio/<videoName>.m4a` narrates the video whose name
 * ends in `-<videoName>.webm`. So `audio/InterruptBased.m4a` lands on
 * `DAPY-react-06-InterruptBased.webm`, and narrating a new page is a matter of
 * dropping a correctly named file in — there is no list here to keep in sync.
 *
 * There used to be one, because the takes were named by hand and drifted from
 * the video names (`deepagentsreact-a2uifixedscheme-error.m4a` for
 * `A2uiFixedSchema`). Renaming the files to match retired the table.
 *
 * The match is on the `-<videoName>.webm` suffix rather than `includes`, so the
 * numeric prefix is ignored — the videos renumber whenever the nav order
 * changes — while a name that is a substring of another still cannot collide.
 *
 * Only the top level of `audio/` is scanned. `audio/on-hold/` is where a
 * narration goes when its take should ship silent for now — a page whose defect
 * has been fixed, so the commentary describes something the video no longer
 * shows. Moving the file back is the whole of re-enabling it.
 */
function discoverTracks() {
  if (!fs.existsSync(AUDIO_DIR)) return [];
  return fs
    .readdirSync(AUDIO_DIR, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.m4a'))
    .map((e) => ({ audioFile: e.name, videoName: path.basename(e.name, path.extname(e.name)) }));
}

function hasFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Mux every track whose video is present in `dir`.
 *
 * `dir` defaults to the recorder's output folder, which is where the automated
 * run leaves its videos. It is a parameter so the same code can be pointed at a
 * downloaded CI artifact folder (`videos/ci-<run-id>/`) after the fact.
 */
export function muxAudioFiles(dir = VIDEOS_DIR) {
  const tracks = discoverTracks();
  if (tracks.length === 0) return;
  if (!fs.existsSync(dir)) return;

  if (!hasFfmpeg()) {
    console.log('ℹ️ [Audio Mux] ffmpeg not found in PATH; skipping (videos stay silent).');
    return;
  }

  const files = fs.readdirSync(dir);

  for (const track of tracks) {
    const audioPath = path.join(AUDIO_DIR, track.audioFile);
    const suffix = `-${track.videoName}.webm`;
    const video = files.find((f) => f.endsWith(suffix) && !f.startsWith('temp_'));

    if (!video) {
      console.log(
        `ℹ️ [Audio Mux] No *${suffix} in this run; skipping ${track.audioFile}.`,
      );
      continue;
    }

    const inputPath = path.join(dir, video);
    const tempPath = path.join(dir, `temp_${video}`);
    console.log(`\n🎵 [Audio Mux] Adding ${track.audioFile} to ${video}...`);

    try {
      // `-af apad` + `-shortest`, not `-shortest` alone. A voiceover is usually
      // shorter than the take it narrates -- 57s of audio over a 92s demo, in
      // the case that turned this up -- and `-shortest` on its own ends the
      // file with the audio, silently truncating the video by the difference.
      // `apad` pads the audio with silence indefinitely, so `-shortest` lands
      // on the video's end instead and the whole demo survives with a quiet
      // tail. Audio longer than the video is still cut to the video, which is
      // the behaviour you want in that direction.
      execSync(
        `ffmpeg -y -i "${inputPath}" -i "${audioPath}" -c:v copy -c:a libopus -af apad -map 0:v:0 -map 1:a:0 -shortest "${tempPath}"`,
        { stdio: 'ignore' },
      );
      fs.copyFileSync(tempPath, inputPath);
      fs.unlinkSync(tempPath);
      console.log(`✅ [Audio Mux] Added audio to ${video}`);
    } catch (err) {
      console.warn(`⚠️ [Audio Mux] Could not mux ${track.audioFile}:`, err.message || err);
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
    }
  }
}
