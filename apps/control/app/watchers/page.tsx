"use client"

import { useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RefreshCw,
} from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/components/dashboard-context"
import { watchers as allWatchers } from "@/src/mock/data"
import type { Watcher, WatcherOutcome } from "@/src/mock/types"

// ── Helpers ──────────────────────────────────────────────────────────────────

const outcomeConfig: Record<
  WatcherOutcome,
  { icon: typeof CheckCircle2; label: string; color: string }
> = {
  ok: { icon: CheckCircle2, label: "ok", color: "text-emerald-500" },
  changed: { icon: RefreshCw, label: "changed", color: "text-primary" },
  error: { icon: XCircle, label: "error", color: "text-destructive" },
  suppressed: { icon: MinusCircle, label: "suppressed", color: "text-muted-foreground" },
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "(disabled)"
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function formatInterval(s: number): string {
  if (s < 60) return `${s}s`
  if (s < 3600) return `${s / 60}m`
  return `${s / 3600}h`
}

// ── Expanded Detail Panel ─────────────────────────────────────────────────────

function WatcherDetail({ watcher }: { watcher: Watcher }) {
  return (
    <div className="border-t bg-muted/20 px-6 py-4 text-xs space-y-4">
      {/* State overview */}
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        <div>
          <span className="text-muted-foreground">Interval</span>
          <p className="mt-0.5 font-mono">{formatInterval(watcher.interval_s)}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Dedupe Window</span>
          <p className="mt-0.5 font-mono">
            {formatInterval(watcher.dedupe_window_s)}{" "}
            <span className="text-muted-foreground">
              ({watcher.dedupe_current_count} in window)
            </span>
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Suppression Count</span>
          <p className={cn("mt-0.5", watcher.suppression_count > 0 && "text-warning font-medium")}>
            {watcher.suppression_count}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Consecutive Errors</span>
          <p className={cn("mt-0.5", watcher.consecutive_errors > 0 && "text-destructive font-medium")}>
            {watcher.consecutive_errors}
          </p>
        </div>
      </div>

      {/* Throttle */}
      <div>
        <span className="text-muted-foreground">Throttle</span>
        {watcher.throttle.enabled ? (
          <p className="mt-0.5">
            Max {watcher.throttle.max_fires} fires per{" "}
            {formatInterval(watcher.throttle.window_s)} window
          </p>
        ) : (
          <p className="mt-0.5 text-muted-foreground italic">Not configured</p>
        )}
      </div>

      {/* Recent ticks */}
      <div>
        <span className="text-muted-foreground">
          Recent Ticks ({watcher.recent_ticks.length})
        </span>
        {watcher.recent_ticks.length === 0 ? (
          <p className="mt-1 text-muted-foreground italic">No ticks yet</p>
        ) : (
          <div className="mt-1 rounded-md border">
            {watcher.recent_ticks.map((t, i) => {
              const conf = outcomeConfig[t.outcome]
              const Icon = conf.icon
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-3 px-3 py-1.5",
                    i > 0 && "border-t",
                  )}
                >
                  <Icon className={cn("size-3 shrink-0", conf.color)} />
                  <span className="text-muted-foreground tabular-nums w-36 shrink-0">
                    {formatDate(t.timestamp)}
                  </span>
                  <span className="flex-1 truncate">{t.summary}</span>
                  {t.latency_ms !== null && (
                    <span className="text-muted-foreground tabular-nums w-16 text-right shrink-0">
                      {t.latency_ms >= 1000
                        ? `${(t.latency_ms / 1000).toFixed(1)}s`
                        : `${t.latency_ms}ms`}
                    </span>
                  )}
                  <span className="font-mono text-muted-foreground w-20 text-right shrink-0 truncate">
                    {t.trace_id}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Watcher Row ───────────────────────────────────────────────────────────────

function WatcherRow({
  watcher,
  isExpanded,
  onToggle,
  onToggleEnabled,
}: {
  watcher: Watcher
  isExpanded: boolean
  onToggle: () => void
  onToggleEnabled: () => void
}) {
  const outcome = watcher.enabled ? watcher.last_outcome : null
  const conf = outcome ? outcomeConfig[outcome] : null
  const OutcomeIcon = conf?.icon

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
            checked={watcher.enabled}
            readOnly
            className="size-3.5 rounded border-muted-foreground accent-primary cursor-pointer"
          />
        </span>

        {/* Name */}
        <span className="flex-1 font-medium truncate">{watcher.name}</span>

        {/* Interval */}
        <span className="w-20 shrink-0 font-mono text-muted-foreground">
          {formatInterval(watcher.interval_s)}
        </span>

        {/* Last tick */}
        <span className="w-24 shrink-0 tabular-nums text-muted-foreground">
          {watcher.enabled ? timeAgo(watcher.last_tick) : "(disabled)"}
        </span>

        {/* Last outcome */}
        <span className="w-24 shrink-0 flex items-center gap-1.5">
          {conf && OutcomeIcon ? (
            <>
              <OutcomeIcon className={cn("size-3 shrink-0", conf.color)} />
              <span className={conf.color}>{conf.label}</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>

        {/* Consecutive errors */}
        <span className="w-16 shrink-0 text-right">
          {watcher.consecutive_errors > 0 ? (
            <span
              title={
                watcher.related_alarm_id
                  ? `Alarm: ${watcher.related_alarm_id}`
                  : undefined
              }
            >
              <Badge variant="destructive" className="cursor-default">
                {watcher.consecutive_errors}
              </Badge>
            </span>
          ) : (
            <span className="text-muted-foreground">0</span>
          )}
        </span>
      </div>

      {isExpanded && <WatcherDetail watcher={watcher} />}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WatchersPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allWatchers.map((w) => [w.id, w.enabled])),
  )
  const [search, setSearch] = useState("")
  const [outcomeFilter, setOutcomeFilter] = useState<WatcherOutcome | "all">("all")
  const { addToast } = useDashboard()

  const filtered = allWatchers.filter((w) => {
    const enabled = enabledMap[w.id] ?? w.enabled
    if (outcomeFilter !== "all") {
      if (!enabled || w.last_outcome !== outcomeFilter) return false
    }
    if (search && !w.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const withLocalState = filtered.map((w) => ({
    ...w,
    enabled: enabledMap[w.id] ?? w.enabled,
  }))

  const errorCount = allWatchers.filter((w) => (enabledMap[w.id] ?? w.enabled) && w.consecutive_errors > 0).length

  return (
    <div className="space-y-4 p-4">
      {/* Error banner */}
      {errorCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>
            {errorCount} watcher{errorCount > 1 ? "s" : ""} with consecutive errors
          </span>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Outcome:</span>
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value as WatcherOutcome | "all")}
            className="rounded-md border bg-transparent px-2 py-1 text-xs"
          >
            <option value="all">All</option>
            <option value="ok">OK</option>
            <option value="changed">Changed</option>
            <option value="error">Error</option>
            <option value="suppressed">Suppressed</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Search:</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Watcher name..."
            className="rounded-md border bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground w-40"
          />
        </div>
      </div>

      {/* Watcher list */}
      <div className="rounded-md border">
        {/* Header */}
        <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span className="w-3.5" /> {/* chevron spacer */}
          <span className="w-3.5" /> {/* checkbox spacer */}
          <span className="flex-1">Name</span>
          <span className="w-20">Interval</span>
          <span className="w-24">Last Tick</span>
          <span className="w-24">Outcome</span>
          <span className="w-16 text-right">Errors</span>
        </div>

        {withLocalState.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No watchers match filters
          </p>
        ) : (
          withLocalState.map((watcher) => (
            <WatcherRow
              key={watcher.id}
              watcher={watcher}
              isExpanded={expandedId === watcher.id}
              onToggle={() =>
                setExpandedId((prev) =>
                  prev === watcher.id ? null : watcher.id,
                )
              }
              onToggleEnabled={() => {
                const newEnabled = !(enabledMap[watcher.id] ?? watcher.enabled)
                setEnabledMap((prev) => ({ ...prev, [watcher.id]: newEnabled }))
                addToast({
                  title: newEnabled ? "Watcher enabled" : "Watcher disabled",
                  description: watcher.name,
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
