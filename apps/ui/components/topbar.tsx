"use client"

import { Button } from "@workspace/ui/components/button"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"
import React from "react"

export function Topbar() {
  const [accentState, setAccentState] = React.useState("indigo")

  React.useEffect(() => {
    if (accentState == "indigo") {
      document.body.removeAttribute("data-accent")
    } else {
      document.body.setAttribute("data-accent", accentState)
    }
  }, [accentState])

  return (
    <header className="sticky top-0 left-0 z-99 flex h-11 w-screen shrink-0 items-center border-b bg-background px-4"></header>
  )
}
