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
import { CheckIcon } from "lucide-react"

type TaskStep = {
  status: "completed" | "in_progress" | "pending"
  label: string
  desc: string | undefined
}

const steps: TaskStep[] = [
  { status: "completed", label: "Ingest meeting transcript", desc: undefined },
  { status: "completed", label: "Extract key points", desc: undefined },
  { status: "in_progress", label: "Identify action items", desc: "4.2s elapsed | tools/ai-extract" },
  { status: "pending", label: "Check Google Calendar", desc: undefined },
  { status: "pending", label: "Draft standup deck", desc: undefined },
  { status: "pending", label: "Write summary", desc: undefined },
]

const badgeVariant = {
  completed: "success",
  in_progress: "pending",
  pending: "secondary",
} as const

export function TaskProgress() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Task Progress</CardTitle>
        <CardAction>
          <Badge variant="success">IN PROGRESS</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex size-full flex-col items-start justify-start gap-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative flex w-full items-start justify-start gap-3 py-0.5"
            >
              {index !== steps.length - 1 && (
                <div
                  className={cn(
                    "absolute top-5.5 left-2.5 z-0 w-px bg-border",
                    step.status === "in_progress" ? "h-9" : "h-4"
                  )}
                />
              )}
              <Badge
                className={cn(
                  "z-1 aspect-square rounded-full p-0 [&_svg:not([class*='size-'])]:size-3",
                  step.status === "in_progress" && "ring-1"
                )}
                variant={badgeVariant[step.status]}
              >
                {step.status === "completed" ? <CheckIcon /> : index + 1}
              </Badge>
              {step.status === "in_progress" ? (
                <div className="grid flex-1 grid-cols-1">
                  <CardDescription className="text-sm font-semibold text-foreground">
                    {step.label}
                  </CardDescription>
                  <CardDescription>{step.desc}</CardDescription>
                </div>
              ) : (
                <CardDescription className="text-sm">{step.label}</CardDescription>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
