import { AuditLevel } from "../common";

export type AuditRow = [string, AuditLevel, string, string];

export type SubsystemEntry = {
  name: string;
  status: "healthy" | "degraded";
  iconIos: "house" | "calendar" | "envelope" | "sensor.tag.radiowaves.forward";
  iconAndroid: "home" | "calendar_today" | "mail" | "sensors";
  volume: string;
};
