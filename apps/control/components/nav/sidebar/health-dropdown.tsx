import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { StatusDot } from "@/components/status-dot";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

import { BrainCircuit, RefreshCwIcon } from "lucide-react";
import { getSystemState } from "@/features/health/system-state";
import { HealthQuery } from "@/features/health/use-health";

export function SystemHealthDropdown({
  healthQuery,
}: {
  healthQuery: HealthQuery;
}) {
  const systemState = getSystemState(healthQuery);

  return (
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
            <StatusDot
              className="size-3"
              pulse={
                systemState.uiStatus === "partial_outage" ||
                systemState.uiStatus === "major_outage"
              }
              status={systemState.uiStatus}
            />
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
          <DropdownMenuLabel className={"text-muted-foreground text-xs"}>
            System Health
          </DropdownMenuLabel>
          <div className="w-full flex flex-col gap-4 pb-2 px-2">
            <div className="w-full flex gap-2 items-start justify-start">
              <div className="pt-1.5 h-full">
                <StatusDot
                  className="size-3"
                  pulse={
                    systemState.uiStatus === "partial_outage" ||
                    systemState.uiStatus === "major_outage"
                  }
                  status={systemState.uiStatus}
                />
              </div>
              <div className="flex-1 grid grid-cols-1">
                <p className="text-sm font-medium">{systemState.title}</p>
                <p className="text-xs text-muted-foreground">
                  Current SYRIS Status
                </p>
              </div>
            </div>
            {healthQuery.data ? (
              <>
                <div className="w-full h-24 grid-cols-2 grid gap-2">
                  <div className="w-full rounded bg-input/15 font-mono flex flex-col p-2 text-xs text-muted-foreground">
                    <p className="">NEXT CHECK</p>
                    <p className="text-lg font-medium text-foreground">38s</p>
                    <p className="mt-auto">5m Intvl</p>
                  </div>
                  <div className="w-full rounded bg-input/15 font-mono flex flex-col p-2 text-xs text-muted-foreground">
                    <p className="">LOAD</p>
                    <p className="text-lg font-medium text-foreground">LOW</p>
                    <p className="mt-auto">58 BPM</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full">
                <p className="text-xs text-muted-foreground">
                  No data available, reconnect to backend to view stats.
                </p>
              </div>
            )}

            <Button
              size={"sm"}
              variant={"secondary"}
              onClick={() => {
                console.log("Reloading");
                window.location.reload();
              }}
            >
              <RefreshCwIcon
                className="group-active/button:animate-spin"
                data-icon="inline-start"
              />
              Reload
            </Button>
            <div className="w-full">
              <p className="text-[10px] text-muted-foreground font-mono">
                Last heartbeat: 11:07:42 PM
              </p>
            </div>
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
