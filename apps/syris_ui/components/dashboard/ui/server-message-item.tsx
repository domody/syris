"use client";
import * as React from "react";

import type {
  ServerMessage,
  S_Event,
  S_Ack,
  S_Error,
  S_Welcome,
  S_Dropped,
  S_HistoryResult,
  S_Pong,
  TransportEvent,
} from "@/types";

import { formatTime, truncate } from "@/util/format";
import { shortId, shortRequestId } from "@/util/ids";
import { summarizeEvent } from "@/util/event-summary";
import { kindBadgeVariant, levelBadgeVariant } from "@/util/event-style";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

type CommonItemProps = {
  className?: string;
  onSelectEvent?: (eventId: string) => void;
  onSetActiveRequest?: (requestId: string) => void;
  onCopy?: (text: string) => void;
};

function MetaBadges({ ev }: { ev: TransportEvent }) {
  return (
    <div className="flex items-center gap-2">
      <Badge variant={kindBadgeVariant(ev.kind)}>{ev.kind.toUpperCase()}</Badge>
      <Badge variant={levelBadgeVariant(ev.level)}>
        {ev.level.toUpperCase()}
      </Badge>
    </div>
  );
}

function TitleWithTime({ title, ts }: { title: string; ts: string }) {
  return (
    <ItemTitle className="flex items-center gap-2">
      <span className="text-muted-foreground tabular-nums">{ts}</span>
      <span className="font-mono">{title}</span>
    </ItemTitle>
  );
}

export function EventItem({
  message,
  className,
  onSelectEvent,
  onSetActiveRequest,
  onCopy,
}: { message: S_Event } & CommonItemProps) {
  const ev = message.event;
  const title = summarizeEvent(ev);
  const ts = formatTime(message.server_ts_ms);

  return (
    <Item
      className={className ?? "hover:bg-accent/50"}
      onClick={() => {
        onSelectEvent?.(ev.id);
        if (ev.request_id) onSetActiveRequest?.(ev.request_id);
      }}
    >
      <ItemContent>
        <div className="flex items-center gap-2">
          <TitleWithTime ts={ts} title={title} />
          <MetaBadges ev={ev} />
        </div>

        <ItemDescription className="mt-1 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
          <span className="text-muted-foreground">id:{shortId(ev.id)}</span>
          {ev.request_id ? (
            <span className="text-muted-foreground">
              req:{shortRequestId(ev.request_id)}
            </span>
          ) : null}
          {ev.entity_id ? (
            <span className="text-muted-foreground">entity:{ev.entity_id}</span>
          ) : null}
          {ev.source ? (
            <span className="text-muted-foreground">
              src:{truncate(ev.source, 60)}
            </span>
          ) : null}
        </ItemDescription>
      </ItemContent>

      <ItemActions className="flex items-center gap-2">
        {ev.request_id ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onSetActiveRequest?.(ev.request_id!);
            }}
          >
            Focus
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onCopy?.(JSON.stringify(message, null, 2));
          }}
        >
          Copy
        </Button>
      </ItemActions>
    </Item>
  );
}

export function AckItem({
  message,
  className,
}: { message: S_Ack } & CommonItemProps) {
  const ts = formatTime(message.server_ts_ms);
  return (
    <Item className={className ?? "hover:bg-accent/50"}>
      <ItemContent>
        <div className="flex items-center gap-2">
          <TitleWithTime
            ts={ts}
            title={shortRequestId(message.request_id ?? "—")}
          />
          <Badge variant={message.ok ? "secondary" : "destructive"}>ACK</Badge>
        </div>

        <ItemDescription className="font-mono text-xs text-muted-foreground">
          {message.message ?? (message.ok ? "queued" : "failed")}
        </ItemDescription>
      </ItemContent>
      <ItemActions />
    </Item>
  );
}

/* ------------------------------ ERROR ITEM ------------------------------ */

export function ErrorItem({
  message,
  className,
  onCopy,
  onSetActiveRequest,
}: { message: S_Error } & CommonItemProps) {
  const rid = message.request_id ?? null;
  const ts = formatTime(message.server_ts_ms);

  return (
    <Item className={className ?? "hover:bg-accent/50"}>
      <ItemContent>
        <ItemTitle className="font-mono flex items-center gap-3">
          <Badge variant="destructive">ERROR</Badge>
          <span>{message.code}</span>
          {rid ? (
            <span className="text-muted-foreground">{shortRequestId(rid)}</span>
          ) : null}
        </ItemTitle>
        <ItemDescription className="font-mono text-xs">
          {truncate(message.message, 180)}
        </ItemDescription>
      </ItemContent>

      <ItemActions className="flex items-center gap-2">
        {rid ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onSetActiveRequest?.(rid);
            }}
          >
            Focus
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onCopy?.(JSON.stringify(message, null, 2));
          }}
        >
          Copy
        </Button>
      </ItemActions>
    </Item>
  );
}

