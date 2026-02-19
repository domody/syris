import type { ProtocolVersion } from "./enums";
import type { SessionId, RequestId } from "./ids";
import type { TransportEvent } from "./events";
import type { JsonObject } from "./json";

type ServerFrameBase = { server_ts_ms: number };

export type S_Welcome = ServerFrameBase & {
  t: "welcome";
  protocol?: ProtocolVersion | number;
  session_id: SessionId;
  server_time_ms: number;
  cap?: string[] | null;
};

export type S_Event = ServerFrameBase & {
  t: "event";
  event: TransportEvent;
};

export type S_HistoryResult = ServerFrameBase & {
  t: "history.result";
  by: string;
  value?: string | null;
  items: TransportEvent[];
};

export type S_Error = ServerFrameBase & {
  t: "error";
  code: string;
  message: string;
  request_id?: RequestId | null;
  details?: JsonObject | null;
};

export type S_Dropped = ServerFrameBase & {
  t: "dropped";
  count: number;
  reason: string;
  stream?: string | null;
};

export type S_Pong = ServerFrameBase & {
  t: "pong";
  nonce?: string | null;
  server_time_ms: number;
};

export type S_Ack = ServerFrameBase & {
  t: "ack";
  request_id: RequestId;
  ok: boolean;
  message?: string | null;
};

export type ServerMessage =
  | S_Welcome
  | S_Event
  | S_HistoryResult
  | S_Error
  | S_Dropped
  | S_Pong
  | S_Ack;
