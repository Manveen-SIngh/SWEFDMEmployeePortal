/**
 * HRDashboard.tsx
 * ---------------
 * The landing page for HUMAN_RESOURCES role users after login.
 */

import React, { useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { getRegistry } from "../../services/Registry";
import RightCanvas from "../../components/common/RightCanvas";
import { QueryStatus } from "../../models/enums";
import type { LeaveRequest } from "../../models/interfaces";
import "./HRDashboard.css";

// ---------------------------------------------------------------------------
// Helper: time-of-day greeting (shared pattern with ConsultantDashboard)
// ---------------------------------------------------------------------------
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// ---------------------------------------------------------------------------
// Helper: format a Date to something like"3 Apr 2026" 
// ---------------------------------------------------------------------------
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Helper: relative time for the activity feed (e.g. "2 hours ago")
// ---------------------------------------------------------------------------
function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diffMs / 60_000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);

  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return formatDate(date);
}

// ---------------------------------------------------------------------------
// StatCard subcomponent
// ---------------------------------------------------------------------------
/**
 * One of the four top-row stat cards.
 * Shows an icon, a large numeric value, and a descriptive label.
 * Optionally rendered as a clickable link to a related page.
 *
 * @param icon       - SVG path content (rendered inside a coloured circle)
 * @param iconTheme  - Colour theme of the icon background
 * @param value      - The numeric or string value to display prominently
 * @param label      - Human-readable description of the value
 * @param linkLabel  - Optional text for the "View …" link at the bottom
 * @param onLinkClick- Optional callback for the link
 */
interface StatCardProps {
  icon: React.ReactNode;
  iconTheme: "primary" | "success" | "warning" | "danger" | "info";
  value: number | string;
  label: string;
  sublabel?: string;
  linkLabel?: string;
  onLinkClick?: () => void;
}

