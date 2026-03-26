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
import { AlertTriangleIcon, ClockIcon } from "lucide-react"

type ScheduledItem = {
  title: string
  cron: string
  next_fire: string
  overdue: boolean
}

const items: ScheduledItem[] = [
  { title: "Morning briefing", cron: "0 8 * * mon-fri", next_fire: "in 22h 46m", overdue: false },
  { title: "Quiet hours lights-off", cron: "0 23 * * *", next_fire: "in 13h 46m", overdue: false },
  { title: "Weekly digest", cron: "0 9 * * mon", next_fire: "in 2d 23h", overdue: false },
  { title: "DB backup overdue", cron: "interval | every 24h", next_fire: "overdue 1h", overdue: true },
]

export function ScheduleQueue() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Schedule Queue</CardTitle>
        <CardAction>
          <Badge variant="secondary">4 UPCOMING</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col px-4">
        {items.map((schedule) => (
          <div key={schedule.title} className="flex gap-2 border-b py-1.5 last:border-b-0">
            <div className="my-auto flex aspect-square size-8 items-center justify-center rounded-xl bg-accent text-muted-foreground">
              {schedule.overdue ? (
                <AlertTriangleIcon className="size-4 text-warning" />
              ) : (
                <ClockIcon className="size-4" />
              )}
            </div>
            <div className="grid flex-1 grid-cols-1">
              <CardDescription className="text-sm font-medium text-foreground">
                {schedule.title}
              </CardDescription>
              <CardDescription className="font-mono text-[10px]">
                {schedule.cron}
              </CardDescription>
            </div>
            <div className="flex h-full items-center justify-end text-[10px]">
              <p className={cn("font-mono", schedule.overdue ? "text-warning" : "text-pending")}>
                {schedule.next_fire}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
