import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon } from "lucide-react"
import { Fragment } from "react"

type TraceStage = {
  label: string
  status: "done" | "active" | "pending"
}

const stages: TraceStage[] = [
  { label: "ingest", status: "done" },
  { label: "route", status: "done" },
  { label: "tool", status: "done" },
  { label: "gate", status: "active" },
  { label: "done", status: "pending" },
]

const badgeVariant = {
  done: "success",
  active: "pending",
  pending: "secondary",
} as const

export function TraceTimeline() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Trace Timeline</CardTitle>
        <CardAction>
          <Badge variant="warning">AWAITING GATE</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex w-full items-start">
          {stages.map((stage, i) => (
            <Fragment key={stage.label}>
              <div className="flex flex-col items-center gap-0.5">
                <Badge
                  className={cn(
                    "aspect-square size-5 p-0",
                    stage.status === "active" && "ring-1 ring-pending"
                  )}
                  variant={badgeVariant[stage.status]}
                >
                  {stage.status === "done" && <CheckIcon />}
                </Badge>
                <span className="whitespace-nowrap text-center font-mono text-[9px] text-muted-foreground">
                  {stage.label}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div
                  className={cn(
                    "mt-2.5 h-px flex-1",
                    stage.status === "done" ? "bg-success" : "bg-border"
                  )}
                />
              )}
            </Fragment>
          ))}
        </div>
        <span className="font-mono text-[10px] text-muted-foreground">
          8c1d04fa-7b3a
        </span>
      </CardContent>
    </Card>
  )
}
