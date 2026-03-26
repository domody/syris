import { cn } from "@workspace/ui/lib/utils"

type MetricChip = {
  label: string
  value: string | number
  variant?: "default" | "warning" | "destructive" | "success" | "pending"
  sub?: string
}

const chips: MetricChip[] = [
  { label: "EVENTS/MIN", value: 47 },
  { label: "P95 LATENCY", value: "142ms", sub: "tool exec" },
  { label: "ACTIVE TASKS", value: 3, variant: "pending" },
  { label: "PENDING GATES", value: 1, variant: "warning" },
  { label: "TOOL FAILURES", value: 2, variant: "destructive", sub: "24h" },
]

export function MetricStrip() {
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
