"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@/lib/utils"
import { useDashboard } from "@/components/dashboard-context"
import { rules as allRules } from "@/src/mock/data"

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "never"
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function RulesPage() {
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(allRules.map((r) => [r.id, r.enabled])),
  )
  const [search, setSearch] = useState("")
  const { addToast } = useDashboard()

  const filtered = allRules.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const withLocalState = filtered.map((r) => ({
    ...r,
    enabled: enabledMap[r.id] ?? r.enabled,
  }))

  return (
    <div className="space-y-4 p-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Search:</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rule name..."
            className="rounded-md border bg-transparent px-2 py-1 text-xs placeholder:text-muted-foreground w-40"
          />
        </div>
        <div className="flex-1" />
        <Button
          size="sm"
          onClick={() =>
            addToast({ title: "Create rule", description: "Rule editor coming soon", variant: "default" })
          }
        >
          + Create
        </Button>
      </div>

      {/* Rule list */}
      <div className="rounded-md border">
        <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span className="w-3.5" />
          <span className="w-3.5" />
          <span className="flex-1">Name</span>
          <span className="w-20 text-right">Hits (24h)</span>
          <span className="w-28">Last Fired</span>
          <span className="w-32">Suppressed</span>
        </div>

        {withLocalState.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">No rules match filters</p>
        ) : (
          withLocalState.map((rule) => (
            <Link
              key={rule.id}
              href={`/rules/${rule.id}`}
              className="flex items-center gap-3 border-b px-4 py-2.5 text-xs transition-colors hover:bg-muted/50 last:border-b-0"
            >
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />

              <span
                className="shrink-0"
                onClick={(e) => {
                  e.preventDefault()
                  const newEnabled = !(enabledMap[rule.id] ?? rule.enabled)
                  setEnabledMap((prev) => ({ ...prev, [rule.id]: newEnabled }))
                  addToast({
                    title: newEnabled ? "Rule enabled" : "Rule disabled",
                    description: rule.name,
                    variant: newEnabled ? "success" : "warning",
                  })
                }}
              >
                <input
                  type="checkbox"
                  checked={rule.enabled}
                  readOnly
                  className="size-3.5 rounded border-muted-foreground accent-primary cursor-pointer"
                />
              </span>

              <span className={cn("flex-1 font-medium truncate", !rule.enabled && "text-muted-foreground")}>
                {rule.name}
              </span>

              <span className="w-20 text-right tabular-nums">
                {rule.hits_24h > 0 ? (
                  <Badge variant="secondary">{rule.hits_24h}</Badge>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </span>

              <span className="w-28 text-muted-foreground tabular-nums">
                {timeAgo(rule.last_fired)}
              </span>

              <span className="w-32 text-muted-foreground">
                {rule.suppressed_count > 0 ? (
                  <Badge variant="warning">{rule.suppressed_count}</Badge>
                ) : (
                  <span>0</span>
                )}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
