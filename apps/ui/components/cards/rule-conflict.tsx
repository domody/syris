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
import { GitBranchIcon } from "lucide-react"

const conflict = {
  event: { id: "evt_09", channel: "email", subject: "standup summary ready" },
  rules: [
    { name: "Morning standup trigger", action: 'run_task("morning-brief")', priority: 10, fired: true },
    { name: "Email archive rule", action: 'archive_to("inbox/standup")', priority: 8, fired: false },
  ],
}

export function RuleConflict() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <GitBranchIcon className="size-3.5 text-muted-foreground" />
          Rule Conflict
        </CardTitle>
        <CardAction>
          <Badge variant="warning">2 RULES</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <CardDescription>
          Two rules matched the same event. The higher-priority rule was
          executed; the other was suppressed.
        </CardDescription>
        <div className="flex flex-col gap-1.5">
          {conflict.rules.map((rule) => (
            <InsetCard
              key={rule.name}
              className={`flex-col gap-1 p-2.5 ${!rule.fired ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between gap-2">
                <CardDescription className="text-[11px] font-medium text-foreground">
                  {rule.name}
                </CardDescription>
                <Badge
                  variant={rule.fired ? "success" : "secondary"}
                  className="shrink-0 font-mono text-[9px]"
                >
                  {rule.fired ? "FIRED" : "SUPPRESSED"}
                </Badge>
              </div>
              <CardDescription className="font-mono text-[10px]">{rule.action}</CardDescription>
              <CardDescription className="font-mono text-[9px]">
                priority {rule.priority}
              </CardDescription>
            </InsetCard>
          ))}
        </div>
        <CardDescription className="font-mono text-[9px]">
          {conflict.event.id} · {conflict.event.channel} · &ldquo;{conflict.event.subject}&rdquo;
        </CardDescription>
      </CardContent>
    </Card>
  )
}
