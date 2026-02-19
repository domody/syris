"use client";

import * as React from "react";

import { Panel, TerminalFeed } from "./base-panel";
import { ServerMessageItem } from "../ui/server-message-item";

import { useDashboardStore } from "@/state/dashboard-store";
import { ServerMessage } from "@/types";

export function EventStreamPanel() {
  const messages = useDashboardStore((s) => s.messages.items);

  const eventStream: ServerMessage[] = React.useMemo(() => {
    return messages.slice(Math.max(0, messages.length - 200));
  }, [messages]);

  return (
    <Panel title="Event Stream">
      <TerminalFeed 
        items={eventStream}
        renderItem={(m, i) => <ServerMessageItem key={keyForMessage(m, i)} message={m} />}
      />
      {/* <TerminalFeed 
      items={Array.from({ length: 10}).flatMap((_, repeatIndex) => test)}
      renderItem={(m, i) => <ServerMessageItem key={keyForMessage(m, i)} message={m} />}
      /> */}
      
      {/* <div ref={containerRef} className="h-full w-full overflow-y-auto">
        <div className="flex flex-col gap-1">
          {Array.from({ length: 10 }).flatMap((_, repeatIndex) =>
            test.map((message, index) => (
              <ServerMessageItem
                key={`${repeatIndex}-${keyForMessage(message, index)}`}
                message={message}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </div> */}
    </Panel>
  );
}

function keyForMessage(msg: ServerMessage, fallbackIndex: number) {
  if (msg.t === "event") return msg.event.id;
  if (msg.t === "ack") return `ack:${msg.request_id}:${fallbackIndex}`;
  if (msg.t === "error")
    return `err:${msg.code}:${msg.request_id ?? "none"}:${fallbackIndex}`;
  if (msg.t === "pong") return `pong:${msg.nonce ?? "none"}:${fallbackIndex}`;
  if (msg.t === "welcome") return `welcome:${msg.session_id}`;
  if (msg.t === "dropped") return `dropped:${fallbackIndex}`;
  if (msg.t === "history.result")
    return `history:${msg.by}:${msg.value ?? "none"}:${fallbackIndex}`;
  // return `${msg.t}:${fallbackIndex}`;
}

const test: ServerMessage[] = [
  {
    t: "event",
    server_ts_ms: 1767529554007,
    event: {
      id: "34526d98-ba77-4317-a30c-e58fdfb92463",
      ts_ms: 1767529554007,
      kind: "device",
      level: "info",
      trace_id: "440b4ce7-960f-4fae-a3ce-546c31e88427",
      request_id: null,
      parent_event_id: null,
      entity_id: "sun.sun",
      user_id: null,
      source: "home_assistant",
      integration_id: null,
      tool_name: null,
      schema: null,
      payload: {
        entity_id: "sun.sun",
        domain: "sun",
        new_state: "above_horizon",
        old_state: "above_horizon",
        name: "Sun",
        old_attributes: {
          next_dawn: "2026-01-05T07:59:25.320404+00:00",
          next_dusk: "2026-01-04T16:44:48.136645+00:00",
          next_midnight: "2026-01-05T00:22:35+00:00",
          next_noon: "2026-01-05T12:22:21+00:00",
          next_rising: "2026-01-05T08:46:23.023513+00:00",
          next_setting: "2026-01-04T15:57:40.512429+00:00",
          elevation: 11.52,
          azimuth: 179.94,
          rising: false,
          friendly_name: "Sun",
        },
        new_attributes: {
          next_dawn: "2026-01-05T07:59:25.320404+00:00",
          next_dusk: "2026-01-04T16:44:48.136645+00:00",
          next_midnight: "2026-01-05T00:22:35+00:00",
          next_noon: "2026-01-05T12:22:21+00:00",
          next_rising: "2026-01-05T08:46:23.023513+00:00",
          next_setting: "2026-01-04T15:57:40.512429+00:00",
          elevation: 11.52,
          azimuth: 180.88,
          rising: false,
          friendly_name: "Sun",
        },
      },
    },
  },
  {
    t: "event",
    server_ts_ms: 1767529554007,
    event: {
      id: "8c20d1dc-e2e4-420d-bc3b-16d2ccda717e",
      ts_ms: 1767529545997,
      kind: "assistant",
      level: "info",
      trace_id: "ae2c105c-da7a-4110-b883-8312dd2694ab",
      request_id: "req_test_1",
      parent_event_id: null,
      entity_id: null,
      user_id: null,
      source: "orchestrator",
      integration_id: null,
      tool_name: null,
      schema: null,
      payload: { text: "Hello, sir!" },
    },
  },
  {
    t: "event",
    server_ts_ms: 1767529554007,
    event: {
      id: "f9e4cdcd-1593-46a1-913b-3f33c8263d24",
      ts_ms: 1767529529609,
      kind: "input",
      level: "info",
      trace_id: "ae2c105c-da7a-4110-b883-8312dd2694ab",
      request_id: "req_test_1",
      parent_event_id: null,
      entity_id: null,
      user_id: "dev",
      source: "dashboard:s_9514d8a3-aef1-4df7-90fd-665024e92206",
      integration_id: null,
      tool_name: null,
      schema: null,
      payload: { text: "hello" },
    },
  },
  {
    t: "ack",
    server_ts_ms: 1767529553007,
    request_id: "req_test_1",
    ok: true,
    message: "queued",
  },
];
