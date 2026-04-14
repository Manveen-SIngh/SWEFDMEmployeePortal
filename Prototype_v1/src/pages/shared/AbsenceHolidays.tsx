/**
 * AbsenceHolidays.tsx
 * -------------------
 * The Absence & Holidays page — the primary leave self-service page
 * for all authenticated users.
 *
 */

import React, { useState, useMemo, useCallback } from "react";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { getRegistry } from "../../services/Registry";
import MonthCalendar, { type DayState } from "../../components/common/MonthCalendar";
import RightCanvas from "../../components/common/RightCanvas";
import { LeaveStatus, LeaveType } from "../../models/enums";
import type { LeaveRequest } from "../../models/interfaces";
import "./AbsenceHolidays.css";

// ---------------------------------------------------------------------------
// Helper: count working days (Mon–Fri) between two dates inclusive
// ---------------------------------------------------------------------------
/**
 * Calculates the number of working days (Mon–Fri) in the range [start, end].
 * Weekends are excluded. 
 *
 * This is the same calculation the Registry uses to populate numberOfDays
 * so the canvas preview matches what gets stored on submission.
 *
 * @param start - Start date (inclusive)
 * @param end   - End date (inclusive)
 * @returns     - Number of working days in the range, or 0 if end < start
 */
function countWorkingDays(start: Date, end: Date): number {
  if (end < start) return 0;
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endNorm = new Date(end);
  endNorm.setHours(0, 0, 0, 0);

  while (current <= endNorm) {
    const dow = current.getDay(); // 0=Sun, 6=Sat
    if (dow !== 0 && dow !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// ---------------------------------------------------------------------------
// Helper: format a date to "DD Mon YYYY"
// ---------------------------------------------------------------------------
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Helper: status badge class + label from LeaveStatus
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helper: convert a Date to the HTML date input format "YYYY-MM-DD"
// ---------------------------------------------------------------------------
function toInputDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Helper: minimum allowed start date for a leave request
// Consultants cannot book leave in the past.
// ---------------------------------------------------------------------------
function todayInputDate(): string {
  return toInputDate(new Date());
}

// ---------------------------------------------------------------------------
// AbsenceHolidays component
// ---------------------------------------------------------------------------
export default function AbsenceHolidays() {
  const { currentUser } = useAuth();
  const { refreshNotifications } = useNotifications();

  
  // Calendar navigation state
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  
  // Booking canvas state
  const [canvasOpen,    setCanvasOpen]    = useState(false);
  const [startDate,     setStartDate]     = useState("");
  const [endDate,       setEndDate]       = useState("");
  const [leaveType,     setLeaveType]     = useState<LeaveType>(LeaveType.ANNUAL);
  const [submitError,   setSubmitError]   = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isSubmitting,  setIsSubmitting]  = useState(false);

  
  // Re-render trigger (same pattern as HR/IT dashboards)
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // -------------------------------------------------------------------------
  // Fetch leave requests from Registry
  // -------------------------------------------------------------------------
  const leaveRequests = useMemo(() => {
    if (!currentUser) return [];
    return getRegistry().getLeaveRequestsForUser(currentUser.employeeID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, refreshKey]);

  if (!currentUser) return null;

  // -------------------------------------------------------------------------
  // Derived entitlement stats
  // -------------------------------------------------------------------------
  /** Total annual leave allowance — FDM standard 25 days */
  const totalAllowance = 25;

  /** Days already taken (from APPROVED requests) */
  const daysTaken = leaveRequests
    .filter((lr) => lr.status === LeaveStatus.APPROVED)
    .reduce((sum, lr) => sum + lr.numberOfDays, 0);

  /** Days pending HR review */
  const daysPending = leaveRequests
    .filter((lr) => lr.status === LeaveStatus.PENDING)
    .reduce((sum, lr) => sum + lr.numberOfDays, 0);

  /** Current live balance from the user object */
  const balance = currentUser.leaveBalance;

  /** Progress bar width — proportion of allowance already taken */
  const takenPct = Math.min(100, Math.round((daysTaken / totalAllowance) * 100));

  // -------------------------------------------------------------------------
  // Calendar: getDayStates
  // -------------------------------------------------------------------------
  /**
   * Returns the array of visual states for each calendar day cell.
   * Called by MonthCalendar for every cell in the grid.
   *
   * Rules (in priority order):
   *   1. Always include "other" for out-of-month cells
   *   2. Always include "today" for the actual current date
   *   3. Check each leave request — if the date falls within a request's range,
   *      add the corresponding state (approved / pending / rejected / cancelled)
   */
  const getDayStates = useCallback(
    (date: Date, isOtherMonth: boolean): DayState[] => {
      const states: DayState[] = [];

      if (isOtherMonth) {
        states.push("other");
        return states; // Don't bother checking leave for out-of-month days
      }

      /* Check if this is today */
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() === today.getTime()) states.push("today");

      /* Check each leave request */
      for (const lr of leaveRequests) {
        const start = new Date(lr.startDate);
        const end   = new Date(lr.endDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 0);

        if (d >= start && d <= end) {
          switch (lr.status) {
            case LeaveStatus.APPROVED:    states.push("approved"); break;
            case LeaveStatus.PENDING:     states.push("pending");  break;
            case LeaveStatus.REJECTED:    states.push("rejected"); break;
            case LeaveStatus.CANCELLED:   states.push("cancelled"); break;
            default:                      break;
          }
          break; // A day can only belong to one leave request at a time
        }
      }

      return states;
    },
    [leaveRequests]
  );

  // -------------------------------------------------------------------------
  // Calendar month navigation handlers
  // -------------------------------------------------------------------------
  const handlePrevMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 0) { setCalYear((y) => y - 1); return 11; }
      return m - 1;
    });
  }, []);

  const handleNextMonth = useCallback(() => {
    setCalMonth((m) => {
      if (m === 11) { setCalYear((y) => y + 1); return 0; }
      return m + 1;
    });
  }, []);

  const handleQuickJump = useCallback((year: number, month: number) => {
    setCalYear(year);
    setCalMonth(month);
  }, []);

  // -------------------------------------------------------------------------
  // Calendar day click -> pre-fill start date and open canvas
  // -------------------------------------------------------------------------
  const handleDayClick = useCallback((date: Date) => {
    /* Only allow clicking future or current dates for booking */
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return;

    setStartDate(toInputDate(date));
    setEndDate(toInputDate(date));
    setLeaveType(LeaveType.ANNUAL);
    setSubmitError("");
    setSubmitSuccess(false);
    setCanvasOpen(true);
  }, []);

  // -------------------------------------------------------------------------
  // Open canvas from the "Book Leave" card
  // -------------------------------------------------------------------------
  const handleOpenCanvas = useCallback(() => {
    setStartDate(todayInputDate());
    setEndDate(todayInputDate());
    setLeaveType(LeaveType.ANNUAL);
    setSubmitError("");
    setSubmitSuccess(false);
    setCanvasOpen(true);
  }, []);

  // -------------------------------------------------------------------------
  // Close canvas and reset form
  // -------------------------------------------------------------------------
  const handleCloseCanvas = useCallback(() => {
    setCanvasOpen(false);
    setSubmitError("");
    setSubmitSuccess(false);
  }, []);

  // -------------------------------------------------------------------------
  // Live day count calculation
  // -------------------------------------------------------------------------
  /**
   * Recalculates the number of working days whenever startDate or endDate changes.
   * Displayed in the canvas so the employee can see the impact before submitting.
   */
  const requestedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return countWorkingDays(new Date(startDate), new Date(endDate));
  }, [startDate, endDate]);

  // -------------------------------------------------------------------------
  // Submit the leave request
  // -------------------------------------------------------------------------
  /**
   * Validates the form and calls Registry.submitLeaveRequest().
   * The Registry performs server-side validation (balance, conflicts).
   * Both client-side and Registry-level errors are surfaced to the user.
   *
   * On success:
   *   1. The canvas shows a success message briefly
   *   2. After 1.5s the canvas closes and the calendar refreshes
   *   3. The HR notification bell updates (Observer pattern)
   */
  const handleSubmit = useCallback(async () => {
    /* Client-side validation first */
    if (!startDate) { setSubmitError("Please select a start date."); return; }
    if (!endDate)   { setSubmitError("Please select an end date."); return; }
    if (new Date(endDate) < new Date(startDate)) {
      setSubmitError("End date cannot be before start date.");
      return;
    }
    if (requestedDays === 0) {
      setSubmitError("Your selected range contains no working days (Mon–Fri). Please choose different dates.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const result = getRegistry().submitLeaveRequest({
        userID:       currentUser.employeeID,
        startDate:    new Date(startDate),
        endDate:      new Date(endDate),
        numberOfDays: requestedDays,
        type:         leaveType,
      });

      if (result.success) {
        setSubmitSuccess(true);
        triggerRefresh();
        refreshNotifications();
        /* Auto-close after brief success display */
        setTimeout(() => handleCloseCanvas(), 1500);
      } else {
        setSubmitError(result.error ?? "Your request could not be submitted. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    startDate, endDate, requestedDays, leaveType,
    currentUser.employeeID, triggerRefresh, refreshNotifications, handleCloseCanvas,
  ]);

  // -------------------------------------------------------------------------
  // Actual Rendering
  // -------------------------------------------------------------------------
  return (
    <div className="absence-page">

      {/* ===================================================================
          LEFT COLUMN
          =================================================================== */}
      <div className="absence-page__left">

        {/* ---- 1. Entitlement Card ---- */}
        <div className="absence-entitlement">
          <h2 className="absence-entitlement__title">Leave Entitlement</h2>

          {/* Progress bar — red fill shows proportion taken */}
          <div className="absence-entitlement__bar-wrap">
            <div
              className="absence-entitlement__bar-track"
              role="progressbar"
              aria-valuenow={takenPct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${daysTaken} of ${totalAllowance} days taken`}
            >
              <div
                className="absence-entitlement__bar-fill"
                style={{ width: `${takenPct}%` }}
              />
            </div>
            <span className="absence-entitlement__bar-label">
              {daysTaken} of {totalAllowance} days taken
            </span>
          </div>

          {/* 4 stat pills */}
          <div className="absence-entitlement__pills">
            <div className="absence-pill">
              <span className="absence-pill__value">{totalAllowance}</span>
              <span className="absence-pill__label">Allowance</span>
            </div>
            <div className="absence-pill absence-pill--highlight">
              <span className="absence-pill__value">{balance}</span>
              <span className="absence-pill__label">Remaining</span>
            </div>
            <div className="absence-pill">
              <span className="absence-pill__value">{daysPending}</span>
              <span className="absence-pill__label">Requested</span>
            </div>
            <div className="absence-pill">
              <span className="absence-pill__value">{daysTaken}</span>
              <span className="absence-pill__label">Approved</span>
            </div>
          </div>
        </div>

        {/* ---- 2. Month Calendar ---- */}
        <MonthCalendar
          year={calYear}
          month={calMonth}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onQuickJump={handleQuickJump}
          getDayStates={getDayStates}
          onDayClick={handleDayClick}
        />

        {/* ---- 3. Leave History ---- */}
        <div className="absence-history">
          <h3 className="absence-history__title">Leave History</h3>

          {leaveRequests.length === 0 ? (
            <div className="absence-history__empty">
              <p>No leave requests found. Book your first leave using the panel on the right.</p>
            </div>
          ) : (
            <div className="absence-history__list">
              {leaveRequests.map((lr) => {
                const { cls, label } = statusBadge(lr.status);
                return (
                  <div key={lr.leaveRequestID} className="absence-history__item">
                    <div className="absence-history__item-left">
                      {/* Date range */}
                      <div className="absence-history__dates">
                        {formatDate(lr.startDate)}
                        {lr.startDate.toDateString() !== lr.endDate.toDateString() && (
                          <> – {formatDate(lr.endDate)}</>
                        )}
                      </div>
                      {/* Days count + type */}
                      <div className="absence-history__meta">
                        <span>{lr.numberOfDays} day{lr.numberOfDays !== 1 ? "s" : ""}</span>
                        <span className="absence-history__sep">·</span>
                        <span>{lr.type}</span>
                        <span className="absence-history__sep">·</span>
                        <span className="absence-history__id">{lr.leaveRequestID}</span>
                      </div>
                      {/* Rejection reason — shown inline when rejected */}
                      {lr.status === LeaveStatus.REJECTED && lr.rejectionReason && (
                        <div className="absence-history__rejection-reason">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                          </svg>
                          <span>Reason: {lr.rejectionReason}</span>
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <span className={`badge ${cls}`}>{label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================================
          RIGHT COLUMN — Book Leave shortcut card
          =================================================================== */}
      <div className="absence-page__right">
        <div className="absence-book-card">
          <div className="absence-book-card__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
            </svg>
          </div>
          <h3 className="absence-book-card__title">Book Leave</h3>
          <p className="absence-book-card__body">
            You have <strong>{balance} day{balance !== 1 ? "s" : ""}</strong> remaining.
            Click below to submit a leave request, or click any future date on the calendar.
          </p>
          <button
            className="btn btn--primary absence-book-card__btn"
            onClick={handleOpenCanvas}
          >
            Request leave
          </button>
        </div>

        {/* Quick balance summary card */}
        <div className="absence-balance-summary">
          <div className="absence-balance-summary__item">
            <span className="absence-balance-summary__num">{balance}</span>
            <span className="absence-balance-summary__label">Days left</span>
          </div>
          <div className="absence-balance-summary__divider" />
          <div className="absence-balance-summary__item">
            <span className="absence-balance-summary__num">{daysTaken}</span>
            <span className="absence-balance-summary__label">Days taken</span>
          </div>
          <div className="absence-balance-summary__divider" />
          <div className="absence-balance-summary__item">
            <span className="absence-balance-summary__num">{daysPending}</span>
            <span className="absence-balance-summary__label">Pending</span>
          </div>
        </div>
      </div>

      {/* ===================================================================
          BOOKING CANVAS
          Slides in from right. Validates and calls Registry.submitLeaveRequest().
          =================================================================== */}
      <RightCanvas
        isOpen={canvasOpen}
        onClose={handleCloseCanvas}
        title="Request Leave"
        footer={
          !submitSuccess
            ? (
              <>
                <button
                  className="btn btn--secondary"
                  onClick={handleCloseCanvas}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  className="btn btn--primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || requestedDays === 0}
                >
                  {isSubmitting ? "Submitting…" : "Submit Request"}
                </button>
              </>
            )
            : undefined
        }
      >
        {submitSuccess ? (
          /* Success state — brief confirmation before auto-close */
          <div className="absence-canvas__success">
            <div className="absence-canvas__success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Request Submitted</h3>
            <p>
              Your leave request for {requestedDays} day{requestedDays !== 1 ? "s" : ""} has
              been submitted. HR has been notified and will review it shortly.
            </p>
          </div>
        ) : (
          <div className="absence-canvas__form">

            {/* Remaining balance badge — prominent at top of canvas */}
            <div className="absence-canvas__balance-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>
                <strong>{balance}</strong> day{balance !== 1 ? "s" : ""} remaining
              </span>
            </div>

            {/* Error alert */}
            {submitError && (
              <div className="absence-canvas__error" role="alert">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span>{submitError}</span>
              </div>
            )}

            {/* Start date */}
            <div className="form-group">
              <label htmlFor="leave-start" className="form-label form-label--required">
                Start Date
              </label>
              <input
                id="leave-start"
                type="date"
                className="form-input"
                value={startDate}
                min={todayInputDate()}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSubmitError("");
                  /* Auto-adjust end date if it's before the new start */
                  if (endDate && e.target.value > endDate) {
                    setEndDate(e.target.value);
                  }
                }}
              />
            </div>

            {/* End date */}
            <div className="form-group">
              <label htmlFor="leave-end" className="form-label form-label--required">
                End Date
              </label>
              <input
                id="leave-end"
                type="date"
                className="form-input"
                value={endDate}
                min={startDate || todayInputDate()}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSubmitError("");
                }}
              />
            </div>

            {/* Leave type dropdown */}
            <div className="form-group">
              <label htmlFor="leave-type" className="form-label form-label--required">
                Leave Type
              </label>
              <select
                id="leave-type"
                className="form-select"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveType)}
              >
                <option value={LeaveType.ANNUAL}>Annual Leave</option>
                <option value={LeaveType.SICK}>Sick Leave</option>
                <option value={LeaveType.OTHER}>Other</option>
              </select>
            </div>

            {/* Live day count summary */}
            {startDate && endDate && (
              <div className={`absence-canvas__day-count ${requestedDays === 0 ? "absence-canvas__day-count--warn" : ""}`}>
                <span className="absence-canvas__day-count-num">{requestedDays}</span>
                <span className="absence-canvas__day-count-label">
                  working day{requestedDays !== 1 ? "s" : ""} requested
                  {requestedDays === 0
                    ? " — no weekdays in this range"
                    : requestedDays > balance
                    ? " — exceeds your remaining balance"
                    : ""}
                </span>
              </div>
            )}

            {/* Balance warning */}
            {requestedDays > balance && requestedDays > 0 && (
              <p className="absence-canvas__balance-warn">
                ⚠ You only have {balance} day{balance !== 1 ? "s" : ""} remaining.
                This request will be rejected automatically.
              </p>
            )}
          </div>
        )}
      </RightCanvas>
    </div>
  );
}
