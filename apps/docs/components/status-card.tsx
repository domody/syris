"use client";

import React, { useEffect, useState } from "react";
import { Item, ItemActions, ItemContent, ItemMedia, ItemTitle } from "./ui/item";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { CardWrapper } from "./card-wrapper";

// ---- Types ----------------------------------------------------------------

type HealthResponse = {
  status: "ok" | "degraded" | string;
  service: string;
  version: string;
  env: string;
  run_id: string;
  started_at: string;
  uptime_s: number;
  db: { ok: boolean; error: string | null };
  last_heartbeat_at: string;
  now: string;
};

type HealthQuery = {
  isPending: boolean;
  isLoading: boolean;
  isError: boolean;
  data?: HealthResponse;
};

type SystemStateKey =
  | "unknown"
  | "healthy"
  | "degraded"
  | "partial_outage"
  | "major_outage";

type SystemState = {
  uiStatus: SystemStateKey;
  title: string;
  severity: "neutral" | "success" | "warning" | "danger";
  color: string;
  reason?: string;
};

// ---- Constants ------------------------------------------------------------

const STATUS_COLOR: Record<SystemStateKey, string> = {
  unknown: "bg-neutral-300 dark:bg-neutral-700",
  healthy: "bg-green-500",
  degraded: "bg-amber-500",
  partial_outage: "bg-orange-500",
  major_outage: "bg-destructive",
};

const SYSTEM_STATES: Record<SystemStateKey, SystemState> = {
  unknown: {
    uiStatus: "unknown",
    title: "System status unknown",
    severity: "neutral",
    color: STATUS_COLOR.unknown,
  },
  healthy: {
    uiStatus: "healthy",
    title: "All systems operational",
    severity: "success",
    color: STATUS_COLOR.healthy,
  },
  degraded: {
    uiStatus: "degraded",
    title: "Degraded performance",
    severity: "warning",
    color: STATUS_COLOR.degraded,
  },
  partial_outage: {
    uiStatus: "partial_outage",
    title: "Partial outage",
    severity: "danger",
    color: STATUS_COLOR.partial_outage,
  },
  major_outage: {
    uiStatus: "major_outage",
    title: "Major outage",
    severity: "danger",
    color: STATUS_COLOR.major_outage,
  },
};

// ---- Helpers --------------------------------------------------------------

function getSystemState(query: HealthQuery): SystemState {
  if (query.isPending || query.isLoading)
    return { ...SYSTEM_STATES.unknown, reason: "query_pending" };
  if (query.isError)
    return { ...SYSTEM_STATES.major_outage, reason: "query_error" };
  if (!query.data) return { ...SYSTEM_STATES.unknown, reason: "no_data" };

  const { status, db } = query.data;

  if (status === "ok" && db?.ok)
    return { ...SYSTEM_STATES.healthy, reason: "api_ok_db_ok" };
  if (status === "degraded")
    return { ...SYSTEM_STATES.degraded, reason: "api_degraded" };
  if (!db?.ok) return { ...SYSTEM_STATES.partial_outage, reason: "db_not_ok" };

  return { ...SYSTEM_STATES.unknown, reason: "fallback" };
}

// ---- StatusDot ------------------------------------------------------------

function StatusDot({
  status = "unknown",
  pulse = false,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  status?: SystemStateKey;
  pulse?: boolean;
}) {
  const color = STATUS_COLOR[status];
  return (
    <div className={cn("relative size-2", className)} {...props}>
      {pulse && status !== "unknown" && (
        <Badge
          className={cn(
            "absolute top-0 left-0 aspect-square size-full p-0 animate-ping",
            color,
          )}
        />
      )}
      <Badge
        className={cn(
          "absolute top-0 left-0 aspect-square size-full p-0",
          color,
        )}
      />
    </div>
  );
}

// ---- StatusCard -----------------------------------------------------------

const HEALTH_URL = "https://api.syris.uk/health";

export function StatusCard({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [query, setQuery] = useState<HealthQuery>({
    isPending: true,
    isLoading: true,
    isError: false,
    data: undefined,
  });

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(HEALTH_URL);
        if (cancelled) return;

        if (!res.ok) {
          setQuery({ isPending: false, isLoading: false, isError: true });
          return;
        }

        const data: HealthResponse = await res.json();
        if (!cancelled)
          setQuery({
            isPending: false,
            isLoading: false,
            isError: false,
            data,
          });
      } catch {
        if (!cancelled)
          setQuery({ isPending: false, isLoading: false, isError: true });
      }
    }

    poll();
    const interval = setInterval(poll, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const state = getSystemState(query);
  const isLive = !query.isPending && !query.isLoading;

  return (
    <CardWrapper>
      <Item
        className={cn("rounded-2xl border-border/50 h-full", className)}
        {...props}
        variant="muted"
      >
        <ItemMedia>
          <StatusDot status={state.uiStatus} pulse={isLive} />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="font-mono text-xs text-muted-foreground">
            {state.title}
          </ItemTitle>
        </ItemContent>
        <ItemActions>
          <Badge variant={"outline"}>prod</Badge>
        </ItemActions>
      </Item>
    </CardWrapper>
  );
}
