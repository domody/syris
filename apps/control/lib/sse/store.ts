import { create } from 'zustand';
import type { SSEEvent, ConnectionStatus, EventBuckets } from './types';

const MAX_BUCKET_SIZE = 500;

interface SSEStore {
  events: EventBuckets;
  status: ConnectionStatus;
  addEvent: (event: SSEEvent) => void;
  setStatus: (status: ConnectionStatus) => void;
  getEventsByType: <P>(streamType: string) => SSEEvent<P>[];
}

export const useSSEStore = create<SSEStore>()((set, get) => ({
  events: {},
  status: 'disconnected',

  addEvent: (event) =>
    set((state) => {
      const bucket = state.events[event.stream_type] ?? [];
      const next = [...bucket, event];
      return {
        events: {
          ...state.events,
          [event.stream_type]: next.length > MAX_BUCKET_SIZE
            ? next.slice(next.length - MAX_BUCKET_SIZE)
            : next,
        },
      };
    }),

  setStatus: (status) => set({ status }),

  getEventsByType: <P>(streamType: string) =>
    (get().events[streamType] ?? []) as SSEEvent<P>[],
}));
