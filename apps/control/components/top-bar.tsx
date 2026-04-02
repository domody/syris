"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { Pause, Play, Command } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { SidebarTrigger } from "@workspace/ui/components/sidebar"
import { Separator } from "@workspace/ui/components/separator"
import { useDashboard } from "./dashboard-context"

const pageTitles: Record<string, string> = {
  "/": "Overview",
  "/feed": "Live Feed",
  "/approvals": "Approvals",
  "/alarms": "Alarms",
  "/tasks": "Tasks",
  "/schedules": "Schedules",
  "/watchers": "Watchers",
  "/rules": "Rules",
  "/integrations": "Integrations",
  "/audit": "Audit Log",
  "/traces": "Trace Inspector",
  "/settings": "Settings",
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)
  if (segments.length <= 1) return null

  const crumbs: { label: string; href: string }[] = []
  const parentPath = `/${segments[0]}`
  crumbs.push({
    label: pageTitles[parentPath] || segments[0],
    href: parentPath,
  })

  return crumbs
}

export function TopBar() {
  const pathname = usePathname()
  const { pipelinePaused, togglePipeline } = useDashboard()
  const breadcrumbs = getBreadcrumbs(pathname)

  const segments = pathname.split("/").filter(Boolean)
  const title =
    segments.length > 1
      ? segments[segments.length - 1]
      : pageTitles[pathname] || "SYRIS"

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 !h-4" />

      <div className="flex flex-1 items-center gap-2">
        {breadcrumbs && (
          <nav className="flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((crumb) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
                <span>/</span>
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-sm font-medium">{title}</h1>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant={pipelinePaused ? "warning" : "outline"}
          size="sm"
          onClick={togglePipeline}
        >
          {pipelinePaused ? (
            <>
              <Play className="size-3" />
              <span>Resume</span>
            </>
          ) : (
            <>
              <Pause className="size-3" />
              <span>Pause</span>
            </>
          )}
        </Button>

        <Button variant="outline" size="sm">
          <Command className="size-3" />
          <span>K</span>
        </Button>
      </div>
    </header>
  )
}
