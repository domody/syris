import type { ServerMessage } from "./server";
import type { TransportEvent } from "./events";

export function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

export function hasT(x: unknown): x is { t: string } {
  return isObject(x) && typeof (x as any).t === "string";
}

export function isServerMessage(x: unknown): x is ServerMessage {
  return hasT(x);
}

export function isEventFrame(x: unknown): x is { t: "event"; event: TransportEvent } {
  return hasT(x) && (x as any).t === "event" && isObject((x as any).event);
}

export function isAckFrame(x: unknown): x is { t: "ack"; request_id: string; ok: boolean } {
  return hasT(x) && (x as any).t === "ack";
}
