/**
 * Navbar.tsx
 * ----------
 * The persistent left-side navigation bar shown on all authenticated pages. *
 *
 * EXPANDABLE SECTIONS:
 *   Schedule and Payments are parent items with children. Clicking the parent
 *   toggles a local expanded state that shows/hides the sub-items.
 *   If the current URL is under a parent's subtree, the parent auto-expands.
 */

import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { Role } from "../../models/enums";
import "./Navbar.css";

// ---------------------------------------------------------------------------
// Nav item type definitions
// ---------------------------------------------------------------------------

/**
 * A single navigation item in the sidebar.
 * Items with children are expandable parent sections (Schedule, Payments).
 */
interface NavItem {
  /** Human-readable label shown next to the icon */
  label: string;
  /** URL path this item navigates to (undefined for parent-only items) */
  path?: string;
  /** SVG icon path data (viewBox 0 0 24 24, stroke-based) */
  icon: React.ReactNode;
  /** Child items — present on Schedule and Payments only */
  children?: NavChild[];
}

/**
 * A sub-item under an expandable parent nav section.
 * Sub-items have no icon of their own — they're indented under the parent.
 */
interface NavChild {
  label: string;
  path: string;
}

// ---------------------------------------------------------------------------
// SVG Icon helpers
// ---------------------------------------------------------------------------
/**
 * Thin wrapper to keep icon JSX clean and consistent.
 * All icons use the same viewBox and strokeWidth.
 */
function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      className="navbar__item-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Core nav items (all roles share these)
// ---------------------------------------------------------------------------
const coreNavItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: (
      <Icon>
        <path d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </Icon>
    ),
  },
  {
    label: "Announcements",
    path: "/announcements",
    icon: (
      <Icon>
        <path d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
      </Icon>
    ),
  },
  {
    label: "My Details",
    path: "/my-details",
    icon: (
      <Icon>
        <path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </Icon>
    ),
  },
  {
    label: "Absence & Holidays",
    path: "/absence",
    icon: (
      <Icon>
        <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </Icon>
    ),
  },
  {
    label: "Schedule",
    icon: (
      <Icon>
        <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </Icon>
    ),
    children: [
      { label: "Planner", path: "/schedule/planner" },
      { label: "Timesheets", path: "/schedule/timesheets" },
    ],
  },
  {
    label: "Payments",
    icon: (
      <Icon>
        <path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </Icon>
    ),
    children: [{ label: "Payslips", path: "/payments/payslips" }],
  },
  {
    label: "Queries",
    path: "/queries",
    icon: (
      <Icon>
        <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </Icon>
    ),
  },
  {
    label: "Documents",
    path: "/documents",
    icon: (
      <Icon>
        <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </Icon>
    ),
  },
];

// ---------------------------------------------------------------------------
// Role-specific extra nav items
// ---------------------------------------------------------------------------

/** Additional items shown only to CONSULTANT role */
const consultantNavItems: NavItem[] = [
  {
    label: "Learning & Dev",
    path: "/learning",
    icon: (
      <Icon>
        <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
      </Icon>
    ),
  },
  {
    label: "Performance",
    path: "/performance",
    icon: (
      <Icon>
        <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </Icon>
    ),
  },
];

/** Additional items shown only to HUMAN_RESOURCES role */
const hrNavItems: NavItem[] = [
  {
    label: "Employee Directory",
    path: "/hr/employees",
    icon: (
      <Icon>
        <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </Icon>
    ),
  },
  {
    label: "Leave Management",
    path: "/hr/leave-management",
    icon: (
      <Icon>
        <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </Icon>
    ),
  },
];

/** Additional items shown only to IT_SUPPORT role */
const itNavItems: NavItem[] = [
  {
    label: "User Management",
    path: "/it/user-management",
    icon: (
      <Icon>
        <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </Icon>
    ),
  },
  {
    label: "Audit Log",
    path: "/it/audit-log",
    icon: (
      <Icon>
        <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
      </Icon>
    ),
  },
];

