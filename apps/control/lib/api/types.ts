// API response types matching the SYRIS backend schemas

// ── Health ────────────────────────────────────────────────────────────────────

export interface HealthResponse {
  status: "ok" | "degraded"
  service: string
  version: string
  env: string
  run_id: string
  started_at: string
  uptime_s: number
  db: {
    ok: boolean
    error: string | null
  }
  last_heartbeat_at: string | null
  now: string
}

// ── Audit ─────────────────────────────────────────────────────────────────────

export type AuditOutcome = "success" | "failure" | "suppressed" | "info"
export type AuditStage =
  | "normalize"
  | "route"
  | "execute"
  | "tool_call"
  | "gate"
  | "operator"
  | "scheduler"
  | "watcher"
  | "rule"
  | "mcp"
  | "task"
export type RiskLevel = "low" | "medium" | "high" | "critical"
export type AutonomyLevelCode = "A0" | "A1" | "A2" | "A3" | "A4"

export interface AuditEvent {
  audit_id: string
  timestamp: string
  trace_id: string
  stage: AuditStage
  type: string
  summary: string
  outcome: AuditOutcome
  ref_event_id: string | null
  ref_task_id: string | null
  ref_step_id: string | null
  ref_tool_call_id: string | null
  ref_approval_id: string | null
  latency_ms: number | null
  tool_name: string | null
  connector_id: string | null
  risk_level: RiskLevel | null
  autonomy_level: AutonomyLevelCode | null
  payload_ref: string | null
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "paused"
export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped"

export interface TaskStepSummary {
  step_id: string
  step_index: number
  status: StepStatus
  tool_name: string
  attempt_count: number
  error: string | null
}

export interface TaskResponse {
  task_id: string
  trace_id: string
  status: TaskStatus
  handler: string
  input_payload: Record<string, unknown>
  checkpoint: Record<string, unknown>
  retry_policy: {
    max_attempts: number
    backoff_s: number
  }
  error: string | null
  created_at: string
  updated_at: string
  started_at: string | null
  completed_at: string | null
  steps: TaskStepSummary[]
}

// ── SSE payloads ──────────────────────────────────────────────────────────────

export interface SSEHealthPayload {
  run_id: string
  status: string
  uptime_s: number
  service: string
  version: string
}
