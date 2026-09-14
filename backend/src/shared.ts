/**
 * One place for the settings every agent module in this backend reads.
 *
 * The doc pages this repo implements name three different model ids across
 * them — `openai:gpt-5.6-luna` on Quickstart and Tool Rendering, `gpt-5.6-luna` on
 * Predictive State Updates, `gpt-5.6-luna` inside the manual-emission snippet.
 * Rather than hardcode a different one per file, every agent reads
 * `OPENAI_MODEL` and defaults to the Quickstart's `gpt-5.6-luna`. The id each page
 * actually prints is recorded on that page's route in the app.
 */

//#region model
/** Bare id, e.g. "gpt-5.6-luna". What `new ChatOpenAI({ model })` takes. */
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? "gpt-5.6-luna";

/** Provider-prefixed. What `createDeepAgent({ model })` takes. */
export const MODEL = `openai:${OPENAI_MODEL}`;
//#endregion
