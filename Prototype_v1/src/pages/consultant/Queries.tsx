import React, { useState } from "react";
import "./Queries.css";

function Queries() {
    const [queryText, setQueryText] = useState(""); /* State to hold the text of the query being entered by the user */
    const [submitted, setSubmitted] = useState(false); /* State to track if query has been submitted */
   
    const handleSubmit = (e: React.FormEvent) => { /* Handle the form submission for the query */
        e.preventDefault(); /* Prevent the default form submission behavior */
        if (queryText.length < 1 || queryText.length > 500) { /* Validate that query */
            alert("Query must be between 1 and 500 characters."); /* Show alert */
            setSubmitted(false); /* Reset submitted state to false if validation fails */
            return;
        }
        setSubmitted(true); /* Set to true to show confirmation message */
        setQueryText(""); /* Clear the textarea after submission */
        setTimeout(() => {
            setSubmitted(false);}, 3000); /* Reset state after 3 seconds + hide message */
    };
    return (
        <div className="queries-container">
            <h2>Submit a Query</h2>
            <form onSubmit={handleSubmit} className="query-form">
                <textarea
                    value={queryText}
                    onChange={(e) => setQueryText(e.target.value)} /* Update state as user types in the textarea */
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

