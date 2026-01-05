"use client";

import * as React from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

import { Panel, TerminalFeed } from "./base-panel";
import { ServerMessageItem } from "../ui/server-message-item";

import { useDashboardStore } from "@/state/dashboard-store";
import { ServerMessage, S_Event } from "@/types";
import { summarizeEvent } from "@/util/event-summary";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp02Icon } from "@hugeicons/core-free-icons";
import { formatTime } from "@/util/format";

export function CommandConsole() {
  const activeRequestId = useDashboardStore((s) => s.activeRequestId);
  const messages = useDashboardStore((s) => s.messages.items);
  const byRequestId = useDashboardStore((s) => s.byRequestId);
  const eventsById = useDashboardStore((s) => s.eventsById);

  const displayPerRequest = false;

  const transcript: ServerMessage[] = React.useMemo(() => {
    const isConsoleFrame = (m: ServerMessage) => {
      if (m.t !== "event") return false;
      return m.event.kind === "input" || m.event.kind === "assistant";
    };

    if (activeRequestId && displayPerRequest) {
      const ids = byRequestId[activeRequestId] ?? [];
      const evs = ids
        .map((id) => eventsById[id])
        .filter(Boolean)
        .filter((ev) => ev.kind === "input" || ev.kind === "assistant");

      return evs.map((event) => ({
        t: "event",
        server_ts_ms: event.ts_ms, // temp
        event,
      }));
    }

    console.log(messages);
    const transcript = messages.filter(isConsoleFrame);
    console.log(transcript);
    return transcript.slice(Math.max(0, transcript.length - 50));
  }, [activeRequestId, byRequestId, eventsById, messages]);

  return (
    <Panel title="Command Console" footer={<ConsoleInput />}>
      <TerminalFeed
        items={transcript}
        renderItem={(m, i) => (
          // <ServerMessageItem key={keyForMessage(m, i)} message={m} />
          <TranscriptItem key={keyForMessage(m, i)} message={m} />
        )}
      />
    </Panel>
  );
}

function TranscriptItem({ message }: { message: ServerMessage }) {
  if (message.t !== "event") return false;
  const ts = formatTime(message.server_ts_ms);

  return (
    <Item className={"hover:bg-accent/50"}>
      <ItemContent>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground tabular-nums">{ts}</span>
          <span>{message.event.kind === "input" ? `>` : `[SYRIS]`}</span>
          <span>{summarizeEvent(message.event)}</span>
          {/* <span className="text-muted-foreground tabular-nums ml-auto">{ts}</span> */}
        </div>
        {/* <ItemDescription>
          <span className="text-muted-foreground tabular-nums">{ts}</span>
        </ItemDescription> */}
      </ItemContent>
    </Item>
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

function ConsoleInput() {
  const [text, setText] = React.useState("");
  const sendCommand = useDashboardStore((s) => s.sendCommand);
  const wsStatus = useDashboardStore((s) => s.wsStatus);

  const disabled = wsStatus != "connected" || text.trim().length === 0;

  const onSend = React.useCallback(() => {
    const t = text.trim();
    if (!t) return;
    console.log("SENDING", {
      wsStatus,
      hasSendJson: !!useDashboardStore.getState().sendJson,
      t,
    });
    sendCommand(t);
    setText("");
  }, [sendCommand, text, wsStatus]);

  return (
    <InputGroup>
      <InputGroupTextarea
        placeholder={
          wsStatus === "connected"
            ? "Send message..."
            : "Connecting to SYRIS..."
        }
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
      />
      <InputGroupAddon align="block-end">
        <InputGroupButton
          variant="default"
          className="rounded-full ml-auto"
          size="icon-xs"
          disabled={disabled}
          onClick={onSend}
        >
          <HugeiconsIcon icon={ArrowUp02Icon} strokeWidth={2} />
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
