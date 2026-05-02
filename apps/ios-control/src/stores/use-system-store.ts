import { create } from 'zustand';

import type { SystemState } from "@/types";

export const useSystemStore = create<SystemState>(() => ({
  autonomyLevel: null,
  systemHealth: null,
  activeTaskCount: null,
}));
