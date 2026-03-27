"use client"

import { useEffect, useRef } from "react"
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
import { StatusDot } from "@workspace/ui/components/status-dot"
import { cn } from "@workspace/ui/lib/utils"
import { type SystemStateKey } from "@workspace/ui/types/system-state"

export type AuditStreamItem = {
  status: "success" | "destructive" | "warn" | "in_progress"
  label: string
  trace: string
  time: string
}

const statusToSystemState: Record<string, SystemStateKey | undefined> = {
  success: "healthy",
  destructive: "major_outage",
}

type AuditStreamProps = {
  items?: AuditStreamItem[]
  isLoading?: boolean
}

export function AuditStream({ items, isLoading }: AuditStreamProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [items?.length])

  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Audit Stream</CardTitle>
        <CardAction>
          <Badge variant="pending" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-current animate-pulse" />
            LIVE
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div
          ref={scrollRef}
          className="flex size-full max-h-64 flex-col overflow-y-auto px-2 scroll-smooth no-scrollbar"
        >
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 border-b py-1.5 last:border-b-0">
                <Skeleton className="mt-1.5 size-2 shrink-0 rounded-full" />
                <div className="flex flex-1 flex-col gap-1">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2.5 w-24" />
                </div>
                <Skeleton className="h-2.5 w-14" />
              </div>
            ))
          ) : !items || items.length === 0 ? (
            <CardDescription className="py-4 text-center text-xs">
              No audit events yet
            </CardDescription>
          ) : (
            items.map((item, i) => (
              <div
                key={`${item.trace}-${i}`}
                className="flex w-full items-start justify-start gap-3 border-b py-1.5 last:border-b-0"
              >
                <StatusDot
                  status={statusToSystemState[item.status]}
                  className="mt-1.5"
                  dotClassName={cn(
                    item.status === "warn" && "bg-warning",
                    item.status === "in_progress" && "bg-pending"
                  )}
                />
                <div className="grid flex-1 grid-cols-1 min-w-0">
                  <CardDescription className="font-medium text-foreground truncate">
                    {item.label}
                  </CardDescription>
                  <CardDescription className="font-mono text-[10px]">
                    trace {item.trace.slice(0, 13)}
                  </CardDescription>
                </div>
                <div className="ml-auto shrink-0">
                  <CardDescription className="font-mono text-[10px]">
                    {item.time}
                  </CardDescription>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
