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
import { cn } from "@workspace/ui/lib/utils"

type IntentChip = {
  label: string
  matched: boolean
}

const chips: IntentChip[] = [
  { label: "gmail.send", matched: true },
  { label: "task-lane", matched: true },
  { label: "fast-lane", matched: false },
  { label: "ha.write", matched: false },
  { label: "calendar.write", matched: false },
  { label: "rules-engine", matched: false },
]

export function IntentRouting() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Intent Routing</CardTitle>
        <CardAction>
          <Badge variant="pending">2 MATCHED</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <InsetCard className="font-mono text-xs text-muted-foreground">
          &ldquo;send the standup notes to the team&rdquo;
        </InsetCard>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <div
              key={chip.label}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-[11px]",
                chip.matched
                  ? "border-pending/30 bg-pending/10 text-pending"
                  : "border-border bg-secondary text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "size-1.5 rounded-full",
                  chip.matched ? "bg-pending" : "bg-muted-foreground/30"
                )}
              />
              {chip.label}
            </div>
          ))}
        </div>
        <CardDescription className="font-mono text-[10px]">
          matched via LLM fallback
        </CardDescription>
      </CardContent>
    </Card>
  )
}
