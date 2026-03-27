"use client";

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
import { useSSEStore } from "@/lib/sse";
import { MetricStrip } from "@workspace/ui/components/metric-strip";
import { AuditStream } from "@workspace/ui/components/audit-stream";
import { EventStream } from "@workspace/ui/components/event-stream";
import { ToolExecutions } from "@workspace/ui/components/tool-executions";
import { AutonomyLevel } from "@workspace/ui/components/autonomy-level";
import { AuditSearch } from "@workspace/ui/components/audit-search";
import { LlmFallback } from "@workspace/ui/components/llm-fallback";
import { SystemHealth } from "@workspace/ui/components/system-health";
import { ScheduleQueue } from "@workspace/ui/components/schedule-queue";

const row4 = ["Approvals", "Alarms", "Failures"];
const row5 = [
  "Pause System",
  "Autonomy",
  "Acknowledge Alarm",
  "Open Trace Explorer",
];

export default function Page() {
  const status = useSSEStore((s) => s.status);
  const auditEvents = useSSEStore((s) => s.events.audit_event);
  const healthEvents = useSSEStore((s) => s.events.health);

  return (
    <div className="flex flex-col flex-1 items-start justify-start">
      <Topbar>
        <h1 className="font-semibold text-lg">Overview</h1>
      </Topbar>
      <div className="flex flex-1 flex-col gap-3 w-full p-4 items-start justify-start">
        <MetricStrip />
        <div className="grid grid-cols-3 gap-3 w-full">
          <Column>
            <AuditStream />
            <ToolExecutions />
          </Column>
          <Column>
            <EventStream />
            <ScheduleQueue />
          </Column>
          <Column>
            <SystemHealth />
            <AutonomyLevel />
            <LlmFallback />
            <AuditSearch />
          </Column>
        </div>
      </div>
    </div>
  );
}

function Column({ ...props }: React.ComponentProps<"div">) {
  return <div className="flex flex-col gap-3" {...props} />;
}
// <div className="grid grid-cols-6 gap-2 w-full">
//   <SystemSnapshot
//     className="col-span-4 grid-cols-4"
//     excludes={["version", "last_heartbeat_at"]}
//   />
//   <SnapshotCard
//     className="opacity-50 select-none"
//     title="Autonomy"
//     value="Not Configured"
//   />
//   <SnapshotCard
//     className="opacity-50 select-none"
//     title="Alarms"
//     value="0 Alarms"
//   />
// </div>
// <EventLoopCard className="w-full" />
// <div className="w-full grid grid-cols-2 gap-2">
//   <UptimeBars />
// </div>
// <div className="w-full grid grid-cols-3 gap-2">
//   {row4.map((item) => {
//     return (
//       <Card key={item} className="min-h-24" size="sm">
//         <CardHeader>
//           <CardTitle>{item}</CardTitle>
//         </CardHeader>
//       </Card>
//     );
//   })}
// </div>
// <div className="w-full grid grid-cols-4 gap-2">
//   {row5.map((item) => {
//     return (
//       <Card key={item} className="min-h-24" size="sm">
//         <CardHeader>
//           <CardTitle>{item}</CardTitle>
//         </CardHeader>
//       </Card>
//     );
//   })}
// </div>
