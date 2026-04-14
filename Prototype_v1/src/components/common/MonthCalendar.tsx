/**
 * MonthCalendar.tsx
 * -----------------
 * A fully self-contained month-view calendar component. *
 *
 *   
 * Day cells receive a `dayState` prop array that determines their appearance:
 *    "approved"  -> green background  (approved leave or scheduled work)
 *    "pending"   -> amber background  (pending leave request)
 *    "rejected"  -> red strikethrough (rejected leave — faint, not bold)
 *    "working"   -> subtle highlight  (planner: scheduled work day)
 *    "today"     -> dark border ring  (the current real-world date)
 *    "other"     -> greyed out        (days from the prev/next month)
 *
 * PROPS:
 *   @param year          - Currently displayed year (controlled by parent)
 *   @param month         - Currently displayed month, 0-indexed (controlled by parent)
 *   @param onPrevMonth   - Callback for left arrow click
 *   @param onNextMonth   - Callback for right arrow click
 *   @param onQuickJump   - Callback when a month is chosen from the dropdown
 *   @param getDayStates  - Function: (date: Date) => DayState[]
 *                          Called for each rendered day cell.
 *                          Returns an array of states (a day can be both "today" and "approved")
 *   @param onDayClick    - Optional callback invoked when a day cell is clicked
 *                          Receives the Date of the clicked day
 *   @param renderDayTooltip - Optional function returning tooltip content for a day
 *
 * This is a controlled component so:
 *   The parent page manages which month is displayed. This keeps the navigation
 *   logic in one place (the page), avoids duplicate state, and lets the Planner
 *   and Absence pages each control their own independently without interference.
 */

import React, { useState } from "react";
import "./MonthCalendar.css";

// ---------------------------------------------------------------------------
// DayState type
// ---------------------------------------------------------------------------
/**
 * The visual states a calendar day cell can be in.
 * A single day can have multiple states simultaneously
 * (e.g. ["today", "pending"] renders today's date with amber bg and a dark ring).
 * States are listed in priority order — "approved" overrides "working", etc.
 */
export type DayState =
  | "approved"   // Green — approved leave / confirmed scheduled day
  | "pending"    // Amber — pending leave request
  | "rejected"   // Red faint — rejected leave (in history, not dominant)
  | "cancelled"  // Grey strikethrough — cancelled leave
  | "working"    // Subtle blue-grey — planner: scheduled work day
  | "today"      // Dark ring — the actual current date
  | "other";     // Greyed out — day from previous or next month shown in grid

// ---------------------------------------------------------------------------
// Short day names and month names
// ---------------------------------------------------------------------------
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// ---------------------------------------------------------------------------
// Helper: generate the grid of Date objects for a given month
// ---------------------------------------------------------------------------
/**
 * Returns an array of 35 or 42 Date objects that fill the calendar grid
 * for the given month. The grid always starts on a Sunday (the first Sunday
 * on or before the 1st of the month) and ends on a Saturday.
 *
 * Dates from the previous and next month are included to fill partial rows —
 * these are marked as "other" state by the parent.
 *
 * @param year  - The full year (e.g. 2026)
 * @param month - 0-indexed month (0 = January, 11 = December)
 * @returns     - Array of Date objects filling the calendar grid
 */
