export const ProtocolVersion = {
  V1: 1,
} as const;

export type ProtocolVersion = (typeof ProtocolVersion)[keyof typeof ProtocolVersion];

export type MsgType =
  // client to server
  | "hello"
  | "subscribe"
  | "unsubscribe"
  | "set_filter"
  | "command"
  | "history.get"
  | "ping"
  // reserved voice/tts
  | "voice.start"
  | "voice.stop"
  | "tts.start"
  | "tts.stop"
  // server to client
  | "welcome"
  | "event"
  | "history.result"
  | "error"
  | "dropped"
  | "pong"
  | "ack";

export type EventKind =
  | "input"
  | "system"
  | "task"
  | "schedule"
  | "tool"
  | "device"
  | "notify"
  | "error"
  | "assistant"
  | "log";

export type Level = "debug" | "info" | "warn" | "error";

export type HistoryQueryBy = "recent" | "request_id" | "entity_id" | "trace_id";

export type CommandMode = "chat" | "control" | "schedule" | "raw";

export type Codec = "pcm_s16le" | "opus";
