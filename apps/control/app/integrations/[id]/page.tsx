"use client"

import { use } from "react"
import Link from "next/link"
import { AlertTriangle, CheckCircle2, XCircle, MinusCircle, ExternalLink } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { StatusDot } from "@workspace/ui/components/status-dot"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/components/dashboard-context"
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

const statusBadge: Record<IntegrationStatus, "success" | "warning" | "destructive"> = {
  healthy: "success",
  degraded: "warning",
  unavailable: "destructive",
}

export default function IntegrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { addToast } = useDashboard()
  const integration = integrations.find((i) => i.id === id)

  if (!integration) {
    return <div className="p-4 text-sm text-muted-foreground">Integration not found</div>
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/integrations" className="hover:text-foreground transition-colors">
            Integrations
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            {integration.name} ({integration.connector_id})
          </span>
        </div>
        <Button
          size="xs"
          variant="outline"
          onClick={() =>
            addToast({
              title: integration.enabled ? "Integration disabled" : "Integration enabled",
              description: integration.name,
              variant: integration.enabled ? "warning" : "success",
            })
          }
        >
          {integration.enabled ? "Disable" : "Enable"}
        </Button>
      </div>

      {/* Health */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-xs">
            <div className="flex items-center gap-1.5">
              <StatusDot status={statusDot[integration.status]} pulse={integration.status === "healthy"} />
              <Badge variant={statusBadge[integration.status]}>{integration.status}</Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Consecutive errors:</span>{" "}
              <span className={cn("font-medium", integration.consecutive_errors > 0 && "text-destructive")}>
                {integration.consecutive_errors}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Last ok:</span>{" "}
              <span className="font-medium">{timeAgo(integration.last_ok)}</span>
            </div>
          </div>

          {integration.rate_limit && (
            <div className="text-xs">
              <span className="text-muted-foreground">Rate limit:</span>{" "}
              <span className="font-medium">
                {integration.rate_limit.current}/{integration.rate_limit.max}
              </span>
              {integration.rate_limit.resets_at && (
                <span className="ml-1 text-muted-foreground">
                  (resets {timeAgo(integration.rate_limit.resets_at)})
                </span>
              )}
              <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${Math.min(100, (integration.rate_limit.current / integration.rate_limit.max) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="text-xs">
            <span className="text-muted-foreground">Auth:</span>{" "}
            <Badge variant={integration.auth.valid ? "success" : "destructive"}>
              {integration.auth.valid ? "valid" : "invalid"}
            </Badge>
            {" · "}
            <span className="text-muted-foreground">Type:</span> {integration.auth.type}
            {integration.auth.expires_at ? (
              <span className={cn("ml-2", integration.auth.warning && "text-warning")}>
                {integration.auth.warning && <AlertTriangle className="inline size-3 mr-0.5" />}
                Expires: {new Date(integration.auth.expires_at).toLocaleDateString()}
              </span>
            ) : (
              <span className="ml-2 text-muted-foreground">(never expires)</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Capabilities */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Capabilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div>
            <span className="text-muted-foreground">Provider type:</span>{" "}
            <Badge variant="secondary">{integration.provider_type}</Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Tools:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {integration.tools.map((tool) => (
                <Badge key={tool} variant="secondary">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Scopes:</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {integration.scopes.map((scope) => (
                <Badge key={scope} variant="outline">
                  {scope}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tool call history */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Tool Call History ({integration.tool_call_history.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {integration.tool_call_history.length === 0 ? (
            <p className="px-4 py-4 text-xs text-muted-foreground">No tool calls recorded</p>
          ) : (
            <div>
              {integration.tool_call_history.map((call, i) => {
                const OutcomeIcon =
                  call.outcome === "success"
                    ? CheckCircle2
                    : call.outcome === "deduped"
                      ? MinusCircle
                      : XCircle
                const iconColor =
                  call.outcome === "success"
                    ? "text-emerald-500"
                    : call.outcome === "deduped"
                      ? "text-muted-foreground"
                      : "text-destructive"

                return (
                  <div
                    key={i}
                    className={cn("flex items-center gap-3 px-4 py-2 text-xs", i > 0 && "border-t")}
                  >
                    <OutcomeIcon className={cn("size-3 shrink-0", iconColor)} />
                    <span className="text-muted-foreground tabular-nums w-28 shrink-0">
                      {new Date(call.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="font-mono w-40 shrink-0 truncate">
                      {call.tool}.{call.action}
                    </span>
                    <span className="text-muted-foreground w-20 shrink-0 tabular-nums">
                      {call.latency_ms !== null ? `${call.latency_ms}ms` : "deduped"}
                    </span>
                    <Link
                      href={`/traces/${call.trace_id}`}
                      className="ml-auto font-mono text-primary hover:underline flex items-center gap-0.5 text-xs"
                    >
                      {call.trace_id}
                      <ExternalLink className="size-2.5" />
                    </Link>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
