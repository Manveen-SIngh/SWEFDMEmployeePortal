/**
 * App.tsx
 * -------
 * The root React component. Defines the application's routing structure
 * and wraps everything in the global context providers.
 *
 * ROUTING STRATEGY:
 * React Router v6 is used with the createBrowserRouter API.
 * Routes are divided into three categories:
 *
 *   1. PUBLIC routes — accessible without login (login page)
 *   2. PROTECTED routes — require any valid login (redirect to /login if not authenticated)
 *   3. ROLE-SPECIFIC routes — require a specific Role enum value
 *      (redirect to the correct dashboard if the wrong role tries to access)
 *
 * The <ProtectedRoute> component handles authentication gating.
 * The <RoleRoute> component handles role-based gating.
 *
 * PROVIDER NESTING ORDER:
 * AuthProvider must wrap NotificationProvider because NotificationProvider
 * consumes AuthContext (it needs currentUser to fetch notifications).
 *
 *   <AuthProvider>                  -> manages login state
 *     <NotificationProvider>        -> reads currentUser from AuthContext
 *       <RouterProvider>            -> renders pages
 *       </RouterProvider>
 *     </NotificationProvider>
 *   </AuthProvider>
 *
 * LAYOUT:
 * Authenticated pages are wrapped in <AppLayout> which renders the
 * sidebar navbar and header, then renders the page in the content area.
 * The login page and announcement flow bypass AppLayout entirely.
 */

import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { Role } from "./models/enums";

/* These are imported lazily to avoid circular dependency issues.  */

import LoginPage from "./pages/LoginPage";
import AppLayout from "./components/layout/AppLayout";
import ConsultantDashboard from "./pages/consultant/ConsultantDashboard";
import HRDashboard from "./pages/hr/HRDashboard";
import ITDashboard from "./pages/it/ITDashboard";
import AnnouncementFlow from "./pages/shared/AnnouncementFlow";
import MyDetails from "./pages/shared/MyDetails";
import AbsenceHolidays from "./pages/shared/AbsenceHolidays";
import EmployeeDirectory from "./pages/hr/EmployeeDirectory";
import LeaveManagement from "./pages/hr/LeaveManagement";
import UserManagement from "./pages/it/UserManagement";
import AuditLog from "./pages/it/AuditLog";

// ---------------------------------------------------------------------------
// ProtectedRoute
// ---------------------------------------------------------------------------
/**
 * Wraps any route that requires authentication.
 * If currentUser is null (not logged in), redirects to /login.
 * If authenticated, renders the child route via <Outlet />.
 *
 * Used as the element for the parent route that wraps all protected pages.
 */
function ProtectedRoute() {
  const { currentUser } = useAuth();

  if (!currentUser) {
    /* Not logged in — redirect to login page, preserving the intended URL */
    return <Navigate to="/login" replace />;
  }

  /* Logged in — render child routes */
  return <Outlet />;
}

// ---------------------------------------------------------------------------
// RoleRoute
// ---------------------------------------------------------------------------
/**
 * Wraps routes that require a specific user role.
 * If the current user's role does not match the required role,
 * redirects to their correct dashboard.
 *
 * @param allowedRoles - Array of Role enum values permitted to access this route
 */
