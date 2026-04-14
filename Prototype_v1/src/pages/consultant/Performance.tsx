import React from "react";
// @ts-ignore
import "./Performance.css";
import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";

export default function Performance() {
    const { currentUser } = useAuth(); /* Get current user from auth context */
    const registry = getRegistry(); /* Get the registry instance */
    const userID = currentUser ? currentUser.employeeID : "";
    const latestReview = registry.getPerformanceReviewsForUser(userID); /* Fetch the latest performance review for the specific user */
    const latest = latestReview?.[0]; /* Get the most recent review */

    const[submitted, setSubmitted] = React.useState(false); /* State to track if new review request submitted */
    const handleRequestReview = () => { /* Handle request review */
        setSubmitted(true); /* True to show success message */
        setTimeout(() => setSubmitted(false), 3000); /* Hide success message after 3 seconds */
    };

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
            <span className="detail-row__value">{latest.rating ? `${latest.rating}/5` : "Not rated"}</span>
          </div>
        </div>
        <div className="performance-feedback">
          <h4>Feedback Comments</h4>
          <p>{latest.writtenEvaluation || "No feedback available."}</p>
        </div>
        <div className="performance-actions">
          <button className="btn btn--primary" onClick={handleRequestReview}>
            Request New Review
          </button>
          {submitted && (
            <p className="success-message"> ✓ Your review request has been submitted. Your manager will be notified.</p>
          )
        } 
        </div>
      </div>
    </div>
  );
}