import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon, FlameIcon, ShieldAlertIcon, ShieldCheckIcon, ZapIcon } from "lucide-react"
import { type ReactNode } from "react"

type IncidentEvent = {
  time: string
  type: "alarm" | "gate" | "action" | "ack" | "resolve"
  label: string
  detail?: string
}

const dotColor: Record<IncidentEvent["type"], string> = {
  alarm: "bg-destructive/15",
  gate: "bg-warning/15",
  action: "bg-pending/15",
  ack: "bg-muted",
  resolve: "bg-success/15",
}

const icon: Record<IncidentEvent["type"], ReactNode> = {
  alarm: <FlameIcon className="size-3 text-destructive" />,
  gate: <ShieldAlertIcon className="size-3 text-warning" />,
  action: <ZapIcon className="size-3 text-pending" />,
  ack: <CheckIcon className="size-3 text-muted-foreground" />,
  resolve: <ShieldCheckIcon className="size-3 text-success" />,
}

const events: IncidentEvent[] = [
  { time: "09:11:02", type: "alarm", label: "HA adapter timeout", detail: "office-blinds · retry 3/3" },
  { time: "09:11:05", type: "gate", label: "Safety gate opened", detail: "severity=critical, ack=false" },
  { time: "09:11:07", type: "action", label: "Watcher fired", detail: "critical-alert-escalation" },
  { time: "09:14:45", type: "ack", label: "Acknowledged by operator" },
  { time: "09:17:30", type: "resolve", label: "HA adapter recovered", detail: "latency 3ms" },
]

export function IncidentTimeline() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Incident Timeline</CardTitle>
        <CardAction>
          <Badge variant="success">RESOLVED</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 px-4">
        {events.map((ev, i) => (
          <div key={i} className="relative flex items-start gap-3 pb-3 last:pb-0">
            {i < events.length - 1 && (
              <div className="absolute top-5 left-2.5 z-0 h-full w-px bg-border" />
            )}
            <div
              className={cn(
                "z-10 flex size-5 shrink-0 items-center justify-center rounded-full",
                dotColor[ev.type]
              )}
            >
              {icon[ev.type]}
            </div>
            <div className="flex flex-1 flex-col gap-0 pt-0.5">
              <div className="flex items-baseline justify-between gap-2">
                <CardDescription className="text-[11px] font-medium text-foreground">
                  {ev.label}
                </CardDescription>
                <span className="shrink-0 font-mono text-[9px] text-muted-foreground">
                  {ev.time}
                </span>
              </div>
              {ev.detail && (
                <CardDescription className="font-mono text-[9px]">{ev.detail}</CardDescription>
              )}
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <CardDescription className="font-mono text-[10px]">
          total duration 6m 28s · trace d70e2219
        </CardDescription>
      </CardFooter>
    </Card>
  )
}
