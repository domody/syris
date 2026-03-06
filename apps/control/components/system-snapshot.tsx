"use client";

import { cn } from "@/lib/utils";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useHealth } from "@/features/health/use-health";
import type { HealthResponse } from "@/features/health/health-api";
import { QueryBoundary } from "./query/query-boundary";
import { UptimeBars } from "./uptime-bars";

type HealthKey = keyof HealthResponse;

const STRIP_ITEMS = [
  "status",
  "uptime_s",
  "last_heartbeat_at",
  "db",
  "version",
  "run_id",
] satisfies readonly HealthKey[];

const GRID_CLASS = "w-full grid grid-cols-6 grid-rows-1 gap-2";

const KEY_LABELS: Partial<Record<HealthKey, string>> = {
  run_id: "Run ID",
  uptime_s: "Uptime",
  last_heartbeat_at: "Last Heartbeat",
  db: "Database",
};

function formatKey(key: HealthKey) {
  return (
    KEY_LABELS[key] ??
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return date.toLocaleString(undefined, { timeStyle: "long" });
}

function formatUptime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

function formatValue(key: HealthKey, value: HealthResponse[HealthKey]) {
  switch (key) {
    case "db":
      return (value as HealthResponse["db"]).ok ? "Connected" : "Disconnected";
    case "uptime_s":
      return formatUptime(value as number);
    case "started_at":
    case "last_heartbeat_at":
      return formatDate(value as string);
    default:
      return String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function SnapshotCard({
  title,
  value,
  className,
  ...props
}: { title: string; value: string } & React.ComponentProps<"div">) {
  return (
    <Card className={cn("w-full", className)} {...props}>
      <CardHeader>
        <CardDescription className="text-xs">{title}</CardDescription>
        <CardTitle className="text-2xl truncate">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

export function SnapshotCardSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardDescription className="text-xs">
          <span className="inline-block h-3 w-24 rounded bg-muted animate-pulse" />
        </CardDescription>
        <CardTitle className="text-2xl truncate">
          <span className="inline-block h-7 w-32 rounded bg-muted animate-pulse" />
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

function SystemSnapshotLoading({ excludes = [] }: { excludes?: HealthKey[] }) {
  return (
    <>
      {STRIP_ITEMS.filter((item) => !excludes.includes(item)).map((key) => (
        <SnapshotCardSkeleton key={key} />
      ))}
    </>
  );
}

export function SystemSnapshot({
  excludes = [],
  className,
  ...props
}: { excludes?: HealthKey[] } & React.ComponentProps<"div">) {
  const q = useHealth();

  return (
    <QueryBoundary
      className={cn("w-full", className)}
      isLoading={q.isLoading}
      isError={q.isError}
      error={q.error}
      hasData={!!q.data}
      loading={
        <div className={cn(GRID_CLASS, className)}>
          <SystemSnapshotLoading excludes={excludes} />
        </div>
      }
      softDisable
      offline={
        <div className="w-full rounded-md border p-3 text-sm">
          API not reachable. Snapshot unavailable, but the app still works.
        </div>
      }
      errorFallback={(err) => (
        <div className="w-full rounded-md border p-3 text-sm">
          Snapshot failed to load.
          <div className="mt-1 opacity-70">
            {err instanceof Error ? err.message : String(err)}
          </div>
        </div>
      )}
    >
      <div className={cn(GRID_CLASS, className)} {...props}>
        {q.data &&
          STRIP_ITEMS.filter((item) => !excludes.includes(item)).map((key) => (
            <SnapshotCard
              key={key}
              title={formatKey(key)}
              value={formatValue(key, q.data[key])}
            />
          ))}
      </div>

    </QueryBoundary>
  );
}
