/**
 * LeaveManagement.tsx
 * -------------------
 * The HR Leave Management page. A full-featured leave request queue
 * giving HR complete visibility and control over all leave requests.
 */

import React, { useState, useMemo, useCallback } from "react";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { getRegistry } from "../../services/Registry";
import RightCanvas from "../../components/common/RightCanvas";
import { LeaveStatus, LeaveType } from "../../models/enums";
import type { LeaveRequest } from "../../models/interfaces";
import "./LeaveManagement.css";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

function statusBadge(status: LeaveStatus): { cls: string; label: string } {
  switch (status) {
    case LeaveStatus.APPROVED:    return { cls: "badge--success", label: "Approved" };
    case LeaveStatus.PENDING:     return { cls: "badge--warning", label: "Pending" };
    case LeaveStatus.REJECTED:    return { cls: "badge--danger",  label: "Rejected" };
    case LeaveStatus.CANCELLED:   return { cls: "badge--neutral", label: "Cancelled" };
    case LeaveStatus.IN_PROGRESS: return { cls: "badge--info",    label: "In Progress" };
    default:                      return { cls: "badge--neutral", label: status };
  }
}

function typeBadge(type: LeaveType): string {
  switch (type) {
    case LeaveType.ANNUAL: return "badge--info";
    case LeaveType.SICK:   return "badge--danger";
    default:               return "badge--neutral";
  }
}

