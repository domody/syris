"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Switch } from "@workspace/ui/components/switch"
import { useState } from "react"

type PolicyToggle = {
  name: string
  sub: string
  enabled: boolean
}

const toggleDefs: PolicyToggle[] = [
  { name: "Quiet hours", sub: "23:00–07:00 no writes", enabled: true },
  { name: "Anti-flap", sub: "30s debounce on HA", enabled: true },
  { name: "Dry-run mode", sub: "preview all writes", enabled: false },
  { name: "LLM fallback", sub: "allow when rules miss", enabled: true },
]

export function PolicyToggles() {
  const [toggles, setToggles] = useState(toggleDefs.map((t) => t.enabled))

  return (
    <Card className="h-min">
      <CardHeader>
        <CardTitle>Policy Toggles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col">
          {toggleDefs.map((toggle, i) => (
            <div
              key={toggle.name}
              className="flex items-center justify-between border-b py-2 last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{toggle.name}</p>
                <CardDescription className="text-[10px]">{toggle.sub}</CardDescription>
              </div>
              <Switch
                checked={toggles[i]}
                onCheckedChange={(checked) => {
                  const next = [...toggles]
                  next[i] = checked
                  setToggles(next)
                }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
