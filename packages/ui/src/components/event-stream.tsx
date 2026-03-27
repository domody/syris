"use client"

import { useEffect, useRef } from "react"
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
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { ActivityIcon } from "lucide-react"

export type LiveEvent = {
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

type EventStreamProps = {
  events?: LiveEvent[]
  todayCount?: number
  isLoading?: boolean
}

export function EventStream({ events, todayCount, isLoading }: EventStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [events?.length])

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
        <div
          ref={scrollRef}
          className="flex max-h-64 flex-col overflow-y-auto scroll-smooth no-scrollbar"
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start gap-2 border-b py-1.5 last:border-b-0">
                <Skeleton className="mt-0.5 h-4 w-12 shrink-0 rounded" />
                <div className="flex flex-1 flex-col gap-1">
                  <Skeleton className="h-3 w-36" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
              </div>
            ))
          ) : !events || events.length === 0 ? (
            <CardDescription className="py-4 text-center text-xs">
              No events yet — waiting for stream
            </CardDescription>
          ) : (
            events.map((ev) => {
              // console.log(ev)
              return (
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
                    {ev.trace.slice(0, 8)} · {ev.time}
                  </span>
                </div>
              </div>
            )})
          )}
        </div>
      </CardContent>
      {todayCount != null && (
        <CardFooter>
          <CardDescription className="font-mono text-[10px]">
            {todayCount.toLocaleString()} events today
          </CardDescription>
        </CardFooter>
      )}
    </Card>
  )
}
