import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

type CheckpointStep = {
  label: string
  status: "done" | "active" | "pending"
}

const steps: CheckpointStep[] = [
  { label: "Fetch emails", status: "done" },
  { label: "Extract action items", status: "done" },
  { label: "Awaiting send approval", status: "active" },
  { label: "Post to calendar", status: "pending" },
  { label: "Write summary", status: "pending" },
]

export function TaskCheckpoint() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Checkpoint</CardTitle>
        <CardAction>
          <Badge variant="warning">PAUSED</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div>
          <div className="flex gap-0.5">
            {steps.map((step, i) => (
              <div
                key={i}
                className={cn(
                  "h-1 flex-1 rounded-sm",
                  step.status === "done" && "bg-success",
                  step.status === "active" && "bg-warning",
                  step.status === "pending" && "bg-border"
                )}
              />
            ))}
          </div>
          <CardDescription className="mt-1.5 font-mono text-[10px]">
            step 3 of 5 · paused at gate
          </CardDescription>
        </div>
        <div className="flex flex-col gap-1.5">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  "size-2 shrink-0 rounded-full",
                  step.status === "done" && "bg-success",
                  step.status === "active" && "bg-warning",
                  step.status === "pending" && "bg-border"
                )}
              />
              <span
                className={cn(
                  "text-xs",
                  step.status === "pending" && "text-muted-foreground",
                  step.status === "done" && "text-muted-foreground",
                  step.status === "active" && "font-semibold text-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" className="h-7 w-fit text-xs">
          Resume task
        </Button>
      </CardContent>
    </Card>
  )
}
