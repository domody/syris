import { Button } from "@workspace/ui/components/button"

import { Metadata } from "next"
import { groupedDemos, demoRegistry } from "./registry"
import { SectionWrapper } from "@/components/section-wrapper"
import { CATEGORY_META } from "./registry"

import { Demo } from "@workspace/ui/components/demo"
import { PaletteDemo } from "@/components/palette-demo"
import { UiDemo } from "@/components/ui-demo"
import { SyrisExamples } from "@/components/syris-examples"

export const metadata: Metadata = {
  title: "Design System — SYRIS",
  description:
    "Visual language, tokens, and component reference for all SYRIS surfaces.",
}

export default function Page() {
  const groups = groupedDemos()

  return (
    <div className="flex min-h-svh w-[calc(100vw-216px)] flex-col overflow-x-auto">
      <UiDemo />
      {/* <div className="h-px w-full bg-border" /> */}
      <SyrisExamples />
    </div>
  )
}