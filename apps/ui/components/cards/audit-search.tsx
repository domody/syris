"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { InsetCard } from "@workspace/ui/components/inset-card"
import { Input } from "@workspace/ui/components/input"
import { useState } from "react"

type LogEntry = {
  time: string
  type: string
  meta: string
}

const entries: LogEntry[] = [
  { time: "09:14:33", type: "task.completed", meta: "a3f9b1c0" },
  { time: "09:14:29", type: "tool.invoked", meta: "calendar.read" },
  { time: "09:13:51", type: "gate.awaiting", meta: "8c1d04fa" },
  { time: "09:13:49", type: "event.ingested", meta: "email" },
  { time: "09:11:02", type: "tool.failed", meta: "ha.device-write d70e2219" },
  { time: "08:47:11", type: "tool.failed", meta: "calendar.read 19cc3a01" },
]

export function AuditSearch() {
  const [query, setQuery] = useState("tool.failed")

  const results = query
    ? entries.filter(
        (e) =>
          e.type.includes(query) ||
          e.meta.includes(query) ||
          e.time.includes(query)
      )
    : entries.slice(0, 3)

  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Audit Log Search</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          className="font-mono text-xs"
          placeholder="trace_id or event type…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          {results.length > 0 ? (
            results.map((entry, i) => (
              <InsetCard key={i} className="gap-2 font-mono text-[11px]">
                <CardDescription>{entry.time}</CardDescription>
                <span className="font-semibold text-foreground">{entry.type}</span>
                <CardDescription className="ml-auto">{entry.meta}</CardDescription>
              </InsetCard>
            ))
          ) : (
            <CardDescription className="text-xs">No results</CardDescription>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
