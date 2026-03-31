/**
 * MyDetails.tsx
 * -------------
 * The personal information self-service page. Employees can view their core details and edit certain fields themselves via a right-hand canvas UI.
 */

import React, { useState, useCallback } from "react";

import { useAuth } from "../../context/AuthContext";
import { getRegistry } from "../../services/Registry";
import RightCanvas from "../../components/common/RightCanvas";
import { Role } from "../../models/enums";
import type { AppUser, ConsultantUser, StaffUser } from "../../models/interfaces";
import "./MyDetails.css";

// ---------------------------------------------------------------------------
// Helper: format a Date to "14 March 1998"
// ---------------------------------------------------------------------------
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Helper: mask a bank account number — show only last 4 digits
// e.g. "12345678" → "****5678"
// ---------------------------------------------------------------------------
function maskAccountNumber(num: string): string {
  if (num.length <= 4) return num;
  return "•".repeat(num.length - 4) + num.slice(-4);
}

// ---------------------------------------------------------------------------
// Helper: convert a Date to the HTML date input format "YYYY-MM-DD"
// ---------------------------------------------------------------------------
function toInputDate(date: Date): string {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Helper: human-readable role label
// ---------------------------------------------------------------------------
function roleLabel(role: Role): string {
  switch (role) {
    case Role.CONSULTANT:      return "Consultant";
    case Role.HUMAN_RESOURCES: return "Human Resources";
    case Role.IT_SUPPORT:      return "IT Support";
    default:                   return role;
  }
}

// ---------------------------------------------------------------------------
// DetailRow subcomponent — a label + value pair inside a card
// ---------------------------------------------------------------------------
/**
 * Renders a single key/value row inside a details card.
 * Used consistently across all four cards for visual alignment.
 *
 * @param label    - The field name (e.g. "Date of Birth")
 * @param value    - The field value to display
 * @param mono     - If true, renders value in monospace (for IDs, numbers)
 * @param locked   - If true, shows a small lock icon beside the value
 *                   indicating this field cannot be self-edited (RQ11)
 */
function DetailRow({
  label,
  value,
  mono = false,
  locked = false,
}: {
  label: string;
  value: string | React.ReactNode;
  mono?: boolean;
  locked?: boolean;
}) {
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <span className={`detail-row__value ${mono ? "detail-row__value--mono" : ""}`}>
        {value}
        {locked && (
          <svg
            className="detail-row__lock"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-label="This field cannot be edited"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
            />
          </svg>
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditIconButton subcomponent — the pencil icon that opens a canvas
// ---------------------------------------------------------------------------
function EditIconButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      className="edit-icon-btn"
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    </button>
  );
}

// ---------------------------------------------------------------------------
// MyDetails component
// ---------------------------------------------------------------------------
export default function MyDetails() {
  const { currentUser, refreshCurrentUser } = useAuth();

  // -------------------------------------------------------------------------
  // Canvas open/close state — one boolean per canvas section
  // -------------------------------------------------------------------------
  const [personalCanvasOpen,  setPersonalCanvasOpen]  = useState(false);
  const [contactCanvasOpen,   setContactCanvasOpen]   = useState(false);
  const [bankCanvasOpen,      setBankCanvasOpen]       = useState(false);

  // -------------------------------------------------------------------------
  // Canvas form field state — Personal Info
  // -------------------------------------------------------------------------
  const [editFirstName,   setEditFirstName]   = useState("");
  const [editLastName,    setEditLastName]     = useState("");
  const [editGender,      setEditGender]       = useState("");
  const [editDOB,         setEditDOB]          = useState("");

  // -------------------------------------------------------------------------
  // Canvas form field state — Address & Contact
  // -------------------------------------------------------------------------
  const [editAddress, setEditAddress] = useState("");
  const [editPhone,   setEditPhone]   = useState("");
  const [editMobile,  setEditMobile]  = useState("");

  // -------------------------------------------------------------------------
  // Canvas form field state — Bank Details
  // -------------------------------------------------------------------------
  const [editBankName,          setEditBankName]          = useState("");
  const [editBankAccountName,   setEditBankAccountName]   = useState("");
  const [editBankAccountNumber, setEditBankAccountNumber] = useState("");
  const [editBankSortCode,      setEditBankSortCode]      = useState("");

  // -------------------------------------------------------------------------
  // Shared canvas UI state
  // -------------------------------------------------------------------------
  /** Which canvas section is saving — shows loading state on its submit button */
  const [saving,        setSaving]        = useState(false);
  /** Success message to flash briefly after a successful save */
  const [saveSuccess,   setSaveSuccess]   = useState(false);
  /** Error message if the save fails */
  const [saveError,     setSaveError]     = useState("");

  if (!currentUser) return null;

  // -------------------------------------------------------------------------
  // Region name lookup
  // -------------------------------------------------------------------------
  const region = getRegistry().getRegionByID(currentUser.regionID);
  const regionName = region?.regionName ?? currentUser.regionID;

  // -------------------------------------------------------------------------
  // Open canvases — pre-fill form fields from current user data
  // -------------------------------------------------------------------------
  /**
   * Each open...Canvas function seeds the form state from the live currentUser
   * object before opening. This means if the user edits and cancels, the next
   * time they open the canvas the form shows their real current values again.
   */
  const openPersonalCanvas = useCallback(() => {
    setEditFirstName(currentUser.firstName);
    setEditLastName(currentUser.lastName);
    setEditGender(currentUser.gender);
    setEditDOB(toInputDate(currentUser.dateOfBirth));
    setSaveError("");
    setSaveSuccess(false);
    setPersonalCanvasOpen(true);
  }, [currentUser]);

  const openContactCanvas = useCallback(() => {
    setEditAddress(currentUser.address);
    setEditPhone(currentUser.phone);
    setEditMobile(currentUser.mobile);
    setSaveError("");
    setSaveSuccess(false);
    setContactCanvasOpen(true);
  }, [currentUser]);

  const openBankCanvas = useCallback(() => {
    setEditBankName(currentUser.bankName);
    setEditBankAccountName(currentUser.bankAccountName);
    setEditBankAccountNumber(currentUser.bankAccountNumber);
    setEditBankSortCode(currentUser.bankSortCode);
    setSaveError("");
    setSaveSuccess(false);
    setBankCanvasOpen(true);
  }, [currentUser]);

  // -------------------------------------------------------------------------
  // Generic save handler
  // -------------------------------------------------------------------------
  /**
   * Calls Registry.updatePersonalDetails() with the given partial updates,
   * then calls AuthContext.refreshCurrentUser() with the returned updated user
   * so the Navbar avatar and name update immediately in the same render cycle.
   *
   * Shows a 1.5s success state then closes the canvas.
   *
   * @param updates   - The partial AppUser fields to save
   * @param onClose   - Callback to close the specific canvas after save
   */
  const handleSave = useCallback(
    async (updates: Partial<AppUser>, onClose: () => void) => {
      setSaving(true);
      setSaveError("");

      try {
        /* Simulate brief async delay for UX realism */
        await new Promise((resolve) => setTimeout(resolve, 300));

        const updated = getRegistry().updatePersonalDetails(
          currentUser.employeeID,
          updates
        );

        if (updated) {
          /* Reflect changes in the Navbar/header immediately */
          refreshCurrentUser(updated);
          setSaveSuccess(true);
          /* Auto-close after brief success flash */
          setTimeout(() => {
            onClose();
            setSaveSuccess(false);
          }, 1200);
        } else {
          setSaveError("Unable to save changes. Please try again.");
        }
      } finally {
        setSaving(false);
      }
    },
    [currentUser.employeeID, refreshCurrentUser]
  );

  // -------------------------------------------------------------------------
  // Derived display values
  // -------------------------------------------------------------------------
  /** Initials for the avatar circle */
  const initials = `${currentUser.firstName[0]}${currentUser.lastName[0]}`.toUpperCase();

  /** Role-specific title/department line */
  const roleSpecificLine =
    currentUser.role === Role.CONSULTANT
      ? (currentUser as ConsultantUser).jobTitle
      : (currentUser as StaffUser).department;

  // -------------------------------------------------------------------------
  // Inline success/error alert (shared across all canvases)
  // -------------------------------------------------------------------------
  const SaveAlert = () => {
    if (saveSuccess) {
      return (
        <div className="my-details-canvas__success" role="status">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Changes saved successfully.
        </div>
      );
    }
    if (saveError) {
      return (
        <div className="my-details-canvas__error" role="alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {saveError}
        </div>
      );
    }
    return null;
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="my-details-page">

      {/* =================================================================
          CARD 1 — PROFILE (full width)
          Shows the employee's core identity information.
          Employee ID shown with a lock icon (non-editable, RQ11).
          ================================================================= */}
      <div className="my-details-card my-details-card--profile">
        {/* Edit icon — opens Personal Info canvas */}
        <EditIconButton
          onClick={openPersonalCanvas}
          label="Edit personal information"
        />

        {/* Avatar + name block */}
        <div className="profile-card__hero">
          <div className="profile-card__avatar" aria-hidden="true">
            {initials}
          </div>
          <div className="profile-card__identity">
            <h2 className="profile-card__name">
              {currentUser.firstName} {currentUser.lastName}
            </h2>
            <p className="profile-card__role-line">{roleSpecificLine}</p>
            <div className="profile-card__badges">
              <span className="badge badge--success">
                {currentUser.employmentStatus.replace("_", " ")}
              </span>
              <span className="badge badge--neutral">
                {roleLabel(currentUser.role)}
              </span>
            </div>
          </div>
        </div>

        {/* Detail rows — personal info grid */}
        <div className="my-details-card__grid">
          <DetailRow
            label="Employee ID"
            value={currentUser.employeeID}
            mono
            locked /* Non-editable — RQ11 */
          />
          <DetailRow label="Username"       value={currentUser.username} mono locked />
          <DetailRow label="Gender"         value={currentUser.gender} />
          <DetailRow label="Date of Birth"  value={formatDate(currentUser.dateOfBirth)} />
          <DetailRow label="NI Number"      value={currentUser.niNumber} mono locked />
          <DetailRow label="Start Date"     value={formatDate(currentUser.startDate)} locked />
        </div>
      </div>

      {/* =================================================================
          ROW 2: Address & Contact + Employment Info (side by side)
          ================================================================= */}
      <div className="my-details-row my-details-row--2col">

        {/* CARD 2 — ADDRESS & CONTACT */}
        <div className="my-details-card">
          <div className="my-details-card__header">
            <h3 className="my-details-card__title">Address & Contact</h3>
            <EditIconButton
              onClick={openContactCanvas}
              label="Edit address and contact details"
            />
          </div>
          <div className="my-details-card__fields">
            <DetailRow label="Home Address" value={currentUser.address} />
            <DetailRow label="Work Phone"   value={currentUser.phone} mono />
            <DetailRow label="Mobile"       value={currentUser.mobile} mono />
            <DetailRow label="Work Email"   value={currentUser.email} locked />
          </div>
        </div>

        {/* CARD 3 — EMPLOYMENT INFO (read-only — HR-managed) */}
        <div className="my-details-card">
          <div className="my-details-card__header">
            <h3 className="my-details-card__title">Employment</h3>
            {/* No edit icon — these fields are HR-managed only */}
            <span className="my-details-card__hr-note">Managed by HR</span>
          </div>
          <div className="my-details-card__fields">
            <DetailRow label="Role"        value={roleLabel(currentUser.role)}                locked />
            <DetailRow label="Region"      value={regionName}                                 locked />
            <DetailRow label="Status"      value={currentUser.employmentStatus.replace("_", " ")} locked />
            <DetailRow label="Start Date"  value={formatDate(currentUser.startDate)}          locked />
            {currentUser.role === Role.CONSULTANT && (
              <DetailRow label="Job Title" value={(currentUser as ConsultantUser).jobTitle}   locked />
            )}
            {currentUser.role !== Role.CONSULTANT && (
              <DetailRow label="Department" value={(currentUser as StaffUser).department}     locked />
            )}
          </div>
        </div>
      </div>

      {/* =================================================================
          CARD 4 — BANK DETAILS (full width)
          Account number is masked — last 4 digits only.
          ================================================================= */}
      <div className="my-details-card">
        <div className="my-details-card__header">
          <h3 className="my-details-card__title">Bank Details</h3>
          <EditIconButton
            onClick={openBankCanvas}
            label="Edit bank details"
          />
        </div>
        <div className="my-details-card__fields my-details-card__fields--bank">
          <DetailRow
            label="Account Name"
            value={currentUser.bankAccountName}
          />
          <DetailRow
            label="Account Number"
            value={maskAccountNumber(currentUser.bankAccountNumber)}
            mono
          />
          <DetailRow
            label="Sort Code"
            value={currentUser.bankSortCode}
            mono
          />
          <DetailRow
            label="Bank"
            value={currentUser.bankName}
          />
        </div>
        <p className="my-details-card__bank-note">
          Bank detail changes take up to 2 working days to process.
          Contact payroll if you have any questions.
        </p>
      </div>

      {/* =================================================================
          CANVAS 1 — PERSONAL INFO
          Editable: firstName, lastName, gender, dateOfBirth
          Non-editable: employeeID, username, niNumber (shown greyed out)
          ================================================================= */}
      <RightCanvas
        isOpen={personalCanvasOpen}
        onClose={() => {
          setPersonalCanvasOpen(false);
          setSaveSuccess(false);
          setSaveError("");
        }}
        title="Edit Personal Information"
        footer={
          !saveSuccess ? (
            <>
              <button
                className="btn btn--secondary"
                onClick={() => setPersonalCanvasOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={() =>
                  handleSave(
                    {
                      firstName:   editFirstName.trim(),
                      lastName:    editLastName.trim(),
                      gender:      editGender.trim(),
                      dateOfBirth: new Date(editDOB),
                    },
                    () => setPersonalCanvasOpen(false)
                  )
                }
                disabled={saving || !editFirstName.trim() || !editLastName.trim()}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : undefined
        }
      >
        <div className="my-details-canvas">
          <SaveAlert />

          {/* Non-editable context fields — shown greyed out so user
              can confirm which account they're editing */}
          <div className="my-details-canvas__locked-fields">
            <p className="my-details-canvas__locked-label">
              Non-editable fields (RQ11)
            </p>
            <div className="my-details-canvas__locked-row">
              <span>Employee ID</span>
              <code>{currentUser.employeeID}</code>
            </div>
            <div className="my-details-canvas__locked-row">
              <span>Username</span>
              <code>{currentUser.username}</code>
            </div>
          </div>

          {/* Editable fields */}
          <div className="form-group">
            <label htmlFor="edit-firstname" className="form-label form-label--required">
              First Name
            </label>
            <input
              id="edit-firstname"
              type="text"
              className="form-input"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
              disabled={saving}
              autoComplete="given-name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-lastname" className="form-label form-label--required">
              Last Name
            </label>
            <input
              id="edit-lastname"
              type="text"
              className="form-input"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
              disabled={saving}
              autoComplete="family-name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-gender" className="form-label">
              Gender
            </label>
            <select
              id="edit-gender"
              className="form-select"
              value={editGender}
              onChange={(e) => setEditGender(e.target.value)}
              disabled={saving}
            >
              <option value="">Prefer not to say</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="edit-dob" className="form-label">
              Date of Birth
            </label>
            <input
              id="edit-dob"
              type="date"
              className="form-input"
              value={editDOB}
              onChange={(e) => setEditDOB(e.target.value)}
              disabled={saving}
              max={toInputDate(new Date())}
              autoComplete="bday"
            />
          </div>
        </div>
      </RightCanvas>

      {/* =================================================================
          CANVAS 2 — ADDRESS & CONTACT
          Editable: address, phone, mobile
          Non-editable: email (work email managed by IT)
          ================================================================= */}
      <RightCanvas
        isOpen={contactCanvasOpen}
        onClose={() => {
          setContactCanvasOpen(false);
          setSaveSuccess(false);
          setSaveError("");
        }}
        title="Edit Address & Contact"
        footer={
          !saveSuccess ? (
            <>
              <button
                className="btn btn--secondary"
                onClick={() => setContactCanvasOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={() =>
                  handleSave(
                    {
                      address: editAddress.trim(),
                      phone:   editPhone.trim(),
                      mobile:  editMobile.trim(),
                    },
                    () => setContactCanvasOpen(false)
                  )
                }
                disabled={saving || !editAddress.trim()}
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : undefined
        }
      >
        <div className="my-details-canvas">
          <SaveAlert />

          <div className="form-group">
            <label htmlFor="edit-address" className="form-label form-label--required">
              Home Address
            </label>
            <textarea
              id="edit-address"
              className="form-textarea"
              rows={3}
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              disabled={saving}
              placeholder="e.g. 14 Canary Wharf Lane, Flat 3, London, E14 5AB"
              autoComplete="street-address"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-phone" className="form-label">
              Work Phone
            </label>
            <input
              id="edit-phone"
              type="tel"
              className="form-input"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              disabled={saving}
              placeholder="e.g. 020 7946 0123"
              autoComplete="work tel"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-mobile" className="form-label">
              Mobile
            </label>
            <input
              id="edit-mobile"
              type="tel"
              className="form-input"
              value={editMobile}
              onChange={(e) => setEditMobile(e.target.value)}
              disabled={saving}
              placeholder="e.g. 07700 900123"
              autoComplete="mobile tel"
            />
          </div>

          {/* Non-editable email note */}
          <div className="my-details-canvas__locked-fields">
            <p className="my-details-canvas__locked-label">
              Managed by IT (not editable)
            </p>
            <div className="my-details-canvas__locked-row">
              <span>Work Email</span>
              <code>{currentUser.email}</code>
            </div>
          </div>
        </div>
      </RightCanvas>

      {/* =================================================================
          CANVAS 3 — BANK DETAILS
          All four bank fields are editable here.
          A clear warning is shown that changes take 2 working days.
          ================================================================= */}
      <RightCanvas
        isOpen={bankCanvasOpen}
        onClose={() => {
          setBankCanvasOpen(false);
          setSaveSuccess(false);
          setSaveError("");
        }}
        title="Edit Bank Details"
        footer={
          !saveSuccess ? (
            <>
              <button
                className="btn btn--secondary"
                onClick={() => setBankCanvasOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                onClick={() =>
                  handleSave(
                    {
                      bankName:          editBankName.trim(),
                      bankAccountName:   editBankAccountName.trim(),
                      bankAccountNumber: editBankAccountNumber.trim(),
                      bankSortCode:      editBankSortCode.trim(),
                    },
                    () => setBankCanvasOpen(false)
                  )
                }
                disabled={
                  saving ||
                  !editBankName.trim() ||
                  !editBankAccountName.trim() ||
                  !editBankAccountNumber.trim() ||
                  !editBankSortCode.trim()
                }
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </>
          ) : undefined
        }
      >
        <div className="my-details-canvas">
          <SaveAlert />

          {/* Warning banner — bank changes have payroll implications */}
          <div className="my-details-canvas__bank-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <div>
              <p className="my-details-canvas__bank-warning-title">
                Important
              </p>
              <p className="my-details-canvas__bank-warning-body">
                Bank detail changes take up to 2 working days to process.
                Ensure your details are correct to avoid payroll delays.
              </p>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-bank-name" className="form-label form-label--required">
              Bank Name
            </label>
            <input
              id="edit-bank-name"
              type="text"
              className="form-input"
              value={editBankName}
              onChange={(e) => setEditBankName(e.target.value)}
              disabled={saving}
              placeholder="e.g. Barclays Bank"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-account-name" className="form-label form-label--required">
              Account Name
            </label>
            <input
              id="edit-account-name"
              type="text"
              className="form-input"
              value={editBankAccountName}
              onChange={(e) => setEditBankAccountName(e.target.value)}
              disabled={saving}
              placeholder="e.g. Aisha Patel"
              autoComplete="cc-name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-account-number" className="form-label form-label--required">
              Account Number
            </label>
            <input
              id="edit-account-number"
              type="text"
              className="form-input"
              value={editBankAccountNumber}
              onChange={(e) =>
                /* Only allow digits — UK account numbers are 8 digits */
                setEditBankAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 8))
              }
              disabled={saving}
              placeholder="8-digit account number"
              maxLength={8}
              inputMode="numeric"
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-sort-code" className="form-label form-label--required">
              Sort Code
            </label>
            <input
              id="edit-sort-code"
              type="text"
              className="form-input"
              value={editBankSortCode}
              onChange={(e) => setEditBankSortCode(e.target.value)}
              disabled={saving}
              placeholder="e.g. 20-15-40"
              maxLength={8}
            />
          </div>
        </div>
      </RightCanvas>
    </div>
  );
}
