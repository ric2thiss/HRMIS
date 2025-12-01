// Compatibility hook for useNotification - wraps Zustand store
import { useNotificationStore } from '../stores/notificationStore';

export const useNotification = () => {
  return useNotificationStore();
};

