"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Play,
  Pause,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/components/dashboard-context"
import { tasks as allTasks } from "@/src/mock/data"
import type { TaskStatus } from "@/lib/api/types"

// ── Helpers ──────────────────────────────────────────────────────────────────

const statusConfig: Record<
  TaskStatus,
  {
    icon: typeof Play
    label: string
    color: string
    badgeVariant: "default" | "success" | "destructive" | "warning" | "secondary"
  }
> = {
  running: { icon: Loader2, label: "running", color: "text-primary", badgeVariant: "default" },
  paused: { icon: Pause, label: "paused", color: "text-warning", badgeVariant: "warning" },
  failed: { icon: XCircle, label: "failed", color: "text-destructive", badgeVariant: "destructive" },
  completed: { icon: CheckCircle2, label: "success", color: "text-success", badgeVariant: "success" },
  pending: { icon: Loader2, label: "pending", color: "text-muted-foreground", badgeVariant: "secondary" },
  cancelled: { icon: X, label: "cancelled", color: "text-muted-foreground", badgeVariant: "secondary" },
}

const filterOptions: { label: string; value: TaskStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Running", value: "running" },
  { label: "Paused", value: "paused" },
  { label: "Failed", value: "failed" },
  { label: "Completed", value: "completed" },
]

const sinceOptions = [
  { label: "Last 24h", value: "24h" },
  { label: "Last 7d", value: "7d" },
  { label: "All time", value: "all" },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({
  completed,
  total,
}: {
  completed: number
  total: number
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex-1",
              i < completed ? "bg-primary" : "bg-transparent",
              i > 0 && "ml-px",
            )}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground tabular-nums">
        {completed}/{total}
      </span>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const searchParams = useSearchParams()
  const initialStatus = searchParams.get("status") as TaskStatus | null
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">(
    initialStatus ?? "all",
  )
  const [sinceFilter, setSinceFilter] = useState("24h")
  const [search, setSearch] = useState("")
  const { addToast } = useDashboard()

  const filtered = allTasks.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false
    if (search && !t.handler.toLowerCase().includes(search.toLowerCase()))
      return false
    return true
  })

  return (
    <div className="space-y-4 p-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TaskStatus | "all")
            }
            className="rounded-md border bg-transparent px-2 py-1 text-xs"
          >
            {filterOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Since:</span>
          <select
            value={sinceFilter}
            onChange={(e) => setSinceFilter(e.target.value)}
            className="rounded-md border bg-transparent px-2 py-1 text-xs"
          >
            {sinceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Search:</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Task name..."
            className="rounded-md border bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground w-40"
          />
        </div>
      </div>

      {/* Task list */}
      <div className="rounded-md border">
        {/* Header */}
        <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span className="w-20">Status</span>
          <span className="flex-1">Task Name</span>
          <span className="w-24">Progress</span>
          <span className="w-20">Started</span>
          <span className="w-24 text-right">Actions</span>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No tasks match filters
          </p>
        ) : (
          filtered.map((task) => {
            const config = statusConfig[task.status]
            const Icon = config.icon
            const completedSteps = task.steps.filter(
              (s) => s.status === "completed",
            ).length

            return (
              <Link
                key={task.task_id}
                href={`/tasks/${task.task_id}`}
                className="flex items-center gap-3 border-b px-4 py-2.5 text-xs transition-colors hover:bg-muted/50 last:border-b-0"
              >
                <span className="flex w-20 items-center gap-1.5">
                  <Icon
                    className={cn(
                      "size-3.5",
                      config.color,
                      task.status === "running" && "animate-spin",
                    )}
                  />
                  <Badge variant={config.badgeVariant}>{config.label}</Badge>
                </span>

                <span className="flex-1 font-medium truncate">
                  {task.handler}
                </span>

                <span className="w-24">
                  <ProgressBar
                    completed={completedSteps}
                    total={task.steps.length}
                  />
                </span>

                <span className="w-20 text-muted-foreground tabular-nums">
                  {task.started_at ? timeAgo(task.started_at) : "—"}
                </span>

                <span
                  className="flex w-24 justify-end gap-1"
                  onClick={(e) => e.preventDefault()}
                >
                  {task.status === "running" && (
                    <>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToast({
                            title: "Task paused",
                            description: task.handler,
                            variant: "warning",
                          })
                        }}
                      >
                        <Pause className="size-3" />
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToast({
                            title: "Task cancelled",
                            description: task.handler,
                            variant: "destructive",
                          })
                        }}
                      >
                        <X className="size-3" />
                      </Button>
                    </>
                  )}
                  {task.status === "paused" && (
                    <>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToast({
                            title: "Task resumed",
                            description: task.handler,
                            variant: "success",
                          })
                        }}
                      >
                        <Play className="size-3" />
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToast({
                            title: "Task cancelled",
                            description: task.handler,
                            variant: "destructive",
                          })
                        }}
                      >
                        <X className="size-3" />
                      </Button>
                    </>
                  )}
                  {task.status === "failed" && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        addToast({
                          title: "Task retry triggered",
                          description: task.handler,
                          variant: "default",
                        })
                      }}
                    >
                      <RefreshCw className="size-3" />
                    </Button>
                  )}
                  {task.status === "completed" && (
                    <span className="text-muted-foreground">—</span>
                  )}
                </span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
