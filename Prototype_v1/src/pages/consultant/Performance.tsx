import React from "react";
import "./Performance.css";
import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";

export default function Performance() {
    const { currentUser } = useAuth(); /* Get the current user from the authentication context */
    const registry = getRegistry(); /* Get the registry service to access performance review data */
    const reviews = currentUser ? registry.getPerformanceReviewsForUser(currentUser.employeeID) : []; /* Fetch performance reviews for the selected user */

    if (!reviews || reviews.length === 0) { /* If no reviews available */
        return (
            <div className="performance-container">
                <h1>Performance Reviews</h1>
                <p>No performance reviews available.</p>
            </div>
        );
    }

    const [submitted, setSubmitted] = React.useState(false); /* State to track if a new review request button has been clicked */
    const handleRequestReview = () => { /* Handle the request for a new performance review */
        setSubmitted(true); /* Set to true to show confirmation message */
        setTimeout(() => setSubmitted(false), 3000); /* Reset after 3 seconds */
        alert("Your request for a new performance review has been submitted."); /* Show an alert confirming the request submission */
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


