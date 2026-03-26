"use client"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { InsetCard } from "@workspace/ui/components/inset-card"
import { Progress } from "@workspace/ui/components/progress"
import { Input } from "@workspace/ui/components/input"
import { Switch } from "@workspace/ui/components/switch"
import { StatusDot } from "@workspace/ui/components/status-dot"
import { cn } from "@workspace/ui/lib/utils"
import { AlertTriangleIcon, CheckIcon, ClockIcon } from "lucide-react"
import { SystemStateKey } from "@workspace/ui/types/system-state"
import React, { Fragment } from "react"

type TraceStage = {
  label: string
  status: "done" | "active" | "pending"
}

type AutonomyLevel = {
  level: number
  desc: string
}

type TaskSummaryField = {
  key: string
  value: string
}

type ActiveAlarmType = {
  title: string
  sub: string
  raised: string
}

type ActiveRuleType = {
  name: string
  conditions: string[]
  action: string
  firedCount: number
}

type MessageEventField = {
  key: string
  value: string
  highlight?: boolean
  success?: boolean
}

type ScopeMatrixRow = {
  tool: string
  read: boolean
  write: boolean
  send: boolean
}

type QueueLane = {
  label: string
  count: number
  max: number
  barClass: string
}

type DiffLine = {
  type: "ctx" | "rem" | "add"
  content: string
}

type CheckpointStep = {
  label: string
  status: "done" | "active" | "pending"
}

type IntentChip = {
  label: string
  matched: boolean
}

type SystemStat = {
  label: string
  value: number
  danger: boolean
}

type LogEntry = {
  time: string
  type: string
  meta: string
}

type PolicyToggle = {
  name: string
  sub: string
  enabled: boolean
}

type TaskProgress = {
  status: string
  label: string
  desc: string | undefined
}

type AuditItem = {
  status: string
  label: string
  trace: string
  time: string
}

type ActiveTool = {
  title: string
  idem: string
  elapsed: string
  progress: number
}

type ApprovalRequest = {
  desc: string
  trace: string
  tool: string
  risk: string
  waiting: string
}

type SystemHealthObject = {
  status: SystemStateKey
  title: string
}

type Watcher = {
  title: string
  condition: string
  last_fired: string | undefined
  armed: boolean
}

type ScheduledItem = {
  title: string
  cron: string
  next_fire: string
  overdue: boolean
}

const taskProgress: TaskProgress[] = [
  {
    status: "completed",
    label: "Ingest meeting transcript",
    desc: undefined,
  },
  {
    status: "completed",
    label: "Extract key points",
    desc: undefined,
  },
  {
    status: "in_progress",
    label: "Identify action items",
    desc: "4.2s elapsed | tools/ai-extract",
  },
  {
    status: "pending",
    label: "Check Google Calendar",
    desc: undefined,
  },
  {
    status: "pending",
    label: "Draft standup deck",
    desc: undefined,
  },
  {
    status: "pending",
    label: "Write summary",
    desc: undefined,
  },
]

const approvalItem: ApprovalRequest = {
  desc: "Task wants to send an email to team@syris.uk with the generated standup summary. Confirm to proceed.",
  trace: "8c1d04fa-7b3a",
  tool: "gmail.send",
  risk: "medium",
  waiting: "2m 14s",
}

const systemHealth: SystemHealthObject[] = [
  { status: "healthy", title: "Normaliser" },
  { status: "healthy", title: "Router" },
  { status: "healthy", title: "Task engine" },
  { status: "degraded", title: "HA adapter" },
  { status: "healthy", title: "Scheduler" },
  { status: "healthy", title: "Rules engine" },
  { status: "unknown", title: "MCP bridge" },
  { status: "healthy", title: "Audit Store" },
]

const scheduleQueue: ScheduledItem[] = [
  {
    title: "Morning briefing",
    cron: "0 8 * * mon-fri",
    next_fire: "in 22h 46m",
    overdue: false,
  },
  {
    title: "Quiet hours lights-off",
    cron: "0 23 * * *",
    next_fire: "in 13h 46m",
    overdue: false,
  },
  {
    title: "Weekly digest",
    cron: "0 9 * * mon",
    next_fire: "in 2d 23h",
    overdue: false,
  },
  {
    title: "DB backup overdue",
    cron: "interval | every 24h",
    next_fire: "overdue 1h",
    overdue: true,
  },
]

