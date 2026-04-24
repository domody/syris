import { create } from 'zustand';

type Notification = {
  id: string;
};

type InboxState = {
  notifications: Notification[];
  unreadCount: number;
};

export const useInboxStore = create<InboxState>(() => ({
  notifications: [],
  unreadCount: 0,
}));
