import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { InsetCard } from "@workspace/ui/components/inset-card"
import { StatusDot } from "@workspace/ui/components/status-dot"
import { type SystemStateKey } from "@workspace/ui/types/system-state"

type SystemHealthItem = {
  status: SystemStateKey
  title: string
}

const items: SystemHealthItem[] = [
  { status: "healthy", title: "Normaliser" },
  { status: "healthy", title: "Router" },
  { status: "healthy", title: "Task engine" },
  { status: "degraded", title: "HA adapter" },
  { status: "healthy", title: "Scheduler" },
  { status: "healthy", title: "Rules engine" },
  { status: "unknown", title: "MCP bridge" },
  { status: "healthy", title: "Audit Store" },
]

export function SystemHealth() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>System Health</CardTitle>
        <CardAction>
          <Badge variant="warning">1 DEGRADED</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <InsetCard key={item.title} className="items-center px-2 py-1.5">
            <StatusDot status={item.status} />
            <CardDescription className="font-medium text-foreground">
              {item.title}
            </CardDescription>
            <CardDescription className="ml-auto font-mono text-[10px]">
              {item.status}
            </CardDescription>
          </InsetCard>
        ))}
      </CardContent>
    </Card>
  )
}
