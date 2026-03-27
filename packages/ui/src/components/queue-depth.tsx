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

type QueueLane = {
  label: string
  count: number
  max: number
  barClass: string
}

const lanes: QueueLane[] = [
  { label: "fast lane", count: 9, max: 14, barClass: "bg-pending" },
  { label: "task lane", count: 4, max: 14, barClass: "bg-success" },
  { label: "gated lane", count: 1, max: 14, barClass: "bg-warning" },
]

export function QueueDepth() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Queue Depth</CardTitle>
        <CardAction>
          <Badge variant="pending">3 ACTIVE</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <p className="text-4xl leading-none font-medium text-foreground">14</p>
          <CardDescription className="mt-1 text-xs">
            events queued · 3 lanes active
          </CardDescription>
        </div>
        <div className="flex flex-col gap-2">
          {lanes.map((lane) => (
            <div key={lane.label} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-muted-foreground">
                {lane.label}
              </span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
                <div
                  className={cn("h-full rounded-full", lane.barClass)}
                  style={{ width: `${(lane.count / lane.max) * 100}%` }}
                />
              </div>
              <span className="w-4 text-right font-mono text-[10px] text-muted-foreground">
                {lane.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
