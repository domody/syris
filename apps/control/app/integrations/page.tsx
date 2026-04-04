"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { StatusDot } from "@workspace/ui/components/status-dot"
import { cn } from "@/lib/utils"
import { integrations } from "@/src/mock/data"
import type { IntegrationStatus } from "@/src/mock/types"

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never"
  const diff = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ago`
}

const statusDot: Record<IntegrationStatus, "healthy" | "degraded" | "major_outage"> = {
  healthy: "healthy",
  degraded: "degraded",
  unavailable: "major_outage",
}

const statusLabel: Record<IntegrationStatus, string> = {
  healthy: "healthy",
  degraded: "degraded",
  unavailable: "unavailable",
}

const statusBadge: Record<IntegrationStatus, "success" | "warning" | "destructive"> = {
  healthy: "success",
  degraded: "warning",
  unavailable: "destructive",
}

export default function IntegrationsPage() {
  const degradedCount = integrations.filter((i) => i.status !== "healthy").length

  return (
    <div className="space-y-4 p-4">
      {degradedCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>{degradedCount} integration{degradedCount > 1 ? "s" : ""} need attention</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Link
            key={integration.id}
            href={`/integrations/${integration.id}`}
            className={cn(
              "rounded-lg border p-4 transition-colors hover:bg-muted/50 block",
              integration.status === "degraded" && "border-warning/40",
              integration.status === "unavailable" && "border-destructive/30 opacity-70",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <StatusDot status={statusDot[integration.status]} pulse={integration.status === "healthy"} />
                <div>
                  <div className="text-sm font-medium">{integration.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{integration.connector_id}</div>
                </div>
              </div>
              <Badge variant={statusBadge[integration.status]}>
                {statusLabel[integration.status]}
              </Badge>
            </div>

            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>Last ok:</span>
                <span>{timeAgo(integration.last_ok)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Errors:</span>
                <span className={cn(integration.consecutive_errors > 0 && "text-destructive font-medium")}>
                  {integration.consecutive_errors}
                </span>
              </div>
              {integration.auth.warning && (
                <div className="flex items-center gap-1 rounded border border-warning/30 bg-warning/10 px-2 py-1 text-warning">
                  <AlertTriangle className="size-3 shrink-0" />
                  <span>
                    Auth exp:{" "}
                    {integration.auth.expires_at
                      ? new Date(integration.auth.expires_at).toLocaleDateString()
                      : "expired"}
                  </span>
                </div>
              )}
              {integration.rate_limit && (
                <div className="flex items-center justify-between">
                  <span>Rate limit:</span>
                  <span>
                    {integration.rate_limit.current}/{integration.rate_limit.max}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {integration.tools.slice(0, 3).map((tool) => (
                <Badge key={tool} variant="secondary" className="text-[10px]">
                  {tool}
                </Badge>
              ))}
              {integration.tools.length > 3 && (
                <Badge variant="secondary" className="text-[10px]">
                  +{integration.tools.length - 3}
                </Badge>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
