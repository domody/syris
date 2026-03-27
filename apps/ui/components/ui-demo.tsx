"use client"

import { TaskProgress } from "@workspace/ui/components/task-progress"
import { ApprovalGate } from "@workspace/ui/components/approval-gate"
import { SystemHealth } from "@workspace/ui/components/system-health"
import { ScheduleQueue } from "@workspace/ui/components/schedule-queue"
import { TraceTimeline } from "@workspace/ui/components/trace-timeline"
import { TaskSummary } from "@workspace/ui/components/task-summary"
import { ActiveAlarm } from "@workspace/ui/components/active-alarm"
import { AuditStream } from "@workspace/ui/components/audit-stream"
import { ActiveTools } from "@workspace/ui/components/active-tools"
import { ActiveWatchers } from "@workspace/ui/components/active-watchers"
import { RuleDetail } from "@workspace/ui/components/rule-detail"
import { ScopeMatrix } from "@workspace/ui/components/scope-matrix"
import { QueueDepth } from "@workspace/ui/components/queue-depth"
import { SystemStats } from "@workspace/ui/components/system-stats"
import { AutonomyLevel } from "@workspace/ui/components/autonomy-level"
import { EventInspector } from "@workspace/ui/components/event-inspector"
import { DryrunPreview } from "@workspace/ui/components/dryrun-preview"
import { TaskCheckpoint } from "@workspace/ui/components/task-checkpoint"
import { IntentRouting } from "@workspace/ui/components/intent-routing"
import { AuditSearch } from "@workspace/ui/components/audit-search"
import { PolicyToggles } from "@workspace/ui/components/policy-toggles"

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
