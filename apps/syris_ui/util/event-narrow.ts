import type {
  TransportEvent,
  ToolPayload,
  DevicePayload,
  IntegrationHealthPayload,
  TraceLinkPayload,
  AssistantPayload,
  InputPayload,
} from "@/types";

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function asToolPayload(ev: TransportEvent): ToolPayload | null {
  if (ev.kind !== "tool") return null;
  return ev.payload as unknown as ToolPayload;
}

export function asDevicePayload(ev: TransportEvent): DevicePayload | null {
  if (ev.kind !== "device") return null;
  const p = ev.payload as any;
  if (!p || typeof p.entity_id !== "string") return null;
  return p as DevicePayload;
}

export function asAssistantPayload(ev: TransportEvent): AssistantPayload | null {
  if (ev.kind !== "assistant") return null;
  const p = ev.payload as any;
  if (!p || typeof p.text !== "string") return null;
  return p as AssistantPayload;
}

export function asInputPayload(ev: TransportEvent): InputPayload | null {
  if (ev.kind !== "input") return null;
  const p = ev.payload as any;
  if (!p || typeof p.text !== "string") return null;
  return p as InputPayload;
}

export function asIntegrationHealthPayload(ev: TransportEvent): IntegrationHealthPayload | null {
  // you may emit as kind=system + payload.kind=integration.health OR schema-based later
  const p = ev.payload as any;
  if (!p || p.kind !== "integration.health") return null;
  if (typeof p.integration_id !== "string" || !isObject(p.patch)) return null;
  return p as IntegrationHealthPayload;
}

export function asTraceLinkPayload(ev: TransportEvent): TraceLinkPayload | null {
  const p = ev.payload as any;
  if (!p || p.kind !== "trace.link") return null;
  if (typeof p.cause_event_id !== "string" || typeof p.effect_event_id !== "string") return null;
  return p as TraceLinkPayload;
}
