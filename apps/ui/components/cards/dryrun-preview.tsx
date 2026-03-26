import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { InsetCard } from "@workspace/ui/components/inset-card"
import { cn } from "@workspace/ui/lib/utils"

type DiffLine = {
  type: "ctx" | "rem" | "add"
  content: string
}

const lines: DiffLine[] = [
  { type: "ctx", content: "to: team@syris.uk" },
  { type: "rem", content: "subject: Standup notes" },
  { type: "add", content: "subject: [SYRIS] Standup · Mon 24 Mar" },
  { type: "ctx", content: "body: 847 chars" },
  { type: "add", content: "attachment: standup.md" },
]

export function DryrunPreview() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Dry-run Preview</CardTitle>
        <CardAction>
          <Badge variant="secondary">GMAIL.SEND</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <InsetCard className="flex-col gap-1 font-mono text-[11px]">
          {lines.map((line, i) => (
            <div key={i} className="flex gap-2">
              <span
                className={cn(
                  "w-2.5 shrink-0 font-medium",
                  line.type === "add" && "text-success",
                  line.type === "rem" && "text-destructive",
                  line.type === "ctx" && "text-muted-foreground"
                )}
              >
                {line.type === "add" ? "+" : line.type === "rem" ? "−" : " "}
              </span>
              <span
                className={cn(
                  line.type === "add" && "text-success",
                  line.type === "rem" && "text-destructive line-through decoration-destructive/50",
                  line.type === "ctx" && "text-muted-foreground"
                )}
              >
                {line.content}
              </span>
            </div>
          ))}
        </InsetCard>
        <div className="flex gap-2">
          <Button variant="success" size="sm" className="h-7 text-xs">
            Approve
          </Button>
          <Button variant="destructive" size="sm" className="h-7 text-xs">
            Deny
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
