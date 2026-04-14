import React from "react";
// @ts-ignore
import "./Performance.css";

export default function Performance() {
  return (
    <div className="performance-page">
      <div className="performance-header">
        <h2>Performance Reviews</h2>
        <p>Track your feedback and request evaluations.</p>
      </div>

      <div className="performance-card">
        <div className="performance-card-header">
          <h3>Latest Review</h3>
          <span className="badge badge--success">Completed</span>
        </div>
        <div className="performance-details">
          <div className="detail-row">
            <span className="detail-row__label">Reviewer</span>
            <span className="detail-row__value">Sarah Jenkins (Line Manager)</span>
          </div>
          <div className="detail-row">
            <span className="detail-row__label">Date</span>
            <span className="detail-row__value">12 Feb 2026</span>
          </div>
          <div className="detail-row">
            <span className="detail-row__label">Rating</span>
            <span className="detail-row__value">★★★★☆ (Exceeds Expectations)</span>
          </div>
        </div>
        <div className="performance-feedback">
          <h4>Feedback Comments</h4>
          <p>"Excellent work on the recent client deployment. Communication skills have significantly improved over the last quarter."</p>
        </div>
        <div className="performance-actions">
          <button className="btn btn--primary">Request New Review</button>
        </div>
      </div>
    </div>
  );
}