"use client"

import { useState } from "react"
import { Check, ChevronRight, History } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/components/dashboard-context"
import type { AutonomyLevelCode } from "@/lib/api/types"

// ── Static mock data ──────────────────────────────────────────────────────────

const autonomyHistory: { at: string; to: AutonomyLevelCode; from: AutonomyLevelCode; actor: string }[] = [
  { at: "2026-04-01T09:00:00Z", to: "A2", from: "A1", actor: "manual" },
  { at: "2026-03-28T22:00:00Z", to: "A1", from: "A2", actor: "manual" },
  { at: "2026-03-28T14:00:00Z", to: "A2", from: "A0", actor: "initial setup" },
]

const autonomyLabels: Record<AutonomyLevelCode, string> = {
  A0: "Full manual",
  A1: "Supervised",
  A2: "Scoped autonomy",
  A3: "High autonomy",
  A4: "Full autonomy",
}

const autonomyDescriptions: Record<AutonomyLevelCode, string> = {
  A0: "Every action requires operator approval.",
  A1: "Low-risk actions execute automatically; medium+ require approval.",
  A2: "Scoped actions execute automatically; high+ require approval.",
  A3: "All but critical actions execute automatically.",
  A4: "All actions execute automatically. No approvals required.",
}

// ── Inline edit ───────────────────────────────────────────────────────────────

function EditableRow({
  label,
  value,
  onSave,
}: {
  label: string
  value: string
  onSave: (next: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  function handleSave() {
    onSave(draft)
    setEditing(false)
  }

  function handleCancel() {
    setDraft(value)
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between py-1.5 text-xs">
      <span className="text-muted-foreground w-52 shrink-0">{label}:</span>
      {editing ? (
        <div className="flex items-center gap-2 flex-1">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave()
              if (e.key === "Escape") handleCancel()
            }}
            className="flex-1 rounded-md border bg-transparent px-2 py-1 text-xs font-medium"
          />
          <Button size="xs" onClick={handleSave}>
            <Check className="size-3" />
            Save
          </Button>
          <Button size="xs" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-between">
          <span className="font-medium">{value}</span>
          <Button size="xs" variant="ghost" onClick={() => setEditing(true)}>
            Edit
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { autonomyLevel, setAutonomyLevel, addToast } = useDashboard()
  const [autonomyDialogOpen, setAutonomyDialogOpen] = useState(false)
  const [pendingLevel, setPendingLevel] = useState<AutonomyLevelCode | null>(null)

  // Safety policy state
  const [quietHours, setQuietHours] = useState("22:00 – 07:00 Europe/London")
  const [antiFlap, setAntiFlap] = useState("30s")
  const [maxNotifications, setMaxNotifications] = useState("20")
  const [approvalExpiry, setApprovalExpiry] = useState("15m")

  // Pipeline state
  const [taskPoll, setTaskPoll] = useState("1s")
  const [schedulerPoll, setSchedulerPoll] = useState("5s")
  const [dedupWindow, setDedupWindow] = useState("60s")
  const [ruleTimeout, setRuleTimeout] = useState("10ms")

  function confirmAutonomyChange() {
    if (!pendingLevel) return
    const prev = autonomyLevel
    setAutonomyLevel(pendingLevel)
    addToast({
      title: "Autonomy level changed",
      description: `${prev} → ${pendingLevel} (${autonomyLabels[pendingLevel]})`,
      variant: "success",
    })
    setAutonomyDialogOpen(false)
    setPendingLevel(null)
  }

  function savePolicy(name: string) {
    addToast({
      title: "Policy updated",
      description: name,
      variant: "success",
    })
  }

  return (
    <div className="space-y-4 p-4 max-w-2xl">
      {/* Autonomy */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Autonomy</CardTitle>
            <Button
              size="xs"
              variant="outline"
              onClick={() => {
                setPendingLevel(autonomyLevel)
                setAutonomyDialogOpen(true)
              }}
            >
              Change
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Current level:</span>
            <Badge variant="secondary" className="font-mono">
              {autonomyLevel}
            </Badge>
            <span className="text-muted-foreground">
              ({autonomyLabels[autonomyLevel]})
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <History className="size-3 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Level history
              </span>
            </div>
            <div className="space-y-1.5">
              {autonomyHistory.map((entry, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className="w-40 shrink-0 text-muted-foreground tabular-nums">
                    {new Date(entry.at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {entry.to}
                    </Badge>
                    <ChevronRight className="size-3 text-muted-foreground rotate-180" />
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {entry.from}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">{entry.actor}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Safety policies */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Safety Policies</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <EditableRow label="Quiet hours" value={quietHours} onSave={(v) => { setQuietHours(v); savePolicy("Quiet hours") }} />
          <EditableRow label="Anti-flap cooldown" value={antiFlap} onSave={(v) => { setAntiFlap(v); savePolicy("Anti-flap cooldown") }} />
          <EditableRow label="Max notifications / hour" value={maxNotifications} onSave={(v) => { setMaxNotifications(v); savePolicy("Max notifications/hour") }} />
          <EditableRow label="Approval default expiry" value={approvalExpiry} onSave={(v) => { setApprovalExpiry(v); savePolicy("Approval default expiry") }} />
        </CardContent>
      </Card>

      {/* Pipeline */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="divide-y">
          <EditableRow label="Task engine poll interval" value={taskPoll} onSave={(v) => { setTaskPoll(v); savePolicy("Task engine poll interval") }} />
          <EditableRow label="Scheduler poll interval" value={schedulerPoll} onSave={(v) => { setSchedulerPoll(v); savePolicy("Scheduler poll interval") }} />
          <EditableRow label="Dedup window" value={dedupWindow} onSave={(v) => { setDedupWindow(v); savePolicy("Dedup window") }} />
          <EditableRow label="Rule eval timeout" value={ruleTimeout} onSave={(v) => { setRuleTimeout(v); savePolicy("Rule eval timeout") }} />
        </CardContent>
      </Card>

      {/* Autonomy change dialog */}
      <Dialog open={autonomyDialogOpen} onOpenChange={setAutonomyDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Autonomy Level</DialogTitle>
          </DialogHeader>

          <div className="space-y-1.5 py-2">
            {(["A0", "A1", "A2", "A3", "A4"] as AutonomyLevelCode[]).map((level) => (
              <button
                key={level}
                onClick={() => setPendingLevel(level)}
                className={cn(
                  "w-full flex items-start gap-3 rounded-lg border px-3 py-2.5 text-xs text-left transition-colors hover:bg-muted/50",
                  pendingLevel === level && "border-primary bg-primary/5",
                )}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{level}</span>
                    <span className="font-medium">{autonomyLabels[level]}</span>
                    {autonomyLevel === level && (
                      <Badge variant="secondary" className="text-[10px]">current</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-muted-foreground">{autonomyDescriptions[level]}</p>
                </div>
                {pendingLevel === level && (
                  <Check className="size-3.5 shrink-0 text-primary mt-0.5" />
                )}
              </button>
            ))}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutonomyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!pendingLevel || pendingLevel === autonomyLevel}
              onClick={confirmAutonomyChange}
            >
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
