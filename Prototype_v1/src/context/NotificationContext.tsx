/**
 * NotificationContext.tsx
 * -----------------------
 * Provides global notification state to the entire React application.
 *
 * DESIGN PATTERN: Observer 
 * ----------------------------------------------------------
 * The class diagram defines Observer and Observable interfaces, with
 * LeaveRequest and Announcement implementing Observable — meaning they
 * "notify observers" when significant events occur (approval, rejection,
 * new announcement posted).
 *
 * In this frontend-only prototype, the Observer pattern is implemented as:
 *   - The Registry is the Observable — it calls pushNotification() internally
 *     whenever a significant state change occurs (approve leave, resolve query, etc.)
 *   - This NotificationContext is the Observer — it reads the Registry's notification
 *     store and exposes it to all React components
 *   - The NotificationBell component in the header subscribes to this context
 *     and re-renders whenever the notification count changes
 *
 * HOW LIVE NOTIFICATIONS WORK WITHOUT A BACKEND:
 * When the user performs an action (e.g. HR approves a leave request), the
 * Registry immediately pushes a Notification object into its internal array.
 * Components call refreshNotifications() after any action to pull the latest
 * state from the Registry. This creates the appearance of live notifications
 * without any WebSocket or polling — all state lives in the Registry singleton.
 *
 * HOW COMPONENTS USE IT:
 *   const { notifications, unreadCount, refreshNotifications, markAllRead } = useNotifications();
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

import type { Notification } from "../models/interfaces";
import { getRegistry } from "../services/Registry";
import { useAuth } from "./AuthContext";

// ---------------------------------------------------------------------------
// Context type definition
// ---------------------------------------------------------------------------
/**
 * Describes the shape of the value provided by NotificationContext.
 */
interface NotificationContextType {
  /**
   * All notifications for the current user, newest first.
   * Rendered as a list in the NotificationBell dropdown panel.
   */
  notifications: Notification[];

  /**
   * Count of unread notifications for the current user.
   * Shown as a badge number on the bell icon in the header.
   * 0 means the badge is hidden.
   */
  unreadCount: number;

  /**
   * Pulls the latest notifications from the Registry into local state.
   * Call this after any action that might generate a new notification
   * (e.g. after submitting a leave request, after HR approves a request).
   * This is the mechanism that makes notifications feel "live".
   */
  refreshNotifications: () => void;

  /**
   * Marks all of the current user's notifications as read.
   * Called when the notification panel is opened.
   * Updates both the Registry and local context state.
   */
  markAllRead: () => void;

  /**
   * Marks a single notification as read by its ID.
   *
   * @param notificationID - The ID of the notification to mark as read
   */
  markOneRead: (notificationID: string) => void;
}

// ---------------------------------------------------------------------------
// Context creation
// ---------------------------------------------------------------------------
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

// ---------------------------------------------------------------------------
// NotificationProvider component
// ---------------------------------------------------------------------------
/**
 * Provides notification state to all child components.
 * Depends on AuthContext — must be nested inside AuthProvider.
 *
 * The provider automatically loads notifications when the current user changes
 * (i.e. on login) and clears them on logout.
 *
 * Usage in App.tsx (inside AuthProvider):
 *   <AuthProvider>
 *     <NotificationProvider>
 *       <RouterProvider router={router} />
 *     </NotificationProvider>
 *   </AuthProvider>
 */
export function NotificationProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();

  /* Local state — mirrors the Registry's notification store for the current user */
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // -------------------------------------------------------------------------
  // refreshNotifications()
  // -------------------------------------------------------------------------
  /**
   * Reads the current user's notifications from the Registry singleton
   * and updates local context state.
   *
   * This is the "poll" mechanism — called:
   *   1. Automatically when the current user changes (useEffect below)
   *   2. Manually by components after performing actions that generate notifications
   *
   * Components that trigger notifications should call this after the Registry
   * action completes so the bell updates immediately.
   */
  const refreshNotifications = useCallback(() => {
    if (!currentUser) {
      /* Nobody is logged in — clear all notification state */
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const registry = getRegistry();

    /* Fetch this user's notifications from the Registry */
    const userNotifications = registry.getNotificationsForUser(
      currentUser.employeeID
    );
    const userUnreadCount = registry.getUnreadNotificationCount(
      currentUser.employeeID
    );

    setNotifications(userNotifications);
    setUnreadCount(userUnreadCount);
  }, [currentUser]);

  // -------------------------------------------------------------------------
  // Auto-refresh on user change
  // -------------------------------------------------------------------------
  /**
   * Whenever the logged-in user changes (login or logout), refresh notifications.
   * On login: loads the pre-seeded notifications for the new user.
   * On logout: clears notification state (refreshNotifications handles null user).
   */
  useEffect(() => {
    refreshNotifications();
  }, [currentUser, refreshNotifications]);

  // -------------------------------------------------------------------------
  // markAllRead()
  // -------------------------------------------------------------------------
  /**
   * Marks all notifications for the current user as read.
   * Delegates to the Registry, then refreshes local state.
   * Called when the user opens the notification panel.
   */
  const markAllRead = useCallback(() => {
    if (!currentUser) return;

    const registry = getRegistry();
    registry.markAllNotificationsAsRead(currentUser.employeeID);

    /* Refresh local state to reflect the read status change */
    refreshNotifications();
  }, [currentUser, refreshNotifications]);

  // -------------------------------------------------------------------------
  // markOneRead()
  // -------------------------------------------------------------------------
  /**
   * Marks a single notification as read by ID.
   * Delegates to the Registry, then refreshes local state.
   *
   * @param notificationID - The ID of the notification to mark as read
   */
  const markOneRead = useCallback(
    (notificationID: string) => {
      const registry = getRegistry();
      registry.markNotificationAsRead(notificationID);
      refreshNotifications();
    },
    [refreshNotifications]
  );

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  const contextValue: NotificationContextType = {
    notifications,
    unreadCount,
    refreshNotifications,
    markAllRead,
    markOneRead,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// useNotifications hook
// ---------------------------------------------------------------------------
/**
 * Custom hook for consuming NotificationContext.
 * Throws a descriptive error if used outside of NotificationProvider.
 *
 * Usage:
 *   const { notifications, unreadCount, refreshNotifications } = useNotifications();
 *
 * @throws Error if called outside of a NotificationProvider
 * @returns The NotificationContextType value for the current user
 */
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);

  if (context === undefined) {
    throw new Error(
      "useNotifications() must be used within a <NotificationProvider>. " +
        "Make sure NotificationProvider is nested inside AuthProvider in App.tsx."
    );
  }

  return context;
}

export default NotificationContext;
