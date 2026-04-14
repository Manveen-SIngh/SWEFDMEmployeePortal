import React, { useState } from "react";
// @ts-ignore
import "./Queries.css";

export default function Queries() {
  const [query, setQuery] = useState(""); /* State to track the query input */
  const [submitted, setSubmitted] = useState(false); /* Track if query submitted successfully */

  const handleSubmit = (e: React.FormEvent) => { /* Handle form submission */
    e.preventDefault(); /* Prevent default form submission behavior */
    if (query.trim()) { /* Only submit if query is not empty */
      setSubmitted(true); /* Set submitted to true to show success message */
      setQuery(""); /* Clear the query input field */
      setTimeout(() => setSubmitted(false), 3000); /* Hide success message after 3 seconds */
    }
  };

  return (
    <div className="queries-page">
      <div className="queries-header">
        <h2>Helpdesk & Queries</h2>
        <p>Submit a request to HR or IT Support.</p>
      </div>

      <div className="queries-card">
        {submitted && (
          <div className="queries-success">
            ✓ Your query has been submitted successfully. A ticket has been created.
          </div>
        )}
        <form className="query-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="queryType" className="form-label">Category</label>
            <select id="queryType" className="form-select">
              <option>Payroll & Expenses</option>
              <option>IT & Technical Support</option>
              <option>HR & Benefits</option>
              <option>Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="queryText" className="form-label">Description</label>
            <textarea
              id="queryText"
              className="form-textarea"
              rows={5}
              placeholder="Please describe your issue in detail..."
              value={query}
              onChange={(e) => setQuery(e.target.value)} /* Update query state on input change */
            />
          </div>

          <button type="submit" className="btn btn--primary" disabled={!query.trim()}>
            Submit Query
          </button>
        </form>
      </div>
    </div>
  );
}