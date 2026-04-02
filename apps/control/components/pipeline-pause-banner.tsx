"use client"

import { useDashboard } from "./dashboard-context"

export function PipelinePauseBanner() {
  const { pipelinePaused } = useDashboard()

  if (!pipelinePaused) return null

  return (
    <div className="flex h-8 items-center justify-center gap-2 bg-warning/15 text-xs font-medium text-warning">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-75" />
        <span className="relative inline-flex size-2 rounded-full bg-warning" />
      </span>
      Pipeline paused — all processing halted
    </div>
  )
}
