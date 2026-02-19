import type { ProtocolVersion, CommandMode, HistoryQueryBy, Codec } from "./enums";
import type { RequestId, StreamId } from "./ids";
import type { StreamSubscription, TransportFilters, SubscribeOptions } from "./filters";
import type { JsonObject } from "./json";

export type C_Hello = {
  t: "hello";
  protocol?: ProtocolVersion | number;
  client?: string | null;
  cap?: string[] | null;
  auth_token?: string | null;
};

export type C_Subscribe = {
  t: "subscribe";
  streams?: StreamSubscription[] | null;
  filters?: TransportFilters | null;
  options?: SubscribeOptions | null;
};

export type C_Unsubscribe = {
  t: "unsubscribe";
  stream_names: string[];
};

export type C_SetFilter = {
  t: "set_filter";
  filters: TransportFilters;
};

export type C_Command = {
  t: "command";
  request_id?: RequestId;
  mode?: CommandMode;

  text?: string;

  action?: string | null;
  entity_id?: string | null;
  args?: JsonObject | null;

  source?: string | null;
};

export type C_HistoryGet = {
  t: "history.get";
  by?: HistoryQueryBy;
  value?: string | null;
  limit?: number | null;
  after_ts_ms?: number | null;
  before_ts_ms?: number | null;
};

export type C_Ping = {
  t: "ping";
  nonce?: string | null;
};

// reserved voice control frames (JSON)
export type C_VoiceStart = {
  t: "voice.start";
  request_id: RequestId;
  stream_id?: StreamId | null;
  codec?: Codec | null;
  sample_rate?: number | null;
  channels?: number | null;
};

export type C_VoiceStop = {
  t: "voice.stop";
  request_id: RequestId;
  stream_id?: StreamId | null;
};

export type C_TTSStart = {
  t: "tts.start";
  request_id: RequestId;
  stream_id?: StreamId | null;
  codec?: Codec | null;
};

export type C_TTSStop = {
  t: "tts.stop";
  request_id: RequestId;
  stream_id?: StreamId | null;
};

export type ClientMessage =
  | C_Hello
  | C_Subscribe
  | C_Unsubscribe
  | C_SetFilter
  | C_Command
  | C_HistoryGet
  | C_Ping
  | C_VoiceStart
  | C_VoiceStop
  | C_TTSStart
  | C_TTSStop;