// ---------------------------------------------------------------------------
// LeaveManagement component
// ---------------------------------------------------------------------------
export default function LeaveManagement() {
  const { currentUser } = useAuth();
  const { refreshNotifications } = useNotifications();

  
  // Tab state
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  
  // Reject canvas state
  const [rejectTarget,   setRejectTarget]   = useState<LeaveRequest | null>(null);
  const [rejectReason,   setRejectReason]   = useState("");
  const [rejectError,    setRejectError]    = useState("");
  const [isRejecting,    setIsRejecting]    = useState(false);

  
  // Re-render trigger
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  if (!currentUser) return null;

  const registry = getRegistry();

  // -------------------------------------------------------------------------
  // Fetch requests based on active tab
  // -------------------------------------------------------------------------
  const requests = useMemo(() => {
    if (activeTab === "pending") {
      /* Oldest-first so the most urgent is at the top */
      return registry
        .getPendingLeaveRequests()
        .sort(
          (a, b) =>
            new Date(a.submissionDate).getTime() -
            new Date(b.submissionDate).getTime()
        );
    }
    /* All requests — newest first */
    return registry.getAllLeaveRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, refreshKey]);

  // -------------------------------------------------------------------------
  // Summary stats for the pill row
  // -------------------------------------------------------------------------
  const allReqs   = useMemo(() => registry.getAllLeaveRequests(), [refreshKey]); // eslint-disable-line
  const pending   = allReqs.filter((r) => r.status === LeaveStatus.PENDING).length;
  const approved  = allReqs.filter((r) => r.status === LeaveStatus.APPROVED).length;
  const rejected  = allReqs.filter((r) => r.status === LeaveStatus.REJECTED).length;

  // -------------------------------------------------------------------------
  // Approve a request
  // -------------------------------------------------------------------------
  const handleApprove = useCallback(
    (leaveRequestID: string) => {
      registry.approveLeaveRequest(leaveRequestID, currentUser.employeeID);
      triggerRefresh();
      refreshNotifications();
    },
    [currentUser.employeeID, registry, triggerRefresh, refreshNotifications]
  );

  
  // Open rejection canvas
  const handleOpenReject = useCallback((lr: LeaveRequest) => {
    setRejectTarget(lr);
    setRejectReason("");
    setRejectError("");
  }, []);

  // -------------------------------------------------------------------------
  // Confirm rejection 
  // -------------------------------------------------------------------------
  const handleConfirmReject = useCallback(async () => {
    if (!rejectReason.trim()) {
      setRejectError("A rejection reason is required.");
      return;
    }
    if (!rejectTarget) return;

    setIsRejecting(true);
    try {
      await new Promise((res) => setTimeout(res, 300));
      const ok = registry.rejectLeaveRequest(
        rejectTarget.leaveRequestID,
        rejectReason.trim(),
        currentUser.employeeID
      );
      if (ok) {
        setRejectTarget(null);
        triggerRefresh();
        refreshNotifications();
      } else {
        setRejectError("Rejection failed. Please try again.");
      }
    } finally {
      setIsRejecting(false);
    }
  }, [
    rejectReason, rejectTarget,
    currentUser.employeeID, registry, triggerRefresh, refreshNotifications,
  ]);

  // -------------------------------------------------------------------------
  // Actual Rendering
  // -------------------------------------------------------------------------
  return (
    <div className="leave-mgmt">

      {/* ---- Summary pills ---- */}
      <div className="leave-mgmt__summary">
        <div className={`leave-mgmt__pill leave-mgmt__pill--warning ${activeTab === "pending" ? "leave-mgmt__pill--active" : ""}`}
          onClick={() => setActiveTab("pending")} role="button" tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && setActiveTab("pending")}
        >
          <span className="leave-mgmt__pill-value">{pending}</span>
          <span className="leave-mgmt__pill-label">Pending</span>
        </div>
        <div className="leave-mgmt__pill leave-mgmt__pill--success">
          <span className="leave-mgmt__pill-value">{approved}</span>
          <span className="leave-mgmt__pill-label">Approved</span>
        </div>
        <div className="leave-mgmt__pill leave-mgmt__pill--danger">
          <span className="leave-mgmt__pill-value">{rejected}</span>
          <span className="leave-mgmt__pill-label">Rejected</span>
        </div>
        <div className="leave-mgmt__pill leave-mgmt__pill--neutral">
          <span className="leave-mgmt__pill-value">{allReqs.length}</span>
          <span className="leave-mgmt__pill-label">Total</span>
        </div>
      </div>

      {/* ---- Tabs ---- */}
      <div className="leave-mgmt__tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === "pending"}
          className={`leave-mgmt__tab ${activeTab === "pending" ? "leave-mgmt__tab--active" : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Review
          {pending > 0 && (
            <span className="badge badge--warning leave-mgmt__tab-badge">{pending}</span>
          )}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === "all"}
          className={`leave-mgmt__tab ${activeTab === "all" ? "leave-mgmt__tab--active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All Requests
        </button>
      </div>

      {/* ---- Leave requests table ---- */}
      <div className="leave-mgmt__table-wrap">
        <table className="leave-mgmt__table" aria-label="Leave requests">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Dates</th>
              <th>Days</th>
              <th>Type</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="leave-mgmt__empty-cell">
                  {activeTab === "pending"
                    ? "No pending requests — all caught up."
                    : "No leave requests found."}
                </td>
              </tr>
            ) : (
              requests.map((lr, i) => {
                const emp = registry.getUserByID(lr.userID);
                const name = emp
                  ? `${emp.firstName} ${emp.lastName}`
                  : lr.userID;
                const { cls, label } = statusBadge(lr.status);

                return (
                  <tr
                    key={lr.leaveRequestID}
                    className="leave-mgmt__row"
                    style={{ animationDelay: `${i * 25}ms` }}
                  >
                    <td className="leave-mgmt__employee-cell">
                      <div className="leave-mgmt__avatar">
                        {emp ? `${emp.firstName[0]}${emp.lastName[0]}` : "?"}
                      </div>
                      <div>
                        <div className="leave-mgmt__emp-name">{name}</div>
                        <code className="leave-mgmt__emp-id">{lr.userID}</code>
                      </div>
                    </td>
                    <td className="leave-mgmt__dates">
                      {formatDate(lr.startDate)}
                      {lr.startDate.toDateString() !== lr.endDate.toDateString() &&
                        <> – {formatDate(lr.endDate)}</>}
                    </td>
                    <td className="leave-mgmt__days">
                      <strong>{lr.numberOfDays}</strong>
                    </td>
                    <td>
                      <span className={`badge ${typeBadge(lr.type)}`}>{lr.type}</span>
                    </td>
                    <td>
                      <span className={`badge ${cls}`}>{label}</span>
                      {lr.status === LeaveStatus.REJECTED && lr.rejectionReason && (
                        <span
                          className="leave-mgmt__reason-hint"
                          title={lr.rejectionReason}
                        >
                          ℹ
                        </span>
                      )}
                    </td>
                    <td className="leave-mgmt__submitted">
                      {formatDate(lr.submissionDate)}
                    </td>
                    <td>
                      {lr.status === LeaveStatus.PENDING && (
                        <div className="leave-mgmt__actions">
                          <button
                            className="btn btn--success btn--sm"
                            onClick={() => handleApprove(lr.leaveRequestID)}
                            title="Approve this leave request"
                          >
                            ✓ Approve
                          </button>
                          <button
                            className="btn btn--danger btn--sm"
                            onClick={() => handleOpenReject(lr)}
                            title="Reject this leave request (reason required)"
                          >
                            ✕ Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===================================================================
          REJECTION CANVAS 
          =================================================================== */}
      <RightCanvas
        isOpen={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectError(""); }}
        title="Reject Leave Request"
        footer={
          <>
            <button
              className="btn btn--secondary"
              onClick={() => setRejectTarget(null)}
              disabled={isRejecting}
            >
              Cancel
            </button>
            <button
              className="btn btn--danger"
              onClick={handleConfirmReject}
              disabled={isRejecting || !rejectReason.trim()}
            >
              {isRejecting ? "Rejecting…" : "Confirm Rejection"}
            </button>
          </>
        }
      >
        {rejectTarget && (() => {
          const emp = registry.getUserByID(rejectTarget.userID);
          const name = emp ? `${emp.firstName} ${emp.lastName}` : rejectTarget.userID;
          return (
            <div className="leave-mgmt-reject-canvas">
              {/* Request summary */}
              <div className="leave-mgmt-reject-canvas__summary">
                <h4 className="leave-mgmt-reject-canvas__summary-title">
                  Request Summary
                </h4>
                <dl className="leave-mgmt-reject-canvas__summary-grid">
                  <dt>Employee</dt><dd>{name}</dd>
                  <dt>Leave Type</dt><dd>{rejectTarget.type}</dd>
                  <dt>From</dt><dd>{formatDate(rejectTarget.startDate)}</dd>
                  <dt>To</dt><dd>{formatDate(rejectTarget.endDate)}</dd>
                  <dt>Days</dt><dd>{rejectTarget.numberOfDays}</dd>
                  <dt>Submitted</dt><dd>{formatDate(rejectTarget.submissionDate)}</dd>
                </dl>
              </div>

              {/* Rejection reason — mandatory */}
              <div className="form-group">
                <label htmlFor="reject-reason-lm" className="form-label form-label--required">
                  Rejection Reason
                </label>
                <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginBottom: "var(--space-2)", lineHeight: "var(--line-height-relaxed)" }}>
                  This reason will be displayed to the employee in their leave history.
                  A reason is mandatory before the rejection can be confirmed.
                </p>
                <textarea
                  id="reject-reason-lm"
                  className={`form-textarea ${rejectError ? "form-textarea--error" : ""}`}
                  rows={5}
                  placeholder="e.g. This request cannot be approved due to insufficient staffing during the requested period. Please propose alternative dates."
                  value={rejectReason}
                  onChange={(e) => { setRejectReason(e.target.value); setRejectError(""); }}
                  disabled={isRejecting}
                />
                {rejectError && (
                  <span className="form-error-message" role="alert">{rejectError}</span>
                )}
              </div>
              <p style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", textAlign: "right" }}>
                {rejectReason.length} characters
              </p>
            </div>
          );
        })()}
      </RightCanvas>
    </div>
  );
}
