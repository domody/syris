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

// ── Task step detail ─────────────────────────────────────────────────────────

export interface TaskStepDetail {
  step_id: string
  label: string
  is_gate: boolean
  gate_risk?: RiskLevel
  tool_call?: {
    tool: string
    action: string
    request: Record<string, unknown>
    response?: Record<string, unknown>
  }
  idempotency_key: string
  duration_ms?: number
  audit_events: {
    timestamp: string
    type: string
    detail: string
  }[]
}

// ── Schedules ───────────────────────────────────────────────────────────────

export type ScheduleType = "cron" | "interval" | "one_shot"
export type CatchUpPolicy = "fire_once" | "fire_all" | "skip"

export interface ScheduleQuietHours {
  enabled: boolean
  start: string // "22:00"
  end: string   // "07:00"
  timezone: string
}

export interface ScheduleFiringEvent {
  timestamp: string
  outcome: "success" | "failure"
  trace_id: string
  summary: string
}

export interface Schedule {
  id: string
  name: string
  enabled: boolean
  type: ScheduleType
  spec: string
  next_run: string | null
  last_fired: string | null
  catch_up: CatchUpPolicy
  quiet_hours: ScheduleQuietHours
  missed_runs: number
  payload_template: Record<string, unknown>
  recent_firings: ScheduleFiringEvent[]
  created_at: string
}

// ── Watchers ─────────────────────────────────────────────────────────────────

export type WatcherOutcome = "ok" | "changed" | "error" | "suppressed"

export interface WatcherTickEvent {
  timestamp: string
  outcome: WatcherOutcome
  trace_id: string
  summary: string
  latency_ms: number | null
}

export interface WatcherThrottle {
  enabled: boolean
  window_s: number
  max_fires: number
}

export interface Watcher {
  id: string
  name: string
  enabled: boolean
  interval_s: number
  last_tick: string | null
  last_outcome: WatcherOutcome | null
  consecutive_errors: number
  suppression_count: number
  dedupe_window_s: number
  dedupe_current_count: number
  throttle: WatcherThrottle
  related_alarm_id: string | null
  recent_ticks: WatcherTickEvent[]
  created_at: string
}

// ── Rules ─────────────────────────────────────────────────────────────────────

export type ConditionOp = "eq" | "neq" | "contains" | "matches" | "gt" | "lt" | "gte" | "lte"
export type ConditionLogic = "ALL" | "ANY" | "NOT"

export interface RuleCondition {
  type: "logic" | "leaf"
  logic?: ConditionLogic
  children?: RuleCondition[]
  field?: string
  op?: ConditionOp
  value?: string | number | boolean
}

export type RuleActionType = "emit_event" | "notify" | "call_tool"

export interface RuleAction {
  type: RuleActionType
  label: string
  config: Record<string, unknown>
}

export interface RuleFiring {
  timestamp: string
  outcome: "triggered" | "suppressed"
  trace_id: string | null
  suppression_reason: string | null
}

export interface Rule {
  id: string
  name: string
  enabled: boolean
  condition: RuleCondition
  actions: RuleAction[]
  debounce_ms: number | null
  dedupe_window_ms: number | null
  quiet_hours: ScheduleQuietHours | null
  hits_24h: number
  last_fired: string | null
  suppressed_count: number
  cascade_targets: string[]
  recent_activity: RuleFiring[]
  created_at: string
}

// ── Integrations ─────────────────────────────────────────────────────────────

export type IntegrationStatus = "healthy" | "degraded" | "unavailable"
export type ProviderType = "native" | "mcp" | "oauth"

export interface IntegrationAuth {
  type: "api_key" | "oauth" | "none"
  valid: boolean
  expires_at: string | null
  warning: boolean
}

export interface IntegrationRateLimit {
  current: number
  max: number
  resets_at: string | null
}

export interface IntegrationToolCall {
  timestamp: string
  tool: string
  action: string
  outcome: "success" | "deduped" | "failed"
  latency_ms: number | null
  trace_id: string
}

export interface Integration {
  id: string
  name: string
  connector_id: string
  enabled: boolean
  status: IntegrationStatus
  last_ok: string | null
  consecutive_errors: number
  rate_limit: IntegrationRateLimit | null
  auth: IntegrationAuth
  tools: string[]
  scopes: string[]
  provider_type: ProviderType
  tool_call_history: IntegrationToolCall[]
  created_at: string
}

// ── Traces ────────────────────────────────────────────────────────────────────

export type TraceNodeType =
  | "ingest"
  | "normalize"
  | "route"
  | "tool_call"
  | "task"
  | "gate"
  | "child_event"
  | "rule"
  | "schedule"

export type TraceNodeStatus = "success" | "failure" | "pending" | "deduped" | "info"

export interface TraceNode {
  id: string
  type: TraceNodeType
  label: string
  status: TraceNodeStatus
  timestamp: string
  latency_ms: number | null
  detail: string | null
}

export type TraceEdgeType = "flow" | "child" | "approval"

export interface TraceEdge {
  source: string
  target: string
  type: TraceEdgeType
}

export interface TraceGraph {
  trace_id: string
  started_at: string
  nodes: TraceNode[]
  edges: TraceEdge[]
}

// Re-export for convenience
export type { AuditEvent, TaskResponse }
