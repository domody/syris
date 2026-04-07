"use client"

import Link from "next/link"
import {
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  CheckIcon,
  Trash2Icon,
  BanIcon,
  XCircleIcon,
  ChevronRightIcon,
  AlarmCheck,
  AlarmCheckIcon,
} from "lucide-react"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "@workspace/ui/components/item"
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
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-full bg-accent/50">
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
          <Button variant={"outline"} size={"xs"}>
            Change
          </Button>
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

function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1)
}

function StatusStrip() {
  const { pipelinePaused, togglePipeline, autonomyLevel } = useDashboard()

  const statusMappable = [
    {
      title: "Status",
      content: capitalizeFirstLetter(systemState.status),
      badge: <StatusDot status={systemState.status} pulse />,
    },
    {
      title: "Autonomy",
      content: autonomyLevel,
      badge: <AutonomyChanger />,
    },
    {
      title: "Uptime",
      content: systemState.uptime,
    },
    {
      title: "Pipeline",
      content: pipelinePaused ? "Paused" : "Active",
      badge: <StatusDot status={pipelinePaused ? "degraded" : "healthy"} />,
    },
    {
      title: "Last Heartbeat",
      content: systemState.last_heartbeat,
    },
  ]

  return (
    <div className="grid h-min grid-cols-2 gap-4 sm:grid-cols-3 xl:w-[420px] xl:grid-cols-2">
      {statusMappable.map((info) => {
        return (
          <Card className="size-sm" key={info.title}>
            <CardContent className="h-full">
              <div className="relative flex h-full flex-col gap-1">
                <CardDescription>{info.title}</CardDescription>
                <CardTitle className="mt-0 text-2xl">{info.content}</CardTitle>
                <CardAction className="absolute top-0 right-0">
                  {info.badge}
                </CardAction>
              </div>
            </CardContent>
          </Card>
        )
      })}
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
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals ({pendingApprovals.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemGroup className="gap-3">
            {pendingApprovals.map((approval) => (
              <Item key={approval.id} variant="muted">
                <ItemMedia variant={"icon"}>
                  <AlertTriangle className="text-warning" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{approval.title}</ItemTitle>
                  <ItemDescription>
                    expires{" "}
                    {new Date(approval.expires_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    size="icon-sm"
                    variant="destructive"
                    onClick={() =>
                      addToast({
                        title: "Denied",
                        description: approval.title,
                        variant: "destructive",
                      })
                    }
                  >
                    <BanIcon />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    onClick={() =>
                      addToast({
                        title: "Approved",
                        description: approval.title,
                        variant: "success",
                      })
                    }
                  >
                    <CheckIcon />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Open Alarms ({openAlarms.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemGroup>
            {openAlarms.map((alarm) => (
              <Item variant={"muted"}>
                <ItemMedia variant={"icon"}>
                  <XCircleIcon className="text-destructive" />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{alarm.title}</ItemTitle>
                  <ItemDescription>{alarm.detail}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button
                    size="icon-sm"
                    variant="secondary"
                    onClick={() =>
                      addToast({
                        title: "Alarm Acknowledged",
                        variant: "default",
                      })
                    }
                  >
                    <AlarmCheckIcon />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        </CardContent>
        <CardFooter className="mt-auto">
          <Button className={"w-full"}>Alarms</Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Failed Tasks ({failedTasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ItemGroup className="gap-3">
            {failedTasks.map((task) => {
              const completedSteps = task.steps.filter(
                (s) => s.status === "completed"
              ).length

              return (
                <Item variant={"muted"}>
                  <ItemMedia variant={"icon"}>
                    <XCircleIcon className="text-destructive" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{task.handler}</ItemTitle>
                    <ItemDescription>
                      step {completedSteps}/{task.steps.length} · retries{" "}
                      {task.retry_policy.max_attempts}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button size="icon-sm" variant="ghost">
                      <ChevronRightIcon />
                    </Button>
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Recent Audit ─────────────────────────────────────────────────────────────

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

function RecentAudit() {
  return (
    <Card className="flex-1 gap-1">
      <CardHeader>
        <CardTitle>Recent Audit</CardTitle>
        <CardAction>
          <Link
            href="/audit"
            className={cn(buttonVariants({ variant: "link" }))}
          >
            View full log
            <ExternalLink data-icon="inline-end" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] text-xs text-muted-foreground">
                Timestamp
              </TableHead>
              <TableHead className="w-[150px] text-xs text-muted-foreground">
                Type
              </TableHead>
              <TableHead className="text-xs text-muted-foreground">
                Summary
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditEvents.slice(0, 10).map((event) => (
              <TableRow key={event.audit_id}>
                <TableCell className="text-muted-foreground">
                  {new Date(event.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      event.outcome === "success"
                        ? "success"
                        : event.outcome === "failure"
                          ? "destructive"
                          : event.outcome === "suppressed"
                            ? "warning"
                            : "secondary"
                    }
                  >
                    {event.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{event.summary}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="hidden space-y-0.5">
          {auditEvents.slice(0, 10).map((evt) => (
            <Link
              key={evt.audit_id}
              href={evt.trace_id ? `/traces/${evt.trace_id}` : "#"}
              className="flex items-center gap-4 rounded-sm px-1 py-1 text-xs transition-colors hover:bg-muted"
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

// ── Acitvity ─────────────────────────────────────────────────────────────────

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import {
  CartesianGrid,
  Line,
  LineChart,
  AreaChart,
  Area,
  XAxis,
} from "recharts"
import { cn } from "@/lib/utils"

const chartData = sparklineData.map((value, index) => ({
  time: String((60 / sparklineData.length) * index),
  events: value,
}))

const chartConfig = {
  events: {
    label: "Events",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

function ActivityCard() {
  return (
    <Card className="flex flex-1">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Event throughput (last 1h)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer className="h-[200px] w-full" config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
              top: 8,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Area
              dataKey="events"
              type="stepAfter"
              stroke="var(--color-events)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <ItemGroup className="sm:flex-row">
          <Item variant={"muted"}>
            <ItemContent>
              <ItemDescription>Events today</ItemDescription>
              <ItemTitle>1,247</ItemTitle>
            </ItemContent>
          </Item>
          <Item variant={"muted"}>
            <ItemContent>
              <ItemDescription>Tool calls today</ItemDescription>
              <ItemTitle>89</ItemTitle>
            </ItemContent>
          </Item>
        </ItemGroup>
      </CardFooter>
    </Card>
  )
}

// ── Workload ──────────────────────────────────────────────────────────────────

function WorkloadCard() {
  return (
    <Card className="h-min xl:w-[420px]">
      <CardHeader>
        <CardTitle>Workload Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
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
              <TableRow key={row.label}>
                <TableCell className="text-muted-foreground">
                  {row.label}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col gap-4 xl:flex-row">
        <ActivityCard />
        <StatusStrip />
      </div>
      <div className="flex flex-col gap-4 xl:flex-row">
        <RecentAudit />
        <WorkloadCard />
      </div>
      <NeedsAttention />
    </div>
  )
}
