import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { TerminalIcon } from "lucide-react"

export type ToolExecution = {
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

type ToolExecutionsProps = {
  executions?: ToolExecution[]
  isLoading?: boolean
}

export function ToolExecutions({ executions, isLoading }: ToolExecutionsProps) {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <TerminalIcon className="size-3.5 text-muted-foreground" />
          Tool Executions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-0 px-4">
        {isLoading ? (
          <>
            <div className="mb-1.5 grid grid-cols-[1fr_auto_auto_auto] gap-x-3">
              {["TOOL", "RISK", "DUR", "STATUS"].map((h) => (
                <span key={h} className="font-mono text-[9px] tracking-wide text-muted-foreground">
                  {h}
                </span>
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-b py-1.5 last:border-b-0">
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
                <Skeleton className="h-4 w-10 rounded" />
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-4 w-14 rounded" />
              </div>
            ))}
          </>
        ) : !executions || executions.length === 0 ? (
          <CardDescription className="py-4 text-center text-xs">
            No tool executions
          </CardDescription>
        ) : (
          <>
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
                  <span className="font-mono text-[9px] text-muted-foreground">{exec.idem.slice(0, 8)}</span>
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
          </>
        )}
      </CardContent>
    </Card>
  )
}
