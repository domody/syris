export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

export interface SSEEvent<P = Record<string, unknown>> {
  stream_type: string;
  trace_id: string;
  timestamp: string;
  payload: P;
}

export type SSEEventMap = {
  audit_event: any;
  health: any;
} & Record<string, unknown>;

export type EventBuckets = {
  [K in keyof SSEEventMap]: SSEEvent<SSEEventMap[K]>[];
};
