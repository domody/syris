import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

type RiskBucket = {
  level: "low" | "medium" | "high" | "critical"
  count: number
  blocked: number
}

const buckets: RiskBucket[] = [
  { level: "low", count: 89, blocked: 0 },
  { level: "medium", count: 12, blocked: 0 },
  { level: "high", count: 3, blocked: 1 },
  { level: "critical", count: 1, blocked: 1 },
]

const barColor: Record<RiskBucket["level"], string> = {
  low: "bg-success",
  medium: "bg-warning",
  high: "bg-destructive",
  critical: "bg-destructive",
}

const badgeVariant: Record<RiskBucket["level"], "success" | "warning" | "destructive"> = {
  low: "success",
  medium: "warning",
  high: "destructive",
  critical: "destructive",
}

export function RiskClassification() {
  const total = buckets.reduce((s, b) => s + b.count, 0)

  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Risk Classification</CardTitle>
        <CardAction>
          <Badge variant="secondary">{total} CALLS</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5">
        {buckets.map((bucket) => {
          const pct = (bucket.count / total) * 100
          return (
            <div key={bucket.level} className="flex items-center gap-3">
              <Badge
                variant={badgeVariant[bucket.level]}
                className="w-14 justify-center font-mono text-[9px] uppercase"
              >
                {bucket.level}
              </Badge>
              <div className="flex flex-1 items-center gap-2">
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("absolute inset-y-0 left-0 rounded-full", barColor[bucket.level])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <CardDescription className="w-5 text-right font-mono text-[10px] font-semibold text-foreground tabular-nums">
                  {bucket.count}
                </CardDescription>
              </div>
              {bucket.blocked > 0 && (
                <Badge variant="destructive" className="font-mono text-[9px]">
                  {bucket.blocked} blocked
                </Badge>
              )}
            </div>
          )
        })}
        <CardDescription className="pt-0.5 font-mono text-[9px]">
          2 high-risk calls blocked by gate · last 24h
        </CardDescription>
      </CardContent>
    </Card>
  )
}
