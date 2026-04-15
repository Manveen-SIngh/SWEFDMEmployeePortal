// schedule planner page for consultants, shows a monthly calendar of assigned work days
// the user's shift times are displayed in a summary bar at the top
// today's date is highlighted, and each work day is marked on the calendar

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRegistry } from '../../services/Registry';
// @ts-ignore
import './SchedulePlanner.css';

// day and month labels used for rendering the calendar header and navigation
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// returns the ISO day index (0=Mon … 6=Sun) so the calendar grid aligns correctly
const isoDay = (date: any) => (date.getDay() + 6) % 7;

// checks whether two Date objects refer to the same calendar day
const isSameDay = (a: any, b: any) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// returns the number of days in a given month
const daysInMonth = (year: any, month: any) => new Date(year, month + 1, 0).getDate();

export default function SchedulePlanner() {
  const { currentUser } = useAuth();
  const today = new Date();

  // the month the calendar is currently showing
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  if (!currentUser) return null;

  const registry = getRegistry();

  // find the schedule record that belongs to this user
  const schedule = registry.getScheduleForUser(currentUser.employeeID);

  // build a Set of "YYYY-MM-DD" strings from the schedule's workDays for O(1) lookup
  const workDaySet = new Set(
    (schedule?.workDays ?? []).map((d: any) => {
      const date = new Date(d);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    })
  );

  const isWorkDay = (date: any) =>
    workDaySet.has(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);

  // how many work days are scheduled in the currently viewed month
  const workDaysThisMonth = (schedule?.workDays ?? []).filter((d: any) => {
    const date = new Date(d);
    return date.getFullYear() === viewYear && date.getMonth() === viewMonth;
  }).length;

  // navigate to the previous month
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };

  // navigate to the next month
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  // build the array of day cells to render
  // leading nulls pad the grid so day 1 lands on the correct column
  const totalDays  = daysInMonth(viewYear, viewMonth);
  const firstDay   = new Date(viewYear, viewMonth, 1);
  const leadingPad = isoDay(firstDay); // 0–6 blank cells before day 1
  const cells      = [
    ...Array(leadingPad).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => new Date(viewYear, viewMonth, i + 1)),
  ];

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  return (
    <div className="schedule-page">

      {/* page header */}
      <div className="schedule-page__header">
        <h2 className="schedule-page__title">Schedule Planner</h2>
        <p className="schedule-page__sub">
          View your assigned shifts and working days for the month.
        </p>
      </div>

      {/* shift summary bar */}
      {schedule ? (
        <div className="schedule-summary">
          <div className="schedule-summary__item">
            <span className="schedule-summary__label">Shift hours</span>
            <span className="schedule-summary__value">
              {schedule.shiftStart} – {schedule.shiftEnd}
            </span>
          </div>
          <div className="schedule-summary__item">
            <span className="schedule-summary__label">Days this month</span>
            <span className="schedule-summary__value">{workDaysThisMonth} working days</span>
          </div>
          <div className="schedule-summary__item">
            <span className="schedule-summary__label">Hours this month</span>
            <span className="schedule-summary__value">
              {/* derive total hours from shift duration × days */}
              {(() => {
                const [sh, sm] = schedule.shiftStart.split(':').map(Number);
                const [eh, em] = schedule.shiftEnd.split(':').map(Number);
                const hoursPerDay = (eh * 60 + em - sh * 60 - sm) / 60;
                return `${(hoursPerDay * workDaysThisMonth).toFixed(1)} hrs`;
              })()}
            </span>
          </div>
        </div>
      ) : (
        <div className="schedule-empty">
          <p>No schedule assigned for your account. Please contact HR if you think this is an error.</p>
        </div>
      )}

      {/* calendar */}
      <div className="schedule-calendar">

        {/* month navigation */}
        <div className="schedule-calendar__nav">
          <button
            className="schedule-calendar__nav-btn"
            onClick={prevMonth}
            aria-label="Previous month"
          >
            Previous
          </button>
          <span className="schedule-calendar__month-label">
            {MONTH_NAMES[viewMonth]} {viewYear}
            {isCurrentMonth && (
              <span className="schedule-calendar__current-tag">This month</span>
            )}
          </span>
          <button
            className="schedule-calendar__nav-btn"
            onClick={nextMonth}
            aria-label="Next month"
          >
            Next
          </button>
        </div>

        {/* day-of-week header row */}
        <div className="schedule-calendar__grid">
          {DAY_LABELS.map((label) => (
            <div key={label} className="schedule-calendar__day-label">
              {label}
            </div>
          ))}

          {/* day cells */}
          {cells.map((date, i) => {
            if (!date) {
              // empty padding cell
              return <div key={`pad-${i}`} className="schedule-calendar__cell schedule-calendar__cell--empty" />;
            }

            const work    = isWorkDay(date);
            const isToday = isSameDay(date, today);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            return (
              <div
                key={date.toISOString()}
                className={[
                  'schedule-calendar__cell',
                  work      ? 'schedule-calendar__cell--work'    : '',
                  isToday   ? 'schedule-calendar__cell--today'   : '',
                  isWeekend ? 'schedule-calendar__cell--weekend' : '',
                ].join(' ').trim()}
                aria-label={`${date.getDate()} ${MONTH_NAMES[viewMonth]}${work ? ' — scheduled work day' : ''}`}
              >
                <span className="schedule-calendar__date-num">{date.getDate()}</span>
                {work && (
                  <span className="schedule-calendar__shift-tag">
                    {schedule.shiftStart}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* legend */}
        <div className="schedule-legend">
          <span className="schedule-legend__item">
            <span className="schedule-legend__dot schedule-legend__dot--work" />
            Scheduled shift
          </span>
          <span className="schedule-legend__item">
            <span className="schedule-legend__dot schedule-legend__dot--today" />
            Today
          </span>
          <span className="schedule-legend__item">
            <span className="schedule-legend__dot schedule-legend__dot--off" />
            Day off
          </span>
        </div>
      </div>
    </div>
  );
}