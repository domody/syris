export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface SSEEvent<P = Record<string, unknown>> {
  stream_type: string;
  trace_id: string;
  timestamp: string;
  payload: P;
}

export type EventBuckets = Record<string, SSEEvent[]>;