function StatCard({
  icon,
  iconTheme,
  value,
  label,
  sublabel,
  linkLabel,
  onLinkClick,
}: StatCardProps) {
  return (
    <div className="hr-stat-card">
      {/* Coloured icon bubble */}
      <div className={`hr-stat-card__icon hr-stat-card__icon--${iconTheme}`}>
        {icon}
      </div>

      {/* Numeric value — large, bold */}
      <div className="hr-stat-card__value">{value}</div>

      {/* Descriptive label */}
      <div className="hr-stat-card__label">{label}</div>

      {/* Optional sub-label (e.g. "out of 5 total") */}
      {sublabel && (
        <div className="hr-stat-card__sublabel">{sublabel}</div>
      )}

      {/* Optional navigation link */}
      {linkLabel && onLinkClick && (
        <button className="dash-card__link" onClick={onLinkClick}>
          {linkLabel} →
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// HRDashboard component
// ---------------------------------------------------------------------------
export default function HRDashboard() {
  const { currentUser } = useAuth();
  const { refreshNotifications } = useNotifications();
  const navigate = useNavigate();

  // -------------------------------------------------------------------------
  // Rejection canvas state
  // -------------------------------------------------------------------------
  /**
   * When the HR user clicks "Reject" on a pending leave request,
   * the right-side canvas opens, pre-filled with that request's details.
   */
  const [rejectCanvasOpen, setRejectCanvasOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------------------
  // Re-render trigger
  // -------------------------------------------------------------------------
  /**
   * A simple counter that, when incremented, forces useMemo to re-derive
   * all dashboard data from the Registry singleton.
   * This is how the stat cards and lists update immediately after an
   * approve/reject action without a full page reload.
   */
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // -------------------------------------------------------------------------
  // Fetch all dashboard data from Registry
  // -------------------------------------------------------------------------
  /**
   * All data is derived in a single useMemo block, keyed on refreshKey.
   * When refreshKey changes (post-action), all values are recalculated
   * from the Registry's current in-memory state.
   */
  const {
    stats,
    pendingLeaveRequests,
    openQueries,
    recentLogs,
  } = useMemo(() => {
    const registry = getRegistry();
    return {
      stats:               registry.getHRDashboardStats(),
      pendingLeaveRequests: registry.getPendingLeaveRequests(),
      openQueries:         registry.getOpenQueries(),
      recentLogs:          registry.getRecentAuditLogs(8),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (!currentUser) return null;

  // -------------------------------------------------------------------------
  // Approve a leave request
  // -------------------------------------------------------------------------
  /**
   * Calls Registry.approveLeaveRequest() which:
   *   1. Sets the request status to APPROVED
   *   2. Deducts days from the employee's leave balance
   *   3. Pushes a success notification to the requesting employee (Observer pattern)
   *   4. Logs the action in the audit trail
   *
   * After approval, the dashboard data is refreshed and the notification
   * context is updated so the bell reflects any new notifications.
   *
   * @param leaveRequestID - The ID of the leave request to approve
   */
  const handleApprove = useCallback(
    (leaveRequestID: string) => {
      const registry = getRegistry();
      const success = registry.approveLeaveRequest(
        leaveRequestID,
        currentUser.employeeID
      );
      if (success) {
        triggerRefresh();
        refreshNotifications(); // Bell updates for the approved employee
      }
    },
    [currentUser.employeeID, triggerRefresh, refreshNotifications]
  );

  // -------------------------------------------------------------------------
  // Open the rejection canvas for a specific request
  // -------------------------------------------------------------------------
  /**
   * Sets the target leave request and opens the RightCanvas.
   * Resets any previous rejection reason and error state.
   *
   * @param leaveRequest - The leave request to reject
   */
  const handleOpenRejectCanvas = useCallback((leaveRequest: LeaveRequest) => {
    setRejectTarget(leaveRequest);
    setRejectionReason("");
    setRejectionError("");
    setRejectCanvasOpen(true);
  }, []);

  // -------------------------------------------------------------------------
  // Submit the rejection
  // -------------------------------------------------------------------------
  /**
   * Called when HR confirms the rejection via the canvas "Confirm Rejection" button.
   *
   * Validates that a rejection reason has been provided.
   * Calls Registry.rejectLeaveRequest() which:
   *   1. Sets the request status to REJECTED
   *   2. Stores the rejection reason on the LeaveRequest object
   *   3. Pushes a danger notification to the requesting employee (Observer)
   *   4. Logs the rejection in the audit trail with a note that reason was recorded
   */
  const handleConfirmRejection = useCallback(async () => {
    // Enforce mandatory rejection reason 
    if (!rejectionReason.trim()) {
      setRejectionError(
        "A rejection reason is required. Please explain why this request cannot be approved."
      );
      return;
    }

    if (!rejectTarget) return;

    setIsSubmitting(true);

    try {
      /* Small delay to show the submitting state — realistic async feel */
      await new Promise((resolve) => setTimeout(resolve, 300));

      const registry = getRegistry();
      const success = registry.rejectLeaveRequest(
        rejectTarget.leaveRequestID,
        rejectionReason.trim(),
        currentUser.employeeID
      );

      if (success) {
        setRejectCanvasOpen(false);
        setRejectTarget(null);
        setRejectionReason("");
        triggerRefresh();
        refreshNotifications(); // Bell updates for the affected employee
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    rejectionReason,
    rejectTarget,
    currentUser.employeeID,
    triggerRefresh,
    refreshNotifications,
  ]);

  // -------------------------------------------------------------------------
  // Lookup helper: get employee display name from their ID
  // -------------------------------------------------------------------------
  /**
   * Resolves an employeeID to a "FirstName LastName" string.
   * Falls back to the raw employeeID if the user is not found.
   *
   * @param userID - The employeeID to look up
   * @returns Human-readable name string
   */
  const getEmployeeName = useCallback(
    (userID: string): string => {
      const registry = getRegistry();
      const user = registry.getUserByID(userID);
      return user ? `${user.firstName} ${user.lastName}` : userID;
    },
    []
  );

  // -------------------------------------------------------------------------
  // Actual rendering
  // -------------------------------------------------------------------------
  return (
    <div className="hr-dash">

      {/* ---- Welcome header ---- */}
      <div className="hr-dash__welcome">
        <div>
          <h2 className="hr-dash__greeting">
            {getGreeting()}, {currentUser.firstName} 👋
          </h2>
          <p className="hr-dash__sub">
            Here's the current status across your consultant team.
          </p>
        </div>
        <div className="hr-dash__meta">
          <span className="badge badge--neutral">{currentUser.employeeID}</span>
          <span className="badge badge--info">HR Staff</span>
        </div>
      </div>

      {/* ---- Row 1: 4 stat cards ---- */}
      <div className="hr-dash__stats-row">

        {/* Total Consultants */}
        <StatCard
          iconTheme="primary"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
          value={stats.totalConsultants}
          label="Total Consultants"
          linkLabel="View directory"
          onLinkClick={() => navigate("/hr/employees")}
        />

        {/* On Leave Today */}
        <StatCard
          iconTheme="warning"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          }
          value={stats.onLeaveToday}
          label="On Leave Today"
          sublabel={`of ${stats.totalConsultants} consultants`}
        />

        {/* Pending Leave Requests */}
        <StatCard
          iconTheme="danger"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          value={stats.pendingLeaveRequests}
          label="Pending Leave Requests"
          sublabel="awaiting review"
          linkLabel="Review requests"
          onLinkClick={() => navigate("/hr/leave-management")}
        />

        {/* Open Queries */}
        <StatCard
          iconTheme="info"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          }
          value={stats.openQueries}
          label="Open Queries"
          sublabel="pending response"
          linkLabel="View queries"
          onLinkClick={() => navigate("/queries")}
        />
      </div>

      {/* ---- Row 2: Pending Leave + Open Queries (side by side) ---- */}
      <div className="hr-dash__split-row">

        {/* Pending leave request queue */}
        <div className="dash-card hr-dash__leave-card">
          <div className="dash-card__header">
            <div className="dash-card__icon dash-card__icon--danger">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <span className="dash-card__label">Pending Leave Requests</span>
            {pendingLeaveRequests.length > 0 && (
              <span className="badge badge--warning">
                {pendingLeaveRequests.length}
              </span>
            )}
          </div>

          {pendingLeaveRequests.length === 0 ? (
            /* Empty state — no pending requests */
            <div className="hr-dash__empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>All caught up — no pending requests.</p>
            </div>
          ) : (
            /* Leave request list */
            <div className="hr-leave-queue">
              {pendingLeaveRequests.map((lr) => {
                /* Resolve the employee's name for each leave request */
                const employeeName = getEmployeeName(lr.userID);

                return (
                  <div key={lr.leaveRequestID} className="hr-leave-queue__item">
                    {/* Employee info */}
                    <div className="hr-leave-queue__employee">
                      {/* Avatar initials */}
                      <div className="hr-leave-queue__avatar">
                        {employeeName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="hr-leave-queue__info">
                        <span className="hr-leave-queue__name">
                          {employeeName}
                        </span>
                        <span className="hr-leave-queue__dates">
                          {formatDate(lr.startDate)} – {formatDate(lr.endDate)}
                          {" · "}
                          {lr.numberOfDays} day{lr.numberOfDays !== 1 ? "s" : ""}
                          {" · "}
                          <span className="hr-leave-queue__type">
                            {lr.type}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="hr-leave-queue__actions">
                      {/* Approve — green, immediate action */}
                      <button
                        className="btn btn--success btn--sm"
                        onClick={() => handleApprove(lr.leaveRequestID)}
                        title={`Approve leave for ${employeeName}`}
                      >
                        ✓
                      </button>
                      {/* Reject — opens canvas for mandatory reason */}
                      <button
                        className="btn btn--danger btn--sm"
                        onClick={() => handleOpenRejectCanvas(lr)}
                        title={`Reject leave for ${employeeName} (reason required)`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            className="dash-card__link"
            onClick={() => navigate("/hr/leave-management")}
          >
            Full leave management →
          </button>
        </div>

        {/* Open queries list */}
        <div className="dash-card hr-dash__queries-card">
          <div className="dash-card__header">
            <div className="dash-card__icon dash-card__icon--info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
            </div>
            <span className="dash-card__label">Open Queries</span>
            {openQueries.length > 0 && (
              <span className="badge badge--info">{openQueries.length}</span>
            )}
          </div>

          {openQueries.length === 0 ? (
            <div className="hr-dash__empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No open queries at this time.</p>
            </div>
          ) : (
            <div className="hr-query-list">
              {openQueries.map((query) => {
                const employeeName = getEmployeeName(query.userID);

                /* Status badge class — PENDING = warning, IN_PROGRESS = info */
                const statusCls =
                  query.status === QueryStatus.PENDING
                    ? "badge--warning"
                    : "badge--info";
                const statusLabel =
                  query.status === QueryStatus.PENDING
                    ? "Pending"
                    : "In Progress";

                return (
                  <div key={query.queryID} className="hr-query-list__item">
                    <div className="hr-query-list__top">
                      <span className="hr-query-list__title">
                        {query.title}
                      </span>
                      <span className={`badge ${statusCls}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="hr-query-list__meta">
                      <span className="hr-query-list__from">
                        {employeeName}
                      </span>
                      <span className="hr-query-list__sep">·</span>
                      <span className="badge badge--neutral" style={{ fontSize: "10px" }}>
                        {query.category}
                      </span>
                      <span className="hr-query-list__sep">·</span>
                      <span className="hr-query-list__date">
                        {formatDate(query.postDate)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            className="dash-card__link"
            onClick={() => navigate("/queries")}
          >
            All queries →
          </button>
        </div>
      </div>

      {/* ---- Row 3: Recent Activity Feed ---- */}
      <div className="dash-card hr-dash__activity-card">
        <div className="dash-card__header">
          <div className="dash-card__icon dash-card__icon--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
            </svg>
          </div>
          <span className="dash-card__label">Recent Activity</span>
          <span className="dash-card__header-aside">Last 8 portal events</span>
        </div>

        {recentLogs.length === 0 ? (
          <p className="dash-card__empty">No recent activity to display.</p>
        ) : (
          <div className="hr-activity-feed">
            {recentLogs.map((log, index) => {
              const employeeName = getEmployeeName(log.userID);

              return (
                <div
                  key={log.logID}
                  className="hr-activity-feed__item"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  {/* Timeline connector line + dot */}
                  <div className="hr-activity-feed__connector">
                    <div className="hr-activity-feed__dot" />
                    {index < recentLogs.length - 1 && (
                      <div className="hr-activity-feed__line" />
                    )}
                  </div>

                  {/* Event content */}
                  <div className="hr-activity-feed__content">
                    <p className="hr-activity-feed__action">{log.action}</p>
                    <div className="hr-activity-feed__meta">
                      <span className="hr-activity-feed__user">
                        {employeeName}
                      </span>
                      <span className="hr-activity-feed__sep">·</span>
                      <time className="hr-activity-feed__time">
                        {formatRelativeTime(log.timeStamp)}
                      </time>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ===================================================================
          REJECTION CANVAS
          Slides in from the right when HR clicks the ✕ button on a pending
          leave request.
          =================================================================== */}
      <RightCanvas
        isOpen={rejectCanvasOpen}
        onClose={() => {
          setRejectCanvasOpen(false);
          setRejectTarget(null);
          setRejectionReason("");
          setRejectionError("");
        }}
        title="Reject Leave Request"
        footer={
          <>
            <button
              className="btn btn--secondary"
              onClick={() => {
                setRejectCanvasOpen(false);
                setRejectTarget(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="btn btn--danger"
              onClick={handleConfirmRejection}
              disabled={isSubmitting || !rejectionReason.trim()}
            >
              {isSubmitting ? "Rejecting…" : "Confirm Rejection"}
            </button>
          </>
        }
      >
        {rejectTarget && (
          <div className="reject-canvas">
            {/* Summary of the request being rejected */}
            <div className="reject-canvas__summary">
              <h3 className="reject-canvas__summary-title">Request Summary</h3>
              <dl className="reject-canvas__summary-grid">
                <dt>Employee</dt>
                <dd>{getEmployeeName(rejectTarget.userID)}</dd>

                <dt>Leave Type</dt>
                <dd>{rejectTarget.type}</dd>

                <dt>From</dt>
                <dd>{formatDate(rejectTarget.startDate)}</dd>

                <dt>To</dt>
                <dd>{formatDate(rejectTarget.endDate)}</dd>

                <dt>Days</dt>
                <dd>{rejectTarget.numberOfDays}</dd>

                <dt>Submitted</dt>
                <dd>{formatDate(rejectTarget.submissionDate)}</dd>
              </dl>
            </div>

            {/* Rejection reason field — mandatory per */}
            <div className="form-group">
              <label
                htmlFor="rejection-reason"
                className="form-label form-label--required"
              >
                Rejection Reason
              </label>
              <p className="reject-canvas__reason-hint">
                This reason will be visible to the employee in their leave
                history. Please be clear and professional. A reason is required
                before the rejection can be confirmed.
              </p>
              <textarea
                id="rejection-reason"
                className={`form-textarea ${
                  rejectionError ? "form-textarea--error" : ""
                }`}
                rows={5}
                placeholder="e.g. Unfortunately this request cannot be approved due to an overlapping project deadline. Please discuss alternative dates with your line manager."
                value={rejectionReason}
                onChange={(e) => {
                  setRejectionReason(e.target.value);
                  /* Clear the error as soon as the user starts typing */
                  if (rejectionError && e.target.value.trim()) {
                    setRejectionError("");
                  }
                }}
                disabled={isSubmitting}
              />
              {rejectionError && (
                <span className="form-error-message" role="alert">
                  {rejectionError}
                </span>
              )}
            </div>

            {/* Character count guidance */}
            <p className="reject-canvas__char-count">
              {rejectionReason.length} character
              {rejectionReason.length !== 1 ? "s" : ""} entered
              {rejectionReason.length < 20 && rejectionReason.length > 0
                ? " — please provide more detail"
                : ""}
            </p>
          </div>
        )}
      </RightCanvas>
    </div>
  );
}
