import React, { useState } from "react";
// @ts-ignore
import "./Queries.css";

export default function Queries() {
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSubmitted(true);
      setQuery("");
      // reset success message
      setTimeout(() => setSubmitted(false), 3000);
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
              onChange={(e) => setQuery(e.target.value)}
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