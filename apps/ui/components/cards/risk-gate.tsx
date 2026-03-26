import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { InsetCard } from "@workspace/ui/components/inset-card"
import { ShieldAlertIcon } from "lucide-react"

const details = [
  ["TOOL", "ha.scene.set"],
  ["ACTION", 'scene("movie-mode")'],
  ["TRACE", "f3a901bb-2c4d"],
  ["TRIGGERED BY", "Evening automation rule"],
  ["RISK", "HIGH · irreversible w/in 30s"],
] as const

export function RiskGate() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-warning">
          <ShieldAlertIcon className="size-3.5" />
          Risk Gate
        </CardTitle>
        <CardAction>
          <Badge variant="warning">HIGH RISK</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <CardDescription>
          A tool execution requires operator approval before proceeding. The
          action is classified as high-risk and may be partially irreversible
          within 30 seconds.
        </CardDescription>
        <InsetCard className="flex-col gap-1.5 p-3">
          {details.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-4">
              <span className="shrink-0 font-mono text-[9px] tracking-wide text-muted-foreground">
                {k}
              </span>
              <CardDescription className="truncate font-mono text-[10px] font-medium text-foreground">
                {v}
              </CardDescription>
            </div>
          ))}
        </InsetCard>
        <div className="flex gap-2">
          <Button variant="success" size="sm">Approve</Button>
          <Button variant="destructive" size="sm">Deny</Button>
          <Button variant="secondary" size="sm">Dry-run</Button>
        </div>
      </CardContent>
      <CardFooter>
        <CardDescription className="font-mono text-[10px]">
          raised 09:18:22 · waiting 0m 47s
        </CardDescription>
      </CardFooter>
    </Card>
  )
}
