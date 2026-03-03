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
} from "../ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { buttonVariants } from "../ui/button";
import { cn } from "@/lib/utils";
import { BrainCircuit, House, ScanHeart } from "lucide-react";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { data as navData } from "./nav-data";
import { usePathname } from "next/navigation";
import { VERSION } from "../../../version";
import { StatusDot } from "../status-dot";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="h-(--header-height) border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuButton
                    className={cn(
                      buttonVariants({ variant: "ghost", size: "default" }),
                      "justify-center h-10 max-h-full",
                    )}
                  >
                    <BrainCircuit data-icon="inline-start" />
                    <div className="flex-1 flex items-end gap-2">
                      <p className="text-sm">syris-controls</p>
                    </div>
                    {/* <Badge className="ml-auto">v{VERSION}</Badge> */}
                    <StatusDot className="size-3" pulse />
                  </SidebarMenuButton>
                }
              />
              <DropdownMenuContent
                className={"min-w-64"}
                align="start"
                side="right"
                sideOffset={4}
              >
                <DropdownMenuGroup className={""}>
                  <DropdownMenuLabel
                    className={"text-muted-foreground text-xs"}
                  >
                    System Health
                  </DropdownMenuLabel>
                  <div className="w-full flex flex-col gap-4 pb-2 px-2">
                    <div className="w-full flex gap-2 items-start justify-start">
                      <div className="pt-1.5 h-full">
                        <StatusDot pulse />
                      </div>
                      <div className="flex-1 grid grid-cols-1">
                        <p className="text-sm font-medium">Online</p>
                        <p className="text-xs text-muted-foreground">
                          Current SYRIS Status
                        </p>
                      </div>
                    </div>
                    <div className="w-full h-24 grid-cols-2 grid gap-2">
                      <div className="w-full rounded bg-input/15 font-mono flex flex-col p-2 text-xs text-muted-foreground">
                        <p className="">NEXT CHECK</p>
                        <p className="text-lg font-medium text-foreground">
                          38s
                        </p>
                        <p className="mt-auto">5m Intvl</p>
                      </div>
                      <div className="w-full rounded bg-input/15 font-mono flex flex-col p-2 text-xs text-muted-foreground">
                        <p className="">LOAD</p>
                        <p className="text-lg font-medium text-foreground">
                          LOW
                        </p>
                        <p className="mt-auto">58 BPM</p>
                      </div>
                    </div>
                    <div className="w-full">
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Last heartbeat: 11:07:42 PM
                      </p>
                    </div>
                  </div>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
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
        <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">v{VERSION}</p>
        <Badge variant={"outline"}>dev</Badge></div>
      </SidebarFooter>
    </Sidebar>
  );
}