// ---------------------------------------------------------------------------
// Navbar component
// ---------------------------------------------------------------------------
export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  /* Which expandable sections are currently open */
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    Schedule: false,
    Payments: false,
  });

  /* Whether the profile/logout dropdown is open */
  const [profileOpen, setProfileOpen] = useState(false);

  // -------------------------------------------------------------------------
  // Auto-expand parent sections based on current URL
  // -------------------------------------------------------------------------
  /**
   * When the current URL is under a parent's subtree (e.g. /schedule/planner),
   * automatically expand that parent section so the active child is visible.
   * Runs on mount and whenever the URL changes.
   */
  useEffect(() => {
    const path = location.pathname;
    setExpanded((prev) => ({
      ...prev,
      Schedule: path.startsWith("/schedule"),
      Payments: path.startsWith("/payments"),
    }));
  }, [location.pathname]);

  // -------------------------------------------------------------------------
  // Build the nav item list for this user's role
  // -------------------------------------------------------------------------
  /**
   * Returns the complete ordered list of nav items for the current user's role.
   * Role-specific items are inserted after the core items (before Documents).
   */
  const getNavItems = (): NavItem[] => {
    if (!currentUser) return coreNavItems;

    /* Splice role-specific items before "Documents" (last core item) */
    const roleItems =
      currentUser.role === Role.CONSULTANT
        ? consultantNavItems
        : currentUser.role === Role.HUMAN_RESOURCES
        ? hrNavItems
        : itNavItems;

    /* Insert before the last core item (Documents) */
    const withRoleItems = [
      ...coreNavItems.slice(0, -1), // All core items except Documents
      ...roleItems,
      coreNavItems[coreNavItems.length - 1], // Documents last
    ];

    return withRoleItems;
  };

  // -------------------------------------------------------------------------
  // isActive() helper
  // -------------------------------------------------------------------------
  /**
   * Determines if a nav item should be styled as active.
   * Dashboard uses exact matching; all others use prefix matching
   * so /schedule/planner correctly activates the Schedule parent.
   *
   * @param path - The nav item's path
   * @returns true if the current URL matches this item
   */
  const isActive = (path: string): boolean => {
    if (path === "/dashboard") return location.pathname === "/dashboard";
    return location.pathname.startsWith(path);
  };

  // -------------------------------------------------------------------------
  // Handle logout
  // -------------------------------------------------------------------------
  const handleLogout = () => {
    setProfileOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  if (!currentUser) return null;

  const navItems = getNavItems();
  const userInitials = `${currentUser.firstName[0]}${currentUser.lastName[0]}`;

  // -------------------------------------------------------------------------
  // Role label for the profile section
  // -------------------------------------------------------------------------
  const roleLabel =
    currentUser.role === Role.CONSULTANT
      ? "Consultant"
      : currentUser.role === Role.HUMAN_RESOURCES
      ? "HR Staff"
      : "IT Support";

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <nav className="navbar" aria-label="Main navigation">
      {/* ---- Logo ---- */}
      <div className="navbar__logo">
        <div className="navbar__logo-mark">FDM</div>
        <span className="navbar__logo-text">Portal</span>
      </div>

      {/* ---- Navigation items ---- */}
      <ul className="navbar__items" role="list">
        {navItems.map((item) => {
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = hasChildren && expanded[item.label];
          /* A parent is "active" if any child is active */
          const parentActive =
            hasChildren &&
            item.children!.some((child) => isActive(child.path));

          return (
            <li key={item.label} className="navbar__item-wrapper">
              {/* Parent / single item button */}
              <button
                className={`navbar__item ${
                  item.path && isActive(item.path)
                    ? "navbar__item--active"
                    : parentActive
                    ? "navbar__item--parent-active"
                    : ""
                }`}
                onClick={() => {
                  if (hasChildren) {
                    /* Toggle the expanded state for this parent section */
                    setExpanded((prev) => ({
                      ...prev,
                      [item.label]: !prev[item.label],
                    }));
                  } else if (item.path) {
                    navigate(item.path);
                  }
                }}
                aria-expanded={hasChildren ? isExpanded : undefined}
                aria-current={
                  item.path && isActive(item.path) ? "page" : undefined
                }
              >
                {/* Icon */}
                <span className="navbar__item-icon-wrap">{item.icon}</span>

                {/* Label */}
                <span className="navbar__item-label">{item.label}</span>

                {/* Chevron for expandable sections */}
                {hasChildren && (
                  <svg
                    className={`navbar__item-chevron ${
                      isExpanded ? "navbar__item-chevron--open" : ""
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                )}
              </button>

              {/* Child items — only rendered when expanded */}
              {hasChildren && isExpanded && (
                <ul className="navbar__children" role="list">
                  {item.children!.map((child) => (
                    <li key={child.path}>
                      <button
                        className={`navbar__child ${
                          isActive(child.path) ? "navbar__child--active" : ""
                        }`}
                        onClick={() => navigate(child.path)}
                        aria-current={
                          isActive(child.path) ? "page" : undefined
                        }
                      >
                        <span className="navbar__child-dot" aria-hidden="true" />
                        {child.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {/* ---- Profile button (bottom) ---- */}
      <div className="navbar__profile-section">
        <div className="navbar__profile-wrapper">
          <button
            className="navbar__profile-btn"
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            aria-label={`Profile menu for ${currentUser.firstName} ${currentUser.lastName}`}
          >
            {/* Avatar initials circle */}
            <div className="navbar__avatar" aria-hidden="true">
              {userInitials}
            </div>
            {/* Name + role */}
            <div className="navbar__profile-text">
              <span className="navbar__profile-name">
                {currentUser.firstName} {currentUser.lastName}
              </span>
              <span className="navbar__profile-role">{roleLabel}</span>
            </div>
            {/* Chevron */}
            <svg
              className={`navbar__profile-chevron ${
                profileOpen ? "navbar__profile-chevron--open" : ""
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 4.5l7.5 7.5-7.5 7.5"
              />
            </svg>
          </button>

          {/* Logout dropdown */}
          {profileOpen && (
            <div className="navbar__profile-dropdown" role="menu">
              {/* Employee ID */}
              <div className="navbar__profile-dropdown-header">
                <span className="navbar__profile-dropdown-id">
                  {currentUser.employeeID}
                </span>
                <span className="navbar__profile-dropdown-email">
                  {currentUser.email}
                </span>
              </div>
              <hr className="navbar__profile-dropdown-divider" />
              <button
                className="navbar__profile-dropdown-item"
                onClick={() => {
                  setProfileOpen(false);
                  navigate("/my-details");
                }}
                role="menuitem"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                My Details
              </button>
              <button
                className="navbar__profile-dropdown-item navbar__profile-dropdown-item--danger"
                onClick={handleLogout}
                role="menuitem"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click-outside overlay to close the profile dropdown */}
      {profileOpen && (
        <div
          className="navbar__overlay"
          onClick={() => setProfileOpen(false)}
          aria-hidden="true"
        />
      )}
    </nav>
  );
}
