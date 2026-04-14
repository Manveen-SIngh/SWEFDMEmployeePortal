import React from "react";
// @ts-ignore
import "./Learning.css";
import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";

export default function Learning() {
    const { currentUser } = useAuth();
    const registry = getRegistry();
    const userID = currentUser ? currentUser.employeeID : "";
    
    // Keeping your friend's original data fetching logic
    const { upcoming, completed } = registry.getLearningCoursesForUser(userID);

    return (
        <div className="learning-page">
            <div className="learning-header">
                <h2>Learning & Development</h2>
                <p>Track your mandatory training modules and download certifications.</p>
            </div>

            <div className="learning-section">
                <h3 className="section-title">Upcoming & In Progress</h3>
                {upcoming.length === 0 ? (
                    <div className="learning-empty">No upcoming courses assigned.</div>
                ) : (
                    <div className="learning-grid">
                        {upcoming.map((course: any, index: number) => (
                            <div key={index} className="learning-card">
                                <div className="learning-card-header">
                                    <h4>{course.moduleName}</h4>
                                    <span className="badge badge--warning">Pending</span>
                                </div>
                                <p className="learning-card-desc">
                                    Please complete this module to meet your ongoing compliance requirements.
                                </p>
                                <div className="learning-card-action">
                                    <button className="btn btn--primary btn--sm">Start Module</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="learning-section">
                <h3 className="section-title">Completed Courses</h3>
                {completed.length === 0 ? (
                    <div className="learning-empty">No completed courses yet.</div>
                ) : (
                    <div className="learning-grid">
                        {completed.map((course: any, index: number) => (
                            <div key={index} className="learning-card learning-card--completed">
                                <div className="learning-card-header">
                                    <h4>{course.moduleName}</h4>
                                    <span className="badge badge--success">Completed</span>
                                </div>
                                <p className="learning-card-date">
                                    Completed on: {course.completionDate ? new Date(course.completionDate).toLocaleDateString('en-GB') : "N/A"}
                                </p>
                                <div className="learning-card-action">
                                    <button className="btn btn--secondary btn--sm">View Certificate</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}