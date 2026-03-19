"use client";

import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenuItem,
  SidebarMenu,
  SidebarMenuButton,
  SidebarGroupLabel,
} from "../../ui/sidebar";

import { buttonVariants } from "../../ui/button";
import { cn } from "@/lib/utils";
import { BrainCircuit, House, ScanHeart } from "lucide-react";
import { Badge } from "../../ui/badge";
import { Separator } from "../../ui/separator";
import { data as navData } from "../nav-data";
import { usePathname } from "next/navigation";
import { VERSION } from "../../../../version";
import { StatusDot } from "../../status-dot";
import { useHealth } from "@/features/health/use-health";
import { getSystemState } from "@/features/health/system-state";
import { SystemHealthDropdown } from "./health-dropdown";
import { EnvironmentSwitcher } from "./environment-switcher";

export function AppSidebar() {
  const pathname = usePathname();
  const healthQuery = useHealth();

  return (
    <Sidebar>
      <SidebarHeader className="h-(--header-height) border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SystemHealthDropdown healthQuery={healthQuery} />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      {/* <Separator /> */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navData.navMain.map((page) => (
                <SidebarMenuItem key={page.url}>
                  <SidebarMenuButton
                    isActive={page.url == pathname}
                    className=""
                    render={
                      <Link href={page.url}>
                        <page.icon />
                        {page.title}
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <EnvironmentSwitcher />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">v{VERSION}</p>
          <Badge variant={"outline"}>dev</Badge>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
