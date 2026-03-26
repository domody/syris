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
import { TerminalIcon } from "lucide-react"

type ToolExecution = {
  tool: string
  risk: "low" | "medium" | "high"
  duration: string
  status: "success" | "failed" | "gated" | "running"
  idem: string
}

const riskVariant: Record<ToolExecution["risk"], "success" | "warning" | "destructive"> = {
  low: "success",
  medium: "warning",
  high: "destructive",
}

const statusVariant: Record<ToolExecution["status"], "success" | "warning" | "destructive" | "pending"> = {
  success: "success",
  gated: "warning",
  failed: "destructive",
  running: "pending",
}

const executions: ToolExecution[] = [
  { tool: "calendar.read", risk: "low", duration: "1.1s", status: "success", idem: "91a33fd0" },
  { tool: "gmail.send", risk: "medium", duration: "—", status: "gated", idem: "8c1d04fa" },
  { tool: "ai-extract", risk: "low", duration: "4.2s", status: "running", idem: "e9f2a001" },
  { tool: "ha.device-write", risk: "high", duration: "0.3s", status: "failed", idem: "d70e2219" },
  { tool: "ha.device-read", risk: "low", duration: "0.8s", status: "success", idem: "c7d401ab" },
  { tool: "calendar.read", risk: "low", duration: "0.9s", status: "success", idem: "19cc3a01" },
]

export function ToolExecutions() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <TerminalIcon className="size-3.5 text-muted-foreground" />
          Tool Executions
        </CardTitle>
        <CardAction>
          <Button variant="ghost" size="xs">View all</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 px-4">
        <div className="mb-1.5 grid grid-cols-[1fr_auto_auto_auto] gap-x-3">
          {["TOOL", "RISK", "DUR", "STATUS"].map((h) => (
            <span key={h} className="font-mono text-[9px] tracking-wide text-muted-foreground">
              {h}
            </span>
          ))}
        </div>
        {executions.map((exec) => (
          <div
            key={exec.idem}
            className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-b py-1.5 last:border-b-0"
          >
            <div className="flex min-w-0 flex-col">
              <CardDescription className="truncate text-[11px] font-medium text-foreground">
                {exec.tool}
              </CardDescription>
              <span className="font-mono text-[9px] text-muted-foreground">{exec.idem}</span>
            </div>
            <Badge variant={riskVariant[exec.risk]} className="font-mono text-[9px] uppercase">
              {exec.risk}
            </Badge>
            <CardDescription className="font-mono text-[10px] tabular-nums">
              {exec.duration}
            </CardDescription>
            <Badge variant={statusVariant[exec.status]} className="font-mono text-[9px] uppercase">
              {exec.status}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
