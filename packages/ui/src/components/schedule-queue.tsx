import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { AlertTriangleIcon, ClockIcon } from "lucide-react"

export type ScheduledItem = {
  title: string
  cron: string
  next_fire: string
  overdue: boolean
}

type ScheduleQueueProps = {
  items?: ScheduledItem[]
  isLoading?: boolean
}

export function ScheduleQueue({ items, isLoading }: ScheduleQueueProps) {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Task Queue</CardTitle>
        <CardAction>
          <Badge variant="secondary">
            {isLoading ? "—" : `${items?.length ?? 0} QUEUED`}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col px-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-2 border-b py-1.5 last:border-b-0">
              <Skeleton className="size-8 rounded-xl" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-2.5 w-20" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))
        ) : !items || items.length === 0 ? (
          <CardDescription className="py-4 text-center text-xs">
            No tasks queued
          </CardDescription>
        ) : (
          items.map((schedule) => (
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
          ))
        )}
      </CardContent>
    </Card>
  )
}
