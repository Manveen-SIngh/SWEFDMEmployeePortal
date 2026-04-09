/**
 * UserManagement.tsx
 * ------------------
 * IT Support user account management page.
 * Features: Lock/Unlock accounts, Assign roles.
 * Create Account and Reset Password functionalities have been left out for the prototype.
 */

import React, { useState, useMemo, useCallback } from "react";

import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";
import RightCanvas from "../../components/common/RightCanvas";
import { Role, EmploymentStatus } from "../../models/enums";
import type { AppUser } from "../../models/interfaces";
import "./UserManagement.css";

/* returns the badge class to use for a given role */
function roleBadgeCls(role: string): string {
  switch (role) {
    case Role.CONSULTANT:      return "badge--info";
    case Role.HUMAN_RESOURCES: return "badge--success";
    case Role.IT_SUPPORT:      return "badge--warning";
    default:                   return "badge--neutral";
  }
}

/* turns a role value into a readable label */
function roleLabel(role: string): string {
  switch (role) {
    case Role.CONSULTANT:      return "Consultant";
    case Role.HUMAN_RESOURCES: return "HR Staff";
    case Role.IT_SUPPORT:      return "IT Support";
    default:                   return role;
  }
}

// ---------------------------------------------------------------------------
// UserManagement component
// ---------------------------------------------------------------------------
export default function UserManagement() {
  const { currentUser } = useAuth();

  /* search text and a key used to force a re-render after changes */
  const [searchTerm,    setSearchTerm]    = useState("");
  const [refreshKey,    setRefreshKey]    = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);


  if (!currentUser) return null;

  const registry = getRegistry();
  const regions  = registry.getRegions();

  /* fetch all users, filtered down by the search term */
  const users = useMemo(() => {
    const all = registry.getAllUsers();
    if (!searchTerm.trim()) return all;
    const term = searchTerm.toLowerCase();
    return all.filter(
      (u) =>
        u.firstName.toLowerCase().includes(term)  ||
        u.lastName.toLowerCase().includes(term)   ||
        u.employeeID.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, refreshKey]);

  /* lock or unlock the account depending on its current state */
  const handleToggleLock = useCallback((user: AppUser) => {
    if (user.isLocked) {
      registry.unlockAccount(user.employeeID);
    } else {
      registry.lockAccount(user.employeeID);
    }
    triggerRefresh();
  }, [registry, triggerRefresh]);

  /* change a user's role and log the action */
  const handleRoleChange = useCallback((userID: string, newRole: string) => {
    registry.assignRole(userID, newRole, currentUser.employeeID);
    triggerRefresh();
  }, [registry, currentUser.employeeID, triggerRefresh]);



  return (
    <div className="user-mgmt">

      {/* ---- Search bar and create button ---- */}
      <div className="user-mgmt__topbar">
        <div className="user-mgmt__search-wrap">
          <svg className="user-mgmt__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="search"
            className="user-mgmt__search"
            placeholder="Search by name, ID, or username…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* disabled in the prototype */}
        <button
          className="btn btn--primary"
          title="Create Account functionality has been removed"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <path d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Account
        </button>
      </div>

      {/* how many accounts are showing */}
      <p className="user-mgmt__count">
        {users.length} account{users.length !== 1 ? "s" : ""}
        {searchTerm && ` matching "${searchTerm}"`}
      </p>

      {/* ---- Main user table ---- */}
      <div className="user-mgmt__table-wrap">
        <table className="user-mgmt__table" aria-label="User accounts">
          <thead>
            <tr>
              <th>Account</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Lock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              /* shown when the search returns nothing */
              <tr>
                <td colSpan={6} className="user-mgmt__empty-cell">
                  No accounts match your search.
                </td>
              </tr>
            ) : (
              users.map((user, i) => (
                <tr
                  key={user.employeeID}
                  className={`user-mgmt__row ${user.isLocked ? "user-mgmt__row--locked" : ""}`}
                  style={{ animationDelay: `${i * 20}ms` }}
                >
                  {/* Name and employee ID */}
                  <td className="user-mgmt__name-cell">
                    <div className={`user-mgmt__avatar ${user.isLocked ? "user-mgmt__avatar--locked" : ""}`}>
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div>
                      <div className="user-mgmt__full-name">
                        {user.firstName} {user.lastName}
                      </div>
                      <code className="user-mgmt__emp-id">{user.employeeID}</code>
                    </div>
                  </td>

                  {/* Login username */}
                  <td>
                    <code className="user-mgmt__username">{user.username}</code>
                  </td>

                  {/* Role dropdown — changes take effect straight away */}
                  <td>
                    <select
                      className="user-mgmt__role-select"
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.employeeID, e.target.value)}
                      aria-label={`Change role for ${user.firstName} ${user.lastName}`}
                    >
                      <option value={Role.CONSULTANT}>Consultant</option>
                      <option value={Role.HUMAN_RESOURCES}>HR Staff</option>
                      <option value={Role.IT_SUPPORT}>IT Support</option>
                    </select>
                  </td>

                  {/* Employment status badge */}
                  <td>
                    <span className={`badge ${
                      user.employmentStatus === EmploymentStatus.ACTIVE ? "badge--success" :
                      user.employmentStatus === EmploymentStatus.ON_LEAVE ? "badge--warning" :
                      "badge--danger"
                    }`}>
                      {user.employmentStatus.replace("_", " ")}
                    </span>
                  </td>

                  {/* Whether the account is locked */}
                  <td>
                    {user.isLocked ? (
                      <span className="badge badge--danger">🔒 Locked</span>
                    ) : (
                      <span className="badge badge--neutral">Active</span>
                    )}
                  </td>

                  {/* Lock/unlock and reset password buttons */}
                  <td>
                    <div className="user-mgmt__actions">
                      {/* toggles the lock state */}
                      <button
                        className={`btn btn--sm ${user.isLocked ? "btn--success" : "btn--secondary"}`}
                        onClick={() => handleToggleLock(user)}
                        title={user.isLocked ? "Unlock account" : "Lock account"}
                      >
                        {user.isLocked ? "Unlock" : "Lock"}
                      </button>

                      {/* not implemented in the prototype */}
                      <button
                        className="btn btn--secondary btn--sm"
                        title="Reset Password"
                      >
                        Reset PW
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


    </div>
  );
}
