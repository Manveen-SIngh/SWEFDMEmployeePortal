/**
 * enums.ts
 * --------
 * Central definition of all enumeration types used throughout the FDM Employee Portal.
 *
 * These enumerations map to the <<enumeration>> types defined in our
 * class diagram. 
 */

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------
/**
 * Represents the role assigned to every User account in the system.
 * Used by the Registry singleton and AuthContext to determine which
 * dashboard, navbar variant, and protected routes a user can access.
 *
 * Corresponds to: <<enumeration>> Role in the class diagram.
 *   CONSULTANT      -> FDM consultant 
 *   HUMAN_RESOURCES -> HR staff 
 *   IT_SUPPORT      -> IT administrator 
 */
export enum Role {
  CONSULTANT = "CONSULTANT",
  HUMAN_RESOURCES = "HUMAN_RESOURCES",
  IT_SUPPORT = "IT_SUPPORT",
}

// ---------------------------------------------------------------------------
// EmploymentStatus
// ---------------------------------------------------------------------------
/**
 * Tracks the current employment state of any User in the system.
 * Displayed on the My Details page and used by HR to filter employees
 * in the Employee Directory.
 *
 * Corresponds to: <<enumeration>> EmploymentStatus in the class diagram.
 *   ACTIVE     -> Employee is currently working
 *   TERMINATED -> Employment has ended
 *   ON_LEAVE   -> Employee is currently on approved leave
 */
export enum EmploymentStatus {
  ACTIVE = "ACTIVE",
  TERMINATED = "TERMINATED",
  ON_LEAVE = "ON_LEAVE",
}

// ---------------------------------------------------------------------------
// LeaveType
// ---------------------------------------------------------------------------
/**
 * The type of leave being requested by an employee.
 *
 * Corresponds to: <<enumeration>> LeaveType in the class diagram.
 *   ANNUAL -> Standard annual leave entitlement
 *   SICK   -> Sick leave
 *   OTHER  -> Any other approved leave category (e.g. compassionate, study)
 */
export enum LeaveType {
  ANNUAL = "ANNUAL",
  SICK = "SICK",
  OTHER = "OTHER",
}

// ---------------------------------------------------------------------------
// LeaveStatus
// ---------------------------------------------------------------------------
/**
 * The current approval state of a submitted leave request.
 * Used for colour coding on the Absence & Holidays calendar:
 *   APPROVED  -> green background on calendar day
 *   PENDING   -> amber background on calendar day
 *   REJECTED  -> shown in leave history only, not on calendar
 *   CANCELLED -> shown in leave history only, not on calendar
 *
 * Corresponds to: <<enumeration>> LeaveStatus in the class diagram.
 */
export enum LeaveStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
}

// ---------------------------------------------------------------------------
// QueryStatus
// ---------------------------------------------------------------------------
/**
 * The current state of an employee query.
 * Used for colour-coded status badges on the Queries page:
 *   PENDING     -> amber  (submitted, not yet picked up by HR/IT)
 *   IN_PROGRESS -> blue   (actively being handled)
 *   RESOLVED    -> green  (a response has been written and saved)
 *
 * Corresponds to: <<enumeration>> QueryStatus in the class diagram.
 */
export enum QueryStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  RESOLVED = "RESOLVED",
}

// ---------------------------------------------------------------------------
// QueryCategory
// ---------------------------------------------------------------------------
/**
 * The department or topic area that a query is directed at.
 *
 * Corresponds to: <<enumeration>> QueryCategory in the class diagram.
 *   HR      -> Human resources related query (leave, contracts, policies)
 *   IT      -> Technical or system access query (passwords, portal issues)
 *   PAYROLL -> Pay, deductions, or tax related query
 *   OTHER   -> Any query that does not fit the above categories
 */
export enum QueryCategory {
  HR = "HR",
  IT = "IT",
  PAYROLL = "PAYROLL",
  OTHER = "OTHER",
}

// ---------------------------------------------------------------------------
// TrainingStatus
// ---------------------------------------------------------------------------
/**
 * The completion state of an individual training record assigned to a consultant.
 *
 * Corresponds to: <<enumeration>> TrainingStatus in the class diagram.
 *   IN_PROGRESS -> Consultant has started but not yet finished the module
 *   COMPLETED   -> Consultant has successfully completed the module
 *   NOT_STARTED -> Module has been assigned but the consultant has not begun
 */
export enum TrainingStatus {
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  NOT_STARTED = "NOT_STARTED",
}
