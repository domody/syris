"use client"

import { useQuery } from "@tanstack/react-query"
import { request } from "@/lib/http/http-client"
import type { AuditEvent, HealthResponse, TaskResponse } from "./types"

export function useHealth() {
  return useQuery({
    queryKey: ["health"],
    queryFn: () => request<HealthResponse>("/health"),
    refetchInterval: 30_000,
  })
}

export function useAuditEvents(params?: {
  trace_id?: string
  limit?: number
  offset?: number
}) {
  const searchParams = new URLSearchParams()
  if (params?.trace_id) searchParams.set("trace_id", params.trace_id)
  if (params?.limit != null) searchParams.set("limit", String(params.limit))
  if (params?.offset != null) searchParams.set("offset", String(params.offset))
  const qs = searchParams.toString()

  return useQuery({
    queryKey: ["audit", params],
    queryFn: () => request<AuditEvent[]>(`/audit${qs ? `?${qs}` : ""}`),
    staleTime: 10_000,
  })
}

export function useTasks(limit = 50) {
  return useQuery({
    queryKey: ["tasks", limit],
    queryFn: () => request<TaskResponse[]>(`/tasks?limit=${limit}`),
    refetchInterval: 15_000,
  })
}
