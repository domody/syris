"use client"

import Link from "next/link"
import { AlertTriangle, XCircle, RefreshCw, ExternalLink } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import { StatusDot } from "@workspace/ui/components/status-dot"
import { useDashboard } from "@/components/dashboard-context"
import {
  systemState,
  workloadSummary,
  approvals,
  alarms,
  tasks,
  auditEvents,
  sparklineData,
  autonomyDescriptions,
} from "@/src/mock/data"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"
import type { AutonomyLevelCode } from "@/lib/api/types"
import { useState } from "react"

// ── Sparkline SVG ────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data)
  const w = 200
  const h = 40
  const step = w / (data.length - 1)
  const points = data
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(" ")

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-primary"
        points={points}
      />
    </svg>
  )
}

// ── Autonomy Dialog ──────────────────────────────────────────────────────────

function AutonomyChanger() {
  const { autonomyLevel, setAutonomyLevel } = useDashboard()
  const [selected, setSelected] = useState<AutonomyLevelCode>(autonomyLevel)
  const [open, setOpen] = useState(false)

  const levels: AutonomyLevelCode[] = ["A0", "A1", "A2", "A3", "A4"]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="cursor-pointer text-xs text-primary hover:underline">
            [change]
          </button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Autonomy Level</DialogTitle>
          <DialogDescription>
            Select the new autonomy level for SYRIS.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {levels.map((level) => (
            <button
              key={level}
              onClick={() => setSelected(level)}
              className={`rounded-md border p-2 text-left text-xs transition-colors ${
                selected === level
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              }`}
            >
              <span className="font-medium">{level}</span>
              <span className="ml-2 text-muted-foreground">
                {autonomyDescriptions[level]}
              </span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="default"
            onClick={() => {
              setAutonomyLevel(selected)
              setOpen(false)
            }}
          >
            Confirm change to {selected}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Status Strip ─────────────────────────────────────────────────────────────

function StatusStrip() {
  const { pipelinePaused, togglePipeline, autonomyLevel } = useDashboard()

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Card size="sm">
        <CardContent className="flex items-center gap-2">
          <StatusDot status="healthy" pulse />
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className="text-sm font-medium capitalize">
              {systemState.status}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex items-center gap-2">
          <Badge variant="outline">{autonomyLevel}</Badge>
          <div>
            <p className="text-xs text-muted-foreground">Autonomy</p>
            <AutonomyChanger />
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent>
          <p className="text-xs text-muted-foreground">Uptime</p>
          <p className="text-sm font-medium">{systemState.uptime}</p>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent className="flex items-center gap-2">
          <div
            className={`size-2 rounded-full ${pipelinePaused ? "bg-warning" : "bg-success"}`}
          />
          <div>
            <p className="text-xs text-muted-foreground">Pipeline</p>
            <button
              onClick={togglePipeline}
              className="cursor-pointer text-sm font-medium transition-colors hover:text-primary"
            >
              {pipelinePaused ? "paused" : "active"}
            </button>
          </div>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardContent>
          <p className="text-xs text-muted-foreground">Last heartbeat</p>
          <p className="text-sm font-medium">{systemState.last_heartbeat}</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Needs Attention ──────────────────────────────────────────────────────────

function NeedsAttention() {
  const { addToast } = useDashboard()
  const pendingApprovals = approvals.filter((a) => a.status === "pending")
  const openAlarms = alarms.filter((a) => a.status === "open")
  const failedTasks = tasks.filter((t) => t.status === "failed")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Needs Attention</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pending Approvals */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              Pending Approvals ({pendingApprovals.length})
            </h3>
            {pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="space-y-1.5 rounded-md border p-2.5"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-3 text-warning" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {approval.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      expires{" "}
                      {new Date(approval.expires_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="xs"
                    variant="success"
                    onClick={() =>
                      addToast({
                        title: "Approved",
                        description: approval.title,
                        variant: "success",
                      })
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    size="xs"
                    variant="destructive"
                    onClick={() =>
                      addToast({
                        title: "Denied",
                        description: approval.title,
                        variant: "destructive",
                      })
                    }
                  >
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Open Alarms + Failed Tasks */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              Open Alarms ({openAlarms.length})
            </h3>
            {openAlarms.map((alarm) => (
              <div
                key={alarm.id}
                className="space-y-1.5 rounded-md border p-2.5"
              >
                <div className="flex items-start gap-2">
                  <XCircle className="mt-0.5 size-3 text-destructive" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{alarm.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {alarm.detail}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      addToast({
                        title: "Alarm acknowledged",
                        variant: "default",
                      })
                    }
                  >
                    Ack
                  </Button>
                  <Link
                    href={"/alarms"}
                    className={buttonVariants({
                      variant: "outline",
                      size: "xs",
                    })}
                  >
                    View
                  </Link>
                  {/* <Button
                    size="xs"
                    variant="outline"
                    render={<Link href="/alarms" />}
                    nativeButton={false}
                  >
                    View
                  </Button> */}
                </div>
              </div>
            ))}
          </div>

          {/* Failed Tasks */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground">
              Failed Tasks ({failedTasks.length})
            </h3>
            {failedTasks.map((task) => {
              const completedSteps = task.steps.filter(
                (s) => s.status === "completed"
              ).length
              return (
                <div
                  key={task.task_id}
                  className="space-y-1.5 rounded-md border p-2.5"
                >
                  <div className="flex items-start gap-2">
                    <XCircle className="mt-0.5 size-3 text-destructive" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium">{task.handler}</p>
                      <p className="text-xs text-muted-foreground">
                        step {completedSteps}/{task.steps.length} · retries{" "}
                        {task.retry_policy.max_attempts}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() =>
                        addToast({
                          title: "Task retry triggered",
                          description: task.handler,
                          variant: "default",
                        })
                      }
                    >
                      <RefreshCw className="size-3" />
                      Retry
                    </Button>
                    <Link
                      href={`/tasks/${task.task_id}`}
                      className={buttonVariants({
                        variant: "outline",
                        size: "xs",
                      })}
                    >
                      View
                    </Link>
                    {/* <Button
                      size="xs"
                      variant="outline"
                      render={<Link href={`/tasks/${task.task_id}`} />}
                      nativeButton={false}
                    >
                      View
                    </Button> */}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Activity + Workload ──────────────────────────────────────────────────────

function ActivityAndWorkload() {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="mb-1 text-xs text-muted-foreground">
              Event throughput (last 1h)
            </p>
            <Sparkline data={sparklineData} />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Events today</span>
              <p className="font-medium tabular-nums">
                {systemState.events_today.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Tool calls today</span>
              <p className="font-medium tabular-nums">
                {systemState.tool_calls_today}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Fast / Task / Gated</span>
              <p className="font-medium tabular-nums">
                {systemState.fast_count} / {systemState.task_count} /{" "}
                {systemState.gated_count}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workload Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5 text-xs">
            {[
              {
                label: "Running tasks",
                value: workloadSummary.running_tasks,
                href: "/tasks?status=running",
              },
              {
                label: "Paused tasks",
                value: workloadSummary.paused_tasks,
                href: "/tasks?status=paused",
              },
              {
                label: "Pending approvals",
                value: workloadSummary.pending_approvals,
                href: "/approvals",
              },
              {
                label: "Active schedules",
                value: workloadSummary.active_schedules,
                href: "/schedules",
              },
              {
                label: "Active watchers",
                value: workloadSummary.active_watchers,
                href: "/watchers",
              },
              {
                label: "Active rules",
                value: workloadSummary.active_rules,
                href: "/rules",
              },
              {
                label: "Healthy integrations",
                value: `${workloadSummary.healthy_integrations}/${workloadSummary.total_integrations}`,
                href: "/integrations",
              },
            ].map((row) => (
              <Link
                key={row.label}
                href={row.href}
                className="flex items-center justify-between rounded-sm px-1 py-0.5 transition-colors hover:bg-muted"
              >
                <span className="text-muted-foreground">{row.label}</span>
                <span className="font-medium tabular-nums">{row.value}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Recent Audit ─────────────────────────────────────────────────────────────

function RecentAudit() {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Recent Audit</CardTitle>
        <Link
          href="/audit"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View full log
          <ExternalLink className="size-3" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-0.5">
          {auditEvents.slice(0, 10).map((evt) => (
            <Link
              key={evt.audit_id}
              href={evt.trace_id ? `/traces/${evt.trace_id}` : "#"}
              className="flex items-center gap-3 rounded-sm px-1 py-1 text-xs transition-colors hover:bg-muted"
            >
              <span className="w-20 shrink-0 font-mono text-muted-foreground tabular-nums">
                {new Date(evt.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
              <span className="w-40 shrink-0 truncate">
                <Badge
                  variant={
                    evt.outcome === "success"
                      ? "success"
                      : evt.outcome === "failure"
                        ? "destructive"
                        : evt.outcome === "suppressed"
                          ? "warning"
                          : "secondary"
                  }
                >
                  {evt.type}
                </Badge>
              </span>
              <span className="flex-1 truncate text-muted-foreground">
                {evt.summary}
              </span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  return (
    <div className="space-y-4 p-4">
      <StatusStrip />
      <NeedsAttention />
      <ActivityAndWorkload />
      <RecentAudit />
    </div>
  )
}
