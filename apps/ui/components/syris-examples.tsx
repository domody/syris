"use client"

import { MetricStrip } from "@/components/cards/metric-strip"
import { EventStream } from "@/components/cards/event-stream"
import { RiskGate } from "@/components/cards/risk-gate"
import { LlmFallback } from "@/components/cards/llm-fallback"
import { RiskClassification } from "@/components/cards/risk-classification"
import { ToolExecutions } from "@/components/cards/tool-executions"
import { AuditRetention } from "@/components/cards/audit-retention"
import { AutonomySuspended } from "@/components/cards/autonomy-suspended"
import { RuleConflict } from "@/components/cards/rule-conflict"
import { IncidentTimeline } from "@/components/cards/incident-timeline"

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
