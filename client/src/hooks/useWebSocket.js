import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useAnnouncementsStore } from '../stores/announcementsStore';
import { approvalQueryKeys } from './useApprovalData';
import { pdsQueryKeys } from './usePdsData';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:3001';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { addNotification } = useNotificationStore();
  const { addAnnouncementToCache, updateAnnouncementInCache, removeAnnouncementFromCache, refreshAnnouncements } = useAnnouncementsStore();

  const connect = useCallback(() => {
    // Don't connect if no user is logged in
    if (!user) {
      return;
    }

    // Clean up existing connection if any - remove all listeners before disconnecting
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      if (socketRef.current.connected) {
        socketRef.current.disconnect();
      }
      socketRef.current = null;
    }

    // Get CSRF token from cookies for authentication
    const getCsrfToken = () => {
      const tokenMatch = document.cookie.match(/XSRF-TOKEN=([^;]*)/);
      return tokenMatch ? decodeURIComponent(tokenMatch[1]) : null;
    };

    // Create new socket connection with credentials
    const socket = io(WEBSOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      withCredentials: true,
      extraHeaders: {
        'X-XSRF-TOKEN': getCsrfToken() || '',
      },
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      // Authenticate with CSRF token
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        socket.emit('authenticate', { token: csrfToken });
      } else {
        console.warn('No CSRF token available for WebSocket authentication');
      }
    });

    socket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
      setIsAuthenticated(true);
    });

    socket.on('auth_error', (error) => {
      console.error('WebSocket authentication error:', error);
      setIsAuthenticated(false);
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
      setIsAuthenticated(false);

      // Attempt to reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      }
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
    });

    // Real-time notification handler
    // Remove any existing listeners first to prevent duplicates
    socket.off('notification');
    socket.on('notification', (data) => {
      console.log('Received notification:', data);
      
      // Only show toast notification if it's not for the current user's own action
      // This prevents duplicate notifications when user submits their own PDS
      // The notification dropdown will still show all notifications from the database
      const isOwnAction = (data.data?.user_id === user?.id || data.data?.action_by_user_id === user?.id) && 
                         (data.entity_type === 'pds' || data.entity_type === 'leave');
      
      if (!isOwnAction) {
        // Add to toast notification system only for actions by others
        addNotification({
          type: data.type || 'info',
          title: data.title || 'Notification',
          message: data.message,
          duration: data.duration || 5000,
          data: data.data,
        });
      }

      // Always refresh notification dropdown to show latest from database
      // Trigger a custom event to refresh notification dropdown
      window.dispatchEvent(new CustomEvent('notification-received', { detail: data }));
    });

    // Real-time PDS update handlers
    const handlePdsUpdate = (eventName, data) => {
      console.log(`Received ${eventName}:`, data);
      
      // Immediately invalidate all PDS-related queries (marks them as stale)
      // This ensures React Query knows the data is outdated
      queryClient.invalidateQueries({ 
        queryKey: approvalQueryKeys.pendingPds(),
        refetchType: 'active' // Only refetch active queries
      });
      queryClient.invalidateQueries({ 
        queryKey: pdsQueryKeys.all,
        refetchType: 'active'
      });
      queryClient.invalidateQueries({ 
        queryKey: approvalQueryKeys.all,
        refetchType: 'active'
      });
      
      // Force immediate refetch - bypasses staleTime and refetchOnMount settings
      queryClient.refetchQueries({ 
        queryKey: approvalQueryKeys.pendingPds(),
        type: 'active',
        exact: false
      });
      queryClient.refetchQueries({ 
        queryKey: pdsQueryKeys.all,
        type: 'active',
        exact: false
      });
      
      // Trigger custom event for components that listen
      window.dispatchEvent(new CustomEvent('pds-updated', { detail: data }));
    };

    // Remove existing PDS listeners before adding new ones
    socket.off('pds:created');
    socket.off('pds:updated');
    socket.off('pds:submitted');
    socket.off('pds:reviewed');
    
    socket.on('pds:created', (data) => handlePdsUpdate('pds:created', data));
    socket.on('pds:updated', (data) => handlePdsUpdate('pds:updated', data));
    socket.on('pds:submitted', (data) => handlePdsUpdate('pds:submitted', data));
    socket.on('pds:reviewed', (data) => handlePdsUpdate('pds:reviewed', data));

    // Real-time announcement handlers
    // Remove existing listener before adding new one
    socket.off('announcement');
    socket.on('announcement', (data) => {
      console.log('Received announcement update:', data);
      const { action, announcement } = data;

      switch (action) {
        case 'created':
          // Add to cache and refresh to get full data with relationships
          if (announcement && announcement.id) {
            addAnnouncementToCache(announcement);
          }
          // Dispatch custom event for components that listen
          window.dispatchEvent(new CustomEvent('announcement-updated', { detail: { action, announcement } }));
          // Use setTimeout to avoid race conditions with state updates
          setTimeout(() => {
            refreshAnnouncements().catch(err => {
              console.error('Error refreshing announcements:', err);
            });
          }, 100);
          break;
        case 'updated':
          if (announcement && announcement.id) {
            updateAnnouncementInCache(announcement);
          }
          break;
        case 'deleted':
          if (announcement && announcement.id) {
            removeAnnouncementFromCache(announcement.id);
          } else if (typeof announcement === 'number') {
            removeAnnouncementFromCache(announcement);
          }
          break;
        case 'activated':
          if (announcement && announcement.id) {
            updateAnnouncementInCache(announcement);
            // Don't show toast here - notifications are already sent via the 'notification' WebSocket event
            // This prevents duplicate toast notifications
            // Dispatch custom event for components that listen (like AnnouncementBanner and MyAnnouncementsList)
            window.dispatchEvent(new CustomEvent('announcement-updated', { detail: { action, announcement } }));
            // Refresh to show newly activated announcement
            setTimeout(() => {
              refreshAnnouncements().catch(err => {
                console.error('Error refreshing announcements:', err);
              });
            }, 100);
          }
          break;
        case 'expired':
          if (announcement && announcement.id) {
            updateAnnouncementInCache(announcement);
          }
          break;
        default:
          // Refresh announcements for any other action
          setTimeout(() => {
            refreshAnnouncements().catch(err => {
              console.error('Error refreshing announcements:', err);
            });
          }, 100);
      }
    });

    // Ping/pong for connection health
    socket.off('pong');
    socket.on('pong', () => {
      // Connection is healthy
    });

    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      // Clean up socket listeners when component unmounts or dependencies change
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
      }
    };
  }, [user, queryClient, addNotification, addAnnouncementToCache, updateAnnouncementInCache, removeAnnouncementFromCache, refreshAnnouncements]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsAuthenticated(false);
  }, []);

  // Connect when user logs in, disconnect when user logs out
  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  return {
    isConnected,
    isAuthenticated,
    socket: socketRef.current,
  };
};

