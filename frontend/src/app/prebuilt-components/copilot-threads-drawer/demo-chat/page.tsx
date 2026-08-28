"use client";

import {
  CopilotChat,
  CopilotChatConfigurationProvider,
  CopilotThreadsDrawer,
} from "@copilotkit/react-core/v2";

import { DemoFrame } from "@/components/demo-frame";

/** The runtime id this demo binds to. Also shown in the demo header. */
const AGENT_ID = "sample_agent";

/**
 * The doc's whole integration: a drawer and a chat inside one shared
 * `CopilotChatConfigurationProvider`.
 *
 * The shared configuration is the point. It holds the active thread, so
 * selecting a row connects the chat to that thread and replays its history, and
 * the "New Conversation" row resets the chat to a fresh welcome screen — with no
 * `threadId` state, no selection handler, and no props passed between the two
 * components.
 *
 * `CopilotKitProvider` is not repeated here; the app already mounts one at the
 * root. The doc nests them because its sample is a whole page.
 *
 * One departure, and it is presentational only. The doc's wrapper is
 * `<div style={{ display: "flex", height: "100dvh" }}>` with the two components
 * as bare children. In a flex row `CopilotChat` has no flex basis of its own, so
 * it collapses to min-content — the chat renders one word per line beside a
 * full-width drawer. `flex: 1` plus `minWidth: 0` gives it the remaining space;
 * `minWidth` matters because a flex item's default `min-width: auto` refuses to
 * shrink below its content and would push the layout wider than the viewport.
 */
export default function Page() {
  return (
    <DemoFrame
      parentPath="/prebuilt-components/copilot-threads-drawer"
      subtitle={`agent: ${AGENT_ID} · CopilotThreadsDrawer + CopilotChat`}
    >
      <CopilotChatConfigurationProvider agentId={AGENT_ID}>
        <div style={{ display: "flex", height: "100%" }}>
          <CopilotThreadsDrawer />
          <div style={{ flex: 1, minWidth: 0 }}>
            <CopilotChat />
          </div>
        </div>
      </CopilotChatConfigurationProvider>
    </DemoFrame>
  );
}