function RoleRoute({ allowedRoles }: { allowedRoles: Role[] }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    /* Wrong role — redirect to the correct dashboard for this user's role */
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

// ---------------------------------------------------------------------------
// RoleDashboard
// ---------------------------------------------------------------------------
/**
 * Renders the correct dashboard component based on the current user's role.
 * Placed inside AppLayout so it has access to the navbar and header.
 */
function RoleDashboard() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;

  switch (currentUser.role) {
    case Role.CONSULTANT:
      return <ConsultantDashboard />;
    case Role.HUMAN_RESOURCES:
      return <HRDashboard />;
    case Role.IT_SUPPORT:
      return <ITDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
}


// ---------------------------------------------------------------------------
// Placeholder component for pages not yet implemented
// ---------------------------------------------------------------------------
function ComingSoon({ pageName }: { pageName: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        gap: "1rem",
        color: "var(--color-text-muted)",
      }}
    >
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"
        />
      </svg>
      <h2 style={{ fontSize: "var(--font-size-xl)", color: "var(--color-text-secondary)" }}>
        {pageName}
      </h2>
      <p style={{ fontSize: "var(--font-size-sm)" }}>
        This page is being implemented. Check back soon.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Router configuration
// ---------------------------------------------------------------------------
/**
 * Defines all application routes.
 *
 * Route structure:
 *   /login                           -> LoginPage (public)
 *   /                                -> redirect to /dashboard
 *   /dashboard                       -> role-specific dashboard

 *   /my-details                      -> MyDetails (shared)
 *   /absence                         -> AbsenceHolidays (shared)

 *   /hr/employees                    -> EmployeeDirectory (HR only)
 *   /hr/leave-management             -> LeaveManagement (HR only)
 *   /it/user-management              -> UserManagement (IT only)
 *   /it/audit-log                    -> AuditLog (IT only)
 */
const router = createBrowserRouter([
  /* Public routes */
  {
    path: "/login",
    element: <LoginPage />,
  },

  /* Root redirect */
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },

  /* Protected routes — all require authentication, all wrapped in AppLayout */
  {
    element: <ProtectedRoute />,
    children: [
      /* ---------------------------------------------------------------
         Announcement Flow — protected but NOT inside AppLayout.
         Renders its own full-screen overlay so it must be a sibling
         of the AppLayout wrapper, not a child.
         --------------------------------------------------------------- */
      {
        path: "/announcements/flow",
        element: <AnnouncementFlow />,
      },

      {
        /* AppLayout wraps all authenticated pages — provides Navbar + Header */
        element: <AppLayout />,
        children: [
          /* Dashboard — renders the correct dashboard for the user's role */
          {
            path: "/dashboard",
            element: <RoleDashboard />,
          },

          /* Shared employee pages — accessible by all roles */
          {
            path: "/announcements",
            element: <ComingSoon pageName="Announcements — For show" />,
          },
          {
            path: "/my-details",
            element: <MyDetails />,
          },
          {
            path: "/absence",
            element: <AbsenceHolidays />,
          },
          {
            path: "/schedule/planner",
            element: <ComingSoon pageName="SchedulePlanner — For show" />,
          },
          {
            path: "/schedule/timesheets",
            element: <ComingSoon pageName="Timesheets — For show" />,
          },
          {
            path: "/payments/payslips",
            element: <ComingSoon pageName="Payslips — For show" />,
          },
          {
            path: "/queries",
            element: <ComingSoon pageName="Queries — For show" />,
          },
          {
            path: "/documents",
            element: <ComingSoon pageName="Documents — For show" />,
          },

          /* HR-only routes */
          {
            element: <RoleRoute allowedRoles={[Role.HUMAN_RESOURCES]} />,
            children: [
              {
                path: "/hr/employees",
                element: <EmployeeDirectory />,
              },
              {
                path: "/hr/leave-management",
                element: <LeaveManagement />,
              },
            ],
          },

          /* IT Support-only routes */
          {
            element: <RoleRoute allowedRoles={[Role.IT_SUPPORT]} />,
            children: [
              {
                path: "/it/user-management",
                element: <UserManagement />,
              },
              {
                path: "/it/audit-log",
                element: <AuditLog />,
              },
            ],
          },

          /* Consultant-only routes */
          {
            element: <RoleRoute allowedRoles={[Role.CONSULTANT]} />,
            children: [
              {
                path: "/learning",
                element: <ComingSoon pageName="Learning & Development — For show" />,
              },
              {
                path: "/performance",
                element: <ComingSoon pageName="Performance Reviews — For show" />,
              },
            ],
          },
        ],
      },
    ],
  },

  /* 404 fallback */
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  },
]);

// ---------------------------------------------------------------------------
// App root component
// ---------------------------------------------------------------------------
/**
 * The application root.
 * Wraps everything in AuthProvider → NotificationProvider → RouterProvider.
 * This component is imported and rendered by main.tsx.
 */
function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <RouterProvider router={router} />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
