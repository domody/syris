"use client"

import { useState } from "react"
import Link from "next/link"
import { X, ExternalLink } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"
import { auditEvents } from "@/src/mock/data"
import type { AuditEvent, AuditOutcome } from "@/lib/api/types"

// ── Helpers ───────────────────────────────────────────────────────────────────

const outcomeVariant: Record<AuditOutcome, "success" | "destructive" | "warning" | "secondary"> = {
  success: "success",
  failure: "destructive",
  suppressed: "warning",
  info: "secondary",
}

const stageColor: Record<string, string> = {
  normalize: "text-blue-400",
  route: "text-purple-400",
  execute: "text-primary",
  tool_call: "text-emerald-400",
  gate: "text-warning",
  operator: "text-orange-400",
  scheduler: "text-cyan-400",
  watcher: "text-indigo-400",
  rule: "text-pink-400",
  mcp: "text-teal-400",
  task: "text-violet-400",
}

const PAGE_SIZE = 20

// ── Right-side Drawer ─────────────────────────────────────────────────────────

function AuditDrawer({
  event,
  onClose,
}: {
  event: AuditEvent
  onClose: () => void
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={onClose}
      />
      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-[420px] flex-col border-l bg-background shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-medium">Audit Event</span>
          <Button size="xs" variant="ghost" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {/* Key fields */}
          <div className="space-y-2">
            <Row label="Audit ID" value={event.audit_id} mono />
            <Row label="Timestamp" value={new Date(event.timestamp).toLocaleString()} />
            <Row label="Stage" value={<span className={stageColor[event.stage] ?? ""}>{event.stage}</span>} />
            <Row label="Type" value={event.type} mono />
            <Row
              label="Outcome"
              value={<Badge variant={outcomeVariant[event.outcome]}>{event.outcome}</Badge>}
            />
            <Row label="Summary" value={event.summary} />
          </div>

          {/* References */}
          {(event.trace_id || event.ref_task_id || event.ref_step_id || event.ref_tool_call_id || event.ref_approval_id) && (
            <div className="space-y-2 border-t pt-3">
              <p className="font-medium text-muted-foreground">References</p>
              {event.trace_id && (
                <Row
                  label="Trace ID"
                  value={
                    <Link
                      href={`/traces/${event.trace_id}`}
                      className="font-mono text-primary hover:underline flex items-center gap-0.5"
                    >
                      {event.trace_id}
                      <ExternalLink className="size-2.5" />
                    </Link>
                  }
                />
              )}
              {event.ref_task_id && <Row label="Task ID" value={event.ref_task_id} mono />}
              {event.ref_step_id && <Row label="Step ID" value={event.ref_step_id} mono />}
              {event.ref_tool_call_id && <Row label="Tool Call ID" value={event.ref_tool_call_id} mono />}
              {event.ref_approval_id && <Row label="Approval ID" value={event.ref_approval_id} mono />}
            </div>
          )}

          {/* Tool info */}
          {(event.tool_name || event.connector_id) && (
            <div className="space-y-2 border-t pt-3">
              <p className="font-medium text-muted-foreground">Tool</p>
              {event.tool_name && <Row label="Tool" value={event.tool_name} mono />}
              {event.connector_id && <Row label="Connector" value={event.connector_id} mono />}
            </div>
          )}

          {/* Risk / autonomy */}
          {(event.risk_level || event.autonomy_level) && (
            <div className="space-y-2 border-t pt-3">
              <p className="font-medium text-muted-foreground">Gate</p>
              {event.risk_level && (
                <Row
                  label="Risk"
                  value={
                    <Badge
                      variant={
                        event.risk_level === "critical" || event.risk_level === "high"
                          ? "destructive"
                          : event.risk_level === "medium"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {event.risk_level}
                    </Badge>
                  }
                />
              )}
              {event.autonomy_level && <Row label="Autonomy" value={event.autonomy_level} />}
            </div>
          )}

          {/* Latency */}
          {event.latency_ms !== null && (
            <div className="border-t pt-3">
              <Row label="Latency" value={`${event.latency_ms}ms`} />
            </div>
          )}

          {/* Payload ref */}
          {event.payload_ref && (
            <div className="border-t pt-3">
              <Row label="Payload ref" value={event.payload_ref} mono />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-28 shrink-0 text-muted-foreground">{label}:</span>
      <span className={cn("flex-1 break-all", mono && "font-mono")}>{value}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null)
  const [typeFilter, setTypeFilter] = useState("")
  const [outcomeFilter, setOutcomeFilter] = useState<AuditOutcome | "all">("all")
  const [traceFilter, setTraceFilter] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  const allTypes = Array.from(new Set(auditEvents.map((e) => e.type))).sort()

  const filtered = auditEvents.filter((e) => {
    if (typeFilter && e.type !== typeFilter) return false
    if (outcomeFilter !== "all" && e.outcome !== outcomeFilter) return false
    if (traceFilter && !e.trace_id.includes(traceFilter)) return false
    if (search && !e.summary.toLowerCase().includes(search.toLowerCase()) && !e.type.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="space-y-4 p-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0) }}
            className="rounded-md border bg-transparent px-2 py-1 text-xs"
          >
            <option value="">All</option>
            {allTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Outcome:</span>
          <select
            value={outcomeFilter}
            onChange={(e) => { setOutcomeFilter(e.target.value as AuditOutcome | "all"); setPage(0) }}
            className="rounded-md border bg-transparent px-2 py-1 text-xs"
          >
            <option value="all">All</option>
            <option value="success">success</option>
            <option value="failure">failure</option>
            <option value="suppressed">suppressed</option>
            <option value="info">info</option>
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Trace:</span>
          <input
            value={traceFilter}
            onChange={(e) => { setTraceFilter(e.target.value); setPage(0) }}
            placeholder="abc-123..."
            className="rounded-md border bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground w-28"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Search:</span>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="summary..."
            className="rounded-md border bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground w-36"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span className="w-28">Time</span>
          <span className="w-16">Stage</span>
          <span className="w-44">Type</span>
          <span className="w-20">Outcome</span>
          <span className="w-20">Trace</span>
          <span className="flex-1">Summary</span>
          <span className="w-16 text-right">Latency</span>
        </div>

        {paged.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">No events match filters</p>
        ) : (
          paged.map((event) => (
            <div
              key={event.audit_id}
              onClick={() => setSelectedEvent(event)}
              className={cn(
                "flex items-center gap-3 border-b px-4 py-2 text-xs cursor-pointer transition-colors hover:bg-muted/50 last:border-b-0",
                selectedEvent?.audit_id === event.audit_id && "bg-muted/40",
              )}
            >
              <span className="w-28 shrink-0 font-mono text-muted-foreground tabular-nums">
                {new Date(event.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  fractionalSecondDigits: 1,
                })}
              </span>
              <span className={cn("w-16 shrink-0 font-mono text-[10px]", stageColor[event.stage] ?? "text-muted-foreground")}>
                {event.stage}
              </span>
              <span className="w-44 shrink-0 truncate font-mono text-[10px]">{event.type}</span>
              <span className="w-20 shrink-0">
                <Badge variant={outcomeVariant[event.outcome]}>{event.outcome}</Badge>
              </span>
              <span className="w-20 shrink-0">
                {event.trace_id ? (
                  <Link
                    href={`/traces/${event.trace_id}`}
                    className="font-mono text-primary hover:underline text-[10px]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {event.trace_id}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
              <span className="flex-1 truncate text-muted-foreground">{event.summary}</span>
              <span className="w-16 shrink-0 text-right tabular-nums text-muted-foreground">
                {event.latency_ms !== null ? `${event.latency_ms}ms` : "—"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs">
          <Button size="xs" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
            ← Previous
          </Button>
          <span className="text-muted-foreground">
            Page {page + 1} of {pageCount}
          </span>
          <Button size="xs" variant="outline" disabled={page >= pageCount - 1} onClick={() => setPage(page + 1)}>
            Next →
          </Button>
        </div>
      )}

      {/* Drawer */}
      {selectedEvent && (
        <AuditDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  )
}
