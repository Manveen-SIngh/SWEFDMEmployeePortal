/**
 * LoginPage.tsx
 * -------------
 * The first screen the user sees. Handles authentication and account locking.
 */

import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getRegistry } from "../services/Registry";
import "./LoginPage.css";

// ---------------------------------------------------------------------------
// LoginPage component
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const { login, isLoading, loginError } = useAuth();
  const navigate = useNavigate();

  /* Form field state */
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  /* Whether the password field shows plain text or dots */
  const [showPassword, setShowPassword] = useState(false);

  /* Local form validation errors (before hitting the Registry) */
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // -------------------------------------------------------------------------
  // validateForm()
  // -------------------------------------------------------------------------
  /**
   * Client-side validation before submitting to the Registry.
   * Catches obviously empty fields so we don't waste a login attempt.
   *
   * @returns true if the form is valid and can be submitted, false otherwise
   */
  const validateForm = (): boolean => {
    let valid = true;

    if (!username.trim()) {
      setUsernameError("Please enter your username.");
      valid = false;
    } else {
      setUsernameError("");
    }

    if (!password) {
      setPasswordError("Please enter your password.");
      valid = false;
    } else {
      setPasswordError("");
    }

    return valid;
  };

  // -------------------------------------------------------------------------
  // handleSubmit()
  // -------------------------------------------------------------------------
  /**
   * Handles form submission.
   * 1. Validates the form client-side
   * 2. Calls login() from AuthContext (which delegates to Registry.attemptLogin())
   * 3. On success: checks for unacknowledged announcements → routes accordingly
   * 4. On failure: error is displayed via loginError from AuthContext
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault(); // Prevent default HTML form submission

      if (!validateForm()) return;

      const success = await login(username.trim(), password);

      if (success) {
        /* Login was successful — check for unacknowledged announcements */
        const registry = getRegistry();

        /* We need the user that just logged in — get them from the registry */
        const loggedInUser = registry.getAllUsers().find(
          (u) => u.username === username.trim()
        );

        if (loggedInUser) {
          const unacknowledged = registry.getUnacknowledgedAnnouncements(
            loggedInUser.employeeID
          );

          if (unacknowledged.length > 0) {
            /* There are unacknowledged announcements — go to the announcement flow */
            navigate("/announcements/flow", { replace: true });
          } else {
            /* No announcements to show — go straight to the dashboard */
            navigate("/dashboard", { replace: true });
          }
        } else {
          /* Fallback — should never happen if login() succeeded */
          navigate("/dashboard", { replace: true });
        }
      }
      /* If success is false, loginError from AuthContext is already set and will display */
    },
    [login, username, password, navigate]
  );

  // -------------------------------------------------------------------------
  // handleKeyDown()
  // -------------------------------------------------------------------------
  /**
   * Submits the form when Enter is pressed in any field.
   * Standard UX for login forms.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit(e as any);
    }
  };

  // -------------------------------------------------------------------------
  // Derived state
  // -------------------------------------------------------------------------
  /**
   * Whether the account is currently locked.
   * Checks if the error message indicates the account has been LOCKED (not just warning about it).
   * Used to disable the form when the account is locked.
   *
   * Only these specific messages mean the account is truly locked:
   * - "Your account has been locked after 5 failed attempts"
   * - "Your account has been locked due to too many failed login attempts"
   *
   * Other messages like "X attempts remaining before your account is locked"
   * are just warnings and should NOT disable the form.
   */
  const isAccountLocked =
    loginError.toLowerCase().includes("has been locked") ||
    loginError.toLowerCase().includes("account locked — contact it support");

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="login-page">
      {/* ---- Left panel — branding ---- */}
      <div className="login-page__brand">
        {/* FDM logo mark */}
        <div className="login-page__logo">
          <div className="login-page__logo-mark">
            <span>FDM</span>
          </div>
          <span className="login-page__logo-group">Group</span>
        </div>

        {/* Tagline */}
        <div className="login-page__tagline">
          <h1 className="login-page__tagline-heading">
            Employee Portal
          </h1>
          <p className="login-page__tagline-sub">
            Your gateway to FDM's self-service HR tools.
            Manage your schedule, leave, payslips and more.
          </p>
        </div>

        {/* Decorative background element */}
        <div className="login-page__brand-decoration" aria-hidden="true">
          <div className="login-page__brand-circle login-page__brand-circle--1" />
          <div className="login-page__brand-circle login-page__brand-circle--2" />
          <div className="login-page__brand-circle login-page__brand-circle--3" />
        </div>
      </div>

      {/* ---- Right panel — login form ---- */}
      <div className="login-page__form-panel">
        <div className="login-card">
          {/* Card header */}
          <div className="login-card__header">
            <h2 className="login-card__title">Sign in</h2>
            <p className="login-card__subtitle">
              Use your FDM employee credentials to access the portal.
            </p>
          </div>

          {/* Login form */}
          <form
            className="login-card__form"
            onSubmit={handleSubmit}
            noValidate /* Disable browser native validation — we handle it */
          >
            {/* Global error alert — shown on auth failure from Registry */}
            {loginError && (
              <div
                className={`login-card__alert ${
                  isAccountLocked
                    ? "login-card__alert--locked"
                    : "login-card__alert--error"
                }`}
                role="alert"
                aria-live="assertive"
              >
                {/* Lock icon for locked accounts, warning icon otherwise */}
                <svg
                  className="login-card__alert-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  {isAccountLocked ? (
                    /* Lock icon */
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  ) : (
                    /* Warning triangle icon */
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                    />
                  )}
                </svg>
                <span>{loginError}</span>
              </div>
            )}

            {/* Username field */}
            <div className="form-group">
              <label htmlFor="username" className="form-label form-label--required">
                Username
              </label>
              <input
                id="username"
                type="text"
                className={`form-input ${usernameError ? "form-input--error" : ""}`}
                placeholder="e.g. aisha.patel"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (usernameError) setUsernameError(""); // Clear error on typing
                }}
                onKeyDown={handleKeyDown}
                disabled={isLoading || isAccountLocked}
                autoComplete="username"
                autoFocus
                aria-describedby={usernameError ? "username-error" : undefined}
              />
              {usernameError && (
                <span id="username-error" className="form-error-message" role="alert">
                  {usernameError}
                </span>
              )}
            </div>

            {/* Password field */}
            <div className="form-group">
              <div className="login-card__password-label-row">
                <label htmlFor="password" className="form-label form-label--required">
                  Password
                </label>
                {/* Forgot password link */}
                <button
                  type="button"
                  className="login-card__forgot-link"
                  onClick={() => navigate("/reset-password")}
                  tabIndex={0}
                >
                  Forgot password?
                </button>
              </div>

              {/* Password input with show/hide toggle */}
              <div className="login-card__password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input ${passwordError ? "form-input--error" : ""}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(""); // Clear error on typing
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading || isAccountLocked}
                  autoComplete="current-password"
                  aria-describedby={passwordError ? "password-error" : undefined}
                />
                {/* Toggle password visibility button */}
                <button
                  type="button"
                  className="login-card__show-password"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1} /* Not in tab order — decorative function */
                  disabled={isLoading || isAccountLocked}
                >
                  {showPassword ? (
                    /* Eye-off icon — password is visible, click to hide */
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    /* Eye icon — password is hidden, click to show */
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>

              {passwordError && (
                <span id="password-error" className="form-error-message" role="alert">
                  {passwordError}
                </span>
              )}
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className="btn btn--primary btn--lg login-card__submit"
              disabled={isLoading || isAccountLocked}
            >
              {isLoading ? (
                /* Loading state — spinner + text */
                <>
                  <svg
                    className="login-card__spinner"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray="60"
                      strokeDashoffset="20"
                    />
                  </svg>
                  Signing in...
                </>
              ) : isAccountLocked ? (
                /* Locked state */
                "Account Locked — Contact IT Support"
              ) : (
                /* Default state */
                "Sign in"
              )}
            </button>
          </form>

          {/* Demo credentials hint — useful for the marker */}
          <div className="login-card__demo-hint">
            <p className="login-card__demo-hint-title">Demo accounts</p>
            <div className="login-card__demo-accounts">
              <div className="login-card__demo-account">
                <span className="login-card__demo-role">Consultant</span>
                <code>aisha.patel</code>
              </div>
              <div className="login-card__demo-account">
                <span className="login-card__demo-role">HR</span>
                <code>sandra.collins</code>
              </div>
              <div className="login-card__demo-account">
                <span className="login-card__demo-role">IT Support</span>
                <code>tom.reeves</code>
              </div>
            </div>
            <p className="login-card__demo-password">
              All accounts use password: <code>Password1!</code>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="login-page__footer">
          © {new Date().getFullYear()} FDM Group. All rights reserved.
          <br />
          <span className="login-page__footer-sub">
            FDM Employee Portal — ECS506U Group 30 Prototype
          </span>
        </p>
      </div>
    </div>
  );
}
