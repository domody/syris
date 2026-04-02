import type {
  AuditEvent,
  AutonomyLevelCode,
  RiskLevel,
  TaskResponse,
} from "@/lib/api/types"

// ── Approvals ────────────────────────────────────────────────────────────────

export type ApprovalStatus = "pending" | "approved" | "denied" | "expired"

export interface Approval {
  id: string
  trace_id: string
  task_id: string | null
  title: string
  risk: RiskLevel
  gate_reason: string
  status: ApprovalStatus
  requested_at: string
  expires_at: string
  resolved_at: string | null
  resolved_by: string | null
  deny_reason: string | null
  what: {
    tool: string
    action: string
    [key: string]: unknown
  }
}

// ── Alarms ───────────────────────────────────────────────────────────────────

export type AlarmStatus = "open" | "acked" | "resolved"
export type AlarmSeverity = "warning" | "error" | "critical"

export interface AlarmTransition {
  status: AlarmStatus
  at: string
  note: string | null
}

export interface Alarm {
  id: string
  severity: AlarmSeverity
  trigger_type: string
  title: string
  detail: string
  status: AlarmStatus
  dedupe_key: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  resolution_note: string | null
  transitions: AlarmTransition[]
  related_entity: {
    type: "integration" | "task" | "watcher"
    id: string
    label: string
  } | null
}

// ── Feed / Audit ─────────────────────────────────────────────────────────────

export type FeedLane = "fast" | "task" | "gated" | null

export interface FeedEvent extends AuditEvent {
  lane: FeedLane
}

// ── Workload summary ─────────────────────────────────────────────────────────

export interface WorkloadSummary {
  running_tasks: number
  paused_tasks: number
  pending_approvals: number
  active_schedules: number
  active_watchers: number
  active_rules: number
  healthy_integrations: number
  total_integrations: number
}

// ── System state ─────────────────────────────────────────────────────────────

export interface SystemState {
  status: "healthy" | "degraded" | "partial_outage"
  autonomy: AutonomyLevelCode
  uptime: string
  pipeline: "active" | "paused"
  last_heartbeat: string
  events_today: number
  tool_calls_today: number
  fast_count: number
  task_count: number
  gated_count: number
}

// Re-export for convenience
export type { AuditEvent, TaskResponse }
