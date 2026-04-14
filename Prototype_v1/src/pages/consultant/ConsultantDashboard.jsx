// landing page shown to consultants after they log in

import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";
import { LeaveStatus, TrainingStatus } from "../../models/enums";
import "./ConsultantDashboard.css";

// returns a greeting based on the current hour of the day
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

// formats a Date object to a short string like "Mon 30 Mar"
const formatShortDate = (date) => {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

// formats a number as GBP currency (e.g. £1,234.56)
const formatGBP = (amount) => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
  }).format(amount);
};

// finds the next working day from today given an array of scheduled work days
const getNextWorkingDay = (workDays) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // filter to only days that are today or in the future, then sort ascending
  const upcoming = workDays
    .map((d) => new Date(d))
    .filter((d) => {
      d.setHours(0, 0, 0, 0);
      return d >= today;
    })
    .sort((a, b) => a.getTime() - b.getTime());

  return upcoming[0] ?? null;
};

// small badge showing whether a training module is done, in progress, or not started
const TrainingStatusBadge = ({ status }) => {
  const map = {
    [TrainingStatus.COMPLETED]:   { label: "Done",        cls: "badge--success" },
    [TrainingStatus.IN_PROGRESS]: { label: "In Progress", cls: "badge--warning" },
    [TrainingStatus.NOT_STARTED]: { label: "Not Started", cls: "badge--neutral" },
  };

  const { label, cls } = map[status];
  return <span className={`badge ${cls}`}>{label}</span>;
};

