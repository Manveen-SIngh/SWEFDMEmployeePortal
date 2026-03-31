/**
 * Header.tsx
 * ----------
 * The horizontal top bar displayed across all authenticated pages.
 * Sits to the right of the Navbar, spanning the full content area width.
 */

import React, { useState } from "react";
import { useLocation } from "react-router-dom";

import { useNotifications } from "../../context/NotificationContext";
import type { Notification } from "../../models/interfaces";
import "./Header.css";

// ---------------------------------------------------------------------------
// Route → page title mapping
// ---------------------------------------------------------------------------
/**
 * Maps URL path prefixes to human-readable page titles.
 * Used to populate the header breadcrumb/title area.
 * Order matters — more specific paths must come before general ones.
 */
const PAGE_TITLES: { path: string; title: string }[] = [
  { path: "/dashboard", title: "Dashboard" },
  { path: "/announcements", title: "Announcements" },
  { path: "/my-details", title: "My Details" },
  { path: "/absence", title: "Absence & Holidays" },
  { path: "/schedule/planner", title: "Schedule — Planner" },
  { path: "/schedule/timesheets", title: "Schedule — Timesheets" },
  { path: "/payments/payslips", title: "Payments — Payslips" },
  { path: "/queries", title: "Queries" },
  { path: "/documents", title: "Documents" },
  { path: "/learning", title: "Learning & Development" },
  { path: "/performance", title: "Performance Reviews" },
  { path: "/hr/employees", title: "Employee Directory" },
  { path: "/hr/leave-management", title: "Leave Management" },
  { path: "/it/user-management", title: "User Management" },
  { path: "/it/audit-log", title: "Audit Log" },
];

// ---------------------------------------------------------------------------
// Relative time formatter
// ---------------------------------------------------------------------------
/**
 * Converts a Date to a human-friendly relative string.
 * Examples: "just now", "5 min ago", "2 hours ago", "3 days ago"
 *
 * @param date - The timestamp to format
 * @returns A relative time string
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// ---------------------------------------------------------------------------
// Notification type → icon colour
// ---------------------------------------------------------------------------
/**
 * Maps notification type to its CSS colour variable.
 * Used to colour the dot on each notification entry.
 */
function notificationColour(type: Notification["type"]): string {
  switch (type) {
    case "success": return "var(--color-success)";
    case "warning": return "var(--color-warning)";
    case "danger":  return "var(--color-danger)";
    case "info":    return "var(--color-info)";
    default:        return "var(--color-text-muted)";
  }
}

// ---------------------------------------------------------------------------
// Header component
// ---------------------------------------------------------------------------
export default function Header() {
  const location = useLocation();
  const { notifications, unreadCount, markAllRead } = useNotifications();

  /* Whether the notification dropdown panel is open */
  const [notifOpen, setNotifOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Derive page title from current URL
  // -------------------------------------------------------------------------
  const currentTitle =
    PAGE_TITLES.find((t) => location.pathname.startsWith(t.path))?.title ??
    "FDM Portal";

  // -------------------------------------------------------------------------
  // Handle bell click — open panel and mark all as read
  // -------------------------------------------------------------------------
  const handleBellClick = () => {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening && unreadCount > 0) {
      /* Mark all notifications as read when the panel is opened */
      markAllRead();
    }
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <header className="app-header" role="banner">
      {/* ---- Left: page title ---- */}
      <div className="app-header__left">
        <h1 className="app-header__title">{currentTitle}</h1>
        <time className="app-header__date" dateTime={new Date().toISOString()}>
          {new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
      </div>

      {/* ---- Right: notification bell ---- */}
      <div className="app-header__right">
        <div className="app-header__notif-wrapper">
          <button
            className="app-header__notif-btn"
            onClick={handleBellClick}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            aria-expanded={notifOpen}
            aria-haspopup="true"
          >
            {/* Bell icon */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>

            {/* Unread badge — only shown when unreadCount > 0 */}
            {unreadCount > 0 && (
              <span
                className="app-header__notif-badge"
                aria-label={`${unreadCount} unread notifications`}
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notification dropdown panel */}
          {notifOpen && (
            <>
              <div
                className="app-header__notif-panel"
                role="dialog"
                aria-label="Notifications"
              >
                {/* Panel header */}
                <div className="app-header__notif-panel-header">
                  <span className="app-header__notif-panel-title">
                    Notifications
                  </span>
                  <button
                    className="app-header__notif-panel-close"
                    onClick={() => setNotifOpen(false)}
                    aria-label="Close notifications"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Notification list */}
                <div className="app-header__notif-list">
                  {notifications.length === 0 ? (
                    <div className="app-header__notif-empty">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                      </svg>
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.notificationID}
                        className={`app-header__notif-item ${
                          !notif.isRead
                            ? "app-header__notif-item--unread"
                            : ""
                        }`}
                      >
                        {/* Coloured type dot */}
                        <span
                          className="app-header__notif-dot"
                          style={{ backgroundColor: notificationColour(notif.type) }}
                          aria-hidden="true"
                        />
                        <div className="app-header__notif-content">
                          <p className="app-header__notif-message">
                            {notif.message}
                          </p>
                          <time className="app-header__notif-time">
                            {formatRelativeTime(notif.timestamp)}
                          </time>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Click-outside overlay */}
              <div
                className="app-header__notif-overlay"
                onClick={() => setNotifOpen(false)}
                aria-hidden="true"
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
