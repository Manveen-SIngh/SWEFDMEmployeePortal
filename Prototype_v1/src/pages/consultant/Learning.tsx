import React, { useState } from "react";
import "./Learning.css";
import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";


export default function Learning() {
    const { currentUser } = useAuth();
    const registry = getRegistry();
    const userID = currentUser ? currentUser.employeeID : "";
    const { upcoming, completed } = registry.getLearningCoursesForUser(userID);

    return (
        <div className="learning-container">
            <h1>Learning & Development</h1>
            <h2>Upcoming Courses</h2>
            {upcoming.length === 0 ? (
                <p>No upcoming courses.</p>
            ) : (
                <ul className="course-list">
                    {upcoming.map((course, index) => (
                        <li key={index} className="course-item">
                            <h3>{course.moduleName}</h3>
                        </li>
                    ))}
                </ul>
            )}
            <h2>Completed Courses</h2>
            {completed.length === 0 ? (
                <p>No completed courses.</p>
            ) : (
                <ul className="course-list">
                    {completed.map((course, index) => (
                        <li key={index} className="course-item">
                            <h3>{course.moduleName}</h3>
                            <p>Completed on: {course.completionDate.toLocaleDateString()}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

