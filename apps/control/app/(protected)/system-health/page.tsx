import { LatestIncidentsCard } from "@/components/latest-incidents";
import { Topbar } from "@/components/nav/topbar";
import { SystemChecksCard } from "@/components/system-checks";
import { SystemSnapshot } from "@/components/system-snapshot";
import { Badge } from "@/components/ui/badge";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { UptimeBars } from "@/components/uptime-bars";
import { UptimeChart } from "@/components/uptime-chart";
import { CheckCircle, CheckCircle2 } from "lucide-react";

export default function SystemHealthPage() {

  return (
    <div className="flex flex-col flex-1 items-start justify-start">
      <Topbar className="g">
        <h1 className="text-base font-medium">System Health</h1>
        <Badge className="bg-green-600 dark:bg-green-500 ml-auto">All Systems Operational</Badge>
      </Topbar>
      <div className="flex flex-1 flex-col gap-2 w-full p-4 items-start justify-start">
        {/* <Item variant={"muted"} className="bg-green-100 dark:bg-green-950/50">
          <ItemMedia>
            <CheckCircle2 className="size-5 stroke-green-600 dark:stroke-green-500" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>All Systems Operational</ItemTitle>
          </ItemContent>
        </Item> */}
        {/* <div className="w-full flex items-center justify-between gap-4 bg-card border border-card ring-1 ring-foreground/10 px-3 py-2.5 rounded-lg ">
          {strip_items.map((item, _) => {
            const data = health_endpoint[item];

            return (
              <div
                key={item}
                className="flex flex-col text-xs text-muted-foreground"
              >
                <p className="">{item}</p>
                <span className="text-foreground text-sm font-normal">
                  {item == "db"
                    ? String(
                        health_endpoint[item].error || health_endpoint[item].ok,
                      )
                    : (data as string)}
                </span>
              </div>
            );
          })}
        </div> */}
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