const traceStages: TraceStage[] = [
  { label: "ingest", status: "done" },
  { label: "route", status: "done" },
  { label: "tool", status: "done" },
  { label: "gate", status: "active" },
  { label: "done", status: "pending" },
]

const taskSummaryFields: TaskSummaryField[] = [
  { key: "Lane", value: "task" },
  { key: "Trace", value: "a3f9b1c0-4d2e" },
  { key: "Step", value: "3 / 6" },
  { key: "Duration", value: "1m 04s" },
  { key: "Retries", value: "0" },
]

const activeAlarm: ActiveAlarmType = {
  title: "HA adapter timeout",
  sub: "ha.device-write · office-blinds · 3 retries exceeded",
  raised: "09:11:02 · 4m ago",
}

const auditItems: AuditItem[] = [
  {
    status: "success",
    label: "task.completed",
    trace: "a3f9b1c0-4d2e",
    time: "09:14:33",
  },
  {
    status: "in_progress",
    label: "tool.invoked | calendar.read",
    trace: "a3f9b1c0-4d2e",
    time: "09:14:29",
  },
  {
    status: "warn",
    label: "gate.awaiting | approval",
    trace: "8c1d04fa-7b3a",
    time: "09:13:51",
  },
  {
    status: "success",
    label: "event.ingested | email",
    trace: "8c1d04fa-7b3a",
    time: "09:13:49",
  },
  {
    status: "destructive",
    label: "tool.failed | ha.device-write",
    trace: "d70e2219-c5f1",
    time: "09:11:02",
  },
]

const acctiveTools: ActiveTool[] = [
  {
    title: "ai-extract | gpt-40",
    idem: "e9f2a001",
    elapsed: "4.2",
    progress: 65,
  },
  {
    title: "ha.device-read | office-blinds",
    idem: "c7d401ab",
    elapsed: "0.8",
    progress: 86,
  },
  {
    title: "calendar.read | next-7-days",
    idem: "91a33fd0",
    elapsed: "1.1",
    progress: 45,
  },
]

const activeWatchers: Watcher[] = [
  {
    title: "Morning standup trigger",
    condition: `channel == "email" AND subject ~ "standup"`,
    last_fired: "09:13:49",
    armed: true,
  },
  {
    title: "Lights off at quiet hours",
    condition: `time >= 23:00 AND ha.zone == "home"`,
    last_fired: "23:00:01",
    armed: true,
  },
  {
    title: "Critical alert escalation",
    condition: `alarm.severity == "critical" AND ack == false`,
    last_fired: undefined,
    armed: true,
  },
]

const activeRule: ActiveRuleType = {
  name: "Morning standup trigger",
  conditions: ['channel == "email"', 'AND subject ~ "standup"'],
  action: 'run_task("morning-brief")',
  firedCount: 14,
}

const scopeMatrix: ScopeMatrixRow[] = [
  { tool: "calendar.*", read: true, write: false, send: false },
  { tool: "ha.*", read: true, write: true, send: false },
  { tool: "gmail.*", read: true, write: false, send: true },
  { tool: "ai.*", read: true, write: false, send: false },
]

const queueLanes: QueueLane[] = [
  { label: "fast lane", count: 9, max: 14, barClass: "bg-pending" },
  { label: "task lane", count: 4, max: 14, barClass: "bg-success" },
  { label: "gated lane", count: 1, max: 14, barClass: "bg-warning" },
]

const systemStats: SystemStat[] = [
  { label: "events ingested", value: 142, danger: false },
  { label: "tasks run", value: 38, danger: false },
  { label: "gates opened", value: 6, danger: false },
  { label: "tool failures", value: 2, danger: true },
]

const autonomyLevels: AutonomyLevel[] = [
  {
    level: 0,
    desc: "Read-only. No tool execution. Every action requires explicit operator command.",
  },
  {
    level: 1,
    desc: "Read-only tools execute freely. All writes require confirmation before proceeding.",
  },
  {
    level: 2,
    desc: "Reads freely, executes read-only tools without confirmation. All writes and sends require operator approval.",
  },
  {
    level: 3,
    desc: "Most tools execute autonomously. Only high-risk or irreversible actions require approval.",
  },
  {
    level: 4,
    desc: "Fully autonomous. All tools execute without confirmation. Audit log only.",
  },
]

