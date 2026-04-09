/**
 * AuditLog.tsx
 * ------------
 * View the system audit log, showing all login activity.
 */

import React, { useState, useMemo } from "react";

import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";
import "./AuditLog.css";

// ---------------------------------------------------------------------------
// Helper: format a Date to something like"29 Mar 2026, 08:45:02"
// ---------------------------------------------------------------------------
function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const PAGE_SIZE = 25;

// ---------------------------------------------------------------------------
// AuditLog component
// ---------------------------------------------------------------------------
export default function AuditLog() {
  const { currentUser } = useAuth();

  const [searchTerm,   setSearchTerm]   = useState("");
  const [filterUserID, setFilterUserID] = useState("");
  const [quickFilter,  setQuickFilter]  = useState<"all" | "logins" | "failures">("all");
  const [currentPage,  setCurrentPage]  = useState(1);

  if (!currentUser) return null;

  const registry = getRegistry();
  const allUsers = registry.getAllUsers();

  // -------------------------------------------------------------------------
  // Build user ID -> name map for the table
  // -------------------------------------------------------------------------
  const userNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    allUsers.forEach((u) => { map[u.employeeID] = `${u.firstName} ${u.lastName}`; });
    return map;
  }, [allUsers]);

  // -------------------------------------------------------------------------
  // Fetch and filter the full audit log
  // -------------------------------------------------------------------------
  const filteredLogs = useMemo(() => {
    let logs = registry.getAuditLogs(); // Newest first

    /* Quick filter */
    if (quickFilter === "logins") {
      logs = logs.filter((l) => l.action.toLowerCase().includes("logged in"));
    } else if (quickFilter === "failures") {
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes("failed") ||
          l.action.toLowerCase().includes("locked")
      );
    }

    /* User filter */
    if (filterUserID) {
      logs = logs.filter((l) => l.userID === filterUserID);
    }

    /* Search term — against action text */
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(term) ||
          l.userID.toLowerCase().includes(term) ||
          (userNameMap[l.userID] ?? "").toLowerCase().includes(term)
      );
    }

    return logs;
  }, [searchTerm, filterUserID, quickFilter, userNameMap]);

  /* Pagination */
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const pageLogs   = filteredLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /* Reset to page 1 when filters change */
  const applyFilter = (fn: () => void) => {
    setCurrentPage(1);
    fn();
  };

  // -------------------------------------------------------------------------
  // Actual Rendering
  // -------------------------------------------------------------------------
  return (
    <div className="audit-log">

      {/* ---- Filter bar ---- */}
      <div className="audit-log__filters">
        {/* Search */}
        <div className="audit-log__search-wrap">
          <svg className="audit-log__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="search"
            className="audit-log__search"
            placeholder="Search actions or employee…"
            value={searchTerm}
            onChange={(e) => applyFilter(() => setSearchTerm(e.target.value))}
          />
        </div>

        {/* User filter */}
        <select
          className="audit-log__select"
          value={filterUserID}
          onChange={(e) => applyFilter(() => setFilterUserID(e.target.value))}
          aria-label="Filter by employee"
        >
          <option value="">All employees</option>
          {allUsers.map((u) => (
            <option key={u.employeeID} value={u.employeeID}>
              {u.firstName} {u.lastName} ({u.employeeID})
            </option>
          ))}
        </select>

        {/* Quick filter toggle */}
        <div className="audit-log__quick-filters" role="group" aria-label="Quick filters">
          {(["all", "logins", "failures"] as const).map((f) => (
            <button
              key={f}
              className={`audit-log__quick-btn ${quickFilter === f ? "audit-log__quick-btn--active" : ""}`}
              onClick={() => applyFilter(() => setQuickFilter(f))}
            >
              {f === "all" ? "All Events" : f === "logins" ? "Logins Only" : "Failures / Locks"}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Result count ---- */}
      <div className="audit-log__meta">
        <p className="audit-log__count">
          {filteredLogs.length.toLocaleString()} event{filteredLogs.length !== 1 ? "s" : ""}
          {searchTerm && ` matching "${searchTerm}"`}
        </p>
      </div>

      {/* ---- Audit table ---- */}
      <div className="audit-log__table-wrap">
        <table className="audit-log__table" aria-label="System audit log">
          <thead>
            <tr>
              <th style={{ width: "200px" }}>Timestamp</th>
              <th style={{ width: "180px" }}>Employee</th>
              <th style={{ width: "90px" }}>ID</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {pageLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="audit-log__empty-cell">
                  No audit entries match your search criteria.
                </td>
              </tr>
            ) : (
              pageLogs.map((log, i) => {
                const name = userNameMap[log.userID] ?? log.userID;
                const isFailure = log.action.toLowerCase().includes("failed");
                const isLock    = log.action.toLowerCase().includes("locked") && !log.action.includes("unlocked");
                const isUnlock  = log.action.toLowerCase().includes("unlocked");

                return (
                  <tr
                    key={log.logID}
                    className={[
                      "audit-log__row",
                      isLock    ? "audit-log__row--danger"  : "",
                      isFailure ? "audit-log__row--warning" : "",
                      isUnlock  ? "audit-log__row--success" : "",
                    ].filter(Boolean).join(" ")}
                    style={{ animationDelay: `${i * 15}ms` }}
                  >
                    {/* Timestamp */}
                    <td className="audit-log__timestamp">
                      <time dateTime={new Date(log.timeStamp).toISOString()}>
                        {formatDateTime(log.timeStamp)}
                      </time>
                    </td>

                    {/* Employee name */}
                    <td className="audit-log__emp">{name}</td>

                    {/* Employee ID */}
                    <td>
                      <code className="audit-log__id">{log.userID}</code>
                    </td>

                    {/* Action */}
                    <td className="audit-log__action" title={log.action}>
                      {/* Severity icon for notable events */}
                      {(isLock || isFailure || isUnlock) && (
                        <span className={`audit-log__event-dot audit-log__event-dot--${isLock ? "danger" : isUnlock ? "success" : "warning"}`}
                          aria-hidden="true" />
                      )}
                      {log.action}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ---- Pagination ---- */}
      {totalPages > 1 && (
        <div className="audit-log__pagination">
          <button
            className="btn btn--secondary btn--sm"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
          >
            ← Previous
          </button>

          {/* Page number buttons — show up to 7 */}
          <div className="audit-log__page-numbers">
            {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
              /* Centre the window around the current page */
              const half   = 3;
              let start    = Math.max(1, safePage - half);
              const end    = Math.min(totalPages, start + 6);
              start        = Math.max(1, end - 6);
              const pageNum = start + i;
              if (pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  className={`audit-log__page-btn ${pageNum === safePage ? "audit-log__page-btn--active" : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            className="btn btn--secondary btn--sm"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
          >
            Next →
          </button>

          <span className="audit-log__page-info">
            Page {safePage} of {totalPages}
            &nbsp;·&nbsp;{filteredLogs.length} entries
          </span>
        </div>
      )}
    </div>
  );
}
