import type { ServerMessage } from "./server";

export function isServerMessage(x: unknown): x is ServerMessage {
  return typeof x === "object" && x !== null && "t" in x;
}

export function isEventMessage(x: unknown): x is Extract<ServerMessage, { t: "event" }> {
  return isServerMessage(x) && (x as any).t === "event";
}

export function isWelcomeMessage(x: unknown): x is Extract<ServerMessage, { t: "welcome" }> {
  return isServerMessage(x) && (x as any).t === "welcome";
}

export function isAckMessage(x: unknown): x is Extract<ServerMessage, { t: "ack" }> {
  return isServerMessage(x) && (x as any).t === "ack";
}

export function isErrorMessage(x: unknown): x is Extract<ServerMessage, { t: "error" }> {
  return isServerMessage(x) && (x as any).t === "error";
}

export function isHistoryResultMessage(x: unknown): x is Extract<ServerMessage, { t: "history.result" }> {
  return isServerMessage(x) && (x as any).t === "history.result";
}
