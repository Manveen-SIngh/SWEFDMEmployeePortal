/**
 * EmployeeDirectory.tsx
 * ---------------------
 */

import React, { useState, useMemo, useCallback } from "react";

import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";
import RightCanvas from "../../components/common/RightCanvas";
import { Role, EmploymentStatus } from "../../models/enums";
import type { AppUser, ConsultantUser, StaffUser } from "../../models/interfaces";
import "./EmployeeDirectory.css";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function roleLabel(role: Role | string): string {
  switch (role) {
    case Role.CONSULTANT:      return "Consultant";
    case Role.HUMAN_RESOURCES: return "HR Staff";
    case Role.IT_SUPPORT:      return "IT Support";
    default:                   return String(role);
  }
}

function roleBadgeCls(role: Role | string): string {
  switch (role) {
    case Role.CONSULTANT:      return "badge--info";
    case Role.HUMAN_RESOURCES: return "badge--success";
    case Role.IT_SUPPORT:      return "badge--warning";
    default:                   return "badge--neutral";
  }
}

function statusBadgeCls(status: EmploymentStatus | string): string {
  switch (status) {
    case EmploymentStatus.ACTIVE:     return "badge--success";
    case EmploymentStatus.ON_LEAVE:   return "badge--warning";
    case EmploymentStatus.TERMINATED: return "badge--danger";
    default:                          return "badge--neutral";
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// EmployeeDirectory component
// ---------------------------------------------------------------------------
export default function EmployeeDirectory() {
  const { currentUser } = useAuth();

  
  // Filter state
  const [searchTerm,    setSearchTerm]    = useState("");
  const [filterRole,    setFilterRole]    = useState("");
  const [filterRegion,  setFilterRegion]  = useState("");
  const [filterStatus,  setFilterStatus]  = useState("");

  
  // Re-render trigger
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  
  // View/Edit profile canvas
  const [viewTarget,      setViewTarget]      = useState<AppUser | null>(null);
  const [editStatus,      setEditStatus]      = useState<string>("");
  const [editRegion,      setEditRegion]       = useState<string>("");
  const [editJobTitle,    setEditJobTitle]     = useState<string>("");
  const [editDepartment,  setEditDepartment]   = useState<string>("");
  const [editSaving,      setEditSaving]       = useState(false);
  const [editSuccess,     setEditSuccess]      = useState(false);
  const [editError,       setEditError]        = useState("");

  if (!currentUser) return null;

  const registry = getRegistry();
  const regions  = registry.getRegions();

  // -------------------------------------------------------------------------
  // Fetch employees with filters applied
  // -------------------------------------------------------------------------
  const employees = useMemo(() => {
    /* Parse search term into firstName/lastName/employeeID */
    const term = searchTerm.trim();
    /* Also allow employee ID search */
    const allUsers = registry.getAllUsers();

    let result = registry.findUsers({
      firstName:        term || undefined,
      role:             filterRole    || undefined,
      employmentStatus: filterStatus  || undefined,
      regionID:         filterRegion  || undefined,
    });

    /* Also check last name and employee ID against the search term */
    if (term) {
      const termLower = term.toLowerCase();
      result = allUsers.filter((u) =>
        u.firstName.toLowerCase().includes(termLower)  ||
        u.lastName.toLowerCase().includes(termLower)   ||
        u.employeeID.toLowerCase().includes(termLower) ||
        u.email.toLowerCase().includes(termLower)
      );
      /* Re-apply role/status/region filters on top of name search */
      if (filterRole)   result = result.filter((u) => u.role === filterRole);
      if (filterStatus) result = result.filter((u) => u.employmentStatus === filterStatus);
      if (filterRegion) result = result.filter((u) => u.regionID === filterRegion);
    }

    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterRole, filterRegion, filterStatus, refreshKey]);

  // -------------------------------------------------------------------------
  // Open view/edit canvas for a user
  // -------------------------------------------------------------------------
  const openViewCanvas = useCallback((user: AppUser) => {
    setViewTarget(user);
    setEditStatus(user.employmentStatus);
    setEditRegion(user.regionID);
    setEditJobTitle((user as ConsultantUser).jobTitle ?? "");
    setEditDepartment((user as StaffUser).department ?? "");
    setEditSaving(false);
    setEditSuccess(false);
    setEditError("");
  }, []);

  // -------------------------------------------------------------------------
  // Save employment record changes
  // -------------------------------------------------------------------------
  const handleSaveEmploymentRecord = useCallback(async () => {
    if (!viewTarget) return;
    setEditSaving(true);
    setEditError("");

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      const updates: Partial<AppUser> = {
        employmentStatus: editStatus as EmploymentStatus,
        regionID:         editRegion,
        ...(viewTarget.role === Role.CONSULTANT
          ? { jobTitle:    editJobTitle.trim()    }
          : { department:  editDepartment.trim()  }),
      };

      const updated = registry.updateEmploymentRecord(
        viewTarget.employeeID,
        updates,
        currentUser.employeeID
      );

      if (updated) {
        setViewTarget(updated);
        setEditSuccess(true);
        triggerRefresh();
        setTimeout(() => setEditSuccess(false), 2000);
      } else {
        setEditError("Failed to save. Please try again.");
      }
    } finally {
      setEditSaving(false);
    }
  }, [
    viewTarget, editStatus, editRegion, editJobTitle, editDepartment,
    currentUser.employeeID, registry, triggerRefresh,
  ]);



  // -------------------------------------------------------------------------
  // Actual Rendering
  // -------------------------------------------------------------------------
  return (
    <div className="emp-dir">

      {/* ---- Top bar ---- */}
      <div className="emp-dir__topbar">
        <div className="emp-dir__filters">
          {/* Name / ID search */}
          <div className="emp-dir__search-wrap">
            <svg className="emp-dir__search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              type="search"
              className="emp-dir__search"
              placeholder="Search by name or employee ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role filter */}
          <select
            className="emp-dir__filter-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            <option value={Role.CONSULTANT}>Consultant</option>
            <option value={Role.HUMAN_RESOURCES}>HR Staff</option>
            <option value={Role.IT_SUPPORT}>IT Support</option>
          </select>

          {/* Region filter */}
          <select
            className="emp-dir__filter-select"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            aria-label="Filter by region"
          >
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r.regionID} value={r.regionID}>
                {r.regionName}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            className="emp-dir__filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value={EmploymentStatus.ACTIVE}>Active</option>
            <option value={EmploymentStatus.ON_LEAVE}>On Leave</option>
            <option value={EmploymentStatus.TERMINATED}>Terminated</option>
          </select>
        </div>

        {/* Create Profile button (placeholder) */}
        <button
          className="btn btn--primary"
          title="Create Profile functionality has been removed"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <path d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Profile
        </button>
      </div>

      {/* ---- Result count ---- */}
      <p className="emp-dir__count">
        {employees.length} employee{employees.length !== 1 ? "s" : ""}
        {searchTerm && ` matching "${searchTerm}"`}
      </p>

      {/* ---- Employees table ---- */}
      <div className="emp-dir__table-wrap">
        <table className="emp-dir__table" aria-label="Employee directory">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Region</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="emp-dir__empty-cell">
                  No employees match your search criteria.
                </td>
              </tr>
            ) : (
              employees.map((emp, i) => {
                const regionName =
                  regions.find((r) => r.regionID === emp.regionID)?.regionName ??
                  emp.regionID;

                return (
                  <tr
                    key={emp.employeeID}
                    className="emp-dir__row"
                    style={{ animationDelay: `${i * 25}ms` }}
                    onClick={() => openViewCanvas(emp)}
                    title={`View profile: ${emp.firstName} ${emp.lastName}`}
                  >
                    <td>
                      <code className="emp-dir__id">{emp.employeeID}</code>
                    </td>
                    <td className="emp-dir__name-cell">
                      {/* Avatar initials */}
                      <div className="emp-dir__avatar">
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <div>
                        <div className="emp-dir__full-name">
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div className="emp-dir__email">{emp.email}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${roleBadgeCls(emp.role)}`}>
                        {roleLabel(emp.role)}
                      </span>
                    </td>
                    <td className="emp-dir__region">{regionName}</td>
                    <td>
                      <span className={`badge ${statusBadgeCls(emp.employmentStatus)}`}>
                        {emp.employmentStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td className="emp-dir__start-date">
                      {formatDate(emp.startDate)}
                    </td>
                    <td>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={(e) => { e.stopPropagation(); openViewCanvas(emp); }}
                        aria-label={`View profile of ${emp.firstName} ${emp.lastName}`}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ===================================================================
          VIEW / EDIT EMPLOYMENT RECORD CANVAS
          =================================================================== */}
      <RightCanvas
        isOpen={!!viewTarget}
        onClose={() => { setViewTarget(null); setEditSuccess(false); }}
        title={viewTarget ? `${viewTarget.firstName} ${viewTarget.lastName}` : ""}
        width="480px"
      >
        {viewTarget && (
          <div className="emp-dir-canvas">
            {/* Profile summary */}
            <div className="emp-dir-canvas__profile">
              <div className="emp-dir-canvas__avatar">
                {viewTarget.firstName[0]}{viewTarget.lastName[0]}
              </div>
              <div>
                <h3 className="emp-dir-canvas__name">
                  {viewTarget.firstName} {viewTarget.lastName}
                </h3>
                <p className="emp-dir-canvas__job">
                  {viewTarget.role === Role.CONSULTANT
                    ? (viewTarget as ConsultantUser).jobTitle
                    : (viewTarget as StaffUser).department}
                </p>
                <div className="emp-dir-canvas__badges">
                  <span className={`badge ${roleBadgeCls(viewTarget.role)}`}>
                    {roleLabel(viewTarget.role)}
                  </span>
                  <span className={`badge ${statusBadgeCls(viewTarget.employmentStatus)}`}>
                    {viewTarget.employmentStatus.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Read-only details */}
            <div className="emp-dir-canvas__section">
              <h4 className="emp-dir-canvas__section-title">Personal Details</h4>
              <div className="emp-dir-canvas__fields">
                {[
                  ["Employee ID",  viewTarget.employeeID,  true],
                  ["Email",        viewTarget.email,        false],
                  ["Phone",        viewTarget.phone || "—", false],
                  ["Mobile",       viewTarget.mobile || "—",false],
                  ["Start Date",   formatDate(viewTarget.startDate), false],
                  ["NI Number",    viewTarget.niNumber || "—", true],
                ].map(([label, value, mono]) => (
                  <div key={String(label)} className="emp-dir-canvas__field-row">
                    <span className="emp-dir-canvas__field-label">{label}</span>
                    <span className={`emp-dir-canvas__field-value ${mono ? "emp-dir-canvas__field-value--mono" : ""}`}>
                      {String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Editable employment record section */}
            <div className="emp-dir-canvas__section emp-dir-canvas__section--edit">
              <h4 className="emp-dir-canvas__section-title">
                Employment Record
                <span className="emp-dir-canvas__editable-note">Editable</span>
              </h4>

              {editSuccess && (
                <div className="emp-dir-canvas__success" role="status">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Employment record saved.
                </div>
              )}
              {editError && (
                <div className="emp-dir-canvas__error" role="alert">
                  {editError}
                </div>
              )}

              {/* Employment Status */}
              <div className="form-group">
                <label htmlFor="edit-emp-status" className="form-label">
                  Employment Status
                </label>
                <select
                  id="edit-emp-status"
                  className="form-select"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  disabled={editSaving}
                >
                  <option value={EmploymentStatus.ACTIVE}>Active</option>
                  <option value={EmploymentStatus.ON_LEAVE}>On Leave</option>
                  <option value={EmploymentStatus.TERMINATED}>Terminated</option>
                </select>
              </div>

              {/* Region */}
              <div className="form-group">
                <label htmlFor="edit-region" className="form-label">
                  Region
                </label>
                <select
                  id="edit-region"
                  className="form-select"
                  value={editRegion}
                  onChange={(e) => setEditRegion(e.target.value)}
                  disabled={editSaving}
                >
                  {regions.map((r) => (
                    <option key={r.regionID} value={r.regionID}>
                      {r.regionName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Title / Department */}
              {viewTarget.role === Role.CONSULTANT ? (
                <div className="form-group">
                  <label htmlFor="edit-job-title" className="form-label">
                    Job Title
                  </label>
                  <input
                    id="edit-job-title"
                    type="text"
                    className="form-input"
                    value={editJobTitle}
                    onChange={(e) => setEditJobTitle(e.target.value)}
                    disabled={editSaving}
                    placeholder="e.g. Software Engineer"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label htmlFor="edit-department" className="form-label">
                    Department
                  </label>
                  <input
                    id="edit-department"
                    type="text"
                    className="form-input"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    disabled={editSaving}
                    placeholder="e.g. Human Resources"
                  />
                </div>
              )}

              {/* Save button */}
              <button
                className="btn btn--primary"
                onClick={handleSaveEmploymentRecord}
                disabled={editSaving}
                style={{ width: "100%" }}
              >
                {editSaving ? "Saving…" : "Save Employment Record"}
              </button>
            </div>
          </div>
        )}
      </RightCanvas>


    </div>
  );
}
