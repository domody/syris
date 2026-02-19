import type { EventId } from "./ids";
import type { EventKind, Level } from "./enums";
import type { JsonObject } from "./json";

export type TransportEvent = {
  id: EventId;
  ts_ms: number;

  kind: EventKind;
  level: Level;

  trace_id?: string | null;
  request_id?: string | null;
  parent_event_id?: string | null;

  entity_id?: string | null;

  user_id?: string | null;
  source?: string | null;

  integration_id?: string | null;
  tool_name?: string | null;

  schema?: string | null; // e.g. "trace.link.v1", "integration.health.v1"
  payload: JsonObject;
};

/** Payload narrowers */

export type InputPayload = { text: string } & JsonObject;

export type AssistantPayload = { text: string; final?: boolean | null; chunk_index?: number | null } & JsonObject;

export type ToolPayload = {
  kind?: string | null;
  domain?: string | null;
  service?: string | null;
  phase?: "start" | "success" | "failure" | string | null;
  duration_ms?: number | null;
  args?: JsonObject | null;
  result?: JsonObject | null;
  error?: (JsonObject & { type?: string | null; message?: string | null; retryable?: boolean | null }) | null;
} & JsonObject;

export type DevicePayload = {
  entity_id: string;
  domain?: string | null;
  name?: string | null;
  old_state?: unknown;
  new_state?: unknown;
  old_attributes?: JsonObject | null;
  new_attributes?: JsonObject | null;
} & JsonObject;

export type TraceLinkPayload = {
  kind: "trace.link";
  cause_event_id: string;
  effect_event_id: string;
  trace_id?: string | null;
  request_id?: string | null;
  matched_on?: JsonObject | null;
  confidence?: number | null;
  reason?: string | null;
} & JsonObject;

export type IntegrationHealthPayload = {
  kind: "integration.health";
  integration_id: string;
  patch: JsonObject;
} & JsonObject;