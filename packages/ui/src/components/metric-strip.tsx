import { cn } from "@workspace/ui/lib/utils"
import { Skeleton } from "@workspace/ui/components/skeleton"

export type MetricChip = {
  label: string
  value: string | number
  variant?: "default" | "warning" | "destructive" | "success" | "pending"
  sub?: string
}

type MetricStripProps = {
  chips?: MetricChip[]
  isLoading?: boolean
}

export function MetricStrip({ chips, isLoading }: MetricStripProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-24 rounded-xl" />
        ))}
      </div>
    )
  }

  if (!chips || chips.length === 0) {
    return (
      <div className="flex flex-wrap gap-2">
        <div className="rounded-xl bg-card px-3 py-2 ring-1 ring-foreground/10">
          <span className="font-mono text-[9px] text-muted-foreground">NO DATA</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip) => (
        <div
          key={chip.label}
          className="flex flex-col gap-0 rounded-xl bg-card px-3 py-2 ring-1 ring-foreground/10"
        >
          <span className="font-mono text-[9px] tracking-wide text-muted-foreground">
            {chip.label}
          </span>
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                chip.variant === "destructive" && "text-destructive",
                chip.variant === "warning" && "text-warning",
                chip.variant === "pending" && "text-pending",
                chip.variant === "success" && "text-success"
              )}
            >
              {chip.value}
            </span>
            {chip.sub && (
              <span className="font-mono text-[9px] text-muted-foreground">
                {chip.sub}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
