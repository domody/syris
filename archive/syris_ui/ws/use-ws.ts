"use client";

import * as React from "react";

import type { ClientMessage, ServerMessage } from "@/types";
import { isServerMessage } from "@/types";
import { useDashboardStore } from "@/state/dashboard-store";

function getWsUrl(): string {
  const env = process.env.NEXT_PUBLIC_SYRIS_WS_URL;
  if (env && env.length > 0) return env;

  if (typeof window !== "undefined") {
    const proto = window.location.protocol === "https" ? "wss" : "ws";
    return `${proto}://${window.location.hostname}:42315/ws`;
  }

  return "ws://localhost:42315/ws";
}

function safeJsonParse(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

export function useWs() {
  const wsRef = React.useRef<WebSocket | null>(null);
  const reconnectTimer = React.useRef<number | null>(null);
  const backoffMs = React.useRef<number>(250);

  const setWsStatus = useDashboardStore((s) => s.setWsStatus);
  const setSendJson = useDashboardStore((s) => s.setSendJson);
  const ingestServerMessage = useDashboardStore((s) => s.ingestServerMessage);

  const connect = React.useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const url = getWsUrl();
    setWsStatus("connecting");

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsStatus("connected");
      backoffMs.current = 250;

      setSendJson((msg) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify(msg));
        }
      });

      ws.send(
        JSON.stringify({
          t: "hello",
          protocol: 1,
          client: "syris-dashboard",
          cap: ["events", "commands"],
        } satisfies ClientMessage)
      );

      ws.send(
        JSON.stringify({
          t: "subscribe",
          streams: [{ name: "all" }],
          filters: {},
          options: { include_recent: true, recent_limit: 200 },
        } satisfies ClientMessage)
      );

      ws.onmessage = (event) => {
        const data =
          typeof event.data === "string" ? safeJsonParse(event.data) : null;
        if (!data) return;

        if (isServerMessage(data)) {
          ingestServerMessage(data as ServerMessage);
        } else {
          // ignoring malformed framed
        }
      };

      ws.onerror = () => {
        // let on close handle the reconnect
      };
    };
    ws.onclose = () => {
      setWsStatus("disconnected");
      setSendJson(null);

      const ms = backoffMs.current;
      backoffMs.current = Math.min(10_000, Math.floor(backoffMs.current * 1.7));

      if (reconnectTimer.current) window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = window.setTimeout(() => connect(), ms);
    };
  }, [ingestServerMessage, setSendJson, setWsStatus]);

  const disconnect = React.useCallback(() => {
    if (reconnectTimer.current) {
      window.clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    backoffMs.current = 250;

    setSendJson(null);
    setWsStatus("disconnected");

    wsRef.current?.close();
    wsRef.current = null;
  }, [setSendJson, setWsStatus]);

  React.useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    connect,
    disconnect,
  };
}
