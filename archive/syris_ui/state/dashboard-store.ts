"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  ClientMessage,
  ServerMessage,
  TransportEvent,
  EventKind,
  Level,
  RequestId,
} from "@/types";

type WsStatus = "disconnected" | "connecting" | "connected"

type RequestStatus = "queued" | "running" | "done" | "failed"


export type TrackedRequest = {
  request_id: RequestId;
  text?: string;
  status: RequestStatus;
  created_at_ms: number;
  updated_at_ms: number;
  last_event_ts_ms?: number;
  error?: string | null;
};

export type IntegrationHealthSnapshot = {
  integration_id: string;
  connected?: boolean;
  ws_alive?: boolean;
  last_error?: { code?: string; message?: string } | null;
  phase?: string | null;
  updated_at_ms: number;
};

export type EntitySnapshot = {
  entity_id: string;
  domain?: string | null;
  name?: string | null;
  state?: unknown;
  attributes?: Record<string, unknown> | null;
  updated_at_ms: number;
};

type MessageRing = {
  max: number;
  items: ServerMessage[];
};

function pushRing(ring: MessageRing, msg: ServerMessage): MessageRing {
  const next = [...ring.items, msg];
  if (next.length > ring.max) next.splice(0, next.length - ring.max);
  return { ...ring, items: next };
}

function pushIndex(index: Record<string, string[]>, key: string, eventId: string, maxPerKey = 2000) {
  const arr = index[key] ?? [];
  arr.push(eventId);
  if (arr.length > maxPerKey) arr.splice(0, arr.length - maxPerKey);
  index[key] = arr;
}

function coerceString(x: unknown): string | null {
  return typeof x === "string" && x.length > 0 ? x : null;
}

function nowMs() {
  return Date.now();
}

