"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ArrowDown, Pause, Play } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"
import { feedEvents } from "@/src/mock/data"
import type { FeedEvent } from "@/src/mock/types"

// ── Lane colours ─────────────────────────────────────────────────────────────

const laneColor: Record<string, string> = {
  fast: "text-blue-500 bg-blue-500/10",
  task: "text-purple-500 bg-purple-500/10",
  gated: "text-warning bg-warning/10",
}

const outcomeVariant: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  success: "success",
  failure: "destructive",
  suppressed: "warning",
  info: "secondary",
}

// ── Simulated stream ─────────────────────────────────────────────────────────

function useSimulatedStream(baseEvents: FeedEvent[]) {
  const [events, setEvents] = useState<FeedEvent[]>(baseEvents)
  const counter = useRef(baseEvents.length)

  useEffect(() => {
    const interval = setInterval(() => {
      const template = baseEvents[Math.floor(Math.random() * baseEvents.length)]
      counter.current++
      const newEvent: FeedEvent = {
        ...template,
        audit_id: `aud-sim-${counter.current}`,
        timestamp: new Date().toISOString(),
      }
      setEvents((prev) => [newEvent, ...prev].slice(0, 200))
    }, 3000)

    return () => clearInterval(interval)
  }, [baseEvents])

  return events
}

// ── Filters ──────────────────────────────────────────────────────────────────

const channels = ["All", "ha_mqtt", "slack_api", "github_api"]
const types = ["All", "event.ingested", "routing.decided", "tool_call.succeeded", "tool_call.deduped", "schedule.fired", "rule.triggered", "gate.required", "watcher.tick", "task.step_started"]
const lanes = ["All", "fast", "task", "gated"]

export default function LiveFeedPage() {
  const events = useSimulatedStream(feedEvents)
  const [autoScroll, setAutoScroll] = useState(true)
  const [channelFilter, setChannelFilter] = useState("All")
  const [typeFilter, setTypeFilter] = useState("All")
  const [laneFilter, setLaneFilter] = useState("All")
  const [search, setSearch] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)

  const filtered = events.filter((evt) => {
    if (channelFilter !== "All" && evt.connector_id !== channelFilter) return false
    if (typeFilter !== "All" && evt.type !== typeFilter) return false
    if (laneFilter !== "All" && evt.lane !== laneFilter) return false
    if (search && !evt.summary.toLowerCase().includes(search.toLowerCase()) && !evt.type.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollTop } = scrollRef.current
    if (scrollTop > 50) setAutoScroll(false)
  }, [])

  const jumpToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })
    setAutoScroll(true)
  }, [])

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [events, autoScroll])

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
        <label className="text-xs text-muted-foreground">
          Channel:
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="ml-1 rounded border bg-transparent px-1.5 py-0.5 text-xs"
          >
            {channels.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-muted-foreground">
          Type:
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="ml-1 rounded border bg-transparent px-1.5 py-0.5 text-xs"
          >
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-muted-foreground">
          Lane:
          <select
            value={laneFilter}
            onChange={(e) => setLaneFilter(e.target.value)}
            className="ml-1 rounded border bg-transparent px-1.5 py-0.5 text-xs"
          >
            {lanes.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </label>

        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border bg-transparent px-2 py-0.5 text-xs placeholder:text-muted-foreground"
        />

        <div className="ml-auto">
          <Button
            variant={autoScroll ? "default" : "outline"}
            size="xs"
            onClick={() => setAutoScroll(!autoScroll)}
          >
            {autoScroll ? (
              <Pause className="size-3" />
            ) : (
              <Play className="size-3" />
            )}
            Auto-scroll
          </Button>
        </div>
      </div>

      {/* Stream table */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-auto"
      >
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-background">
            <tr className="border-b text-left text-muted-foreground">
              <th className="w-28 px-4 py-2 font-medium">Time</th>
              <th className="w-44 px-2 py-2 font-medium">Type</th>
              <th className="px-2 py-2 font-medium">Summary</th>
              <th className="w-16 px-2 py-2 font-medium">Lane</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((evt) => (
              <tr
                key={evt.audit_id}
                className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <td className="px-4 py-1.5 font-mono text-muted-foreground tabular-nums">
                  {new Date(evt.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    fractionalSecondDigits: 1,
                  })}
                </td>
                <td className="px-2 py-1.5">
                  <Badge variant={outcomeVariant[evt.outcome] ?? "secondary"}>
                    {evt.type}
                  </Badge>
                </td>
                <td className="px-2 py-1.5 truncate max-w-xs">
                  {evt.summary}
                </td>
                <td className="px-2 py-1.5">
                  {evt.lane ? (
                    <span
                      className={cn(
                        "inline-block rounded px-1.5 py-0.5 text-[10px] font-medium",
                        laneColor[evt.lane],
                      )}
                    >
                      {evt.lane}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Jump to latest */}
        {!autoScroll && (
          <Button
            variant="default"
            size="sm"
            className="fixed bottom-6 right-6 shadow-lg"
            onClick={jumpToTop}
          >
            <ArrowDown className="size-3" />
            Jump to latest
          </Button>
        )}
      </div>
    </div>
  )
}
