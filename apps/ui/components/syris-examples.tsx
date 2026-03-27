"use client"

import { MetricStrip } from "@workspace/ui/components/metric-strip"
import { EventStream } from "@workspace/ui/components/event-stream"
import { RiskGate } from "@workspace/ui/components/risk-gate"
import { LlmFallback } from "@workspace/ui/components/llm-fallback"
import { RiskClassification } from "@workspace/ui/components/risk-classification"
import { ToolExecutions } from "@workspace/ui/components/tool-executions"
import { AuditRetention } from "@workspace/ui/components/audit-retention"
import { AutonomySuspended } from "@workspace/ui/components/autonomy-suspended"
import { RuleConflict } from "@workspace/ui/components/rule-conflict"
import { IncidentTimeline } from "@workspace/ui/components/incident-timeline"

export function SyrisExamples() {
  return (
    <div
      className="grid w-full gap-3 p-4"
      style={{ gridTemplateColumns: "repeat(3, minmax(350px, 500px))" }}
    >
      {/* ── Column 1: Pipeline Activity ── */}
      <div className="flex flex-col gap-3">
        <MetricStrip />
        <EventStream />
        <RiskGate />
      </div>

      {/* ── Column 2: Monitoring & Diagnostics ── */}
      <div className="flex flex-col gap-3">
        <LlmFallback />
        <RiskClassification />
        <ToolExecutions />
        <AuditRetention />
      </div>

      {/* ── Column 3: Alerts & Timelines ── */}
      <div className="flex flex-col gap-3">
        <AutonomySuspended />
        <RuleConflict />
        <IncidentTimeline />
      </div>
    </div>
  )
}
