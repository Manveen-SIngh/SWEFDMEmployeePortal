/**
 * AuthContext.tsx
 * ---------------
 * Provides global authentication state to the entire React application.
 *
 * WHAT THIS DOES:
 * Wraps the application in a React Context that holds:
 *   - The currently logged-in user (or null if not logged in)
 *   - Functions to log in and log out
 *   - The last login error message (for display on the login screen)
 *   - A loading state for async operations
 *
 * WHY CONTEXT?
 * Without a backend session, we need a way for every component in the app
 * to know who is logged in and what their role is — without passing props
 * through every level of the component tree. React Context solves this.
 *
 * HOW IT CONNECTS TO THE REGISTRY:
 * AuthContext does NOT manage data directly. It delegates all authentication
 * logic (credential checking, account locking) to Registry.attemptLogin().
 * This keeps the Registry as the single source of truth.
 *
 * HOW COMPONENTS USE IT:
 * Import the useAuth hook and call it inside any functional component:
 *   const { currentUser, login, logout } = useAuth();
 *
 * The currentUser object is the full AppUser from the Registry —
 * components can read currentUser.role to determine what to render,
 * and currentUser.employeeID to pass to Registry methods.
 *
 * PROTECTED ROUTES:
 * The router in App.tsx uses currentUser to redirect unauthenticated
 * users to the login page. Role-specific routes additionally check
 * currentUser.role to ensure the correct portal is shown.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

import type { AppUser } from "../models/interfaces";
import { getRegistry } from "../services/Registry";

// ---------------------------------------------------------------------------
// Context type definition
// ---------------------------------------------------------------------------
/**
 * Describes the shape of the value provided by AuthContext.
 * Every component that calls useAuth() gets an object of this type.
 */
interface AuthContextType {
  /**
   * The currently authenticated user, or null if nobody is logged in.
   * This is the live AppUser object from the Registry — reflects any
   * updates made during the session (e.g. personal detail changes).
   */
  currentUser: AppUser | null;

  /**
   * Whether an authentication operation is currently in progress.
   * Used by the login page to show a loading state on the button.
   */
  isLoading: boolean;

  /**
   * The error message from the most recent failed login attempt.
   * Empty string when there is no error.
   * Displayed below the login form on the login page.
   */
  loginError: string;

  /**
   * Attempts to log in with the given credentials.
   * Delegates to Registry.attemptLogin() which handles credential checking,
   * failed attempt counting, and account locking.
   *
   * @param username - The username entered on the login form
   * @param password - The password entered on the login form
   * @returns true if login was successful, false if it failed
   */
  login: (username: string, password: string) => Promise<boolean>;

  /**
   * Logs out the current user.
   * Clears currentUser from context and delegates the audit log entry
   * to Registry.logout().
   */
  logout: () => void;

  /**
   * Updates the currentUser in context after a personal detail change.
   * Called by the My Details page after Registry.updatePersonalDetails()
   * succeeds, so the header/navbar reflect the new name immediately.
   *
   * @param updatedUser - The updated AppUser object returned by Registry
   */
  refreshCurrentUser: (updatedUser: AppUser) => void;
}

// ---------------------------------------------------------------------------
// Context creation
// ---------------------------------------------------------------------------
/**
 * The AuthContext itself. Components never import this directly —
 * they use the useAuth() hook below.
 * Initialised with undefined so that useAuth() can detect if it is
 * being used outside of the AuthProvider and throw a helpful error.
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ---------------------------------------------------------------------------
// AuthProvider component
// ---------------------------------------------------------------------------
/**
 * Wrap the application root with this component to provide auth state
 * to all child components.
 *
 * Usage in App.tsx:
 *   <AuthProvider>
 *     <RouterProvider router={router} />
 *   </AuthProvider>
 *
 * @param children - The React node tree to provide context to
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  /* The currently logged-in user. null means nobody is logged in. */
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  /* Loading state for async operations (login) */
  const [isLoading, setIsLoading] = useState(false);

  /* Error message from the most recent failed login attempt */
  const [loginError, setLoginError] = useState("");

  // -------------------------------------------------------------------------
  // login()
  // -------------------------------------------------------------------------
  /**
   * Attempts to authenticate the user.
   * Uses useCallback to prevent unnecessary re-renders of child components
   * that receive this function as a prop.
   *
   * Simulates an async operation with a brief artificial delay (300ms) to
   * give the login button a satisfying loading state — in a real app this
   * would be the time taken for the HTTP request to the auth endpoint.
   */
  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      setLoginError(""); // Clear any previous error

      try {
        /* Simulate network latency for realism */
        await new Promise((resolve) => setTimeout(resolve, 300));

        const registry = getRegistry();
        const { user, reason } = registry.attemptLogin(username, password);

        if (user) {
          /* Successful login — set the user in context */
          setCurrentUser(user);
          setLoginError("");
          return true;
        } else {
          /* Failed login — display the reason from Registry */
          setLoginError(reason);
          return false;
        }
      } finally {
        /* Always clear loading state, even if an error was thrown */
        setIsLoading(false);
      }
    },
    []
  );

  // -------------------------------------------------------------------------
  // logout()
  // -------------------------------------------------------------------------
  /**
   * Logs out the current user.
   * Records the logout in the audit log via the Registry,
   * then clears the user from context.
   *
   * After this call, all protected routes will redirect to /login.
   */
  const logout = useCallback(() => {
    if (currentUser) {
      const registry = getRegistry();
      registry.logout(currentUser.employeeID);
    }
    setCurrentUser(null);
    setLoginError("");
  }, [currentUser]);

  // -------------------------------------------------------------------------
  // refreshCurrentUser()
  // -------------------------------------------------------------------------
  /**
   * Replaces the currentUser in context with an updated version.
   * Called after personal detail edits so that the header reflects
   * changes (e.g. name change) without requiring a new login.
   *
   * @param updatedUser - The updated AppUser returned by Registry.updatePersonalDetails()
   */
  const refreshCurrentUser = useCallback((updatedUser: AppUser) => {
    setCurrentUser(updatedUser);
  }, []);

  // -------------------------------------------------------------------------
  // Context value
  // -------------------------------------------------------------------------
  /**
   * The value object provided to all consuming components.
   * Memoisation is handled per-function via useCallback above.
   */
  const contextValue: AuthContextType = {
    currentUser,
    isLoading,
    loginError,
    login,
    logout,
    refreshCurrentUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// useAuth hook
// ---------------------------------------------------------------------------
/**
 * Custom hook for consuming AuthContext.
 * Provides a clean, type-safe API and throws a descriptive error if
 * used outside of AuthProvider (which would mean no context is available).
 *
 * Usage:
 *   const { currentUser, login, logout } = useAuth();
 *
 * @throws Error if called outside of an AuthProvider
 * @returns The AuthContextType value for the current user's session
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth() must be used within an <AuthProvider>. " +
        "Make sure your component is a descendant of <AuthProvider> in App.tsx."
    );
  }

  return context;
}

export default AuthContext;
