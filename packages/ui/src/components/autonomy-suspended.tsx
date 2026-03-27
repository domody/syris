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
import { ShieldAlertIcon } from "lucide-react"

const meta = [
  ["SUSPENDED AT", "09:11:05"],
  ["DURATION", "7m 22s"],
  ["TRIGGER", "3× ha.device-write"],
  ["GATES OPEN", "2 pending"],
] as const

export function AutonomySuspended() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-destructive">
          <ShieldAlertIcon className="size-3.5" />
          Autonomy Suspended
        </CardTitle>
        <CardAction>
          <Badge variant="destructive">LEVEL 0</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
          <p className="text-sm font-semibold text-destructive">
            SYRIS has been placed in read-only mode
          </p>
          <p className="mt-1 text-xs text-destructive/80">
            3 consecutive tool failures triggered the safety circuit breaker.
            All write and send operations are suspended until an operator
            manually restores autonomy level.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {meta.map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0">
              <span className="font-mono text-[9px] text-muted-foreground">{k}</span>
              <CardDescription className="text-sm font-semibold text-foreground">{v}</CardDescription>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm">Restore Level 2</Button>
          <Button variant="secondary" size="sm">Inspect failures</Button>
        </div>
      </CardContent>
    </Card>
  )
}
