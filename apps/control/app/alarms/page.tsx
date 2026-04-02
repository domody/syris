"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/components/dashboard-context"
import { alarms as allAlarms } from "@/src/mock/data"
import type { Alarm, AlarmSeverity, AlarmStatus } from "@/src/mock/types"

// ── Helpers ──────────────────────────────────────────────────────────────────

const tabs: { label: string; status: AlarmStatus }[] = [
  { label: "Open", status: "open" },
  { label: "Acknowledged", status: "acked" },
  { label: "Resolved", status: "resolved" },
]

const severityVariant: Record<AlarmSeverity, "warning" | "destructive"> = {
  warning: "warning",
  error: "destructive",
  critical: "destructive",
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ── Alarm Row ────────────────────────────────────────────────────────────────

function AlarmRow({ alarm }: { alarm: Alarm }) {
  const { addToast } = useDashboard()
  const [expanded, setExpanded] = useState(false)
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [resolutionNote, setResolutionNote] = useState("")

  const entityLink = alarm.related_entity
    ? alarm.related_entity.type === "integration"
      ? `/integrations/${alarm.related_entity.id}`
      : alarm.related_entity.type === "task"
        ? `/tasks/${alarm.related_entity.id}`
        : `/watchers`
    : null

  return (
    <div className="rounded-md border">
      {/* Main row */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}

        <Badge variant={severityVariant[alarm.severity]}>
          {alarm.severity}
        </Badge>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium">{alarm.title}</p>
          <p className="text-xs text-muted-foreground truncate">
            {alarm.detail}
          </p>
        </div>

        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {timeAgo(alarm.created_at)}
        </span>

        {/* Actions */}
        <div className="flex shrink-0 gap-1.5" onClick={(e) => e.stopPropagation()}>
          {alarm.status === "open" && (
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                addToast({
                  title: "Alarm acknowledged",
                  description: alarm.title,
                  variant: "default",
                })
              }
            >
              Ack
            </Button>
          )}

          {(alarm.status === "open" || alarm.status === "acked") && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => setResolveDialogOpen(true)}
            >
              Resolve
            </Button>
          )}

          {entityLink && (
            <Button
              size="xs"
              variant="outline"
              render={<Link href={entityLink} />}
            >
              {alarm.related_entity!.label}
            </Button>
          )}
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t bg-muted/30 px-4 py-3 space-y-3">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
            <div>
              <span className="text-muted-foreground">Dedupe key</span>
              <p className="font-mono">{alarm.dedupe_key}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created</span>
              <p>{new Date(alarm.created_at).toLocaleString()}</p>
            </div>
            {alarm.resolved_at && (
              <div>
                <span className="text-muted-foreground">Resolved</span>
                <p>{new Date(alarm.resolved_at).toLocaleString()}</p>
              </div>
            )}
            {alarm.resolution_note && (
              <div>
                <span className="text-muted-foreground">Resolution note</span>
                <p>{alarm.resolution_note}</p>
              </div>
            )}
          </div>

          {/* State transitions */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              State transitions
            </p>
            <div className="space-y-0.5">
              {alarm.transitions.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-xs"
                >
                  <span className="w-36 shrink-0 font-mono text-muted-foreground tabular-nums">
                    {new Date(t.at).toLocaleString()}
                  </span>
                  <Badge
                    variant={
                      t.status === "open"
                        ? "destructive"
                        : t.status === "acked"
                          ? "warning"
                          : "success"
                    }
                  >
                    {t.status}
                  </Badge>
                  {t.note && (
                    <span className="text-muted-foreground">{t.note}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resolve dialog */}
      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Alarm</DialogTitle>
            <DialogDescription>
              Optionally provide a resolution note for this alarm.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={resolutionNote}
            onChange={(e) => setResolutionNote(e.target.value)}
            placeholder="Resolution note (optional)"
            className="w-full rounded-md border bg-transparent p-2 text-xs placeholder:text-muted-foreground"
            rows={3}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={() => {
                setResolveDialogOpen(false)
                setResolutionNote("")
                addToast({
                  title: "Alarm resolved",
                  description: alarm.title,
                  variant: "success",
                })
              }}
            >
              Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AlarmsPage() {
  const [activeTab, setActiveTab] = useState<AlarmStatus>("open")

  const filtered = allAlarms.filter((a) => a.status === activeTab)

  return (
    <div className="space-y-4 p-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        {tabs.map((tab) => {
          const count = allAlarms.filter((a) => a.status === tab.status).length
          return (
            <button
              key={tab.status}
              onClick={() => setActiveTab(tab.status)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                activeTab === tab.status
                  ? "bg-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {count > 0 && (
                <span className="ml-1.5 text-muted-foreground">({count})</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Alarm list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No {activeTab} alarms
          </p>
        ) : (
          filtered.map((alarm) => (
            <AlarmRow key={alarm.id} alarm={alarm} />
          ))
        )}
      </div>
    </div>
  )
}
