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

type ActiveTool = {
  title: string
  idem: string
  elapsed: string
  progress: number
}

const tools: ActiveTool[] = [
  { title: "ai-extract | gpt-40", idem: "e9f2a001", elapsed: "4.2", progress: 65 },
  { title: "ha.device-read | office-blinds", idem: "c7d401ab", elapsed: "0.8", progress: 86 },
  { title: "calendar.read | next-7-days", idem: "91a33fd0", elapsed: "1.1", progress: 45 },
]

export function ActiveTools() {
  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Active Tools</CardTitle>
        <CardAction>
          <Badge variant="pending">3 RUNNING</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-1 flex-col gap-2">
          {tools.map((tool) => (
            <InsetCard key={tool.title} className="flex-col gap-1">
              <CardDescription className="font-semibold text-foreground">
                {tool.title}
              </CardDescription>
              <div className="flex w-full justify-between">
                <CardDescription className="font-mono">
                  idem | {tool.idem}
                </CardDescription>
                <CardDescription className="text-pending">
                  {tool.elapsed}s
                </CardDescription>
              </div>
              <Progress value={tool.progress} />
            </InsetCard>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