function buildCalendarGrid(year: number, month: number): Date[] {
  // First day of the target month
  const firstOfMonth = new Date(year, month, 1);

  // Find the Sunday that starts this calendar grid 
  const startDay = new Date(firstOfMonth);
  startDay.setDate(1 - firstOfMonth.getDay()); // Go back to the nearest Sunday

  // Last day of the target month 
  const lastOfMonth = new Date(year, month + 1, 0);

  // Find the Saturday that ends this calendar grid 
  const endDay = new Date(lastOfMonth);
  endDay.setDate(lastOfMonth.getDate() + (6 - lastOfMonth.getDay()));

  // Build the array by stepping through each day 
  const grid: Date[] = [];
  const current = new Date(startDay);

  while (current <= endDay) {
    grid.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return grid;
}

// ---------------------------------------------------------------------------
// MonthCalendar props interface
// ---------------------------------------------------------------------------
interface MonthCalendarProps {
  // Currently displayed year — 4-digit number 
  year: number;
  // Currently displayed month — 0-indexed (0 = January) 
  month: number;
  // Called when the left arrow is clicked — parent decrements month 
  onPrevMonth: () => void;
  // Called when the right arrow is clicked — parent increments month
  onNextMonth: () => void;
  // Called when user selects a month from the quick-jump dropdown
  onQuickJump: (year: number, month: number) => void;
  /**
   * Returns the visual state(s) for a given calendar day.
   * Called for every cell in the rendered grid.
   * Days from prev/next months will have the "other" state at minimum.
   *
   * @param date        - The date to get states for
   * @param isOtherMonth - True when the date is outside the displayed month
   */
  getDayStates: (date: Date, isOtherMonth: boolean) => DayState[];
  /** Optional click handler for day cells */
  onDayClick?: (date: Date) => void;
}

// ---------------------------------------------------------------------------
// MonthCalendar component
// ---------------------------------------------------------------------------
export default function MonthCalendar({
  year,
  month,
  onPrevMonth,
  onNextMonth,
  onQuickJump,
  getDayStates,
  onDayClick,
}: MonthCalendarProps) {
  // Whether the quick-jump month dropdown is open 
  const [quickJumpOpen, setQuickJumpOpen] = useState(false);

  // Today's date — used to identify the current real-world day 
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build the grid for the current month/year
  const calendarGrid = buildCalendarGrid(year, month);

  // -------------------------------------------------------------------------
  // Quick-jump dropdown options
  // -------------------------------------------------------------------------
  /**
   * Generates a list of the next 12 months (starting from today's month)
   * for the quick-jump dropdown.
   */
  const quickJumpOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` };
  });

  // -------------------------------------------------------------------------
  // Actual rendering
  // -------------------------------------------------------------------------
  return (
    <div className="month-cal">

      {/* Calendar header: prev arrow, month+year, quick-jump, next arrow */}
      <div className="month-cal__header">
        {/* Previous month */}
        <button
          className="month-cal__nav-btn"
          onClick={onPrevMonth}
          aria-label="Previous month"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Month + Year heading + quick-jump trigger */}
        <div className="month-cal__title-wrap">
          <h3 className="month-cal__title">
            {MONTH_NAMES[month]} {year}
          </h3>

          {/* Three-dot quick-jump button */}
          <div className="month-cal__quickjump-wrap">
            <button
              className="month-cal__quickjump-btn"
              onClick={() => setQuickJumpOpen((v) => !v)}
              aria-label="Quick jump to a month"
              aria-expanded={quickJumpOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="5"  cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="19" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </button>

            {/* Quick-jump dropdown */}
            {quickJumpOpen && (
              <>
                <div className="month-cal__quickjump-menu" role="menu">
                  {quickJumpOptions.map((opt) => {
                    const isActive = opt.year === year && opt.month === month;
                    return (
                      <button
                        key={opt.label}
                        className={`month-cal__quickjump-item ${isActive ? "month-cal__quickjump-item--active" : ""}`}
                        onClick={() => {
                          onQuickJump(opt.year, opt.month);
                          setQuickJumpOpen(false);
                        }}
                        role="menuitem"
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {/* Click-outside overlay */}
                <div
                  className="month-cal__quickjump-overlay"
                  onClick={() => setQuickJumpOpen(false)}
                  aria-hidden="true"
                />
              </>
            )}
          </div>
        </div>

        {/* Next month */}
        <button
          className="month-cal__nav-btn"
          onClick={onNextMonth}
          aria-label="Next month"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* ---- Day-of-week headers: Sun Mon Tue ... Sat ---- */}
      <div className="month-cal__day-headers" role="row">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="month-cal__day-header"
            role="columnheader"
            aria-label={name}
          >
            {name}
          </div>
        ))}
      </div>

      {/* ---- Day cells grid ---- */}
      <div className="month-cal__grid" role="grid">
        {calendarGrid.map((date, index) => {
          const isOtherMonth = date.getMonth() !== month;

          // Get the states for this day from the parent page 
          const states = getDayStates(date, isOtherMonth);

          // Build the CSS class string from the states array
          const stateClasses = states
            .map((s) => `month-cal__day--${s}`)
            .join(" ");

          // Check if the cell is clickable
          const isClickable = !!onDayClick && !isOtherMonth;

          return (
            <div
              key={index}
              className={`month-cal__day ${stateClasses} ${isClickable ? "month-cal__day--clickable" : ""}`}
              role="gridcell"
              aria-label={date.toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              aria-current={
                states.includes("today") ? "date" : undefined
              }
              onClick={isClickable ? () => onDayClick!(date) : undefined}
              tabIndex={isClickable ? 0 : -1}
              onKeyDown={
                isClickable
                  ? (e) => e.key === "Enter" && onDayClick!(date)
                  : undefined
              }
            >
              <span className="month-cal__day-num">{date.getDate()}</span>

              {/* State dots — up to 2 dots showing leave/work indicators */}
              <div className="month-cal__day-dots" aria-hidden="true">
                {states.includes("approved") && !isOtherMonth && (
                  <span className="month-cal__dot month-cal__dot--approved" />
                )}
                {states.includes("pending") && !isOtherMonth && (
                  <span className="month-cal__dot month-cal__dot--pending" />
                )}
                {states.includes("working") && !isOtherMonth && (
                  <span className="month-cal__dot month-cal__dot--working" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- Legend ---- */}
      <div className="month-cal__legend" aria-label="Calendar legend">
        <div className="month-cal__legend-item">
          <span className="month-cal__legend-swatch month-cal__legend-swatch--approved" />
          <span>Approved leave</span>
        </div>
        <div className="month-cal__legend-item">
          <span className="month-cal__legend-swatch month-cal__legend-swatch--pending" />
          <span>Pending</span>
        </div>
        <div className="month-cal__legend-item">
          <span className="month-cal__legend-swatch month-cal__legend-swatch--working" />
          <span>Working day</span>
        </div>
        <div className="month-cal__legend-item">
          <span className="month-cal__legend-swatch month-cal__legend-swatch--today" />
          <span>Today</span>
        </div>
      </div>
    </div>
  );
}
