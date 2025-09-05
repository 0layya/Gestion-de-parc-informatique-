import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { notificationsAPI } from '../services/api';

export interface Notification {
  id: string | number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  read?: boolean;
  timestamp: Date;
  user_id?: number;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isMuted: boolean;
}

interface NotificationContextType extends NotificationState {
  showNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp' | 'user_id'>) => Promise<void>;
  hideNotification: (id: string | number) => Promise<void>;
  markAsRead: (id: string | number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  toggleMute: () => void;
  loadNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string | number }
  | { type: 'MARK_AS_READ'; payload: string | number }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'CLEAR_ALL' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'LOAD_FROM_STORAGE'; payload: NotificationState }
  | { type: 'LOAD_FROM_API'; payload: Notification[] };

function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION': {
      const newNotification = { ...action.payload, read: false, timestamp: new Date() };
      return {
        ...state,
        notifications: [...state.notifications, newNotification],
        unreadCount: state.unreadCount + 1,
      };
    }
    case 'REMOVE_NOTIFICATION': {
      const notificationToRemove = state.notifications.find(n => n.id === action.payload);
      const wasUnread = notificationToRemove && !notificationToRemove.read;
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    }
    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => 
          n.id === action.payload ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      };
    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };
    case 'TOGGLE_MUTE':
      return {
        ...state,
        isMuted: !state.isMuted,
      };
    case 'LOAD_FROM_STORAGE':
      return action.payload;
    case 'LOAD_FROM_API':
      return {
        ...state,
        notifications: action.payload,
        unreadCount: action.payload.filter(n => !n.read).length,
      };
    default:
      return state;
  }
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    notifications: [],
    unreadCount: 0,
    isMuted: false,
  });

  // Load notifications from API on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      const notifications = response.data.map((n: any) => ({
        ...n,
        timestamp: new Date(n.created_at)
      }));
      dispatch({ type: 'LOAD_FROM_API', payload: notifications });
    } catch (error) {
      console.error('Failed to load notifications from API:', error);
      // Fallback to localStorage if API fails
      try {
        const stored = localStorage.getItem('notifications');
        if (stored) {
          const parsed = JSON.parse(stored);
          const notificationsWithDates = parsed.notifications.map((n: { timestamp: string }) => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
          dispatch({ 
            type: 'LOAD_FROM_STORAGE', 
            payload: { ...parsed, notifications: notificationsWithDates }
          });
        }
      } catch (storageError) {
        console.error('Failed to load notifications from storage:', storageError);
      }
    }
  };

  // Save notifications to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }, [state]);

  const showNotification = async (notification: Omit<Notification, 'id' | 'read' | 'timestamp' | 'user_id'>) => {
    if (state.isMuted) return;
    
    // Check if this notification already exists (prevent duplicates)
    const isDuplicate = state.notifications.some(n => 
      n.title === notification.title && 
      n.message === notification.message &&
      n.type === notification.type
    );
    
    if (isDuplicate) return;
    
    try {
      // Get current user ID from localStorage
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData).id : null;
      
      if (userId) {
        // Save to database via API using the configured notificationsAPI
        const response = await notificationsAPI.create({
          ...notification,
          user_id: userId
        });
        
        const savedNotification = response.data;
        const newNotification = { 
          ...savedNotification, 
          timestamp: new Date(savedNotification.created_at)
        };
        dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
      } else {
        // Fallback to local storage if no user ID
        const id = Math.random().toString(36).substr(2, 9);
        const newNotification = { 
          ...notification, 
          id,
          timestamp: new Date(),
          read: false
        };
        dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
      }
    } catch (error) {
      console.error('Failed to save notification:', error);
      // Fallback to local storage
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification = { 
        ...notification, 
        id,
        timestamp: new Date(),
        read: false
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
    }
  };

  const hideNotification = async (id: string | number) => {
    try {
      // Try to delete from database if it's a numeric ID (from database)
      if (typeof id === 'number') {
        await notificationsAPI.delete(id.toString());
      }
    } catch (error) {
      console.error('Failed to delete notification from database:', error);
    }
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const markAsRead = async (id: string | number) => {
    try {
      // Try to mark as read in database if it's a numeric ID (from database)
      if (typeof id === 'number') {
        await notificationsAPI.markAsRead(id.toString());
      }
    } catch (error) {
      console.error('Failed to mark notification as read in database:', error);
    }
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  const markAllAsRead = async () => {
    try {
      // Mark all unread notifications as read in database
      const unreadNotifications = state.notifications.filter(n => !n.read && typeof n.id === 'number');
      await Promise.all(
        unreadNotifications.map(notification => 
          notificationsAPI.markAsRead(notification.id.toString())
        )
      );
    } catch (error) {
      console.error('Failed to mark all notifications as read in database:', error);
    }
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const clearAll = async () => {
    try {
      // Delete all notifications from database
      const databaseNotifications = state.notifications.filter(n => typeof n.id === 'number');
      await Promise.all(
        databaseNotifications.map(notification => 
          notificationsAPI.delete(notification.id.toString())
        )
      );
    } catch (error) {
      console.error('Failed to clear all notifications from database:', error);
    }
    dispatch({ type: 'CLEAR_ALL' });
  };

  const toggleMute = () => {
    dispatch({ type: 'TOGGLE_MUTE' });
  };

  return (
    <NotificationContext.Provider value={{
      ...state,
      showNotification,
      hideNotification,
      markAsRead,
      markAllAsRead,
      clearAll,
      toggleMute,
      loadNotifications,
    }}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

// Notification Container Component
const NotificationContainer: React.FC = () => {
  // Don't render floating notifications - they will only appear in the header dropdown
  return null;
};
