import type { AutonomyLevel, SystemHealth } from "./common";

export type SystemState = {
  autonomyLevel: AutonomyLevel | null;
  systemHealth: SystemHealth | null;
  activeTaskCount: number | null;
};

export type Notification = {
  id: string;
};

export type InboxState = {
  notifications: Notification[];
  unreadCount: number;
};
