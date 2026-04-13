import React, { useState } from "react";
import "./Queries.css";

function Queries() {
    const [queryText, setQueryText] = useState("");
    const [submitted, setSubmitted] = useState(false);
   
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (queryText.length < 1 || queryText.length > 500) {
            alert("Query must be between 1 and 500 characters.");
            setSubmitted(false);
            return;
        }
        setSubmitted(true);
        setQueryText("");
        setTimeout(() => {
            setSubmitted(false);}, 3000);
    };
    return (
        <div className="queries-container">
            <h2>Submit a Query</h2>
            <form onSubmit={handleSubmit} className="query-form">
                <textarea
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)}
                    placeholder="Enter your query here..."
                    className="query-textarea"
                    maxLength={500}
                />
                <button type="submit" className="submit-button">Submit</button>
            </form> 
            {submitted && <p className="confirmation-message">Your query has been submitted successfully!</p>}
        </div>
    );
}

export default Queries;