const messageEventFields: MessageEventField[] = [
  { key: "event_id", value: "msg_01HXYZ", highlight: true },
  { key: "channel", value: "email" },
  { key: "trace_id", value: "8c1d04fa-7b3a" },
  { key: "received_at", value: "09:13:49Z" },
  { key: "normalised", value: "true", success: true },
  { key: "routed_to", value: "task-lane" },
  { key: "version", value: "3" },
]

const diffLines: DiffLine[] = [
  { type: "ctx", content: "to: team@syris.uk" },
  { type: "rem", content: "subject: Standup notes" },
  { type: "add", content: "subject: [SYRIS] Standup · Mon 24 Mar" },
  { type: "ctx", content: "body: 847 chars" },
  { type: "add", content: "attachment: standup.md" },
]

const checkpointSteps: CheckpointStep[] = [
  { label: "Fetch emails", status: "done" },
  { label: "Extract action items", status: "done" },
  { label: "Awaiting send approval", status: "active" },
  { label: "Post to calendar", status: "pending" },
  { label: "Write summary", status: "pending" },
]

const intentChips: IntentChip[] = [
  { label: "gmail.send", matched: true },
  { label: "task-lane", matched: true },
  { label: "fast-lane", matched: false },
  { label: "ha.write", matched: false },
  { label: "calendar.write", matched: false },
  { label: "rules-engine", matched: false },
]

const logEntries: LogEntry[] = [
  { time: "09:14:33", type: "task.completed", meta: "a3f9b1c0" },
  { time: "09:14:29", type: "tool.invoked", meta: "calendar.read" },
  { time: "09:13:51", type: "gate.awaiting", meta: "8c1d04fa" },
  { time: "09:13:49", type: "event.ingested", meta: "email" },
  { time: "09:11:02", type: "tool.failed", meta: "ha.device-write d70e2219" },
  { time: "08:47:11", type: "tool.failed", meta: "calendar.read 19cc3a01" },
]

const policyToggles: PolicyToggle[] = [
  { name: "Quiet hours", sub: "23:00–07:00 no writes", enabled: true },
  { name: "Anti-flap", sub: "30s debounce on HA", enabled: true },
  { name: "Dry-run mode", sub: "preview all writes", enabled: false },
  { name: "LLM fallback", sub: "allow when rules miss", enabled: true },
]

