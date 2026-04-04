"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { traceGraphs } from "@/src/mock/data"

export default function TracesPage() {
  const [traceId, setTraceId] = useState("")
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (traceId.trim()) {
      router.push(`/traces/${traceId.trim()}`)
    }
  }

  return (
    <div className="space-y-6 p-4">
      {/* Search */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-md">
        <input
          type="text"
          value={traceId}
          onChange={(e) => setTraceId(e.target.value)}
          placeholder="Enter trace ID (e.g. abc-123)"
          className="flex-1 rounded-md border bg-transparent px-3 py-1.5 text-sm placeholder:text-muted-foreground"
        />
        <Button type="submit" size="sm">
          <Search className="size-3.5 mr-1" />
          Inspect
        </Button>
      </form>

      {/* Recent traces */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Available traces
        </p>
        <div className="rounded-md border">
          {traceGraphs.map((trace, i) => (
            <button
              key={trace.trace_id}
              onClick={() => router.push(`/traces/${trace.trace_id}`)}
              className={`w-full flex items-center gap-4 px-4 py-2.5 text-xs text-left transition-colors hover:bg-muted/50 ${i > 0 ? "border-t" : ""}`}
            >
              <span className="font-mono font-medium text-primary">{trace.trace_id}</span>
              <span className="text-muted-foreground">{new Date(trace.started_at).toLocaleString()}</span>
              <span className="text-muted-foreground">{trace.nodes.length} nodes</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
