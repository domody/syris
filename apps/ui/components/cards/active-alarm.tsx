import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const alarm = {
  title: "HA adapter timeout",
  sub: "ha.device-write · office-blinds · 3 retries exceeded",
  raised: "09:11:02 · 4m ago",
}

export function ActiveAlarm() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Active Alarm</CardTitle>
        <CardAction>
          <Badge variant="destructive">CRITICAL</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm font-medium text-destructive">{alarm.title}</p>
          <p className="mt-1 font-mono text-[10px] text-destructive/70">{alarm.sub}</p>
          <div className="mt-3 flex gap-2">
            <Button variant="destructive" size="sm" className="h-7 text-xs">
              Acknowledge
            </Button>
            <Button variant="secondary" size="sm" className="h-7 text-xs">
              Inspect
            </Button>
          </div>
        </div>
        <CardDescription className="font-mono text-[10px]">
          raised {alarm.raised}
        </CardDescription>
      </CardContent>
    </Card>
  )
}
