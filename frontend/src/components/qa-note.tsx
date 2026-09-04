/**
 * A short "what to try / what should happen" note on a demo route.
 *
 * These routes get screen-recorded, and most of the clips carry no voice track
 * — only the two narrated in `autorecorder/audio/` do. The recorder used to
 * paint captions over the video to say what was being shown, which read wrong:
 * nobody testing an app can make a caption appear on screen. A tester *can*
 * leave a note on the page, so the explanation lives here in the app instead,
 * where it is something a person could actually have written.
 *
 * It earns its place most on the routes that are broken. "Nothing happened" is
 * ambiguous on video — it looks the same as a slow model or a page nobody has
 * touched yet. Stating the expected result next to the empty space is what
 * makes the absence legible.
 *
 * Keep it to one line each. This is a caption, not documentation, and it must
 * not push the thing being demonstrated off screen.
 */
export function QaNote({
  try: tryThis,
  expected,
  actual,
}: {
  /** The prompt or click to perform. */
  try: string;
  /** What the doc page says should happen. */
  expected: string;
  /** What happens instead, on routes with a known defect. Omit when it works. */
  actual?: string;
}) {
  return (
    <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs leading-relaxed dark:border-slate-800 dark:bg-slate-900/60">
      <p className="text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-500 dark:text-slate-400">Try:</span> {tryThis}
      </p>
      <p className="text-slate-600 dark:text-slate-300">
        <span className="font-semibold text-slate-500 dark:text-slate-400">Expected:</span>{" "}
        {expected}
      </p>
      {actual && (
        <p className="text-rose-700 dark:text-rose-300">
          <span className="font-semibold">Actual:</span> {actual}
        </p>
      )}
    </div>
  );
}
