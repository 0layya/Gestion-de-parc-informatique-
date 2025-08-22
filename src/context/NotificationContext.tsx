import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface Notification {
  id: string;
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
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isMuted: boolean;
}

interface NotificationContextType extends NotificationState {
  showNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
  hideNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  toggleMute: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

type NotificationAction =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'CLEAR_ALL' }
  | { type: 'TOGGLE_MUTE' }
  | { type: 'LOAD_FROM_STORAGE'; payload: NotificationState };

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

  // Load notifications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert timestamp strings back to Date objects
        const notificationsWithDates = parsed.notifications.map((n: { timestamp: string }) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        dispatch({ 
          type: 'LOAD_FROM_STORAGE', 
          payload: { ...parsed, notifications: notificationsWithDates }
        });
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error);
    }
  }, []);

  // Save notifications to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('notifications', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }, [state]);

  const showNotification = (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    if (state.isMuted) return;
    
    // Check if this notification already exists (prevent duplicates)
    const isDuplicate = state.notifications.some(n => 
      n.title === notification.title && 
      n.message === notification.message &&
      n.type === notification.type
    );
    
    if (isDuplicate) return;
    
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { 
      ...notification, 
      id,
      timestamp: new Date(),
      read: false
    };
    
    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });

    // Remove auto-hide functionality - notifications will persist until manually dismissed
    // const duration = notification.duration || 5000;
    // setTimeout(() => {
    //   hideNotification(id);
    // }, duration);
  };

  const hideNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  const clearAll = () => {
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