/* ----------------------------- WELCOME ITEM ----------------------------- */

export function WelcomeItem({
  message,
  className,
}: { message: S_Welcome } & CommonItemProps) {
  const ts = formatTime(message.server_ts_ms);

  return (
    <Item className={className ?? "hover:bg-accent/50"}>
      <ItemContent>
        <div className="flex items-center gap-2">
          <TitleWithTime
            ts={ts}
            title={`session:${shortId(message.session_id, 10)}`}
          />
          <span className="text-muted-foreground">
            proto:{String(message.protocol ?? 1)}
          </span>
          <Badge variant="outline">WELCOME</Badge>
        </div>
        <ItemDescription className="font-mono text-xs text-muted-foreground">
          caps: {(message.cap ?? []).join(", ") || "—"}
        </ItemDescription>
      </ItemContent>
      <ItemActions />
    </Item>
  );
}

/* ----------------------------- DROPPED ITEM ----------------------------- */

export function DroppedItem({
  message,
  className,
}: { message: S_Dropped } & CommonItemProps) {
  const ts = formatTime(message.server_ts_ms);

  return (
    <Item className={className ?? "hover:bg-accent/50"}>
      <ItemContent>
        <ItemTitle className="font-mono flex items-center gap-3">
          <Badge variant="default">DROPPED</Badge>
          <span>{message.count}</span>
          <span className="text-muted-foreground">{message.reason}</span>
        </ItemTitle>
        <ItemDescription className="font-mono text-xs text-muted-foreground">
          {message.stream ? `stream: ${message.stream}` : "stream: —"}
        </ItemDescription>
      </ItemContent>
      <ItemActions />
    </Item>
  );
}

/* -------------------------- HISTORY RESULT ITEM ------------------------- */

export function HistoryResultItem({
  message,
  className,
  onCopy,
}: { message: S_HistoryResult } & CommonItemProps) {
  const ts = formatTime(message.server_ts_ms);

  return (
    <Item className={className ?? "hover:bg-accent/50"}>
      <ItemContent>
        <ItemTitle className="font-mono flex items-center gap-3">
          <Badge variant="outline">HISTORY</Badge>
          <span>{message.by}</span>
          {message.value ? (
            <span className="text-muted-foreground">
              {truncate(message.value, 40)}
            </span>
          ) : null}
        </ItemTitle>
        <ItemDescription className="font-mono text-xs text-muted-foreground">
          items: {message.items.length}
        </ItemDescription>
      </ItemContent>
      <ItemActions className="flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onCopy?.(JSON.stringify(message, null, 2));
          }}
        >
          Copy
        </Button>
      </ItemActions>
    </Item>
  );
}

/* -------------------------------- PONG -------------------------------- */

export function PongItem({
  message,
  className,
}: { message: S_Pong } & CommonItemProps) {
  const ts = formatTime(message.server_ts_ms);

  return (
    <Item className={className ?? "hover:bg-accent/50"}>
      <ItemContent>
        <ItemTitle className="font-mono flex items-center gap-3">
          <Badge variant="outline">PONG</Badge>
          {message.nonce ? (
            <span className="text-muted-foreground">nonce:{message.nonce}</span>
          ) : null}
        </ItemTitle>
        <ItemDescription className="font-mono text-xs text-muted-foreground">
          server_time_ms: {message.server_time_ms}
        </ItemDescription>
      </ItemContent>
      <ItemActions />
    </Item>
  );
}


export function ServerMessageItem({
  message,
  className,
  onSelectEvent,
  onSetActiveRequest,
  onCopy,
}: { message: ServerMessage } & CommonItemProps) {
  switch (message.t) {
    case "event":
      return (
        <EventItem
          message={message}
          className={className}
          onSelectEvent={onSelectEvent}
          onSetActiveRequest={onSetActiveRequest}
          onCopy={onCopy}
        />
      );

    case "ack":
      return <AckItem message={message} className={className} />;

    case "error":
      return (
        <ErrorItem
          message={message}
          className={className}
          onCopy={onCopy}
          onSetActiveRequest={onSetActiveRequest}
        />
      );

    case "welcome":
      return <WelcomeItem message={message} className={className} />;

    case "dropped":
      return <DroppedItem message={message} className={className} />;

    case "history.result":
      return (
        <HistoryResultItem
          message={message}
          className={className}
          onCopy={onCopy}
        />
      );

    case "pong":
      return <PongItem message={message} className={className} />;

    // If you add new server message types later, you’ll get a TS error if you enable exhaustive checking.
    default:
      return (
        <Item className={className ?? "hover:bg-accent/50"}>
          <ItemContent>
            <ItemTitle className="font-mono">UNKNOWN</ItemTitle>
            <ItemDescription className="font-mono text-xs text-muted-foreground">
              {(message as any).t ?? "no t"}
            </ItemDescription>
          </ItemContent>
          <ItemActions />
        </Item>
      );
  }
}
