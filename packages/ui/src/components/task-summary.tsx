import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

type TaskSummaryField = {
  key: string
  value: string
}

const fields: TaskSummaryField[] = [
  { key: "Lane", value: "task" },
  { key: "Trace", value: "a3f9b1c0-4d2e" },
  { key: "Step", value: "3 / 6" },
  { key: "Duration", value: "1m 04s" },
  { key: "Retries", value: "0" },
]

export function TaskSummary() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Task</CardTitle>
        <CardAction>
          <Badge variant="pending">RUNNING</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col">
        <p className="mb-3 text-sm font-semibold text-foreground">
          Morning standup brief
        </p>
        {fields.map((field) => (
          <div
            key={field.key}
            className="flex items-baseline justify-between border-b py-1.5 last:border-b-0"
          >
            <CardDescription className="text-xs">{field.key}</CardDescription>
            <CardDescription className="font-mono text-xs font-semibold text-foreground">
              {field.value}
            </CardDescription>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
