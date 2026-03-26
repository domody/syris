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
import { ActivityIcon } from "lucide-react"

type LiveEvent = {
  id: string
  channel: "email" | "webhook" | "cron" | "ha" | "manual"
  summary: string
  routing: "rule" | "llm" | "gated" | "dropped"
  time: string
  trace: string
}

const channelColor: Record<LiveEvent["channel"], string> = {
  email: "text-pending",
  webhook: "text-success",
  cron: "text-muted-foreground",
  ha: "text-warning",
  manual: "text-foreground",
}

const routingVariant: Record<LiveEvent["routing"], "success" | "pending" | "warning" | "secondary"> = {
  rule: "success",
  llm: "pending",
  gated: "warning",
  dropped: "secondary",
}

const events: LiveEvent[] = [
  { id: "evt_01", channel: "email", summary: "standup@team.syris.uk", routing: "rule", time: "09:14:33", trace: "a3f9b1c0" },
  { id: "evt_02", channel: "webhook", summary: "github · PR merged", routing: "llm", time: "09:13:11", trace: "b8e2d441" },
  { id: "evt_03", channel: "cron", summary: "morning-briefing · fired", routing: "rule", time: "09:13:00", trace: "8c1d04fa" },
  { id: "evt_04", channel: "ha", summary: "sensor.motion · office", routing: "gated", time: "09:11:02", trace: "d70e2219" },
  { id: "evt_05", channel: "ha", summary: "sensor.temperature · 21.4°C", routing: "dropped", time: "09:10:58", trace: "f9c03b12" },
  { id: "evt_06", channel: "email", summary: "alert@pagerduty.com", routing: "rule", time: "09:09:41", trace: "7a1e8f00" },
  { id: "evt_07", channel: "webhook", summary: "stripe · payment.succeeded", routing: "llm", time: "09:08:17", trace: "c2d97e55" },
  { id: "evt_08", channel: "manual", summary: "operator command", routing: "rule", time: "09:07:01", trace: "0011ab3d" },
]

export function EventStream() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <ActivityIcon className="size-3.5 text-muted-foreground" />
          Event Stream
        </CardTitle>
        <CardAction>
          <Badge variant="pending" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-current animate-pulse" />
            LIVE
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 px-4">
        {events.map((ev) => (
          <div key={ev.id} className="flex items-start gap-2 border-b py-1.5 last:border-b-0">
            <Badge
              variant={routingVariant[ev.routing]}
              className="mt-0.5 w-12 shrink-0 justify-center font-mono text-[9px] uppercase"
            >
              {ev.routing}
            </Badge>
            <div className="flex min-w-0 flex-1 flex-col gap-0">
              <div className="flex items-center gap-1.5">
                <span className={cn("shrink-0 font-mono text-[9px] font-medium uppercase", channelColor[ev.channel])}>
                  {ev.channel}
                </span>
                <CardDescription className="truncate text-[11px]">
                  {ev.summary}
                </CardDescription>
              </div>
              <span className="font-mono text-[9px] text-muted-foreground">
                {ev.trace} · {ev.time}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
      <CardFooter>
        <CardDescription className="font-mono text-[10px]">
          142 events today · 47/min avg
        </CardDescription>
      </CardFooter>
    </Card>
  )
}
