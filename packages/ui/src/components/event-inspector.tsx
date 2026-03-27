import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { Fragment } from "react"

type MessageEventField = {
  key: string
  value: string
  highlight?: boolean
  success?: boolean
}

const fields: MessageEventField[] = [
  { key: "event_id", value: "msg_01HXYZ", highlight: true },
  { key: "channel", value: "email" },
  { key: "trace_id", value: "8c1d04fa-7b3a" },
  { key: "received_at", value: "09:13:49Z" },
  { key: "normalised", value: "true", success: true },
  { key: "routed_to", value: "task-lane" },
  { key: "version", value: "3" },
]

export function EventInspector() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Message Event</CardTitle>
        <CardAction>
          <Badge variant="secondary">INGESTED</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {fields.map((field) => (
            <Fragment key={field.key}>
              <CardDescription className="pt-0.5 font-mono text-[10px] whitespace-nowrap">
                {field.key}
              </CardDescription>
              <CardDescription
                className={cn(
                  "break-all font-mono text-[11px] font-semibold",
                  field.highlight && "text-pending",
                  field.success && "text-success",
                  !field.highlight && !field.success && "text-foreground"
                )}
              >
                {field.value}
              </CardDescription>
            </Fragment>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
