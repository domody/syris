import type { RiskLevel } from "../common";

export type AuditEventStage =
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
  | "task";

export type AuditEventOutcome = "success" | "failure" | "suppressed" | "info";

export type AuditEvent = {
  audit_id: string;
  timestamp: string;
  trace_id: string;
  stage: AuditEventStage;
  type: string;
  summary: string;
  outcome: AuditEventOutcome;
  latency_ms?: number;
  ref_event_id?: string;
  ref_task_id?: string;
  ref_step_id?: string;
  ref_tool_call_id?: string;
  ref_approval_id?: string;
  tool_name?: string;
  connector_id?: string;
  risk_level?: RiskLevel;
  autonomy_level?: "A0" | "A1" | "A2" | "A3" | "A4";
  payload_ref?: string;
};
