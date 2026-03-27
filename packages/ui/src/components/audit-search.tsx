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
import { Skeleton } from "@workspace/ui/components/skeleton"
import { useState } from "react"

export type AuditLogEntry = {
  time: string
  type: string
  meta: string
}

type AuditSearchProps = {
  entries?: AuditLogEntry[]
  isLoading?: boolean
}

export function AuditSearch({ entries, isLoading }: AuditSearchProps) {
  const [query, setQuery] = useState("")

  const results = query
    ? (entries ?? []).filter(
        (e) =>
          e.type.toLowerCase().includes(query.toLowerCase()) ||
          e.meta.toLowerCase().includes(query.toLowerCase()) ||
          e.time.includes(query)
      )
    : (entries ?? []).slice(0, 4)

  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Audit Log Search</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Input
          className="font-mono text-xs"
          placeholder="event type or tool name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))
          ) : results.length > 0 ? (
            results.map((entry, i) => (
              <InsetCard key={i} className="gap-2 font-mono text-[11px]">
                <CardDescription className="shrink-0">{entry.time}</CardDescription>
                <span className="truncate font-semibold text-foreground">{entry.type}</span>
                <CardDescription className="ml-auto shrink-0">{entry.meta}</CardDescription>
              </InsetCard>
            ))
          ) : (
            <CardDescription className="text-xs">
              {query ? "No results" : "No audit events"}
            </CardDescription>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
