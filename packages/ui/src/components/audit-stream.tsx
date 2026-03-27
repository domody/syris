import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { StatusDot } from "@workspace/ui/components/status-dot"
import { cn } from "@workspace/ui/lib/utils"
import { type SystemStateKey } from "@workspace/ui/types/system-state"

type AuditItem = {
  status: "success" | "destructive" | "warn" | "in_progress"
  label: string
  trace: string
  time: string
}

const statusToSystemState: Record<string, SystemStateKey | undefined> = {
  success: "healthy",
  destructive: "major_outage",
}

const items: AuditItem[] = [
  { status: "success", label: "task.completed", trace: "a3f9b1c0-4d2e", time: "09:14:33" },
  { status: "in_progress", label: "tool.invoked | calendar.read", trace: "a3f9b1c0-4d2e", time: "09:14:29" },
  { status: "warn", label: "gate.awaiting | approval", trace: "8c1d04fa-7b3a", time: "09:13:51" },
  { status: "success", label: "event.ingested | email", trace: "8c1d04fa-7b3a", time: "09:13:49" },
  { status: "destructive", label: "tool.failed | ha.device-write", trace: "d70e2219-c5f1", time: "09:11:02" },
]

export function AuditStream() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Audit Stream</CardTitle>
        <CardAction>
          <Badge variant="secondary">LIVE</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex size-full flex-col px-2">
          {items.map((item) => (
            <div
              key={item.label}
              className="flex w-full items-start justify-start gap-3 border-b py-1.5 last:border-b-0"
            >
              <StatusDot
                status={statusToSystemState[item.status]}
                className="mt-1.5"
                dotClassName={cn(
                  item.status === "warn" && "bg-warning",
                  item.status === "in_progress" && "bg-pending"
                )}
              />
              <div className="grid flex-1 grid-cols-1">
                <CardDescription className="font-medium text-foreground">
                  {item.label}
                </CardDescription>
                <CardDescription className="font-mono text-[10px]">
                  trace {item.trace}
                </CardDescription>
              </div>
              <div className="ml-auto">
                <CardDescription className="font-mono text-[10px]">
                  {item.time}
                </CardDescription>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
