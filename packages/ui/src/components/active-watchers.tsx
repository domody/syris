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

type Watcher = {
  title: string
  condition: string
  last_fired: string | undefined
  armed: boolean
}

const watchers: Watcher[] = [
  {
    title: "Morning standup trigger",
    condition: `channel == "email" AND subject ~ "standup"`,
    last_fired: "09:13:49",
    armed: true,
  },
  {
    title: "Lights off at quiet hours",
    condition: `time >= 23:00 AND ha.zone == "home"`,
    last_fired: "23:00:01",
    armed: true,
  },
  {
    title: "Critical alert escalation",
    condition: `alarm.severity == "critical" AND ack == false`,
    last_fired: undefined,
    armed: true,
  },
]

export function ActiveWatchers() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Active Watchers</CardTitle>
        <CardAction>
          <Badge variant="success">3 ARMED</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {watchers.map((watcher) => (
          <InsetCard key={watcher.title} className="flex-col">
            <CardDescription className="text-sm font-semibold text-foreground">
              {watcher.title}
            </CardDescription>
            <div className="overflow-hidden rounded border bg-secondary px-2 font-mono text-[10px] text-muted-foreground">
              {watcher.condition}
            </div>
            <div className="flex items-center justify-between">
              <CardDescription className="font-mono text-[10px]">
                {watcher.last_fired ? `last fired | ${watcher.last_fired}` : "never fired"}
              </CardDescription>
              <Badge variant={watcher.armed ? "success" : "destructive"}>
                {watcher.armed ? "ARMED" : "DISARMED"}
              </Badge>
            </div>
          </InsetCard>
        ))}
      </CardContent>
    </Card>
  )
}
