"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Zap,
  Clock,
  Bell,
  ListTodo,
  Calendar,
  Eye,
  Cog,
  Plug,
  ScrollText,
  Search,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar"
import { Badge } from "@workspace/ui/components/badge"
import { StatusDot } from "@workspace/ui/components/status-dot"
import { useDashboard } from "./dashboard-context"

const mainNav = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Live Feed", href: "/feed", icon: Zap },
]

const operatorNav = [
  { label: "Approvals", href: "/approvals", icon: Clock, badgeKey: "approvals" as const },
  { label: "Alarms", href: "/alarms", icon: Bell, badgeKey: "alarms" as const },
]

const workloadNav = [
  { label: "Tasks", href: "/tasks", icon: ListTodo },
  { label: "Schedules", href: "/schedules", icon: Calendar },
  { label: "Watchers", href: "/watchers", icon: Eye },
  { label: "Rules", href: "/rules", icon: Cog },
]

const systemNav = [
  { label: "Integrations", href: "/integrations", icon: Plug },
  { label: "Audit Log", href: "/audit", icon: ScrollText },
  { label: "Trace Inspector", href: "/traces", icon: Search },
]

const badgeCounts: Record<string, number> = {
  approvals: 3,
  alarms: 1,
}

function NavGroup({
  label,
  items,
}: {
  label?: string
  items: {
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    badgeKey?: string
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={item.label}
                  render={<Link href={item.href} />}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </SidebarMenuButton>
                {item.badgeKey && badgeCounts[item.badgeKey] > 0 && (
                  <SidebarMenuBadge>
                    <Badge
                      variant={
                        item.badgeKey === "alarms" ? "destructive" : "warning"
                      }
                    >
                      {badgeCounts[item.badgeKey]}
                    </Badge>
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { autonomyLevel } = useDashboard()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              tooltip="SYRIS"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-sm font-bold">S</span>
              </div>
              <div className="flex flex-1 items-center gap-2">
                <span className="truncate font-semibold">SYRIS</span>
                <Badge variant="outline">{autonomyLevel}</Badge>
                <StatusDot status="healthy" pulse />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavGroup items={mainNav} />
        <NavGroup label="Operator" items={operatorNav} />
        <NavGroup label="Workloads" items={workloadNav} />
        <NavGroup label="System" items={systemNav} />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Settings"
              render={<Link href="/settings" />}
              isActive={pathname === "/settings"}
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