export function UiDemo() {
  const [autonomyLevel, setAutonomyLevel] = React.useState(2)
  const [toggles, setToggles] = React.useState(
    policyToggles.map((t) => t.enabled)
  )
  const [logQuery, setLogQuery] = React.useState("tool.failed")

  const filteredLog = logQuery
    ? logEntries.filter(
        (e) =>
          e.type.includes(logQuery) ||
          e.meta.includes(logQuery) ||
          e.time.includes(logQuery)
      )
    : logEntries.slice(0, 3)

  return (
    <div
      className="grid w-full gap-3 p-4"
      style={{ gridTemplateColumns: "repeat(3, minmax(350px, 500px))" }}
    >
      {/* ── Column 1 ── */}
      <div className="flex flex-col gap-3">
        {/* task progress */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 [&_svg:not([class*='size-'])]:size-4">
              Task Progress
            </CardTitle>
            <CardAction>
              <Badge variant={"success"}>IN PROGRESS</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex size-full flex-col items-start justify-start gap-3">
              {taskProgress.map((task, index) => {
                const mappings = {
                  completed: "success",
                  in_progress: "pending",
                  pending: "secondary",
                }
                return (
                  <div
                    key={index}
                    className="relative flex w-full items-start justify-start gap-3 py-0.5"
                  >
                    {index !== taskProgress.length - 1 && (
                      <div
                        className={cn(
                          "absolute top-5.5 left-2.5 z-0 w-px bg-border",
                          task.status === "in_progress" ? "h-9" : "h-4"
                        )}
                      />
                    )}
                    <Badge
                      className={cn(
                        "z-1 aspect-square rounded-full p-0 [&_svg:not([class*='size-'])]:size-3",
                        task.status === "in_progress" && "ring-1"
                      )}
                      variant={mappings[task.status]}
                    >
                      {task.status === "completed" ? <CheckIcon /> : index + 1}
                    </Badge>
                    {task.status === "in_progress" ? (
                      <div className="grid flex-1 grid-cols-1">
                        <CardDescription className="text-sm font-semibold text-foreground">
                          {task.label}
                        </CardDescription>
                        <CardDescription>{task.desc}</CardDescription>
                      </div>
                    ) : (
                      <CardDescription className="text-sm">
                        {task.label}
                      </CardDescription>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* approval gate */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Approval Gate</CardTitle>
            <CardAction>
              <Badge variant={"warning"}>AWAITING</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <CardDescription>{approvalItem.desc}</CardDescription>
            <div className="grid flex-1 grid-cols-2 gap-4 pt-4">
              {(["trace", "tool", "risk", "waiting"] as const).map((item) => (
                <div key={item} className="flex flex-col gap-0">
                  <CardDescription className="font-mono text-[10px]">
                    {item.toUpperCase()}
                  </CardDescription>
                  <CardDescription className="text-sm font-semibold text-foreground">
                    {approvalItem[item]}
                  </CardDescription>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="mt-auto justify-start gap-4">
            <Button variant={"success"}>Approve</Button>
            <Button variant={"destructive"}>Deny</Button>
            <Button variant={"secondary"}>Preview</Button>
          </CardFooter>
        </Card>

        {/* system health */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardAction>
              <Badge variant={"warning"}>1 DEGRADED</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {systemHealth.map((health) => (
              <InsetCard
                key={health.title}
                className="items-center px-2 py-1.5"
              >
                <StatusDot status={health.status} />
                <CardDescription className="font-medium text-foreground">
                  {health.title}
                </CardDescription>
                <CardDescription className="ml-auto font-mono text-[10px]">
                  {health.status}
                </CardDescription>
              </InsetCard>
            ))}
          </CardContent>
        </Card>

        {/* schedule queue */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Schedule Queue</CardTitle>
            <CardAction>
              <Badge variant={"secondary"}>4 UPCOMING</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col px-4">
            {scheduleQueue.map((schedule) => (
              <div
                key={schedule.title}
                className="flex gap-2 border-b py-1.5 last:border-b-0"
              >
                <div className="my-auto flex aspect-square size-8 items-center justify-center rounded-xl bg-accent text-muted-foreground">
                  {schedule.overdue ? (
                    <AlertTriangleIcon className="size-4 text-warning" />
                  ) : (
                    <ClockIcon className="size-4" />
                  )}
                </div>
                <div className="grid flex-1 grid-cols-1">
                  <CardDescription className="text-sm font-medium text-foreground">
                    {schedule.title}
                  </CardDescription>
                  <CardDescription className="font-mono text-[10px]">
                    {schedule.cron}
                  </CardDescription>
                </div>
                <div className="flex h-full items-center justify-end text-[10px]">
                  <p
                    className={cn(
                      "font-mono",
                      schedule.overdue ? "text-warning" : "text-pending"
                    )}
                  >
                    {schedule.next_fire}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* trace timeline */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Trace Timeline</CardTitle>
            <CardAction>
              <Badge variant="warning">AWAITING GATE</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex w-full items-start">
              {traceStages.map((stage, i) => {
                const mapping = {
                  done: "success",
                  active: "pending",
                  pending: "secondary",
                }
                return (
                  <Fragment key={stage.label}>
                    <div className="flex flex-col items-center gap-0.5">
                      <Badge
                        className={cn(
                          "aspect-square size-5 p-0",
                          stage.status === "active" && "ring-1 ring-pending"
                        )}
                        variant={mapping[stage.status]}
                      >
                        {stage.status === "done" && <CheckIcon />}
                      </Badge>
                      <span className="text-center font-mono text-[9px] whitespace-nowrap text-muted-foreground">
                        {stage.label}
                      </span>
                    </div>
                    {i < traceStages.length - 1 && (
                      <div
                        className={cn(
                          "mt-2.5 h-px flex-1",
                          stage.status === "done" ? "bg-success" : "bg-border"
                        )}
                      />
                    )}
                  </Fragment>
                )
              })}
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              8c1d04fa-7b3a
            </span>
          </CardContent>
        </Card>

        {/* task summary */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Task</CardTitle>
            <CardAction>
              <Badge variant="pending">RUNNING</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Morning standup brief
            </p>
            {taskSummaryFields.map((field) => (
              <div
                key={field.key}
                className="flex items-baseline justify-between border-b py-1.5 last:border-b-0"
              >
                <CardDescription className="text-xs">
                  {field.key}
                </CardDescription>
                <CardDescription className="font-mono text-xs font-semibold text-foreground">
                  {field.value}
                </CardDescription>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* active alarm */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Active Alarm</CardTitle>
            <CardAction>
              <Badge variant="destructive">CRITICAL</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
              <p className="text-sm font-medium text-destructive">
                {activeAlarm.title}
              </p>
              <p className="mt-1 font-mono text-[10px] text-destructive/70">
                {activeAlarm.sub}
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="destructive" size="sm" className="h-7 text-xs">
                  Acknowledge
                </Button>
                <Button variant="secondary" size="sm" className="h-7 text-xs">
                  Inspect
                </Button>
              </div>
            </div>
            <CardDescription className="font-mono text-[10px]">
              raised {activeAlarm.raised}
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* ── Column 2 ── */}
      <div className="flex flex-col gap-3">
        {/* audit stream */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Audit Stream</CardTitle>
            <CardAction>
              <Badge variant={"secondary"}>LIVE</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex size-full flex-col px-2">
              {auditItems.map((item) => {
                const mappings = {
                  success: "healthy",
                  destructive: "major_outage",
                }
                return (
                  <div
                    key={item.label}
                    className="flex w-full items-start justify-start gap-3 border-b py-1.5 last:border-b-0"
                  >
                    <StatusDot
                      status={mappings[item.status] || undefined}
                      className="mt-1.5"
                      dotClassName={cn(
                        item.status === "warn" && "bg-warning",
                        item.status === "in_progress" && "bg-pending"
                      )}
                    />
                    <div className="grid flex-1 grid-cols-1">
                      <CardDescription className="font-medium text-foreground">
                        {item.label}
                      </CardDescription>
                      <CardDescription className="font-mono text-[10px]">
                        trace {item.trace}
                      </CardDescription>
                    </div>
                    <div className="ml-auto">
                      <CardDescription className="font-mono text-[10px]">
                        {item.time}
                      </CardDescription>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* active tools */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Active Tools</CardTitle>
            <CardAction>
              <Badge variant={"pending"}>3 RUNNING</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="flex flex-1 flex-col gap-2">
              {acctiveTools.map((tool) => (
                <InsetCard key={tool.title} className="flex-col gap-1">
                  <CardDescription className="font-semibold text-foreground">
                    {tool.title}
                  </CardDescription>
                  <div className="flex w-full justify-between">
                    <CardDescription className="font-mono">
                      idem | {tool.idem}
                    </CardDescription>
                    <CardDescription className="text-pending">
                      {tool.elapsed}s
                    </CardDescription>
                  </div>
                  <Progress value={tool.progress} />
                </InsetCard>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* active watchers */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Active Watchers</CardTitle>
            <CardAction>
              <Badge variant={"success"}>3 ARMED</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {activeWatchers.map((watcher) => (
              <InsetCard key={watcher.title} className="flex-col">
                <CardDescription className="text-sm font-semibold text-foreground">
                  {watcher.title}
                </CardDescription>
                <div className="overflow-hidden rounded border bg-secondary px-2 font-mono text-[10px] text-muted-foreground">
                  {watcher.condition}
                </div>
                <div className="flex items-center justify-between">
                  <CardDescription className="font-mono text-[10px]">
                    {watcher.last_fired
                      ? `last fired | ${watcher.last_fired}`
                      : "never fired"}
                  </CardDescription>
                  <Badge variant={watcher.armed ? "success" : "destructive"}>
                    {watcher.armed ? "ARMED" : "DISARMED"}
                  </Badge>
                </div>
              </InsetCard>
            ))}
          </CardContent>
        </Card>

        {/* rule */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Rule</CardTitle>
            <CardAction>
              <Badge variant="success">ACTIVE</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-foreground">
              {activeRule.name}
            </p>
            <InsetCard className="flex-col gap-1 font-mono text-xs">
              <CardDescription className="text-[10px] font-semibold tracking-widest uppercase">
                if
              </CardDescription>
              {activeRule.conditions.map((cond, i) => (
                <p key={i} className="text-xs text-foreground/80">
                  {cond}
                </p>
              ))}
            </InsetCard>
            <InsetCard className="flex-col gap-1 font-mono text-xs">
              <CardDescription className="text-[10px] font-semibold tracking-widest uppercase">
                then
              </CardDescription>
              <p className="text-xs text-foreground/80">{activeRule.action}</p>
            </InsetCard>
            <CardDescription className="font-mono text-[10px]">
              fired {activeRule.firedCount}× this week
            </CardDescription>
          </CardContent>
        </Card>

        {/* scope matrix */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Tool Scope Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="pb-2 text-left font-mono text-[10px] font-medium tracking-wider text-muted-foreground uppercase" />
                  {["read", "write", "send"].map((h) => (
                    <th
                      key={h}
                      className="pb-2 text-center font-mono text-[10px] font-medium tracking-wider text-muted-foreground uppercase"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scopeMatrix.map((row) => (
                  <tr key={row.tool} className="border-t">
                    <td className="py-1.5 font-mono text-[10px] text-muted-foreground">
                      {row.tool}
                    </td>
                    {([row.read, row.write, row.send] as boolean[]).map(
                      (val, j) => (
                        <td key={j} className="py-1.5 text-center">
                          <span
                            className={
                              val ? "text-success" : "text-muted-foreground/30"
                            }
                          >
                            {val ? (
                              <CheckIcon className="mx-auto size-3" />
                            ) : (
                              "—"
                            )}
                          </span>
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* queue depth */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Queue Depth</CardTitle>
            <CardAction>
              <Badge variant="pending">3 ACTIVE</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <p className="text-4xl leading-none font-medium text-foreground">
                14
              </p>
              <CardDescription className="mt-1 text-xs">
                events queued · 3 lanes active
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              {queueLanes.map((lane) => (
                <div key={lane.label} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">
                    {lane.label}
                  </span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                    <div
                      className={cn("h-full rounded-full", lane.barClass)}
                      style={{ width: `${(lane.count / lane.max) * 100}%` }}
                    />
                  </div>
                  <span className="w-4 text-right font-mono text-[10px] text-muted-foreground">
                    {lane.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* system stats */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>System Stats</CardTitle>
            <CardAction>
              <Badge variant="secondary">TODAY</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {systemStats.map((stat) => (
              <InsetCard key={stat.label} className="flex-col gap-0.5">
                <p
                  className={cn(
                    "text-2xl leading-none font-medium",
                    stat.danger && "text-destructive"
                  )}
                >
                  {stat.value}
                </p>
                <CardDescription className="text-[10px]">
                  {stat.label}
                </CardDescription>
              </InsetCard>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* ── Column 3 ── */}
      <div className="flex flex-col gap-3">
        {/* autonomy selector */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Autonomy Level</CardTitle>
            <CardAction>
              <Badge variant="pending">LEVEL {autonomyLevel}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex gap-1.5">
              {autonomyLevels.map((al) => (
                <button
                  key={al.level}
                  onClick={() => setAutonomyLevel(al.level)}
                  className={cn(
                    "flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors",
                    autonomyLevel === al.level
                      ? "border-pending bg-pending/10 text-pending"
                      : "border-border text-muted-foreground hover:bg-accent"
                  )}
                >
                  {al.level}
                </button>
              ))}
            </div>
            <CardDescription className="text-sm leading-relaxed">
              {autonomyLevels[autonomyLevel].desc}
            </CardDescription>
          </CardContent>
        </Card>

        {/* message event inspector */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Message Event</CardTitle>
            <CardAction>
              <Badge variant="secondary">INGESTED</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
              {messageEventFields.map((field) => (
                <Fragment key={field.key}>
                  <CardDescription className="pt-0.5 font-mono text-[10px] whitespace-nowrap">
                    {field.key}
                  </CardDescription>
                  <CardDescription
                    className={cn(
                      "font-mono text-[11px] font-semibold break-all",
                      field.highlight && "text-pending",
                      field.success && "text-success",
                      !field.highlight && !field.success && "text-foreground"
                    )}
                  >
                    {field.value}
                  </CardDescription>
                </Fragment>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* dry-run diff */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Dry-run Preview</CardTitle>
            <CardAction>
              <Badge variant="secondary">GMAIL.SEND</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <InsetCard className="flex-col gap-1 font-mono text-[11px]">
              {diffLines.map((line, i) => (
                <div key={i} className="flex gap-2">
                  <span
                    className={cn(
                      "w-2.5 shrink-0 font-medium",
                      line.type === "add" && "text-success",
                      line.type === "rem" && "text-destructive",
                      line.type === "ctx" && "text-muted-foreground"
                    )}
                  >
                    {line.type === "add"
                      ? "+"
                      : line.type === "rem"
                        ? "−"
                        : " "}
                  </span>
                  <span
                    className={cn(
                      line.type === "add" && "text-success",
                      line.type === "rem" &&
                        "text-destructive line-through decoration-destructive/50",
                      line.type === "ctx" && "text-muted-foreground"
                    )}
                  >
                    {line.content}
                  </span>
                </div>
              ))}
            </InsetCard>
            <div className="flex gap-2">
              <Button variant="success" size="sm" className="h-7 text-xs">
                Approve
              </Button>
              <Button variant="destructive" size="sm" className="h-7 text-xs">
                Deny
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* checkpoint */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Checkpoint</CardTitle>
            <CardAction>
              <Badge variant="warning">PAUSED</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <div className="flex gap-0.5">
                {checkpointSteps.map((step, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-sm",
                      step.status === "done" && "bg-success",
                      step.status === "active" && "bg-warning",
                      step.status === "pending" && "bg-border"
                    )}
                  />
                ))}
              </div>
              <CardDescription className="mt-1.5 font-mono text-[10px]">
                step 3 of 5 · paused at gate
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1.5">
              {checkpointSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      step.status === "done" && "bg-success",
                      step.status === "active" && "bg-warning",
                      step.status === "pending" && "bg-border"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs",
                      step.status === "pending" && "text-muted-foreground",
                      step.status === "done" && "text-muted-foreground",
                      step.status === "active" &&
                        "font-semibold text-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" className="h-7 w-fit text-xs">
              Resume task
            </Button>
          </CardContent>
        </Card>

        {/* intent router */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Intent Routing</CardTitle>
            <CardAction>
              <Badge variant="pending">2 MATCHED</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <InsetCard className="font-mono text-xs text-muted-foreground">
              "send the standup notes to the team"
            </InsetCard>
            <div className="flex flex-wrap gap-1.5">
              {intentChips.map((chip) => (
                <div
                  key={chip.label}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px]",
                    chip.matched
                      ? "border-pending/30 bg-pending/10 text-pending"
                      : "border-border bg-secondary text-muted-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "size-1.5 rounded-full",
                      chip.matched ? "bg-pending" : "bg-muted-foreground/30"
                    )}
                  />
                  {chip.label}
                </div>
              ))}
            </div>
            <CardDescription className="font-mono text-[10px]">
              matched via LLM fallback
            </CardDescription>
          </CardContent>
        </Card>

        {/* audit log search */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Audit Log Search</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input
              className="font-mono text-xs"
              placeholder="trace_id or event type…"
              value={logQuery}
              onChange={(e) => setLogQuery(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              {filteredLog.length > 0 ? (
                filteredLog.map((entry, i) => (
                  <InsetCard key={i} className="gap-2 font-mono text-[11px]">
                    <CardDescription>{entry.time}</CardDescription>
                    <span className="font-semibold text-foreground">
                      {entry.type}
                    </span>
                    <CardDescription className="ml-auto">
                      {entry.meta}
                    </CardDescription>
                  </InsetCard>
                ))
              ) : (
                <CardDescription className="text-xs">
                  No results
                </CardDescription>
              )}
            </div>
          </CardContent>
        </Card>

        {/* policy toggles */}
        <Card className="h-min">
          <CardHeader>
            <CardTitle>Policy Toggles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col">
              {policyToggles.map((toggle, i) => (
                <div
                  key={toggle.name}
                  className="flex items-center justify-between border-b py-2 last:border-b-0"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {toggle.name}
                    </p>
                    <CardDescription className="text-[10px]">
                      {toggle.sub}
                    </CardDescription>
                  </div>
                  <Switch
                    checked={toggles[i]}
                    onCheckedChange={(checked) => {
                      const next = [...toggles]
                      next[i] = checked
                      setToggles(next)
                    }}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

