import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { InsetCard } from "@workspace/ui/components/inset-card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { StatusDot } from "@workspace/ui/components/status-dot"
import { type SystemStateKey } from "@workspace/ui/types/system-state"

export type SystemHealthItem = {
  status: SystemStateKey
  title: string
}

type SystemHealthProps = {
  items?: SystemHealthItem[]
  uptime?: string
  version?: string
  isLoading?: boolean
}

export function SystemHealth({ items, uptime, version, isLoading }: SystemHealthProps) {
  const degradedCount = items?.filter((i) => i.status !== "healthy" && i.status !== "unknown").length ?? 0
  const unknownCount = items?.filter((i) => i.status === "unknown").length ?? 0

  const badgeVariant = degradedCount > 0 ? "warning" : "success"
  const badgeLabel = isLoading
    ? "—"
    : degradedCount > 0
      ? `${degradedCount} DEGRADED`
      : unknownCount > 0
        ? `${unknownCount} UNKNOWN`
        : "ALL HEALTHY"

  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardAction>
          <Badge variant={isLoading ? "secondary" : badgeVariant}>{badgeLabel}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        ) : !items || items.length === 0 ? (
          <CardDescription className="py-2 text-center text-xs">No health data</CardDescription>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <InsetCard key={item.title} className="items-center px-2 py-1.5">
                <StatusDot status={item.status} />
                <CardDescription className="font-medium text-foreground">
                  {item.title}
                </CardDescription>
                <CardDescription className="ml-auto font-mono text-[10px]">
                  {item.status}
                </CardDescription>
              </InsetCard>
            ))}
          </div>
        )}
        {(uptime || version) && (
          <CardDescription className="font-mono text-[10px] px-1">
            {[version && `v${version}`, uptime && `up ${uptime}`].filter(Boolean).join(" · ")}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  )
}
