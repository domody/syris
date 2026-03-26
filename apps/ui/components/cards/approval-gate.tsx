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

type ApprovalRequest = {
  desc: string
  trace: string
  tool: string
  risk: string
  waiting: string
}

const item: ApprovalRequest = {
  desc: "Task wants to send an email to team@syris.uk with the generated standup summary. Confirm to proceed.",
  trace: "8c1d04fa-7b3a",
  tool: "gmail.send",
  risk: "medium",
  waiting: "2m 14s",
}

export function ApprovalGate() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Approval Gate</CardTitle>
        <CardAction>
          <Badge variant="warning">AWAITING</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <CardDescription>{item.desc}</CardDescription>
        <div className="grid flex-1 grid-cols-2 gap-4 pt-4">
          {(["trace", "tool", "risk", "waiting"] as const).map((key) => (
            <div key={key} className="flex flex-col gap-0">
              <CardDescription className="font-mono text-[10px]">
                {key.toUpperCase()}
              </CardDescription>
              <CardDescription className="text-sm font-semibold text-foreground">
                {item[key]}
              </CardDescription>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-auto justify-start gap-4">
        <Button variant="success">Approve</Button>
        <Button variant="destructive">Deny</Button>
        <Button variant="secondary">Preview</Button>
      </CardFooter>
    </Card>
  )
}
