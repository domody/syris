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
import { Progress } from "@workspace/ui/components/progress"
import { BotIcon } from "lucide-react"

const stats = {
  ruleHits: 134,
  total: 142,
  llmCalls: 8,
  avgConfidence: 0.87,
  tokensUsed: 14820,
  avgLatency: "1.4s",
}

export function LlmFallback() {
  const coveragePct = Math.round((stats.ruleHits / stats.total) * 100)

  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <BotIcon className="size-3.5 text-muted-foreground" />
          LLM Fallback
        </CardTitle>
        <CardAction>
          <Badge variant="secondary">TODAY</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between">
            <CardDescription>Rule coverage</CardDescription>
            <CardDescription className="font-semibold text-foreground">
              {coveragePct}%
            </CardDescription>
          </div>
          <Progress value={(stats.ruleHits / stats.total) * 100} />
          <CardDescription className="font-mono text-[9px]">
            {stats.ruleHits} rule hits · {stats.llmCalls} LLM calls
          </CardDescription>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              ["AVG CONF", stats.avgConfidence.toFixed(2)],
              ["AVG LATENCY", stats.avgLatency],
              ["TOKENS", stats.tokensUsed.toLocaleString()],
            ] as const
          ).map(([label, value]) => (
            <InsetCard key={label} className="flex-col items-start gap-0 p-2">
              <span className="font-mono text-[9px] text-muted-foreground">{label}</span>
              <span className="font-mono text-xs font-semibold text-foreground">{value}</span>
            </InsetCard>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
