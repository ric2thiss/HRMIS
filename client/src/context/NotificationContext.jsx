import { createContext, useContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, newNotification]);

    // Auto remove after duration (default 5 seconds)
    const duration = notification.duration || 5000;
    setTimeout(() => {
      removeNotification(id);
    }, duration);

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = useCallback(
    (message, title = 'Success') => {
      return addNotification({
        type: 'success',
        title,
        message,
        duration: 4000,
      });
    },
    [addNotification]
  );

  const showError = useCallback(
    (message, title = 'Error') => {
      return addNotification({
        type: 'error',
        title,
        message,
        duration: 6000,
      });
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (message, title = 'Warning') => {
      return addNotification({
        type: 'warning',
        title,
        message,
        duration: 5000,
      });
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (message, title = 'Info') => {
      return addNotification({
        type: 'info',
        title,
        message,
        duration: 4000,
      });
    },
    [addNotification]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

