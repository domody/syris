"use client"

import { TaskProgress } from "@/components/cards/task-progress"
import { ApprovalGate } from "@/components/cards/approval-gate"
import { SystemHealth } from "@/components/cards/system-health"
import { ScheduleQueue } from "@/components/cards/schedule-queue"
import { TraceTimeline } from "@/components/cards/trace-timeline"
import { TaskSummary } from "@/components/cards/task-summary"
import { ActiveAlarm } from "@/components/cards/active-alarm"
import { AuditStream } from "@/components/cards/audit-stream"
import { ActiveTools } from "@/components/cards/active-tools"
import { ActiveWatchers } from "@/components/cards/active-watchers"
import { RuleDetail } from "@/components/cards/rule-detail"
import { ScopeMatrix } from "@/components/cards/scope-matrix"
import { QueueDepth } from "@/components/cards/queue-depth"
import { SystemStats } from "@/components/cards/system-stats"
import { AutonomyLevel } from "@/components/cards/autonomy-level"
import { EventInspector } from "@/components/cards/event-inspector"
import { DryrunPreview } from "@/components/cards/dryrun-preview"
import { TaskCheckpoint } from "@/components/cards/task-checkpoint"
import { IntentRouting } from "@/components/cards/intent-routing"
import { AuditSearch } from "@/components/cards/audit-search"
import { PolicyToggles } from "@/components/cards/policy-toggles"

export function UiDemo() {
  return (
    <div
      className="grid w-full gap-3 p-4"
      style={{ gridTemplateColumns: "repeat(3, minmax(350px, 500px))" }}
    >
      {/* ── Column 1 ── */}
      <div className="flex flex-col gap-3">
        <TaskProgress />
        <ApprovalGate />
        <SystemHealth />
        <ScheduleQueue />
        <TraceTimeline />
        <TaskSummary />
        <ActiveAlarm />
      </div>

      {/* ── Column 2 ── */}
      <div className="flex flex-col gap-3">
        <AuditStream />
        <ActiveTools />
        <ActiveWatchers />
        <RuleDetail />
        <ScopeMatrix />
        <QueueDepth />
        <SystemStats />
      </div>

      {/* ── Column 3 ── */}
      <div className="flex flex-col gap-3">
        <AutonomyLevel />
        <EventInspector />
        <DryrunPreview />
        <TaskCheckpoint />
        <IntentRouting />
        <AuditSearch />
        <PolicyToggles />
      </div>
    </div>
  )
}
