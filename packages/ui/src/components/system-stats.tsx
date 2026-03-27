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

type SystemStat = {
  label: string
  value: number
  danger: boolean
}

const stats: SystemStat[] = [
  { label: "events ingested", value: 142, danger: false },
  { label: "tasks run", value: 38, danger: false },
  { label: "gates opened", value: 6, danger: false },
  { label: "tool failures", value: 2, danger: true },
]

export function SystemStats() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>System Stats</CardTitle>
        <CardAction>
          <Badge variant="secondary">TODAY</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {stats.map((stat) => (
          <InsetCard key={stat.label} className="flex-col gap-0.5">
            <p className={cn("text-2xl leading-none font-medium", stat.danger && "text-destructive")}>
              {stat.value}
            </p>
            <CardDescription className="text-[10px]">{stat.label}</CardDescription>
          </InsetCard>
        ))}
      </CardContent>
    </Card>
  )
}
