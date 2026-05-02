import { create } from 'zustand';

import type { InboxState } from '@/types/store';

export const useInboxStore = create<InboxState>(() => ({
  notifications: [],
  unreadCount: 0,
}));
