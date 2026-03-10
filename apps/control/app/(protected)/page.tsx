import { EventLoopCard } from "@/components/event-loop";
import { Topbar } from "@/components/nav/topbar";
import { SnapshotCard, SystemSnapshot } from "@/components/system-snapshot";
import { UptimeBars } from "@/components/uptime-bars";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const row4 = ["Approvals", "Alarms", "Failures"];
const row5 = [
  "Pause System",
  "Autonomy",
  "Acknowledge Alarm",
  "Open Trace Explorer",
];

export default function Page() {
  return (
    <div className="flex flex-col flex-1 items-start justify-start">
      <Topbar>
        <h1 className="font-semibold text-lg">Overview</h1>
      </Topbar>
      <div className="flex flex-1 flex-col gap-2 w-full p-4 items-start justify-start">
        <div className="grid grid-cols-6 gap-2 w-full">
          <SystemSnapshot
            className="col-span-4 grid-cols-4"
            excludes={["version", "last_heartbeat_at"]}
          />
          <SnapshotCard
            className="opacity-50 select-none"
            title="Autonomy"
            value="Not Configured"
          />
          <SnapshotCard
            className="opacity-50 select-none"
            title="Alarms"
            value="0 Alarms"
          />
        </div>
        <EventLoopCard className="w-full" />
        <div className="w-full grid grid-cols-2 gap-2">
          <UptimeBars />
        </div>
        <div className="w-full grid grid-cols-4 gap-2">
          {row4.map((item) => {
            return (
              <Card key={item} className="min-h-24" size="sm">
                <CardHeader>
                  <CardTitle>{item}</CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>
        <div className="w-full grid grid-cols-4 gap-2">
          {row5.map((item) => {
            return (
              <Card key={item} className="min-h-24" size="sm">
                <CardHeader>
                  <CardTitle>{item}</CardTitle>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
