"use client"

import { useState } from "react"
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Timer,
  Crosshair,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/components/dashboard-context"
import { schedules as allSchedules } from "@/src/mock/data"
import type { Schedule, ScheduleType } from "@/src/mock/types"

// ── Helpers ──────────────────────────────────────────────────────────────────

const typeConfig: Record<ScheduleType, { icon: typeof Calendar; label: string }> = {
  cron: { icon: Calendar, label: "cron" },
  interval: { icon: Timer, label: "interval" },
  one_shot: { icon: Crosshair, label: "one-shot" },
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "(disabled)"
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff < 0) {
    const ago = Math.abs(diff)
    const minutes = Math.floor(ago / 60000)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `in ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `in ${hours}h`
  return `in ${Math.floor(hours / 24)}d`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// ── Expanded Detail Panel ───────────────────────────────────────────────────

function ScheduleDetail({ schedule }: { schedule: Schedule }) {
  return (
    <div className="border-t bg-muted/20 px-6 py-4 text-xs space-y-4">
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <div>
          <span className="text-muted-foreground">Full Spec</span>
          <p className="mt-0.5 font-mono">{schedule.spec}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Type</span>
          <p className="mt-0.5">{schedule.type}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Catch-up Policy</span>
          <p className="mt-0.5">{schedule.catch_up.replace("_", " ")}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Missed Runs</span>
          <p className={cn("mt-0.5", schedule.missed_runs > 0 && "text-destructive font-medium")}>
            {schedule.missed_runs}
          </p>
        </div>
      </div>

      <div>
        <span className="text-muted-foreground">Quiet Hours</span>
        {schedule.quiet_hours.enabled ? (
          <p className="mt-0.5">
            {schedule.quiet_hours.start} &ndash; {schedule.quiet_hours.end}{" "}
            ({schedule.quiet_hours.timezone})
          </p>
        ) : (
          <p className="mt-0.5 text-muted-foreground italic">Not configured</p>
        )}
      </div>

      {/* Payload template */}
      <div>
        <span className="text-muted-foreground">Payload Template</span>
        <pre className="mt-1 rounded-md bg-muted p-2 font-mono text-[11px] overflow-x-auto">
          {JSON.stringify(schedule.payload_template, null, 2)}
        </pre>
      </div>

      {/* Recent firings */}
      <div>
        <span className="text-muted-foreground">
          Recent Firings ({schedule.recent_firings.length})
        </span>
        {schedule.recent_firings.length === 0 ? (
          <p className="mt-1 text-muted-foreground italic">No firings yet</p>
        ) : (
          <div className="mt-1 rounded-md border">
            {schedule.recent_firings.map((f, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 px-3 py-1.5",
                  i > 0 && "border-t",
                )}
              >
                {f.outcome === "success" ? (
                  <CheckCircle2 className="size-3 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="size-3 text-destructive shrink-0" />
                )}
                <span className="text-muted-foreground tabular-nums w-32 shrink-0">
                  {formatDate(f.timestamp)}
                </span>
                <span className="flex-1 truncate">{f.summary}</span>
                <span className="font-mono text-muted-foreground">{f.trace_id}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Schedule Row ────────────────────────────────────────────────────────────

function ScheduleRow({
  schedule,
  isExpanded,
  onToggle,
  onToggleEnabled,
}: {
  schedule: Schedule
  isExpanded: boolean
  onToggle: () => void
  onToggleEnabled: () => void
}) {
  const conf = typeConfig[schedule.type]
  const TypeIcon = conf.icon

  return (
    <div className={cn("border-b last:border-b-0", isExpanded && "bg-muted/10")}>
      <div
        className="flex items-center gap-3 px-4 py-2.5 text-xs cursor-pointer transition-colors hover:bg-muted/50"
        onClick={onToggle}
      >
        {/* Expand chevron */}
        <span className="shrink-0">
          {isExpanded ? (
            <ChevronDown className="size-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 text-muted-foreground" />
          )}
        </span>

        {/* Enable toggle */}
        <span
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onToggleEnabled()
          }}
        >
          <input
            type="checkbox"
            checked={schedule.enabled}
            readOnly
            className="size-3.5 rounded border-muted-foreground accent-primary cursor-pointer"
          />
        </span>

        {/* Name */}
        <span className="flex-1 font-medium truncate">{schedule.name}</span>

        {/* Type badge */}
        <span className="w-20 shrink-0 flex items-center gap-1.5">
          <TypeIcon className="size-3 text-muted-foreground" />
          <Badge variant="secondary">{conf.label}</Badge>
        </span>

        {/* Spec */}
        <span className="w-28 shrink-0 font-mono text-muted-foreground truncate">
          {schedule.spec}
        </span>

        {/* Next run */}
        <span
          className="w-28 shrink-0 tabular-nums text-right"
          title={schedule.next_run ?? undefined}
        >
          {!schedule.enabled ? (
            <span className="text-muted-foreground">(disabled)</span>
          ) : schedule.type === "one_shot" && schedule.last_fired ? (
            <span className="text-muted-foreground">completed</span>
          ) : (
            relativeTime(schedule.next_run)
          )}
        </span>
      </div>

      {isExpanded && <ScheduleDetail schedule={schedule} />}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulesPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allSchedules.map((s) => [s.id, s.enabled])),
  )
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState<ScheduleType | "all">("all")
  const { addToast } = useDashboard()

  const filtered = allSchedules.filter((s) => {
    if (typeFilter !== "all" && s.type !== typeFilter) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Apply local enabled state over mock data
  const withLocalState = filtered.map((s) => ({
    ...s,
    enabled: enabledMap[s.id] ?? s.enabled,
  }))

  return (
    <div className="space-y-4 p-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as ScheduleType | "all")}
            className="rounded-md border bg-transparent px-2 py-1 text-xs"
          >
            <option value="all">All</option>
            <option value="cron">Cron</option>
            <option value="interval">Interval</option>
            <option value="one_shot">One-shot</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Search:</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Schedule name..."
            className="rounded-md border bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground w-40"
          />
        </div>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() =>
            addToast({
              title: "Create schedule",
              description: "Schedule creation dialog coming soon",
              variant: "default",
            })
          }
        >
          + Create
        </Button>
      </div>

      {/* Schedule list */}
      <div className="rounded-md border">
        {/* Header */}
        <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span className="w-3.5" /> {/* chevron spacer */}
          <span className="w-3.5" /> {/* checkbox spacer */}
          <span className="flex-1">Name</span>
          <span className="w-20">Type</span>
          <span className="w-28">Spec</span>
          <span className="w-28 text-right">Next Run</span>
        </div>

        {withLocalState.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No schedules match filters
          </p>
        ) : (
          withLocalState.map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              schedule={schedule}
              isExpanded={expandedId === schedule.id}
              onToggle={() =>
                setExpandedId((prev) =>
                  prev === schedule.id ? null : schedule.id,
                )
              }
              onToggleEnabled={() => {
                const newEnabled = !enabledMap[schedule.id]
                setEnabledMap((prev) => ({ ...prev, [schedule.id]: newEnabled }))
                addToast({
                  title: newEnabled ? "Schedule enabled" : "Schedule disabled",
                  description: schedule.name,
                  variant: newEnabled ? "success" : "warning",
                })
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}
