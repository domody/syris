import type { DashboardState } from "./dashboard-store";

export const selectMessages = (s: DashboardState) => s.messages.items;

export const selectEventsForRequest = (requestId: string | null) => (s: DashboardState) => {
  if (!requestId) return [];
  const ids = s.byRequestId[requestId] ?? [];
  return ids.map((id) => s.eventsById[id]).filter(Boolean);
};

export const selectIntegration = (integrationId: string) => (s: DashboardState) =>
  s.integration[integrationId] ?? null;

export const selectEntity = (entityId: string) => (s: DashboardState) =>
  s.entities[entityId] ?? null;
