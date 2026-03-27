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
import { Progress } from "@workspace/ui/components/progress"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { BotIcon } from "lucide-react"

export type LlmFallbackStats = {
  ruleHits: number
  total: number
  llmCalls: number
  avgLatencyMs: number | null
}

type LlmFallbackProps = {
  stats?: LlmFallbackStats
  isLoading?: boolean
}

export function LlmFallback({ stats, isLoading }: LlmFallbackProps) {
  const coveragePct = stats && stats.total > 0
    ? Math.round((stats.ruleHits / stats.total) * 100)
    : 0
  const coverageValue = stats && stats.total > 0
    ? (stats.ruleHits / stats.total) * 100
    : 0
  const avgLatency = stats?.avgLatencyMs != null
    ? stats.avgLatencyMs < 1000
      ? `${stats.avgLatencyMs}ms`
      : `${(stats.avgLatencyMs / 1000).toFixed(1)}s`
    : "—"

  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <BotIcon className="size-3.5 text-muted-foreground" />
          Routing
        </CardTitle>
        <CardAction>
          <Badge variant="secondary">TODAY</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {isLoading ? (
          <>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-2.5 w-36" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          </>
        ) : !stats || stats.total === 0 ? (
          <CardDescription className="py-2 text-center text-xs">No routing data</CardDescription>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <CardDescription>Rule coverage</CardDescription>
                <CardDescription className="font-semibold text-foreground">
                  {coveragePct}%
                </CardDescription>
              </div>
              <Progress value={coverageValue} />
              <CardDescription className="font-mono text-[9px]">
                {stats.ruleHits} rule hits · {stats.llmCalls} LLM calls
              </CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["TOTAL EVENTS", stats.total.toLocaleString()],
                  ["AVG LATENCY", avgLatency],
                ] as const
              ).map(([label, value]) => (
                <InsetCard key={label} className="flex-col items-start gap-0 p-2">
                  <span className="font-mono text-[9px] text-muted-foreground">{label}</span>
                  <span className="font-mono text-xs font-semibold text-foreground">{value}</span>
                </InsetCard>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