export default function ConsultantDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  if (!currentUser) return null;

  // pull all the data we need for this user from the registry in one go
  // useMemo so we're not re-running these array filters on every render
  const { schedule, leaveRequests, payslips, trainingRecords } = useMemo(() => {
    const reg = getRegistry();
    return {
      schedule:        reg.getScheduleForUser(currentUser.employeeID),
      leaveRequests:   reg.getLeaveRequestsForUser(currentUser.employeeID),
      payslips:        reg.getPayslipsForUser(currentUser.employeeID).slice(0, 4), // only show the 4 most recent
      trainingRecords: reg.getTrainingRecordsForUser(currentUser.employeeID),
    };
  }, [currentUser.employeeID]);

  // next scheduled work day from today based on the user's schedule
  const nextWorkday = schedule
    ? getNextWorkingDay(schedule.workDays)
    : null;

  // next approved leave request that starts today or in the future
  const nextHoliday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return leaveRequests
      .filter((lr) => {
        if (lr.status !== LeaveStatus.APPROVED) return false;
        const start = new Date(lr.startDate);
        start.setHours(0, 0, 0, 0);
        return start >= today;
      })
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0] ?? null;
  }, [leaveRequests]);

  // how many days until the next holiday starts (used to show "starts today", "tomorrow", etc.)
  const daysUntilHoliday = nextHoliday
    ? Math.ceil(
        (new Date(nextHoliday.startDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // the 5 working days (Mon–Fri) of the current week
  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...

    // shift so the week starts on Monday instead of Sunday
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));

    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  // a set of date strings for quick lookup of which days are scheduled work days
  const workDaySet = useMemo(() => {
    if (!schedule) return new Set();
    return new Set(
      schedule.workDays.map((d) => new Date(d).toDateString())
    );
  }, [schedule]);

  // checks whether any approved or pending leave covers a given date
  const isOnLeave = (date) => {
    return leaveRequests.some((lr) => {
      if (lr.status !== LeaveStatus.APPROVED && lr.status !== LeaveStatus.PENDING) return false;
      return date >= new Date(lr.startDate) && date <= new Date(lr.endDate);
    });
  };

  // same as above but only for approved leave (used for styling the planner differently)
  const isOnLeaveApproved = (date) =>
    leaveRequests.some((lr) => {
      if (lr.status !== LeaveStatus.APPROVED) return false;
      return date >= new Date(lr.startDate) && date <= new Date(lr.endDate);
    });

  // training summary numbers for the progress bar
  const completedTraining = trainingRecords.filter(
    (t) => t.trainingStatus === TrainingStatus.COMPLETED
  ).length;
  const totalTraining = trainingRecords.length;
  const trainingPercentage = totalTraining > 0
    ? Math.round((completedTraining / totalTraining) * 100)
    : 0;


  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="consultant-dash">

      {/* welcome header */}
      <div className="consultant-dash__welcome">
        <div>
          <h2 className="consultant-dash__greeting">
            {getGreeting()}, {currentUser.firstName} 👋
          </h2>
          <p className="consultant-dash__sub">
            Here's your portal overview for today.
          </p>
        </div>
        <div className="consultant-dash__meta">
          <span className="badge badge--neutral">
            {currentUser.employeeID}
          </span>
          <span className="badge badge--success">
            {currentUser.employmentStatus.replace("_", " ")}
          </span>
        </div>
      </div>

      {/* row 1: next working day + next holiday */}
      <div className="consultant-dash__row consultant-dash__row--2col">

        {/* card 1: next working day */}
        <div className="dash-card">
          <div className="dash-card__header">
            <div className="dash-card__icon dash-card__icon--info">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="dash-card__label">Next Working Day</span>
          </div>

          {nextWorkday ? (
            <>
              <p className="dash-card__value">
                {formatShortDate(nextWorkday)}
              </p>
              <p className="dash-card__sub">
                {schedule
                  ? `${schedule.shiftStart} – ${schedule.shiftEnd}`
                  : "Standard hours"}
              </p>
            </>
          ) : (
            <p className="dash-card__value dash-card__value--muted">
              No schedule
            </p>
          )}

          <button
            className="dash-card__link"
            onClick={() => navigate("/schedule/planner")}
          >
            View planner →
          </button>
        </div>

        {/* card 2: next holiday */}
        <div className="dash-card">
          <div className="dash-card__header">
            <div className="dash-card__icon dash-card__icon--success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <span className="dash-card__label">Next Holiday</span>
          </div>

          {nextHoliday ? (
            <>
              <p className="dash-card__value">
                {formatShortDate(new Date(nextHoliday.startDate))}
              </p>
              <p className="dash-card__sub">
                {nextHoliday.numberOfDays} day{nextHoliday.numberOfDays !== 1 ? "s" : ""} ·{" "}
                {daysUntilHoliday === 0
                  ? "starts today"
                  : daysUntilHoliday === 1
                  ? "starts tomorrow"
                  : `in ${daysUntilHoliday} days`}
              </p>
            </>
          ) : (
            <>
              <p className="dash-card__value dash-card__value--muted">
                None booked
              </p>
              <p className="dash-card__sub">
                {currentUser.leaveBalance} days remaining
              </p>
            </>
          )}

          <button
            className="dash-card__link"
            onClick={() => navigate("/absence")}
          >
            Book leave →
          </button>
        </div>
      </div>

      {/* row 2: weekly planner */}
      <div className="consultant-dash__row">
        <div className="dash-card dash-card--wide">
          <div className="dash-card__header">
            <div className="dash-card__icon dash-card__icon--primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
            </div>
            <span className="dash-card__label">This Week</span>
            <span className="dash-card__header-aside">
              {schedule ? `${schedule.shiftStart} – ${schedule.shiftEnd}` : ""}
            </span>
          </div>

          {/* mon–fri day strip */}
          <div className="weekly-planner">
            {currentWeekDays.map((day) => {
              const isToday        = day.toDateString() === new Date().toDateString();
              const isWorkDay      = workDaySet.has(day.toDateString());
              const leaveApproved  = isOnLeaveApproved(day);
              const leavePending   = !leaveApproved && isOnLeave(day);

              return (
                <div
                  key={day.toISOString()}
                  className={[
                    "weekly-planner__day",
                    isToday        ? "weekly-planner__day--today"   : "",
                    leaveApproved  ? "weekly-planner__day--leave"   : "",
                    leavePending   ? "weekly-planner__day--pending" : "",
                    !isWorkDay && !leaveApproved && !leavePending
                                   ? "weekly-planner__day--off"     : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <span className="weekly-planner__day-name">
                    {day.toLocaleDateString("en-GB", { weekday: "short" })}
                  </span>
                  <span className="weekly-planner__day-num">
                    {day.getDate()}
                  </span>
                  <span className="weekly-planner__day-status">
                    {leaveApproved
                      ? "Leave"
                      : leavePending
                      ? "Pending"
                      : isWorkDay
                      ? "Work"
                      : "—"}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            className="dash-card__link"
            onClick={() => navigate("/schedule/planner")}
          >
            Full planner →
          </button>
        </div>
      </div>

      {/* row 3: payslips + training */}
      <div className="consultant-dash__row consultant-dash__row--3col">

        {/* card 4: latest payslips */}
        <div className="dash-card dash-card--span2">
          <div className="dash-card__header">
            <div className="dash-card__icon dash-card__icon--warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <span className="dash-card__label">Latest Payslips</span>
          </div>

          <div className="payslip-list">
            {payslips.length === 0 ? (
              <p className="dash-card__empty">No payslips available.</p>
            ) : (
              payslips.map((p) => (
                <div key={p.payslipID} className="payslip-list__item">
                  <div className="payslip-list__period">
                    <span className="payslip-list__month">{p.payPeriod}</span>
                    <span className="payslip-list__tax-year">Tax year {p.taxYear}</span>
                  </div>
                  <div className="payslip-list__amounts">
                    <span className="payslip-list__gross">{formatGBP(p.grossPay)}</span>
                    <span className="payslip-list__net">Net {formatGBP(p.netPay)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            className="dash-card__link"
            onClick={() => navigate("/payments/payslips")}
          >
            All payslips →
          </button>
        </div>

        {/* card 5: training progress */}
        <div className="dash-card">
          <div className="dash-card__header">
            <div className="dash-card__icon dash-card__icon--primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
              </svg>
            </div>
            <span className="dash-card__label">Training</span>
          </div>

          {/* overall progress bar */}
          <div className="training-summary">
            <div className="training-summary__counts">
              <span className="training-summary__done">{completedTraining}</span>
              <span className="training-summary__total">/{totalTraining} modules</span>
            </div>
            <div
              className="training-summary__bar-track"
              role="progressbar"
              aria-valuenow={trainingPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${trainingPercentage}% training complete`}
            >
              <div
                className="training-summary__bar-fill"
                style={{ width: `${trainingPercentage}%` }}
              />
            </div>
            <span className="training-summary__pct">{trainingPercentage}% complete</span>
          </div>

          {/* individual module list with status badges */}
          <div className="training-modules">
            {trainingRecords.map((t) => (
              <div key={t.trainingID} className="training-modules__item">
                <span className="training-modules__name">{t.moduleName}</span>
                <TrainingStatusBadge status={t.trainingStatus} />
              </div>
            ))}
          </div>
              
          <button
            className="dash-card__link"
            onClick={() => navigate("/learning")}
          >
            Learning & Dev →
          </button>
        </div>
      </div>
    </div>
  );
}
