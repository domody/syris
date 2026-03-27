"use client"

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
import { useState } from "react"

type AutonomyLevel = {
  level: number
  desc: string
}

const levels: AutonomyLevel[] = [
  { level: 0, desc: "Read-only. No tool execution. Every action requires explicit operator command." },
  { level: 1, desc: "Read-only tools execute freely. All writes require confirmation before proceeding." },
  { level: 2, desc: "Reads freely, executes read-only tools without confirmation. All writes and sends require operator approval." },
  { level: 3, desc: "Most tools execute autonomously. Only high-risk or irreversible actions require approval." },
  { level: 4, desc: "Fully autonomous. All tools execute without confirmation. Audit log only." },
]

type AutonomyLevelProps = {
  initialLevel?: number
}

export function AutonomyLevel({ initialLevel = 2 }: AutonomyLevelProps) {
  const [selected, setSelected] = useState(initialLevel)

  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Autonomy Level</CardTitle>
        <CardAction>
          <Badge variant="pending">LEVEL {selected}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-1.5">
          {levels.map((al) => (
            <button
              key={al.level}
              onClick={() => setSelected(al.level)}
              className={cn(
                "flex-1 rounded-md border py-1.5 text-xs font-medium transition-colors",
                selected === al.level
                  ? "border-pending bg-pending/10 text-pending"
                  : "border-border text-muted-foreground hover:bg-accent"
              )}
            >
              {al.level}
            </button>
          ))}
        </div>
        <CardDescription className="text-sm leading-relaxed">
          {levels[selected].desc}
        </CardDescription>
      </CardContent>
    </Card>
  )
}
