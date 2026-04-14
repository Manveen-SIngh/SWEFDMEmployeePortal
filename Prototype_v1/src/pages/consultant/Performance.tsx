import React from "react";
import "./Performance.css";
import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";

export default function Performance() {
    const { currentUser } = useAuth();
    const registry = getRegistry();
    const reviews = currentUser ? registry.getPerformanceReviewsForUser(currentUser.employeeID) : [];

    if (!reviews || reviews.length === 0) {
        return (
            <div className="performance-container">
                <h1>Performance Reviews</h1>
                <p>No performance reviews available.</p>
            </div>
        );
    }

    const [submitted, setSubmitted] = React.useState(false);
    const handleRequestReview = () => {
        setSubmitted(true);
        setTimeout(() => setSubmitted(false), 3000);
        alert("Your request for a new performance review has been submitted.");
    };

    const review = reviews[0];
    return (
        <div className="performance-container">
            <h1>Performance Review</h1>
            <div className="review">
                <p><strong>Review Date:</strong> {review.reviewPeriodStart.toDateString()}-{review.reviewPeriodEnd.toDateString()}</p>
                <p><strong>Rating:</strong> {review.rating}/5</p>
                <p><strong>Evaluation:</strong> {review.writtenEvaluation}</p>
            </div>
            <button className="request-review-button" onClick={handleRequestReview}>
                Request New Review on: {new Date().toDateString()}
            </button>
            {submitted && <p className="confirmation-message">Review request submitted!</p>}
        </div>
    );
}


