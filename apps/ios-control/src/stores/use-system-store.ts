import { create } from 'zustand';

type AutonomyLevel = 'A0' | 'A1' | 'A2' | 'A3' | 'A4';
type SystemHealth = 'healthy' | 'degraded' | 'critical';

type SystemState = {
  autonomyLevel: AutonomyLevel | null;
  systemHealth: SystemHealth | null;
  activeTaskCount: number | null;
};

export const useSystemStore = create<SystemState>(() => ({
  autonomyLevel: null,
  systemHealth: null,
  activeTaskCount: null,
}));
