/**
 * Shared paths, ports and URLs for the CI/CD pipeline.
 *
 * Everything under ci/ imports from here rather than rebuilding paths, so a
 * moved folder or a changed port is a one-line edit.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT_DIR = path.resolve(__dirname, '..', '..');
export const CI_DIR = path.join(ROOT_DIR, 'ci');
export const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
export const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
export const RECORDER_DIR = path.join(ROOT_DIR, 'autorecorder');
export const VIDEOS_DIR = path.join(RECORDER_DIR, 'videos');
export const AUDIO_DIR = path.join(RECORDER_DIR, 'audio');
export const LOGS_DIR = path.join(VIDEOS_DIR, 'logs');

export const isWindows = process.platform === 'win32';

/**
 * Prefix for CI artifact names. Deliberately the repo name rather than the
 * video prefix (`DAJS-react`): the artifact is the folder someone downloads,
 * and it should say which repo produced it.
 */
export const PROJECT_SLUG = 'DeepAgentsjs-React';

/**
 * 8124, not the Quickstart's 8123. The backend here is the LangGraph JS dev
 * server, which serves every graph in `backend/langgraph.json`.
 *
 * The port differs from the doc's deliberately: the Python sibling repo runs on
 * 8123 and publishes identical graph ids, so on a shared port whichever server
 * bound first would silently answer for the other language.
 *
 * Three things break together if this changes: the recorder's `backendUrl` in
 * `autorecorder/config/project.config.ts`, the `--port` in `backend/package.json`'s
 * dev script, and `LANGGRAPH_DEPLOYMENT_URL` in `frontend/.env.local` — without
 * the last one the Next runtime route keeps forwarding runs to the old port and
 * every demo answers with an error banner while this health check reports the
 * server up.
 */
export const BACKEND_PORT = Number(process.env.AGENT_PORT || 8124);
export const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 3000);

/** `langgraph dev` answers `/ok` with `{"ok":true}`. It has no `/health`. */
export const BACKEND_HEALTH_URL = `http://127.0.0.1:${BACKEND_PORT}/ok`;
export const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;

/**
 * Routes compiled before recording starts. Next.js builds routes on demand, so
 * the first hit of each is slow enough to blow the recorder's preflight
 * timeout. Warming them keeps that cost out of the recording itself.
 *
 * These are the routes whose takes are click-driven rather than
 * prompt-and-wait, which is where a cold compile actually costs something: a
 * rebuild landing after a tab or a toggle has been clicked remounts the
 * component and drops the state the click just wrote.
 */
export const WARMUP_ROUTES = [
  '/',
  '/quickstart/demo-chat',
  '/shared-state/predictive-state-updates/demo-chat',
  '/generative-ui/your-components/interrupt-based/demo-chat',
  // The take clicks "Toggle Language" and then prompts. A rebuild arriving in
  // between drops the write, so the take prompts in English and proves nothing.
  '/shared-state/in-app-agent-write/demo-chat',
];
