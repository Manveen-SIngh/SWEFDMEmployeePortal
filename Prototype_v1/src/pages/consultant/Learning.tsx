import React, { useState } from "react";
import "./Learning.css";
import { useAuth } from "../../context/AuthContext"; 
import { getRegistry } from "../../services/Registry";


export default function Learning() {
    const { currentUser } = useAuth(); /* Get the current user from the authentication context */
    const registry = getRegistry(); /* Get the registry service to access learning course data */
    const userID = currentUser ? currentUser.employeeID : ""; /* Get Employee ID */
    const { upcoming, completed } = registry.getLearningCoursesForUser(userID); /* Fetch upcoming and completed courses for the selected user */

    return (
        <div className="learning-container">
            <h1>Learning & Development</h1>
            <h2>Upcoming Courses</h2>
            {upcoming.length === 0 ? ( /* If no upcoming courses */
                <p>No upcoming courses.</p>
            ) : (
                <ul className="course-list">
                    {upcoming.map((course, index) => ( /* map through upcoming courses and display them */
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
                    {completed.map((course, index) => ( /* map through completed courses and display them */
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

