"use client"

import { ThemeProvider } from "./theme-provider"
import { SidebarProvider } from "@workspace/ui/components/sidebar"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { DashboardProvider } from "./dashboard-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardProvider>
        <TooltipProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </TooltipProvider>
      </DashboardProvider>
    </ThemeProvider>
  )
}
