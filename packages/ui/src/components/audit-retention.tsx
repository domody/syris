import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { InsetCard } from "@workspace/ui/components/inset-card"

const stats = {
  totalEvents: 14820,
  storageMB: 2310,
  retentionDays: 90,
  oldestDate: "2025-12-26",
  writesPerDay: 164,
}

const cells = [
  ["Total events", stats.totalEvents.toLocaleString()],
  ["Storage", `${(stats.storageMB / 1000).toFixed(1)} GB`],
  ["Writes / day", String(stats.writesPerDay)],
  ["Oldest record", stats.oldestDate],
] as const

export function AuditRetention() {
  return (
    <Card size="sm" className="h-min">
      <CardHeader>
        <CardTitle>Audit Retention</CardTitle>
        <CardAction>
          <Badge variant="secondary">90d</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {cells.map(([label, value]) => (
          <InsetCard key={label} className="flex-col items-start gap-0.5 px-2 py-1.5">
            <span className="font-mono text-[9px] text-muted-foreground">{label}</span>
            <span className="font-mono text-xs font-semibold text-foreground">{value}</span>
          </InsetCard>
        ))}
      </CardContent>
    </Card>
  )
}
