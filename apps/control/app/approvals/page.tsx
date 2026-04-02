"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, X, Search, ChevronDown, ChevronRight } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
} from "@workspace/ui/components/card"
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
import { approvals as allApprovals } from "@/src/mock/data"
import type { Approval, ApprovalStatus } from "@/src/mock/types"
import type { RiskLevel } from "@/lib/api/types"

// ── Helpers ──────────────────────────────────────────────────────────────────

const tabs: { label: string; status: ApprovalStatus }[] = [
  { label: "Pending", status: "pending" },
  { label: "Approved", status: "approved" },
  { label: "Denied", status: "denied" },
  { label: "Expired", status: "expired" },
]

const riskVariant: Record<RiskLevel, "secondary" | "warning" | "destructive" | "destructive"> = {
  low: "secondary",
  medium: "warning",
  high: "destructive",
  critical: "destructive",
}

function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return "expired"
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m remaining`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m remaining`
}

function isExpiringSoon(expiresAt: string): boolean {
  const diff = new Date(expiresAt).getTime() - Date.now()
  return diff > 0 && diff < 5 * 60 * 1000
}

// ── Approval Card ────────────────────────────────────────────────────────────

function ApprovalCard({ approval }: { approval: Approval }) {
  const { addToast } = useDashboard()
  const [payloadExpanded, setPayloadExpanded] = useState(false)
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [denyDialogOpen, setDenyDialogOpen] = useState(false)
  const [denyReason, setDenyReason] = useState("")

  const isPending = approval.status === "pending"
  const remaining = isPending ? timeRemaining(approval.expires_at) : null
  const expiringSoon = isPending && isExpiringSoon(approval.expires_at)

  return (
    <Card>
      <CardContent className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{approval.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>
                Risk:{" "}
                <Badge variant={riskVariant[approval.risk]}>
                  {approval.risk.toUpperCase()}
                </Badge>
              </span>
              <span>Gate: {approval.gate_reason}</span>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                Requested:{" "}
                {new Date(approval.requested_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {remaining && (
                <span className={cn(expiringSoon && "text-destructive font-medium")}>
                  Expires: {remaining}
                </span>
              )}
              {approval.resolved_at && (
                <span>
                  Resolved:{" "}
                  {new Date(approval.resolved_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              <span>
                Trace:{" "}
                <Link
                  href={`/traces/${approval.trace_id}`}
                  className="text-primary hover:underline"
                >
                  {approval.trace_id}
                </Link>
              </span>
              {approval.task_id && (
                <span>
                  Task:{" "}
                  <Link
                    href={`/tasks/${approval.task_id}`}
                    className="text-primary hover:underline"
                  >
                    {approval.task_id}
                  </Link>
                </span>
              )}
            </div>
          </div>

          {!isPending && (
            <Badge
              variant={
                approval.status === "approved"
                  ? "success"
                  : approval.status === "denied"
                    ? "destructive"
                    : "secondary"
              }
            >
              {approval.status}
            </Badge>
          )}
        </div>

        {/* Payload preview */}
        <div>
          <button
            onClick={() => setPayloadExpanded(!payloadExpanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            {payloadExpanded ? (
              <ChevronDown className="size-3" />
            ) : (
              <ChevronRight className="size-3" />
            )}
            Payload preview
          </button>
          {payloadExpanded && (
            <pre className="mt-1.5 rounded-md bg-muted/50 p-2 text-xs font-mono overflow-auto max-h-40">
              {JSON.stringify(approval.what, null, 2)}
            </pre>
          )}
        </div>

        {/* Actions */}
        {isPending && (
          <div className="flex gap-2">
            {/* Approve */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
              <Button
                size="sm"
                variant="success"
                onClick={() => setApproveDialogOpen(true)}
              >
                <Check className="size-3" />
                Approve
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Approval</DialogTitle>
                  <DialogDescription>
                    You are approving execution of this action. This cannot be
                    undone.
                  </DialogDescription>
                </DialogHeader>
                <pre className="rounded-md bg-muted/50 p-2 text-xs font-mono overflow-auto max-h-48">
                  {JSON.stringify(approval.what, null, 2)}
                </pre>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setApproveDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => {
                      setApproveDialogOpen(false)
                      addToast({
                        title: "Approved",
                        description: approval.title,
                        variant: "success",
                      })
                    }}
                  >
                    Confirm Approve
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Deny */}
            <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setDenyDialogOpen(true)}
              >
                <X className="size-3" />
                Deny
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Deny Approval</DialogTitle>
                  <DialogDescription>
                    Optionally provide a reason for denying this action.
                  </DialogDescription>
                </DialogHeader>
                <textarea
                  value={denyReason}
                  onChange={(e) => setDenyReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="w-full rounded-md border bg-transparent p-2 text-xs placeholder:text-muted-foreground"
                  rows={3}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDenyDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDenyDialogOpen(false)
                      setDenyReason("")
                      addToast({
                        title: "Denied",
                        description: approval.title,
                        variant: "destructive",
                      })
                    }}
                  >
                    Confirm Deny
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Full Trace */}
            <Button
              size="sm"
              variant="outline"
              render={<Link href={`/traces/${approval.trace_id}`} />}
            >
              <Search className="size-3" />
              Full Trace
            </Button>
          </div>
        )}

        {/* Deny reason for denied approvals */}
        {approval.status === "denied" && approval.deny_reason && (
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Reason:</span> {approval.deny_reason}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<ApprovalStatus>("pending")

  const grouped = allApprovals.filter((a) => a.status === activeTab)
  const pendingCount = allApprovals.filter((a) => a.status === "pending").length

  return (
    <div className="space-y-4 p-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        {tabs.map((tab) => {
          const count =
            tab.status === "pending"
              ? pendingCount
              : allApprovals.filter((a) => a.status === tab.status).length
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

      {/* Approval list */}
      <div className="space-y-3">
        {grouped.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No {activeTab} approvals
          </p>
        ) : (
          grouped.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} />
          ))
        )}
      </div>
    </div>
  )
}
