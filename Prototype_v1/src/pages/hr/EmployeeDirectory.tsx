// hr employee directory page
// updated with bulk assignment and review due alerts

import React, { useState, useMemo, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { getRegistry } from "../../services/Registry";
import RightCanvas from "../../components/common/RightCanvas";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import ToastContainer, { useToasts } from "../../components/common/Toast";
import { Role, EmploymentStatus } from "../../models/enums";
import type { AppUser, ConsultantUser, StaffUser } from "../../models/interfaces";

// @ts-ignore
import "./EmployeeDirectory.css";

// helpers
function roleLabel(role: Role | string): string {
  switch (role) {
    case Role.CONSULTANT:
      return "Consultant";
    case Role.HUMAN_RESOURCES:
      return "HR Staff";
    case Role.IT_SUPPORT:
      return "IT Support";
    default:
      return String(role);
  }
}

function roleBadgeCls(role: Role | string): string {
  switch (role) {
    case Role.CONSULTANT:
      return "badge--info";
    case Role.HUMAN_RESOURCES:
      return "badge--success";
    case Role.IT_SUPPORT:
      return "badge--warning";
    default:
      return "badge--neutral";
  }
}

function statusBadgeCls(status: EmploymentStatus | string): string {
  switch (status) {
    case EmploymentStatus.ACTIVE:
      return "badge--success";
    case EmploymentStatus.ON_LEAVE:
      return "badge--warning";
    case EmploymentStatus.TERMINATED:
      return "badge--danger";
    default:
      return "badge--neutral";
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// check if consultant review is older than 6 months
function isReviewDue(emp: AppUser, registry: any): boolean {
  if (emp.role !== Role.CONSULTANT) return false;
  
  const reviews = registry.getPerformanceReviewsForUser(emp.employeeID);
  if (reviews.length === 0) return true;
  
  const lastReviewDate = reviews[0].reviewPeriodEnd.getTime();
  const sixMonthsInMs = 180 * 24 * 60 * 60 * 1000;
  
  return new Date().getTime() - lastReviewDate > sixMonthsInMs;
}

// star rating display
function Stars({ rating }: { rating: number }) {
  return (
    <span className="emp-dir-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={i <= rating ? "#d97706" : "var(--color-border)"}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
      <span className="emp-dir-stars__text">
        {rating}/5
      </span>
    </span>
  );
}

// main component
export default function EmployeeDirectory() {
  const { currentUser } = useAuth();
  const { refreshNotifications } = useNotifications();
  const { toasts, pushToast } = useToasts();
  const registry = getRegistry();
  const regions = registry.getRegions();

  // filters
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [filterRole, setFilterRole] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterReviewDue, setFilterReviewDue] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // bulk actions state
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkRegionTarget, setBulkRegionTarget] = useState("");

  // view and edit canvas
  const [viewTarget, setViewTarget] = useState<AppUser | null>(null);
  const [editStatus, setEditStatus] = useState<string>("");
  const [editRegion, setEditRegion] = useState<string>("");
  const [editJobTitle, setEditJobTitle] = useState<string>("");
  const [editDepartment, setEditDepartment] = useState<string>("");
  const [editSaving, setEditSaving] = useState(false);

  // create profile canvas
  const [createOpen, setCreateOpen] = useState(false);
  const [crFn, setCrFn] = useState("");
  const [crLn, setCrLn] = useState("");
  const [crUser, setCrUser] = useState("");
  const [crRole, setCrRole] = useState("CONSULTANT");
  const [crRegion, setCrRegion] = useState("R001");
  const [crJob, setCrJob] = useState("");
  const [crGender, setCrGender] = useState("");
  const [crDob, setCrDob] = useState("");
  const [crErr, setCrErr] = useState("");
  const [crSuccess, setCrSuccess] = useState<AppUser | null>(null);

  // performance review canvas
  const [reviewTarget, setReviewTarget] = useState<AppUser | null>(null);
  const [rvPs, setRvPs] = useState("");
  const [rvPe, setRvPe] = useState("");
  const [rvRating, setRvRating] = useState("4");
  const [rvText, setRvText] = useState("");
  const [rvErr, setRvErr] = useState("");
  const [rvSuccess, setRvSuccess] = useState(false);

  // confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    danger: boolean;
    confirmLabel: string;
    requireInput?: boolean;
    inputPlaceholder?: string;
    onConfirm: (val?: string) => void;
  } | null>(null);

  if (!currentUser) return null;

  // fetch and filter employees
  const employees = useMemo(() => {
    const allUsers = registry.getAllUsers();
    let result = allUsers;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      if (searchField === "id") {
        result = result.filter((u) => u.employeeID.toLowerCase().includes(term));
      } else if (searchField === "name") {
        result = result.filter((u) => 
          (u.firstName + " " + u.lastName).toLowerCase().includes(term)
        );
      } else if (searchField === "email") {
        result = result.filter((u) => u.email.toLowerCase().includes(term));
      } else {
        result = result.filter((u) =>
          u.firstName.toLowerCase().includes(term) ||
          u.lastName.toLowerCase().includes(term) ||
          u.employeeID.toLowerCase().includes(term) ||
          u.email.toLowerCase().includes(term)
        );
      }
    }

    if (filterRole) {
      result = result.filter((u) => u.role === filterRole);
    }
    
    if (filterStatus) {
      result = result.filter((u) => u.employmentStatus === filterStatus);
    }
    
    if (filterRegion) {
      result = result.filter((u) => u.regionID === filterRegion);
    }
    
    if (filterReviewDue) {
      result = result.filter((u) => isReviewDue(u, registry));
    }

    return result;
  }, [searchTerm, searchField, filterRole, filterRegion, filterStatus, filterReviewDue, refreshKey, registry]);

  const toggleSelectUser = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const handleBulkAssign = () => {
    if (!bulkRegionTarget || selectedUsers.length === 0) return;
    
    registry.bulkAssignRegion(
      selectedUsers, 
      bulkRegionTarget, 
      currentUser.employeeID
    );
    
    triggerRefresh();
    pushToast(`successfully updated region for ${selectedUsers.length} employees`, "success");
    setSelectedUsers([]);
    setBulkRegionTarget("");
  };

  const openViewCanvas = useCallback((user: AppUser) => {
    setViewTarget(user);
    setEditStatus(user.employmentStatus);
    setEditRegion(user.regionID);
    setEditJobTitle((user as ConsultantUser).jobTitle ?? "");
    setEditDepartment((user as StaffUser).department ?? "");
    setEditSaving(false);
  }, []);

  // save employment record
  const handleSaveEmploymentRecord = useCallback(async () => {
    if (!viewTarget) return;

    const doSave = async () => {
      setEditSaving(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));

        const updates: Partial<AppUser> = {
          employmentStatus: editStatus as EmploymentStatus,
          regionID: editRegion,
          ...(viewTarget.role === Role.CONSULTANT
            ? { jobTitle: editJobTitle.trim() }
            : { department: editDepartment.trim() }),
        };

        const updated = registry.updateEmploymentRecord(
          viewTarget.employeeID,
          updates,
          currentUser.employeeID
        );

        if (updated) {
          setViewTarget(updated);
          triggerRefresh();
          refreshNotifications();

          let msgs: string[] = [];
          if (viewTarget.employmentStatus !== editStatus) {
            msgs.push(`status → ${editStatus.replace("_", " ")}`);
          }
          if (viewTarget.regionID !== editRegion) {
            msgs.push(`region updated`);
          }
          
          const actionMsg = msgs.length ? msgs.join(", ") : "record saved";
          pushToast(
            `${viewTarget.firstName} ${viewTarget.lastName} — ${actionMsg}.`, 
            "success"
          );
        }
      } finally {
        setEditSaving(false);
      }
    };

    if (editStatus === "TERMINATED" && viewTarget.employmentStatus !== "TERMINATED") {
      setConfirmDialog({
        title: "Change status to Terminated",
        message: `Are you sure you want to set ${viewTarget.firstName} ${viewTarget.lastName}'s employment status to Terminated? This will mark them as no longer employed by FDM.`,
        danger: true,
        confirmLabel: "Confirm termination",
        onConfirm: () => {
          setConfirmDialog(null);
          doSave();
        },
      });
    } else {
      doSave();
    }
  }, [viewTarget, editStatus, editRegion, editJobTitle, editDepartment, currentUser.employeeID, registry, triggerRefresh, refreshNotifications, pushToast, regions]);

  // activate / deactivate account with mandatory audit reasoning
  const handleToggleAccount = useCallback((emp: AppUser) => {
    const isCurrentlyActive = !emp.isLocked;
    const action = isCurrentlyActive ? "deactivate" : "activate";

    setConfirmDialog({
      title: `${isCurrentlyActive ? "Deactivate" : "Activate"} account`,
      message: `Are you sure you want to ${action} the account for ${emp.firstName} ${emp.lastName} (${emp.employeeID})?`,
      danger: isCurrentlyActive,
      confirmLabel: isCurrentlyActive ? "Deactivate account" : "Activate account",
      requireInput: isCurrentlyActive,
      inputPlaceholder: "mandatory: provide a reason for the audit log...",
      onConfirm: (reasonVal?: string) => {
        if (isCurrentlyActive) {
          registry.deactivateAccount(
            emp.employeeID, 
            currentUser.employeeID, 
            reasonVal
          );
        } else {
          registry.activateAccount(
            emp.employeeID, 
            currentUser.employeeID
          );
        }
        
        const refreshed = registry.getUserByID(emp.employeeID);
        if (refreshed && viewTarget?.employeeID === emp.employeeID) {
          setViewTarget(refreshed);
        }
        
        triggerRefresh();
        refreshNotifications();
        pushToast(
          `${emp.firstName} ${emp.lastName}'s account has been ${isCurrentlyActive ? "deactivated" : "activated"}.`,
          isCurrentlyActive ? "danger" : "success"
        );
        
        setConfirmDialog(null);
      },
    });
  }, [registry, currentUser.employeeID, viewTarget, triggerRefresh, refreshNotifications, pushToast]);

  // create profile
  const openCreateCanvas = useCallback(() => {
    setCrFn(""); 
    setCrLn(""); 
    setCrUser(""); 
    setCrRole("CONSULTANT");
    setCrRegion("R001"); 
    setCrJob(""); 
    setCrGender(""); 
    setCrDob("");
    setCrErr(""); 
    setCrSuccess(null);
    setCreateOpen(true);
  }, []);

  const handleSubmitCreate = useCallback(async () => {
    let errs: string[] = [];
    
    if (!crFn.trim()) errs.push("First name is required.");
    if (!crLn.trim()) errs.push("Last name is required.");
    if (!crUser.trim()) errs.push("Username is required.");
    
    if (errs.length) {
      setCrErr(errs.join(" "));
      return;
    }

    const result = registry.createConsultantProfile(
      {
        firstName: crFn.trim(),
        lastName: crLn.trim(),
        username: crUser.trim(),
        role: crRole,
        regionID: crRegion,
        jobTitle: crJob.trim() || undefined,
        gender: crGender || undefined,
        dateOfBirth: crDob || undefined,
      },
      currentUser.employeeID
    );

    if (result.success && result.user) {
      setCrSuccess(result.user);
      triggerRefresh();
      refreshNotifications();
      pushToast(
        `Profile created for ${result.user.firstName} ${result.user.lastName} (${result.user.employeeID}).`
      );
    } else {
      setCrErr(result.error || "Failed to create profile.");
    }
  }, [crFn, crLn, crUser, crRole, crRegion, crJob, crGender, crDob, currentUser.employeeID, registry, triggerRefresh, refreshNotifications, pushToast]);

  // performance review
  const openReviewCanvas = useCallback((emp: AppUser) => {
    setViewTarget(null);
    setTimeout(() => {
      setReviewTarget(emp);
      setRvPs(""); 
      setRvPe(""); 
      setRvRating("4"); 
      setRvText("");
      setRvErr(""); 
      setRvSuccess(false);
    }, 100);
  }, []);

  const handleSubmitReview = useCallback(async () => {
    if (!reviewTarget) return;

    let errs: string[] = [];
    
    if (!rvPs) errs.push("Start date is required.");
    if (!rvPe) errs.push("End date is required.");
    
    if (rvPs && rvPe && new Date(rvPe) < new Date(rvPs)) {
      errs.push("End date must be after start date.");
    }
    
    if (!rvText.trim()) {
      errs.push("Written evaluation is required.");
    } else if (rvText.trim().length < 20) {
      errs.push("Evaluation must be at least 20 characters.");
    }
    
    if (errs.length) {
      setRvErr(errs.join(" "));
      return;
    }

    const result = registry.submitPerformanceReview({
      userID: reviewTarget.employeeID,
      reviewerID: currentUser.employeeID,
      rating: parseInt(rvRating),
      writtenEvaluation: rvText.trim(),
      reviewPeriodStart: new Date(rvPs),
      reviewPeriodEnd: new Date(rvPe),
    });

    if (result.success) {
      setRvSuccess(true);
      triggerRefresh();
      refreshNotifications();
      pushToast(
        `Performance review submitted for ${reviewTarget.firstName} ${reviewTarget.lastName} (${rvRating}/5).`
      );
    } else {
      setRvErr(result.error || "Failed to submit review.");
    }
  }, [reviewTarget, rvPs, rvPe, rvRating, rvText, currentUser.employeeID, registry, triggerRefresh, refreshNotifications, pushToast]);

  // render
  return (
    <div className="emp-dir">
      <ToastContainer toasts={toasts} />

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          danger={confirmDialog.danger}
          confirmLabel={confirmDialog.confirmLabel}
          requireInput={confirmDialog.requireInput}
          inputPlaceholder={confirmDialog.inputPlaceholder}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* top bar */}
      <div className="emp-dir__topbar">
        <div className="emp-dir__filters">
          <div className="emp-dir__search-wrap">
            <svg 
              className="emp-dir__search-icon" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" 
              />
            </svg>
            <input
              id="directory-search"
              title="Search directory"
              type="search"
              className="emp-dir__search"
              placeholder={
                searchField === "id" ? "Search by employee ID…" :
                searchField === "name" ? "Search by name…" :
                searchField === "email" ? "Search by email…" :
                "Search by name, ID or email…"
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            id="filter-field"
            title="Search field filter"
            className="emp-dir__filter-select"
            value={searchField}
            onChange={(e) => setSearchField(e.target.value)}
            aria-label="Search by field"
          >
            <option value="all">All fields</option>
            <option value="id">Employee ID</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>

          <select
            id="filter-role"
            title="Role filter"
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

          <select
            id="filter-region"
            title="Region filter"
            className="emp-dir__filter-select"
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            aria-label="Filter by region"
          >
            <option value="">All regions</option>
            {regions.map((r) => (
              <option 
                key={r.regionID} 
                value={r.regionID}
              >
                {r.regionName}
              </option>
            ))}
          </select>

          <div className="emp-dir__review-filter">
            <input 
              id="filter-review-due" 
              type="checkbox" 
              checked={filterReviewDue} 
              onChange={(e) => setFilterReviewDue(e.target.checked)} 
            />
            <label 
              htmlFor="filter-review-due" 
              className="emp-dir__review-filter-label"
            >
              Review Due (6mo+)
            </label>
          </div>
        </div>

        <button 
          className="btn btn--primary" 
          onClick={openCreateCanvas}
        >
          <svg 
            className="emp-dir__icon-sm" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Profile
        </button>
      </div>

      <p className="emp-dir__count">
        {employees.length} employee{employees.length !== 1 ? "s" : ""} matching criteria
      </p>

      {/* directory table */}
      <div className="emp-dir__table-wrap">
        <table 
          className="emp-dir__table" 
          aria-label="Employee directory"
        >
          <thead>
            <tr>
              <th className="emp-dir__checkbox-col"></th>
              <th>ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Region</th>
              <th>Status</th>
              <th>Account</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="emp-dir__empty-cell">
                  No employees match your search criteria.
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const regionName = regions.find(
                  (r) => r.regionID === emp.regionID
                )?.regionName ?? emp.regionID;
                const isDeactivated = emp.isLocked;
                const reviewDue = isReviewDue(emp, registry);

                return (
                  <tr
                    key={emp.employeeID}
                    className={`emp-dir__row emp-dir__row-anim ${isDeactivated ? "emp-dir__row--deactivated" : ""}`}
                    onClick={() => openViewCanvas(emp)}
                    title={`View profile: ${emp.firstName} ${emp.lastName}`}
                  >
                    <td className="emp-dir__checkbox-col">
                      <input 
                        type="checkbox" 
                        checked={selectedUsers.includes(emp.employeeID)}
                        onClick={(e) => toggleSelectUser(e, emp.employeeID)}
                        aria-label={`Select ${emp.firstName}`}
                      />
                    </td>
                    <td>
                      <code className="emp-dir__id">
                        {emp.employeeID}
                      </code>
                    </td>
                    <td className="emp-dir__name-cell">
                      <div className={`emp-dir__avatar ${isDeactivated ? "emp-dir__avatar--deactivated" : ""}`}>
                        {emp.firstName[0]}
                        {emp.lastName[0]}
                      </div>
                      <div>
                        <div className="emp-dir__full-name">
                          {emp.firstName} {emp.lastName}
                        </div>
                        {reviewDue && (
                          <div className="emp-dir__review-due">
                            <svg 
                              viewBox="0 0 24 24" 
                              fill="currentColor"
                            >
                              <circle cx="12" cy="12" r="10" />
                            </svg>
                            Review Due
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${roleBadgeCls(emp.role)}`}>
                        {roleLabel(emp.role)}
                      </span>
                    </td>
                    <td className="emp-dir__region">
                      {regionName}
                    </td>
                    <td>
                      <span className={`badge ${statusBadgeCls(emp.employmentStatus)}`}>
                        {emp.employmentStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      {isDeactivated ? (
                        <span className="badge badge--danger">
                          Deactivated
                        </span>
                      ) : (
                        <span className="badge badge--success">
                          Active
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn btn--ghost btn--sm"
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          openViewCanvas(emp); 
                        }}
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

      {/* bulk action bar */}
      {selectedUsers.length > 0 && (
        <div className="emp-dir__bulk-bar">
          <span className="emp-dir__bulk-count">
            {selectedUsers.length} selected
          </span>
          <div className="emp-dir__bulk-actions">
            <select 
              className="emp-dir__bulk-select"
              value={bulkRegionTarget}
              onChange={(e) => setBulkRegionTarget(e.target.value)}
              aria-label="Select target region for bulk assignment"
            >
              <option value="">
                Move to region...
              </option>
              {regions.map((r) => (
                <option 
                  key={r.regionID} 
                  value={r.regionID}
                >
                  {r.regionName}
                </option>
              ))}
            </select>
            <button 
              className="btn btn--primary btn--sm" 
              onClick={handleBulkAssign}
              disabled={!bulkRegionTarget}
            >
              Apply
            </button>
            <button 
              className="btn btn--ghost btn--sm emp-dir__bulk-clear" 
              onClick={() => setSelectedUsers([])}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* view and edit profile */}
      <RightCanvas
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title={viewTarget ? `${viewTarget.firstName} ${viewTarget.lastName}` : ""}
        width="480px"
      >
        {viewTarget && (() => {
          const emp = registry.getUserByID(viewTarget.employeeID) || viewTarget;
          const isCon = emp.role === Role.CONSULTANT;
          const isDeactivated = emp.isLocked;

          return (
            <div className="emp-dir-canvas">
              <div className="emp-dir-canvas__profile">
                <div className={`emp-dir-canvas__avatar ${isDeactivated ? "emp-dir-canvas__avatar--deactivated" : ""}`}>
                  {emp.firstName[0]}
                  {emp.lastName[0]}
                </div>
                <div>
                  <h3 className="emp-dir-canvas__name">
                    {emp.firstName} {emp.lastName}
                  </h3>
                  <p className="emp-dir-canvas__job">
                    {isCon ? (emp as ConsultantUser).jobTitle : (emp as StaffUser).department}
                  </p>
                  <div className="emp-dir-canvas__badges">
                    <span className={`badge ${roleBadgeCls(emp.role)}`}>
                      {roleLabel(emp.role)}
                    </span>
                    <span className={`badge ${statusBadgeCls(emp.employmentStatus)}`}>
                      {emp.employmentStatus.replace("_", " ")}
                    </span>
                    {isDeactivated && (
                      <span className="badge badge--danger">
                        Deactivated
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* account status banner */}
              <div className={`emp-dir-canvas__account-banner ${isDeactivated ? "emp-dir-canvas__account-banner--inactive" : ""}`}>
                <div>
                  <div className="emp-dir-canvas__account-status">
                    Account {isDeactivated ? "deactivated" : "active"}
                  </div>
                  <div className="emp-dir-canvas__account-hint">
                    {isDeactivated 
                      ? "This employee cannot log in to the portal." 
                      : "This employee can log in to the portal."}
                  </div>
                </div>
                <button
                  className={`btn btn--sm ${isDeactivated ? "btn--success" : "btn--danger"}`}
                  onClick={() => handleToggleAccount(emp)}
                >
                  {isDeactivated ? "Activate" : "Deactivate"}
                </button>
              </div>

              <div className="emp-dir-canvas__section emp-dir-canvas__section--edit">
                <h4 className="emp-dir-canvas__section-title">
                  Employment Record 
                  <span className="emp-dir-canvas__editable-note">
                    Editable
                  </span>
                </h4>

                <div className="form-group">
                  <label 
                    htmlFor="edit-emp-status" 
                    className="form-label"
                  >
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

                <div className="form-group">
                  <label 
                    htmlFor="edit-region" 
                    className="form-label"
                  >
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
                      <option 
                        key={r.regionID} 
                        value={r.regionID}
                      >
                        {r.regionName}
                      </option>
                    ))}
                  </select>
                </div>

                {isCon ? (
                  <div className="form-group">
                    <label 
                      htmlFor="edit-job-title" 
                      className="form-label"
                    >
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
                    <label 
                      htmlFor="edit-department" 
                      className="form-label"
                    >
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

                <button 
                  className="btn btn--primary emp-dir__full-width-btn" 
                  onClick={handleSaveEmploymentRecord} 
                  disabled={editSaving}
                >
                  {editSaving ? "Saving…" : "Save Employment Record"}
                </button>
              </div>

              {isCon && (
                <div className="emp-dir-canvas__section">
                  <div className="emp-dir-canvas__section-header-row">
                    <h4 className="emp-dir-canvas__section-title">
                      Performance Reviews
                    </h4>
                    <button 
                      className="btn btn--primary btn--sm" 
                      onClick={() => openReviewCanvas(emp)}
                    >
                      Write review
                    </button>
                  </div>

                  {(() => {
                    const reviews = registry.getPerformanceReviewsForUser(emp.employeeID);
                    if (reviews.length === 0) {
                      return (
                        <div className="emp-dir-canvas__no-reviews">
                          No performance reviews yet.
                        </div>
                      );
                    }
                    
                    return reviews.map((r) => {
                      const reviewer = registry.getUserByID(r.reviewerID);
                      const reviewerName = reviewer 
                        ? `${reviewer.firstName} ${reviewer.lastName}` 
                        : r.reviewerID;
                      
                      return (
                        <div 
                          key={r.reviewID} 
                          className="emp-dir-canvas__review-card"
                        >
                          <div className="emp-dir-canvas__review-top">
                            <div>
                              <div className="emp-dir-canvas__review-period">
                                {formatDate(r.reviewPeriodStart)} — {formatDate(r.reviewPeriodEnd)}
                              </div>
                              <div className="emp-dir-canvas__review-sub">
                                Review period
                              </div>
                            </div>
                            <Stars rating={r.rating} />
                          </div>
                          <div className="emp-dir-canvas__review-body">
                            {r.writtenEvaluation}
                          </div>
                          <div className="emp-dir-canvas__review-meta">
                            <span>
                              Reviewed by {reviewerName}
                            </span>
                            <span className="emp-dir-canvas__review-sep">
                              ·
                            </span>
                            <span className="badge badge--info emp-dir__review-id">
                              {r.reviewerID}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          );
        })()}
      </RightCanvas>

      {/* create profile flow */}
      <RightCanvas 
        isOpen={createOpen} 
        onClose={() => { 
          setCreateOpen(false); 
          setCrSuccess(null); 
        }} 
        title="Create Consultant Profile" 
        footer={
          !crSuccess ? (
            <>
              <button 
                className="btn btn--secondary" 
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn--primary" 
                onClick={handleSubmitCreate}
              >
                Create Profile
              </button>
            </>
          ) : undefined
        }
      >
        {crSuccess ? (
          <div className="emp-dir-canvas__create-success">
            <svg 
              className="emp-dir__icon-md" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <h3>Profile Created</h3>
            <p>
              {crSuccess.firstName} {crSuccess.lastName} added.<br/>
              ID: <code>{crSuccess.employeeID}</code>
            </p>
            <button 
              className="btn btn--primary" 
              onClick={() => { 
                setCreateOpen(false); 
                setCrSuccess(null); 
              }}
            >
              Back to Directory
            </button>
          </div>
        ) : (
          <div className="emp-dir-create-canvas">
            {crErr && (
              <div className="emp-dir-canvas__error">
                {crErr}
              </div>
            )}
            
            <div className="emp-dir-canvas__grid-2">
              <div className="form-group">
                <label 
                  htmlFor="cr-fn" 
                  className="form-label form-label--required"
                >
                  First Name
                </label>
                <input 
                  id="cr-fn" 
                  type="text" 
                  className="form-input" 
                  value={crFn} 
                  onChange={(e) => setCrFn(e.target.value)} 
                />
              </div>
              <div className="form-group">
                <label 
                  htmlFor="cr-ln" 
                  className="form-label form-label--required"
                >
                  Last Name
                </label>
                <input 
                  id="cr-ln" 
                  type="text" 
                  className="form-input" 
                  value={crLn} 
                  onChange={(e) => setCrLn(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="form-group">
              <label 
                htmlFor="cr-un" 
                className="form-label form-label--required"
              >
                Username
              </label>
              <input 
                id="cr-un" 
                type="text" 
                className="form-input" 
                value={crUser} 
                onChange={(e) => setCrUser(e.target.value)} 
              />
            </div>
            
            <div className="emp-dir-canvas__grid-2">
              <div className="form-group">
                <label 
                  htmlFor="cr-role" 
                  className="form-label form-label--required"
                >
                  Role
                </label>
                <select 
                  id="cr-role" 
                  className="form-select" 
                  value={crRole} 
                  onChange={(e) => setCrRole(e.target.value)}
                >
                  <option value="CONSULTANT">Consultant</option>
                  <option value="HUMAN_RESOURCES">HR Staff</option>
                </select>
              </div>
              <div className="form-group">
                <label 
                  htmlFor="cr-reg" 
                  className="form-label form-label--required"
                >
                  Region
                </label>
                <select 
                  id="cr-reg" 
                  className="form-select" 
                  value={crRegion} 
                  onChange={(e) => setCrRegion(e.target.value)}
                >
                  {regions.map((r) => (
                    <option 
                      key={r.regionID} 
                      value={r.regionID}
                    >
                      {r.regionName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label 
                htmlFor="cr-job" 
                className="form-label"
              >
                Job Title
              </label>
              <input 
                id="cr-job" 
                type="text" 
                className="form-input" 
                value={crJob} 
                onChange={(e) => setCrJob(e.target.value)} 
              />
            </div>
            
            <div className="emp-dir-canvas__grid-2">
              <div className="form-group">
                <label 
                  htmlFor="cr-gen" 
                  className="form-label"
                >
                  Gender
                </label>
                <select 
                  id="cr-gen" 
                  className="form-select" 
                  value={crGender} 
                  onChange={(e) => setCrGender(e.target.value)}
                >
                  <option value="">Prefer not to say</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label 
                  htmlFor="cr-dob" 
                  className="form-label"
                >
                  Date of Birth
                </label>
                <input 
                  id="cr-dob" 
                  type="date" 
                  className="form-input" 
                  value={crDob} 
                  onChange={(e) => setCrDob(e.target.value)} 
                />
              </div>
            </div>
          </div>
        )}
      </RightCanvas>

      {/* write review flow */}
      <RightCanvas 
        isOpen={!!reviewTarget} 
        onClose={() => { 
          setReviewTarget(null); 
          setRvSuccess(false); 
        }} 
        title="Write Performance Review" 
        footer={
          !rvSuccess ? (
            <>
              <button 
                className="btn btn--secondary" 
                onClick={() => setReviewTarget(null)}
              >
                Cancel
              </button>
              <button 
                className="btn btn--primary" 
                onClick={handleSubmitReview}
              >
                Submit
              </button>
            </>
          ) : undefined
        }
      >
        {reviewTarget && (
          rvSuccess ? (
            <div className="emp-dir-canvas__create-success">
              <svg 
                className="emp-dir__icon-md" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
              <h3>Review Submitted</h3>
              <button 
                className="btn btn--primary" 
                onClick={() => setReviewTarget(null)}
              >
                Back
              </button>
            </div>
          ) : (
            <div className="emp-dir-create-canvas">
              {rvErr && (
                <div className="emp-dir-canvas__error">
                  {rvErr}
                </div>
              )}
              
              <div className="emp-dir-canvas__grid-2">
                <div className="form-group">
                  <label 
                    htmlFor="rv-start" 
                    className="form-label form-label--required"
                  >
                    Start
                  </label>
                  <input 
                    id="rv-start" 
                    type="date" 
                    className="form-input" 
                    value={rvPs} 
                    onChange={(e) => setRvPs(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label 
                    htmlFor="rv-end" 
                    className="form-label form-label--required"
                  >
                    End
                  </label>
                  <input 
                    id="rv-end" 
                    type="date" 
                    className="form-input" 
                    value={rvPe} 
                    onChange={(e) => setRvPe(e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label 
                  htmlFor="rv-rate" 
                  className="form-label form-label--required"
                >
                  Rating
                </label>
                <select 
                  id="rv-rate" 
                  className="form-select" 
                  value={rvRating} 
                  onChange={(e) => setRvRating(e.target.value)}
                >
                  <option value="1">1 - Unsatisfactory</option>
                  <option value="2">2 - Needs improvement</option>
                  <option value="3">3 - Meets expectations</option>
                  <option value="4">4 - Exceeds</option>
                  <option value="5">5 - Outstanding</option>
                </select>
              </div>
              
              <div className="form-group">
                <label 
                  htmlFor="rv-text" 
                  className="form-label form-label--required"
                >
                  Evaluation
                </label>
                <textarea 
                  id="rv-text" 
                  className="form-textarea" 
                  rows={6} 
                  value={rvText} 
                  onChange={(e) => setRvText(e.target.value)} 
                />
              </div>
            </div>
          )
        )}
      </RightCanvas>
    </div>
  );
}