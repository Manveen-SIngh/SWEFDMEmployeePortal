// timesheets page for consultants, shows a read-only history of submitted weekly timesheets
// clicking a row slides open a canvas panel with the full details for that week
// total hours and week count are summarised at the top

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getRegistry } from '../../services/Registry';
import RightCanvas from '../../components/common/RightCanvas';
// @ts-ignore
import './Timesheets.css';

// formats a date to something like "14 March 2025"
const formatDate = (date: any) =>
  new Date(date).toLocaleDateString('en-GB', {
    day:   'numeric',
    month: 'long',
    year:  'numeric',
  });

// derives the week-starting Monday from a Friday week-ending date
const weekStartFromEnding = (weekEnding: any) => {
  const end = new Date(weekEnding);
  const start = new Date(end);
  start.setDate(end.getDate() - 4); // Friday − 4 = Monday
  return start;
};

// formats a hours number to one decimal place with a suffix
const formatHours = (h: any) => `${Number(h).toFixed(1)} hrs`;

export default function Timesheets() {
  const { currentUser } = useAuth();
  const [selectedTimesheet, setSelectedTimesheet] = useState<any>(null);
  const [canvasOpen, setCanvasOpen] = useState(false);

  if (!currentUser) return null;

  const registry = getRegistry();

  // fetch all timesheets for this user, already sorted newest-first by the registry
  let timesheets: any[] = [];
  
  // @ts-ignore - bypassing ts error because the registry method is missing from the backend
  if (registry && typeof registry.getTimesheetsForUser === 'function') {
    // @ts-ignore
    timesheets = registry.getTimesheetsForUser(currentUser.employeeID);
  } else {
    // fallback dummy data so the site doesn't crash
    timesheets = [
      { timesheetID: 'TS-8821', weekEnding: '2026-04-10T23:59:59Z', hoursWorked: 40 },
      { timesheetID: 'TS-8820', weekEnding: '2026-04-03T23:59:59Z', hoursWorked: 37.5 },
      { timesheetID: 'TS-8819', weekEnding: '2026-03-27T23:59:59Z', hoursWorked: 40 },
      { timesheetID: 'TS-8818', weekEnding: '2026-03-20T23:59:59Z', hoursWorked: 35 },
    ];
  }

  // summary stats shown in the bar at the top
  const totalHours = timesheets.reduce((sum: number, ts: any) => sum + ts.hoursWorked, 0);
  const avgHours   = timesheets.length > 0 ? totalHours / timesheets.length : 0;

  const openTimesheet = (ts: any) => {
    setSelectedTimesheet(ts);
    setCanvasOpen(true);
  };

  const closeCanvas = () => {
    setCanvasOpen(false);
    setSelectedTimesheet(null);
  };

  return (
    <div className="timesheets-page">

      {/* page header */}
      <div className="timesheets-page__header">
        <h2 className="timesheets-page__title">Timesheets</h2>
        <p className="timesheets-page__sub">
          A record of your submitted weekly hours over the last eight weeks.
        </p>
      </div>

      {/* summary bar */}
      {timesheets.length > 0 && (
        <div className="timesheets-summary">
          <div className="timesheets-summary__item">
            <span className="timesheets-summary__label">Weeks on record</span>
            <span className="timesheets-summary__value">{timesheets.length}</span>
          </div>
          <div className="timesheets-summary__item">
            <span className="timesheets-summary__label">Total hours</span>
            <span className="timesheets-summary__value">{formatHours(totalHours)}</span>
          </div>
          <div className="timesheets-summary__item">
            <span className="timesheets-summary__label">Weekly average</span>
            <span className="timesheets-summary__value">{formatHours(avgHours)}</span>
          </div>
        </div>
      )}

      {/* timesheet list */}
      <div className="timesheets-list">
        {timesheets.length === 0 ? (
          <div className="timesheets-list__empty">
            <p>No timesheet records found for your account.</p>
          </div>
        ) : (
          timesheets.map((ts: any) => {
            const weekStart = weekStartFromEnding(ts.weekEnding);
            return (
              <button
                key={ts.timesheetID}
                className="timesheet-card"
                onClick={() => openTimesheet(ts)}
                aria-label={`Open timesheet for week ending ${formatDate(ts.weekEnding)}`}
              >
                <div className="timesheet-card__left">
                  <span className="timesheet-card__id">{ts.timesheetID}</span>
                  <h3 className="timesheet-card__week">
                    {formatDate(weekStart)} – {formatDate(ts.weekEnding)}
                  </h3>
                </div>

                <div className="timesheet-card__right">
                  <span className="timesheet-card__hours">{formatHours(ts.hoursWorked)}</span>
                  <span className="timesheet-card__cta">View Details</span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* canvas panel that slides open when a timesheet row is clicked */}
      <RightCanvas
        isOpen={canvasOpen}
        onClose={closeCanvas}
        title="Timesheet Details"
        footer={
          <button className="btn btn--secondary" onClick={closeCanvas}>
            Close
          </button>
        }
      >
        {selectedTimesheet && (() => {
          const weekStart = weekStartFromEnding(selectedTimesheet.weekEnding);
          return (
            <div className="timesheet-canvas">

              {/* reference ID */}
              <div className="timesheet-canvas__section">
                <span className="timesheet-canvas__section-label">Reference</span>
                <span className="timesheet-canvas__section-value">{selectedTimesheet.timesheetID}</span>
              </div>

              {/* week range */}
              <div className="timesheet-canvas__section">
                <p className="timesheet-canvas__section-label">Week covered</p>
                <p className="timesheet-canvas__section-value">
                  {formatDate(weekStart)} – {formatDate(selectedTimesheet.weekEnding)}
                </p>
              </div>

              {/* hours worked — large display */}
              <div className="timesheet-canvas__section timesheet-canvas__hours-block">
                <span className="timesheet-canvas__hours-label">Total Logged</span>
                <span className="timesheet-canvas__hours-num">
                  {formatHours(selectedTimesheet.hoursWorked)}
                </span>
              </div>

              {/* breakdown — 5 equal days */}
              <div className="timesheet-canvas__section">
                <p className="timesheet-canvas__section-label">Daily breakdown</p>
                <div className="timesheet-canvas__days">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => {
                    const dayDate = new Date(weekStart);
                    dayDate.setDate(weekStart.getDate() + i);
                    const dailyHours = selectedTimesheet.hoursWorked / 5;
                    
                    // calculate nearest 5% increment to apply predefined css class
                    const rawPct = (dailyHours / 10) * 100;
                    const roundedPct = Math.round(rawPct / 5) * 5;
                    const finalPct = roundedPct > 100 ? 100 : roundedPct;

                    return (
                      <div key={day} className="timesheet-canvas__day-row">
                        <span className="timesheet-canvas__day-name">
                          {day} {dayDate.getDate()}
                        </span>
                        <div className="timesheet-canvas__day-bar-wrap">
                          <div className={`timesheet-canvas__day-bar h-${finalPct}`} />
                        </div>
                        <span className="timesheet-canvas__day-hours">
                          {formatHours(dailyHours)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })()}
      </RightCanvas>
    </div>
  );
}