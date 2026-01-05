"use client"

import { useWs } from "@/ws/use-ws";
import { Topbar } from "./topbar";
import { DashboardShell } from "./dashboard-shell";

export function Dashboard() {
  useWs();
  return (
    <div className="flex flex-col justify-start items-start w-full h-screen shrink-0 overflow-hidden">
      <Topbar />
      <DashboardShell />
    </div>
  );
}
