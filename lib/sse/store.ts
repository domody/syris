import { create } from "zustand";
import type {
  SSEEvent,
  SSEEventMap,
  ConnectionStatus,
  EventBuckets,
} from "./types";

const MAX_BUCKET_SIZE = 500;

interface SSEStore {
  events: EventBuckets;
  status: ConnectionStatus;
  addEvent: <K extends keyof SSEEventMap>(
    event: SSEEvent<SSEEventMap[K]> & { stream_type: K },
  ) => void;
  setStatus: (status: ConnectionStatus) => void;
}

export const useSSEStore = create<SSEStore>()((set, get) => ({
  events: createEventBuckets(),
  status: "disconnected",

  addEvent: (event) =>
    set((state) => {
      const bucket = state.events[event.stream_type] ?? [];
      const next = [...bucket, event];
      return {
        events: {
          ...state.events,
          [event.stream_type]:
            next.length > MAX_BUCKET_SIZE
              ? next.slice(next.length - MAX_BUCKET_SIZE)
              : next,
        },
      };
    }),

  setStatus: (status) => set({ status }),
}));

const EMPTY_ARRAY: any[] = [];

function createEventBuckets(): EventBuckets {
  return new Proxy({} as EventBuckets, {
    get(target, prop: keyof EventBuckets) {
      if (!(prop in target)) {
        target[prop] = EMPTY_ARRAY;
      }
      return target[prop];
    },
  });
}