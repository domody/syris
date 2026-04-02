import type { AuditEvent, SSEHealthPayload } from "@/lib/api/types"

export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

export interface SSEEvent<P = Record<string, unknown>> {
  stream_type: string
  trace_id: string
  timestamp: string
  payload: P
}

export type SSEEventMap = {
  audit_event: AuditEvent
  health: SSEHealthPayload
} & Record<string, unknown>

export type EventBuckets = {
  [K in keyof SSEEventMap]: SSEEvent<SSEEventMap[K]>[]
}
