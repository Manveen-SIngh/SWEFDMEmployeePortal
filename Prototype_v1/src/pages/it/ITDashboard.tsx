/**
 * ITDashboard.tsx
 * ---------------
 * The landing page for IT_SUPPORT role users after login.
 *
 */

import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";
import { Role } from "../../models/enums";
import "./ITDashboard.css";

/* returns a greeting based on the time of day */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/* formats a date into a short readable string */
function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* turns a role value into a human-readable label */
function roleLabel(role: Role): string {
  switch (role) {
    case Role.CONSULTANT:      return "Consultant";
    case Role.HUMAN_RESOURCES: return "HR Staff";
    case Role.IT_SUPPORT:      return "IT Support";
    default:                   return role;
  }
}

// ---------------------------------------------------------------------------
// ITDashboard component
// ---------------------------------------------------------------------------
export default function ITDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  /**
   * Incrementing this counter forces useMemo to re-derive all dashboard data
   * from the Registry singleton. Used after unlock actions so the locked
   * accounts card and stat cards update immediately.
   */
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  /* pull everything we need from the registry */
  const { stats, lockedAccounts, allUsers, recentLogs } = useMemo(() => {
    const registry = getRegistry();
    return {
      stats:          registry.getITDashboardStats(),
      lockedAccounts: registry.getLockedAccounts(),
      allUsers:       registry.getAllUsers(),
      recentLogs:     registry.getRecentAuditLogs(10),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (!currentUser) return null;

  /* unlocks an account and refreshes the page data */
  const handleUnlock = useCallback(
    (userID: string) => {
      const registry = getRegistry();
      registry.unlockAccount(userID);
      triggerRefresh();
    },
    [triggerRefresh]
  );

  /* counts how many users are in each role for the bar chart */
  const roleBreakdown = useMemo(() => {
    const counts = {
      [Role.CONSULTANT]:      0,
      [Role.HUMAN_RESOURCES]: 0,
      [Role.IT_SUPPORT]:      0,
    };
    allUsers.forEach((u) => {
      if (u.role in counts) counts[u.role as Role]++;
    });
    const total = allUsers.length;
    return Object.entries(counts).map(([role, count]) => ({
      role: role as Role,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [allUsers]);

  /* map of employee ID to full name, used when rendering audit log rows */
  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    allUsers.forEach((u) => {
      map[u.employeeID] = `${u.firstName} ${u.lastName}`;
    });
    return map;
  }, [allUsers]);

  /* colours for each role in the breakdown chart */
  const roleTheme: Record<Role, string> = {
    [Role.CONSULTANT]:      "primary",
    [Role.HUMAN_RESOURCES]: "info",
    [Role.IT_SUPPORT]:      "warning",
  };

  return (
    <div className="it-dash">

      {/* ---- Welcome header ---- */}
      <div className="it-dash__welcome">
        <div>
          <h2 className="it-dash__greeting">
            {getGreeting()}, {currentUser.firstName} 👋
          </h2>
          <p className="it-dash__sub">
            System health and account overview for today.
          </p>
        </div>
        <div className="it-dash__meta">
          <span className="badge badge--neutral">{currentUser.employeeID}</span>
          <span className="badge badge--warning">IT Support</span>
        </div>
      </div>

      {/* ---- Row 1: 3 stat cards ---- */}
      <div className="it-dash__stats-row">

        {/* Total accounts across all roles */}
        <div className="it-stat-card">
          <div className="it-stat-card__icon it-stat-card__icon--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <div className="it-stat-card__value">{stats.totalAccounts}</div>
          <div className="it-stat-card__label">Total Accounts</div>
          <div className="it-stat-card__sublabel">across all roles</div>
          <button
            className="dash-card__link"
            onClick={() => navigate("/it/user-management")}
          >
            Manage accounts →
          </button>
        </div>

        {/* Locked accounts — turns red if any exist */}
        <div
          className={`it-stat-card ${
            stats.lockedAccounts > 0 ? "it-stat-card--alert" : ""
          }`}
        >
          <div
            className={`it-stat-card__icon ${
              stats.lockedAccounts > 0
                ? "it-stat-card__icon--danger"
                : "it-stat-card__icon--success"
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <div className="it-stat-card__value">{stats.lockedAccounts}</div>
          <div className="it-stat-card__label">
            {stats.lockedAccounts === 1 ? "Locked Account" : "Locked Accounts"}
          </div>
          <div className="it-stat-card__sublabel">
            {stats.lockedAccounts === 0
              ? "All accounts active"
              : "require IT action (RQ6)"}
          </div>
        </div>

        {/* Successful logins in the last 24 hours */}
        <div className="it-stat-card">
          <div className="it-stat-card__icon it-stat-card__icon--info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </div>
          <div className="it-stat-card__value">{stats.recentLogins}</div>
          <div className="it-stat-card__label">Logins (24h)</div>
          <div className="it-stat-card__sublabel">successful authentications</div>
          <button
            className="dash-card__link"
            onClick={() => navigate("/it/audit-log")}
          >
            View audit log →
          </button>
        </div>
      </div>

      {/* ---- Row 2: Locked Accounts + Role Breakdown ---- */}
      <div className="it-dash__split-row">

        {/* List of locked accounts with unlock buttons */}
        <div className="dash-card it-dash__locked-card">
          <div className="dash-card__header">
            <div className="dash-card__icon dash-card__icon--danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <span className="dash-card__label">Locked Accounts</span>
            {lockedAccounts.length > 0 && (
              <span className="badge badge--danger">
                {lockedAccounts.length}
              </span>
            )}
          </div>

          {lockedAccounts.length === 0 ? (
            /* shown when no accounts are locked */
            <div className="it-dash__empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <p>No locked accounts — all users can sign in.</p>
            </div>
          ) : (
            /* list each locked account with a button to unlock it */
            <div className="it-locked-list">
              {lockedAccounts.map((user) => (
                <div key={user.employeeID} className="it-locked-list__item">
                  {/* Account info */}
                  <div className="it-locked-list__info">
                    {/* Initials avatar */}
                    <div className="it-locked-list__avatar">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div className="it-locked-list__details">
                      <span className="it-locked-list__name">
                        {user.firstName} {user.lastName}
                      </span>
                      <div className="it-locked-list__meta">
                        <code className="it-locked-list__id">
                          {user.employeeID}
                        </code>
                        <span className="badge badge--danger" style={{ fontSize: "10px" }}>
                          Locked
                        </span>
                        <span className="badge badge--neutral" style={{ fontSize: "10px" }}>
                          {roleLabel(user.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Unlock button */}
                  <button
                    className="btn btn--primary btn--sm"
                    onClick={() => handleUnlock(user.employeeID)}
                    title={`Unlock account for ${user.firstName} ${user.lastName}`}
                  >
                    Unlock
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            className="dash-card__link"
            onClick={() => navigate("/it/user-management")}
          >
            User management →
          </button>
        </div>

        {/* Bar chart showing how many users are in each role */}
        <div className="dash-card it-dash__breakdown-card">
          <div className="dash-card__header">
            <div className="dash-card__icon dash-card__icon--primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <span className="dash-card__label">Account Breakdown</span>
            <span className="dash-card__header-aside">{allUsers.length} total</span>
          </div>

          {/* One bar per role */}
          <div className="it-breakdown">
            {roleBreakdown.map(({ role, count, percentage }) => (
              <div key={role} className="it-breakdown__row">
                {/* Role name and count */}
                <div className="it-breakdown__label-row">
                  <span className="it-breakdown__role">{roleLabel(role)}</span>
                  <span className="it-breakdown__count">{count}</span>
                </div>

                {/* The coloured bar */}
                <div className="it-breakdown__bar-track">
                  <div
                    className={`it-breakdown__bar-fill it-breakdown__bar-fill--${roleTheme[role]}`}
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${roleLabel(role)}: ${count} accounts (${percentage}%)`}
                  />
                </div>

                {/* Percentage on the right */}
                <span className="it-breakdown__pct">{percentage}%</span>
              </div>
            ))}
          </div>

          {/* Summary of active vs locked */}
          <div className="it-breakdown__summary">
            <div className="it-breakdown__summary-item">
              <span
                className="it-breakdown__summary-dot"
                style={{ backgroundColor: "var(--color-success)" }}
              />
              <span>
                {allUsers.length - stats.lockedAccounts} active
              </span>
            </div>
            <div className="it-breakdown__summary-item">
              <span
                className="it-breakdown__summary-dot"
                style={{ backgroundColor: "var(--color-danger)" }}
              />
              <span>{stats.lockedAccounts} locked</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Row 3: Recent Audit Log table ---- */}
      <div className="dash-card it-dash__audit-card">
        <div className="dash-card__header">
          <div className="dash-card__icon dash-card__icon--info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
          </div>
          <span className="dash-card__label">Recent Audit Log</span>
          <span className="dash-card__header-aside">Last 10 events (RQ40)</span>
        </div>

        {/* Table of the 10 most recent audit entries */}
        <div className="it-audit-table-wrap">
          <table className="it-audit-table" aria-label="Recent audit log entries">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Employee</th>
                <th>ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="it-audit-table__empty">
                    No audit entries found.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log, index) => {
                  const name = userNameMap[log.userID] ?? log.userID;
                  /* colour the row differently for failures and locks */
                  const isFailure = log.action.toLowerCase().includes("failed");
                  const isLock    = log.action.toLowerCase().includes("locked");

                  return (
                    <tr
                      key={log.logID}
                      className={[
                        isLock    ? "it-audit-table__row--danger"  : "",
                        isFailure ? "it-audit-table__row--warning" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {/* When it happened */}
                      <td className="it-audit-table__timestamp">
                        <time dateTime={new Date(log.timeStamp).toISOString()}>
                          {formatDateTime(log.timeStamp)}
                        </time>
                      </td>
                      {/* Who it was */}
                      <td className="it-audit-table__user">{name}</td>
                      {/* Their ID */}
                      <td>
                        <code className="it-audit-table__id">{log.userID}</code>
                      </td>
                      {/* What they did */}
                      <td
                        className="it-audit-table__action"
                        title={log.action}
                      >
                        {log.action}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <button
          className="dash-card__link"
          onClick={() => navigate("/it/audit-log")}
        >
          Full audit log →
        </button>
      </div>
    </div>
  );
}
