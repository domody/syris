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

const rule = {
  name: "Morning standup trigger",
  conditions: ['channel == "email"', 'AND subject ~ "standup"'],
  action: 'run_task("morning-brief")',
  firedCount: 14,
}

export function RuleDetail() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Rule</CardTitle>
        <CardAction>
          <Badge variant="success">ACTIVE</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-sm font-semibold text-foreground">{rule.name}</p>
        <InsetCard className="flex-col gap-1 font-mono text-xs">
          <CardDescription className="text-[10px] font-semibold uppercase tracking-widest">
            if
          </CardDescription>
          {rule.conditions.map((cond, i) => (
            <p key={i} className="text-xs text-foreground/80">
              {cond}
            </p>
          ))}
        </InsetCard>
        <InsetCard className="flex-col gap-1 font-mono text-xs">
          <CardDescription className="text-[10px] font-semibold uppercase tracking-widest">
            then
          </CardDescription>
          <p className="text-xs text-foreground/80">{rule.action}</p>
        </InsetCard>
        <CardDescription className="font-mono text-[10px]">
          fired {rule.firedCount}× this week
        </CardDescription>
      </CardContent>
    </Card>
  )
}
