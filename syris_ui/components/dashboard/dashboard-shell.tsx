import * as React from "react";
import { cn } from "@/lib/utils";
import { Panel } from "./panels/base-panel";
import { CommandConsole } from "./panels/command-console";
import { EventStreamPanel } from "./panels/event-stream";

export function DashboardShell() {
  return (
    <div className="w-full h-full max-h-full flex flex-col overflow-hidden">
      {/* Dashboard */}
      <div className="w-full h-full p-2 grid grid-cols-3 gap-x-2">
        <Column className="grid-rows-2">
          <CommandConsole />
          <Panel />
        </Column>
        <Column className="grid-rows-2">
          <EventStreamPanel />
          <Panel />
        </Column>
        <Column className="grid-rows-3">
          <Panel />
          <Panel />
          <Panel />
        </Column>
      </div>
      {/* Inspector */}
      <div className="w-full shrink-0"></div>
    </div>
  );
}

function Column({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(className, "h-[calc(100vh-4rem)] max-h-full col-span-1 grid grid-cols-1 gap-2 overdflow-y-hidden")}
      {...props}
    >
      {children}
    </div>
  );
}
