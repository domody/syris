import { LatestIncidentsCard } from "@/components/latest-incidents";
import { Topbar } from "@/components/nav/topbar";
import { SystemChecksCard } from "@/components/system-checks";
import { SystemSnapshot } from "@/components/system-snapshot";
import { Badge } from "@/components/ui/badge";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { UptimeBars } from "@/components/uptime-bars";
import { UptimeChart } from "@/components/uptime-chart";
import { SystemHealthBadge } from "@/features/health/components/system-health-badge";
import { CheckCircle, CheckCircle2 } from "lucide-react";

export default function SystemHealthPage() {
  return (
    <div className="flex flex-col flex-1 items-start justify-start">
      <Topbar className="g">
        <h1 className="text-base font-medium">System Health</h1>
        <SystemHealthBadge className="ml-auto mr-2" />
      </Topbar>
      <div className="flex flex-1 flex-col gap-2 w-full p-4 items-start justify-start">
        <SystemSnapshot />
        <div className="w-full grid grid-cols-5 gap-2 gr">
          <UptimeBars className="col-span-3 h-full" />
          {/* <SystemChecksCard className="col-span-1 row-span-2" /> */}
          {/* <LatestIncidentsCard className="col-span-1 row-span-2" /> */}
          {/* <UptimeBars className="col-span-3 h-full" /> */}
        </div>
      </div>
    </div>
  );
}
