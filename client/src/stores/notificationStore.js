import { create } from 'zustand';

export const useNotificationStore = create((set) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date(),
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto remove after duration (default 5 seconds)
    const duration = notification.duration || 5000;
    setTimeout(() => {
      useNotificationStore.getState().removeNotification(id);
    }, duration);

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  showSuccess: (message, title = 'Success') => {
    return useNotificationStore.getState().addNotification({
      type: 'success',
      title,
      message,
      duration: 4000,
    });
  },

  showError: (message, title = 'Error') => {
    return useNotificationStore.getState().addNotification({
      type: 'error',
      title,
      message,
      duration: 6000,
    });
  },

  showWarning: (message, title = 'Warning') => {
    return useNotificationStore.getState().addNotification({
      type: 'warning',
      title,
      message,
      duration: 5000,
    });
  },

  showInfo: (message, title = 'Info') => {
    return useNotificationStore.getState().addNotification({
      type: 'info',
      title,
      message,
      duration: 4000,
    });
  },

  clearAll: () => {
    set({ notifications: [] });
  },
}));

