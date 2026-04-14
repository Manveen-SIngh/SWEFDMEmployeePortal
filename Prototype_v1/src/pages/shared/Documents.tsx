import React from "react";
// @ts-ignore
import "./Documents.css";

export default function Documents() {
  const docs = [
    { 
      name: "FDM Employee Handbook 2026", 
      type: "PDF", 
      size: "2.4 MB",
      content: "FDM EMPLOYEE HANDBOOK 2026\n\nWelcome to FDM Group. This handbook outlines our core values, standard working hours, holiday entitlements, and general employee expectations for the 2026 operating year. Please review this document carefully to understand your rights and responsibilities."
    },
    { 
      name: "Health and Safety Policy", 
      type: "PDF", 
      size: "1.1 MB",
      content: "HEALTH AND SAFETY POLICY\n\nFDM is strictly committed to providing a safe working environment. Please ensure your workstation is ergonomically set up. Report any physical hazards, accidents, or near-misses to the HR department or your Line Manager immediately."
    },
    { 
      name: "IT Acceptable Use Policy", 
      type: "PDF", 
      size: "850 KB",
      content: "IT ACCEPTABLE USE POLICY\n\nCompany-issued equipment and network resources are for official business use only. Do not share your passwords, disable antivirus software, or install unauthorized third-party applications on company laptops. All network traffic is subject to monitoring."
    },
    { 
      name: "Code of Conduct", 
      type: "PDF", 
      size: "1.8 MB",
      content: "CODE OF CONDUCT\n\nAll FDM employees must act with the highest level of integrity, respect their colleagues, and adhere strictly to our zero-tolerance policy on workplace discrimination, bullying, and harassment. Professional behavior is expected at all times."
    },
  ];

  const handleDownload = (doc: any) => {
    // creates a temporary text file in the browser containing the doc's content
    const blob = new Blob([doc.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.href = url;
    link.download = `${doc.name}.txt`; // downloads as .txt so it opens instantly on any PC
    document.body.appendChild(link);
    link.click();
    
    // clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="documents-page">
      <div className="documents-header">
        <h2>My Documents</h2>
        <p>Access your important employee files and company policies.</p>
      </div>

      <div className="documents-list">
        {docs.map((doc, i) => (
          <div key={i} className="document-card">
            <div className="document-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="document-info">
              <h3>{doc.name}</h3>
              <span>{doc.type} • {doc.size}</span>
            </div>
            <button 
              className="btn btn--secondary btn--sm"
              onClick={() => handleDownload(doc)}
            >
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}