export type DashboardState = {
  // ws
  wsStatus: WsStatus;
  setWsStatus: (s: WsStatus) => void;

  // sending (hook injects)
  sendJson: ((msg: ClientMessage) => void) | null;
  setSendJson: (fn: ((msg: ClientMessage) => void) | null) => void;

  // stream control
  paused: boolean;
  setPaused: (v: boolean) => void;

  // selection
  activeRequestId: string | null;
  setActiveRequestId: (id: string | null) => void;

  selectedEventId: string | null;
  setSelectedEventId: (id: string | null) => void;

  inspectorOpen: boolean;
  setInspectorOpen: (v: boolean) => void;

  // filters (you can use later)
  filterKinds: EventKind[] | null;
  setFilterKinds: (kinds: EventKind[] | null) => void;

  filterLevels: Level[] | null;
  setFilterLevels: (levels: Level[] | null) => void;

  searchText: string;
  setSearchText: (s: string) => void;

  // data
  messages: MessageRing;

  eventsById: Record<string, TransportEvent>;
  byRequestId: Record<string, string[]>;
  byEntityId: Record<string, string[]>;
  byTraceId: Record<string, string[]>;

  // derived
  integration: Record<string, IntegrationHealthSnapshot>;
  entities: Record<string, EntitySnapshot>;

  // requests
  requests: Record<string, TrackedRequest>;

  // actions
  ingestServerMessage: (msg: ServerMessage) => void;
  ingestEvent: (ev: TransportEvent) => void;

  sendCommand: (text: string, requestId?: string) => string; // returns requestId
};

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      wsStatus: "disconnected",
      setWsStatus: (s) => set({ wsStatus: s }),

      sendJson: null,
      setSendJson: (fn) => set({ sendJson: fn }),

      paused: false,
      setPaused: (v) => set({ paused: v }),

      activeRequestId: null,
      setActiveRequestId: (id) => set({ activeRequestId: id }),

      selectedEventId: null,
      setSelectedEventId: (id) => set({ selectedEventId: id }),

      inspectorOpen: false,
      setInspectorOpen: (v) => set({ inspectorOpen: v }),

      filterKinds: null,
      setFilterKinds: (kinds) => set({ filterKinds: kinds }),

      filterLevels: null,
      setFilterLevels: (levels) => set({ filterLevels: levels }),

      searchText: "",
      setSearchText: (s) => set({ searchText: s }),

      messages: { max: 3000, items: [] },

      eventsById: {},
      byRequestId: {},
      byEntityId: {},
      byTraceId: {},

      integration: {},
      entities: {},

      requests: {},

      ingestServerMessage: (msg) => {
        const state = get();
        if (state.paused) {
          // still buffer messages while paused
          // return;
        }

        set((s) => ({
          messages: pushRing(s.messages, msg),
        }));

        // if its an event, ingest it deeper
        if (msg.t === "event") {
          get().ingestEvent(msg.event);
        }

        // If it's an ack/error, update request status (nice for your requests panel)
        if (msg.t === "ack") {
          const rid = msg.request_id;
          set((s) => {
            const existing = s.requests[rid];
            if (!existing) return s;
            return {
              ...s,
              requests: {
                ...s.requests,
                [rid]: {
                  ...existing,
                  status: msg.ok ? existing.status : "failed",
                  updated_at_ms: nowMs(),
                  error: msg.ok ? existing.error : (msg.message ?? "ack failed"),
                },
              },
            };
          });
        }

        if (msg.t === "error") {
          const rid = msg.request_id ?? null;
          if (rid) {
            set((s) => {
              const existing = s.requests[rid];
              if (!existing) return s;
              return {
                ...s,
                requests: {
                  ...s.requests,
                  [rid]: {
                    ...existing,
                    status: "failed",
                    updated_at_ms: nowMs(),
                    error: msg.message ?? "error",
                  },
                },
              };
            });
          }
        }
      },

      ingestEvent: (ev) => {
        set((s) => {
          // store event by id
          s.eventsById[ev.id] = ev;

          // indexes
          if (ev.request_id) pushIndex(s.byRequestId, ev.request_id, ev.id);
          if (ev.entity_id) pushIndex(s.byEntityId, ev.entity_id, ev.id);
          if (ev.trace_id) pushIndex(s.byTraceId, ev.trace_id, ev.id);

          // also promote request_id from payload if present (trace.link often)
          const pRid = coerceString((ev.payload as any)?.request_id);
          if (pRid) pushIndex(s.byRequestId, pRid, ev.id);

          // derived: integration health
          const pKind = (ev.payload as any)?.kind;
          if (pKind === "integration.health") {
            const integration_id = coerceString((ev.payload as any)?.integration_id);
            const patch = (ev.payload as any)?.patch;

            if (integration_id) {
              const prev = s.integration[integration_id];
              const next: IntegrationHealthSnapshot = {
                integration_id,
                connected: typeof patch?.connected === "boolean" ? patch.connected : prev?.connected,
                ws_alive: typeof patch?.ws_alive === "boolean" ? patch.ws_alive : prev?.ws_alive,
                last_error: patch?.last_error ?? prev?.last_error ?? null,
                phase: patch?.details?.phase ?? prev?.phase ?? null,
                updated_at_ms: nowMs(),
              };
              s.integration[integration_id] = next;
            }
          }

          // derived: last-known entity state
          if (ev.kind === "device") {
            const entity_id = coerceString((ev.payload as any)?.entity_id) ?? ev.entity_id;
            if (entity_id) {
              s.entities[entity_id] = {
                entity_id,
                domain: coerceString((ev.payload as any)?.domain),
                name: coerceString((ev.payload as any)?.name),
                state: (ev.payload as any)?.new_state,
                attributes: ((ev.payload as any)?.new_attributes ?? null) as any,
                updated_at_ms: nowMs(),
              };
            }
          }

          // requests: move queued -> running/done based on events
          if (ev.request_id) {
            const rid = ev.request_id;
            const req = s.requests[rid];
            if (req) {
              const updated: TrackedRequest = {
                ...req,
                updated_at_ms: nowMs(),
                last_event_ts_ms: ev.ts_ms,
              };

              // running when anything beyond input arrives
              if (updated.status === "queued" && ev.kind !== "input") {
                updated.status = "running";
              }

              // done when assistant output arrives (simple heuristic)
              if (ev.kind === "assistant") {
                updated.status = "done";
              }

              // failed when tool failure appears
              if (ev.kind === "tool" && (ev.payload as any)?.phase === "failure") {
                updated.status = "failed";
                const em = (ev.payload as any)?.error?.message;
                updated.error = typeof em === "string" ? em : "tool failure";
              }

              s.requests[rid] = updated;
            }
          }

          return s;
        });
      },

      sendCommand: (text, requestId) => {
        console.log(text, requestId)
        const send = get().sendJson;
        console.log(send)
        const rid = requestId ?? `req_${Math.random().toString(16).slice(2, 10)}`;

        // track request immediately
        set((s) => ({
          requests: {
            ...s.requests,
            [rid]: {
              request_id: rid,
              text,
              status: "queued",
              created_at_ms: nowMs(),
              updated_at_ms: nowMs(),
              error: null,
            },
          },
          activeRequestId: rid,
        }));

        // send if connected
        if (send) {
          console.log("Sending...")
          send({
            t: "command",
            request_id: rid,
            mode: "chat",
            text,
            source: "dashboard",
          });
        } else {
            // mayb mark as failed here
            console.log("Nope")
        }

        return rid;
      },
    }),
    {
      name: "syris.dashboard",
      partialize: (state) => ({
        // persist only user prefs, not event data
        filterKinds: state.filterKinds,
        filterLevels: state.filterLevels,
        searchText: state.searchText,
      }),
    }
  )
);


