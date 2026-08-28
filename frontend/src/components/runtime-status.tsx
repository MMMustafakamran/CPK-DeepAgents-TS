import { getRuntimeInfo } from "@/lib/runtime-info";

function Row({
  tone,
  label,
  detail,
}: {
  tone: "ok" | "bad" | "neutral";
  label: string;
  detail: string;
}) {
  const dot =
    tone === "neutral" ? "bg-slate-400" : tone === "ok" ? "bg-emerald-500" : "bg-rose-500";
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{label}</p>
        <p className="break-words text-xs text-slate-500 dark:text-slate-400">{detail}</p>
      </div>
    </li>
  );
}

/**
 * Server component: probes the agent server and the runtime during render, so
 * the Quickstart shows what `[[...slug]]/route.ts` actually negotiated rather
 * than what the env file claims.
 *
 * Three independent axes, and conflating them is the usual way to lose an hour:
 *
 *   - **mode** — did the runtime read `INTELLIGENCE_API_KEY` at all.
 *   - **licenseStatus** — a different credential (`COPILOTKIT_LICENSE_TOKEN`),
 *     and the one the Threads Drawer gates its unlocked UI on.
 *   - **threadEndpoints** — what the runtime says it can do. SSE mode already
 *     reports `list: true` from its in-memory runner, so this flag alone is a
 *     false positive for "Intelligence is on".
 */
export async function RuntimeStatus() {
  const info = await getRuntimeInfo();

  const intelligenceLive = info.mode === "intelligence";
  const enabled = Object.entries(info.threadEndpoints ?? {})
    .filter(([, v]) => v)
    .map(([k]) => k)
    .join(", ");

  const intelligenceDetail = intelligenceLive
    ? `Mode "intelligence"${enabled ? `, threadEndpoints ${enabled}` : ""}. This says the key was read, not that the platform accepted it — a bad key still reports this. Confirm by sending a message and looking for the thread in your project dashboard.`
    : info.intelligenceKeySet
      ? 'INTELLIGENCE_API_KEY is set, but /info still reports mode "sse" — the key was rejected or never reached the platform.'
      : 'Not configured. /info reports mode "sse": an in-memory runner backs the threads, so chat works everywhere and thread list/inspect answer locally, but mutations and realtime metadata stay off and nothing persists across a restart.';

  const licenseOk = info.licenseStatus === "valid" || info.licenseStatus === "expiring";
  const licenseDetail = licenseOk
    ? `licenseStatus "${info.licenseStatus}" — feature UIs that gate on a license (the Threads Drawer) render unlocked.`
    : info.licenseTokenSet
      ? `COPILOTKIT_LICENSE_TOKEN is set but /info reports licenseStatus "${info.licenseStatus ?? "none"}" — the token was rejected.`
      : `No COPILOTKIT_LICENSE_TOKEN, so /info reports licenseStatus "${info.licenseStatus ?? "none"}". Threads can still work; the Drawer will show its locked "Upgrade" view anyway, because it reads this field and not whether threads function.`;

  return (
    <ul className="space-y-3">
      <Row
        tone={info.agent.ok ? "ok" : "bad"}
        label="Agent server"
        detail={info.agent.detail}
      />
      <Row
        tone={info.runtime.ok ? "ok" : "bad"}
        label="Copilot Runtime (/api/copilotkit/info)"
        detail={info.runtime.detail}
      />
      <Row
        tone={intelligenceLive ? "ok" : "neutral"}
        label="CopilotKit Intelligence"
        detail={intelligenceDetail}
      />
      <Row
        tone={licenseOk ? "ok" : "neutral"}
        label="License (Threads Drawer gate)"
        detail={licenseDetail}
      />
      {info.agentIds.length > 0 && (
        <Row
          tone="ok"
          label={`${info.agentIds.length} graph(s) registered`}
          detail={info.agentIds.join(", ")}
        />
      )}
    </ul>
  );
}
