/**
 * AnnouncementFlow.tsx
 * --------------------
 * The post-login announcement sequence.
 *
 * The LoginPage checks for unacknowledged announcements after a successful
 * login. If any exist, it navigates to /announcements/flow instead of
 * /dashboard. This page renders the announcement sequence over the AppLayout so
 * the user sees the navbar and header behind the modal overlay.
 *
 
 * ROUTE:
 *   /announcements/flow
 *   Protected — must be logged in. Does not use AppLayout wrapper (it renders
 *   its own full-screen overlay), but it is nested inside ProtectedRoute.
 */

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";
import type { Announcement } from "../../models/interfaces";
import "./AnnouncementFlow.css";

// ---------------------------------------------------------------------------
// Helper: format a Date to something like "10 March 2026"
// ---------------------------------------------------------------------------
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// AnnouncementFlow component
// ---------------------------------------------------------------------------
export default function AnnouncementFlow() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // -------------------------------------------------------------------------
  // Fetch unacknowledged announcements for the current user
  // -------------------------------------------------------------------------
  /**
   * useMemo with no dependencies — we only need the list once on mount.
   * If the user acknowledges or skips during the flow, we don't re-fetch;
   * we advance the index into the original array instead.
   * This prevents the list from shrinking under the user's feet mid-flow.
   */
  const unacknowledged = useMemo<Announcement[]>(() => {
    if (!currentUser) return [];
    return getRegistry().getUnacknowledgedAnnouncements(currentUser.employeeID);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------
  // Current position in the flow
  // -------------------------------------------------------------------------
  /** Index of the announcement currently being displayed */
  const [currentIndex, setCurrentIndex] = useState(0);

  // -------------------------------------------------------------------------
  // Edge case: no unacknowledged announcements — go straight to dashboard
  // -------------------------------------------------------------------------
  if (!currentUser || unacknowledged.length === 0) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const totalCount    = unacknowledged.length;
  const current       = unacknowledged[currentIndex];
  const isLast        = currentIndex === totalCount - 1;

  // -------------------------------------------------------------------------
  // Advance to the next announcement or navigate to dashboard
  // -------------------------------------------------------------------------
  /**
   * Called after either Acknowledge or Skip action.
   * If there are more announcements, increments the index.
   * If this was the last one, navigates to the dashboard.
   */
  const advanceOrFinish = () => {
    if (isLast) {
      navigate("/dashboard", { replace: true });
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  // -------------------------------------------------------------------------
  // Handle Acknowledge
  // -------------------------------------------------------------------------
  /**
   * Records the acknowledgement in the Registry so this announcement
   * will NOT appear in the flow on the next login.
   * Then advances to the next announcement or the dashboard.
   */
  const handleAcknowledge = () => {
    getRegistry().acknowledgeAnnouncement(
      currentUser.employeeID,
      current.announcementID
    );
    advanceOrFinish();
  };

  // -------------------------------------------------------------------------
  // Handle Skip
  // -------------------------------------------------------------------------
  /**
   * Does NOT record an acknowledgement — the announcement will appear again
   * on the user's next login. Just advances to the next in the sequence.
   */
  const handleSkip = () => {
    advanceOrFinish();
  };

  // -------------------------------------------------------------------------
  // Resolve the poster's name from their employeeID
  // -------------------------------------------------------------------------
  const poster = getRegistry().getUserByID(current.postedByUserID);
  const posterName = poster
    ? `${poster.firstName} ${poster.lastName}`
    : "FDM Communications";

  // -------------------------------------------------------------------------
  // Actual Rendering
  // -------------------------------------------------------------------------
  return (
    <div className="ann-flow">
      {/* Dark full-screen overlay */}
      <div className="ann-flow__overlay" aria-hidden="true" />

      {/* Centred modal card */}
      <div
        className="ann-flow__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ann-flow-title"
      >
        {/* ---- Header: "New Announcement" label + progress indicator ---- */}
        <div className="ann-flow__card-header">
          <span className="ann-flow__new-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" />
            </svg>
            Company Announcement
          </span>

          {/* Progress indicator — only shown when there are multiple announcements */}
          {totalCount > 1 && (
            <div
              className="ann-flow__progress"
              aria-label={`Announcement ${currentIndex + 1} of ${totalCount}`}
            >
              {Array.from({ length: totalCount }).map((_, i) => (
                <span
                  key={i}
                  className={`ann-flow__progress-dot ${
                    i === currentIndex
                      ? "ann-flow__progress-dot--active"
                      : i < currentIndex
                      ? "ann-flow__progress-dot--done"
                      : ""
                  }`}
                  aria-hidden="true"
                />
              ))}
              <span className="ann-flow__progress-label">
                {currentIndex + 1} of {totalCount}
              </span>
            </div>
          )}
        </div>

        {/* ---- Title ---- */}
        <h2 id="ann-flow-title" className="ann-flow__title">
          {current.title}
        </h2>

        {/* ---- Body text — preserves line breaks from mock data ---- */}
        <div className="ann-flow__body">
          <p className="ann-flow__body-text">{current.body}</p>
        </div>

        {/* ---- Meta: posted by, dates ---- */}
        <div className="ann-flow__meta">
          <div className="ann-flow__meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            <span>Posted by {posterName}</span>
          </div>
          <div className="ann-flow__meta-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
            </svg>
            <span>{formatDate(current.postDate)}</span>
          </div>
          {current.expiryDate && (
            <div className="ann-flow__meta-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Expires {formatDate(current.expiryDate)}</span>
            </div>
          )}
        </div>

        {/* ---- Action buttons ---- */}
        <div className="ann-flow__actions">
          {/* Skip — does not acknowledge, shows next login */}
          <button
            className="btn btn--secondary ann-flow__skip-btn"
            onClick={handleSkip}
          >
            Remind me later
          </button>

          {/* Acknowledge — records acknowledgement, won't show next login */}
          <button
            className="btn btn--primary ann-flow__ack-btn"
            onClick={handleAcknowledge}
          >
            {isLast ? "Acknowledged — Go to Portal" : "Acknowledged — Next"}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>

        {/* ---- Skip note ---- */}
        <p className="ann-flow__skip-note">
          Choosing "Remind me later" will show this announcement again on your next login.
        </p>
      </div>
    </div>
  );
}
