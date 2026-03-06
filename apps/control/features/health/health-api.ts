import { request } from "@/lib/http/http-client"

export type HealthResponse = {
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

export function fetchHealth() {
    return request<HealthResponse>("/health")
}