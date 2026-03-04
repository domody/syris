import { cn } from "@/lib/utils";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Copy } from "lucide-react";

function formatKey(key: string) {
  const map: Record<string, string> = {
    run_id: "Run ID",
    uptime_s: "Uptime",
    last_heartbeat_at: "Last Heartbeat",
    db: "Database",
  };

  if (map[key]) return map[key];

  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(value: string) {
  const date = new Date(value);

  return date.toLocaleString(undefined, {
    timeStyle: "long",
  });
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return `${h}h ${m}m ${s}s`;
}

function formatValue(key: health_keys, value: any) {
  if (key === "db") return value.ok ? "Connected" : "Disconnected";

  if (key === "uptime_s") return formatUptime(value);

  if (key === "started_at" || key === "last_heartbeat_at") {
    return formatDate(value);
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const health_endpoint = {
  status: "healthy",
  service: "syris-core",
  version: "3.0.1",
  env: "dev",
  run_id: "9f3c2b7e-8d41-4c2e-9a7b-1f2d6e8c4b10",
  started_at: "2026-03-02T08:15:30.123456Z",
  uptime_s: 12,
  db: { ok: true, error: null },
  last_heartbeat_at: "2026-03-02T12:30:45.654321Z",
  now: "2026-03-02T12:45:00.000000Z",
} as const;

type health_keys = keyof typeof health_endpoint;

const strip_items: health_keys[] = [
  "status",
  "uptime_s",
  "last_heartbeat_at",
  "db",
  "version",
  "run_id",
];

function SnapshotCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="text-xs">{title}</CardDescription>
        <CardTitle className="text-2xl truncate">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}
export function SystemSnapshot({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("w-full grid grid-cols-6 grid-rows-1 gap-2", className)}
      {...props}
    >
      {strip_items.map((key) => (
        <SnapshotCard
          key={key}
          title={formatKey(key)}
          value={formatValue(key, health_endpoint[key])}
        />
      ))}
    </div>
  );
}
