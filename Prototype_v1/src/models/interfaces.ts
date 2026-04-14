/**
 * interfaces.ts
 * -------------
 * TypeScript interface definitions for every entity in our class diagram.
 *
 * These interfaces define the shape of all data objects used throughout the portal.
 * They correspond directly to the classes shown in the class diagram, preserving
 * attribute names and types as closely as TypeScript allows.
 *
 * Relationships from the class diagram (inheritance, associations) are represented
 * here through interface extension (extends) and property typing.
 *
 * All mock data objects in mockData.ts must conform to these interfaces.
 * All React components that consume data must type their props using these interfaces.
 */

import {
  Role,
  EmploymentStatus,
  LeaveType,
  LeaveStatus,
  QueryStatus,
  QueryCategory,
  TrainingStatus,
} from "./enums";

// ---------------------------------------------------------------------------
// AuditLog
// ---------------------------------------------------------------------------
/**
 * Corresponds to: AuditLog class in the class diagram.
 * Attributes:
 *   logID     -> Unique identifier for this audit entry
 *   timeStamp -> Exact date and time the event occurred
 *   action    -> Human-readable description of what happened (e.g. "User logged in")
 *   userID    -> The employeeID of the user who triggered or was affected by the event
 */
export interface AuditLog {
  logID: string;
  timeStamp: Date;
  action: string;
  userID: string;
}

// ---------------------------------------------------------------------------
// Payslip
// ---------------------------------------------------------------------------
/**
 * Corresponds to: Payslips class in the class diagram.
 *
 * Attributes:
 *   payslipID  ->Unique identifier for this payslip
 *   payPeriod  ->Human-readable label for the period (e.g. "March 2026")
 *   payDate    ->The actual date payment was made
 *   taxYear    -> Tax year this payslip falls within (e.g. "2025/2026")
 *   grossPay   -> Total pay before deductions (in GBP)
 *   deductions -> Total amount deducted (tax, NI, pension, etc.) (in GBP)
 *   netPay     -> Take-home pay after all deductions (in GBP)
 *   userID     -> The employeeID of the employee this payslip belongs to
 */
export interface Payslip {
  payslipID: string;
  payPeriod: string;
  payDate: Date;
  taxYear: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  userID: string;
}

// ---------------------------------------------------------------------------
// TimeSheet
// ---------------------------------------------------------------------------
/**
 * Corresponds to: Timesheets class in the class diagram.
 *
 * Attributes:
 *   timesheetID -> Unique identifier for this timesheet record
 *   weekEnding  -> The date of the last day of the work week covered
 *   hoursWorked -> Total number of hours worked during the week
 *   userID      -> The employeeID of the employee this timesheet belongs to
 */
export interface TimeSheet {
  timesheetID: string;
  weekEnding: Date;
  hoursWorked: number;
  userID: string;
}

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------
/**
 * Corresponds to: Schedule class in the class diagram.
 *
 * Attributes:
 *   scheduleID  -> Unique identifier for this schedule record
 *   workDays    -> Array of dates on which the employee is scheduled to work
 *   shiftStart  -> Start time of the working day (e.g. "09:00")
 *   shiftEnd    -> End time of the working day (e.g. "17:30")
 *   userID      -> The employeeID of the employee this schedule belongs to
 */
export interface Schedule {
  scheduleID: string;
  workDays: Date[];
  shiftStart: string;
  shiftEnd: string;
  userID: string;
}

// ---------------------------------------------------------------------------
// Announcement
// ---------------------------------------------------------------------------
/** *
 * Implements the Observable interface (from class diagram) — when HR posts
 * a new announcement, the NotificationContext sends an Observer notification
 * to all active users' notification queues.
 *
 * Corresponds to: Announcement class in the class diagram.
 *
 * Attributes:
 *   announcementID -> Unique identifier for this announcement
 *   title          -> Short headline displayed on the announcement card
 *   body           -> Full text content shown in the detail view
 *   postDate       -> Date the announcement was published
 *   expiryDate     -> Date after which the announcement is no longer relevant
 *   postedByUserID -> employeeID of the HR staff member who posted it
 */
export interface Announcement {
  announcementID: string;
  title: string;
  body: string;
  postDate: Date;
  expiryDate: Date;
  postedByUserID: string;
}

// ---------------------------------------------------------------------------
// Acknowledgement
// ---------------------------------------------------------------------------
/**
 * Records whether a specific employee has acknowledged a specific announcement.
 * If the employee skips it, no Acknowledgement record is created and it will
 * appear again on the next login.
 *
 * Corresponds to: Acknowledgement class in the class diagram.
 *
 * Attributes:
 *   announcementID  -> Which announcement was acknowledged
 *   userID          -> Which employee acknowledged it
 *   isMandatory     -> If true, the employee cannot skip this announcement
 *   acknowledgedAt  -> Timestamp of when acknowledgement was recorded
 */
export interface Acknowledgement {
  announcementID: string;
  userID: string;
  isMandatory: boolean;
  acknowledgedAt: Date;
}

// ---------------------------------------------------------------------------
// LeaveRequest
// ---------------------------------------------------------------------------
/**
 * Implements the Observable interface (class diagram) — status changes
 * trigger Observer notifications to the requesting employee.
 *
 * Corresponds to: LeaveRequest class in the class diagram.
 *
 * Attributes:
 *   leaveRequestID  -> Unique identifier, auto-generated on submission 
 *   startDate       -> First day of requested leave (inclusive)
 *   endDate         -> Last day of requested leave (inclusive)
 *   status          -> Current approval state (see LeaveStatus enum)
 *   rejectionReason -> HR must provide this when rejecting a request 
 *                     Null/undefined when status is not REJECTED
 *   submissionDate  -> Date and time the request was submitted
 *   type            -> The category of leave being requested (see LeaveType enum)
 *   userID          -> The employeeID of the employee making the request
 *   numberOfDays    -> Calculated number of working days the request covers
 */
export interface LeaveRequest {
  leaveRequestID: string;
  startDate: Date;
  endDate: Date;
  status: LeaveStatus;
  rejectionReason?: string;
  submissionDate: Date;
  type: LeaveType;
  userID: string;
  numberOfDays: number;
}

// ---------------------------------------------------------------------------
// Query
// ---------------------------------------------------------------------------
/**
 * Corresponds to: Query class in the class diagram.
 *
 * Attributes:
 *   queryID   -> Unique identifier for this query
 *   title     -> Short subject line for the query (shown on card)
 *   message   -> Full description of the issue or question
 *   category  -> Which department the query is directed to (see QueryCategory enum)
 *   status    -> Current handling state (see QueryStatus enum)
 *   response  -> The reply written by HR/IT when resolving the query
 *               Undefined/null while status is PENDING or IN_PROGRESS
 *   postDate  -> Date and time the query was submitted
 *   userID    -> The employeeID of the employee who submitted the query
 */
export interface Query {
  queryID: string;
  title: string;
  message: string;
  category: QueryCategory;
  status: QueryStatus;
  response?: string;
  postDate: Date;
  userID: string;
}

// ---------------------------------------------------------------------------
// TrainingRecord
// ---------------------------------------------------------------------------
/**
 * Represents a single training module assigned to a consultant.
 *
 * Corresponds to: TrainingRecord class in the class diagram.
 *
 * Attributes:
 *   trainingID      -> Unique identifier for this training record
 *   moduleName      -> Name of the training module
 *   completionDate  -> Date the module was completed (undefined if not yet done)
 *   trainingStatus  -> Current completion state (see TrainingStatus enum)
 *   userID          -> The employeeID of the consultant this record belongs to
 */
export interface TrainingRecord {
  trainingID: string;
  moduleName: string;
  completionDate?: Date;
  trainingStatus: TrainingStatus;
  userID: string;
}

// ---------------------------------------------------------------------------
// PerformanceReview
// ---------------------------------------------------------------------------
/**
 * Corresponds to: PerformanceReview class in the class diagram.
 *
 * Attributes:
 *   reviewID          -> Unique identifier for this review
 *   rating            -> Numeric score (e.g. 1-5) assigned by the reviewer
 *   writtenEvaluation -> Free-text narrative evaluation of performance 
 *   reviewPeriodStart -> First day of the period being reviewed 
 *   reviewPeriodEnd   -> Last day of the period being reviewed 
 *   userID            -> The employeeID of the consultant being reviewed
 *   reviewerID        -> The employeeID of the HR staff who wrote the review
 */
export interface PerformanceReview {
  reviewID: string;
  rating: number;
  writtenEvaluation: string;
  reviewPeriodStart: Date;
  reviewPeriodEnd: Date;
  userID: string;
  reviewerID: string;
}

// ---------------------------------------------------------------------------
// Region
// ---------------------------------------------------------------------------
/**
 * Corresponds to: Region class in the class diagram.
 *
 * Attributes:
 *   regionID   -> Unique identifier for the region
 *   regionName -> Human-readable region name (e.g. "London", "Leeds", "Glasgow")
 */
export interface Region {
  regionID: string;
  regionName: string;
}

// ---------------------------------------------------------------------------
// Notification
// ---------------------------------------------------------------------------
/**
 * Represents a single in-app notification in a user's notification queue.
 * This is the runtime representation of the Observer pattern
 * when Observable objects (LeaveRequest, Announcement) call notifyObservers(),
 * a Notification object is pushed into the NotificationContext queue for
 * the relevant user, and the bell icon in the header updates its badge count.
 *
 * This interface is not exactly in the class diagram but implements the
 * Observer/Observable pattern described there. It is an implementation detail
 * of how the frontend performs that design pattern without a backend.
 *
 * Attributes:
 *   notificationID -> Unique identifier for this notification
 *   message        -> Human-readable notification text
 *   timestamp      -> When the notification was generated
 *   isRead         -> Whether the user has opened/dismissed this notification
 *   type           -> Category for styling the notification (success/warning/info/danger)
 *   userID         -> The employeeID of the user who should receive this notification
 */
export interface Notification {
  notificationID: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type: "success" | "warning" | "info" | "danger";
  userID: string;
}

// ---------------------------------------------------------------------------
// User 
// ---------------------------------------------------------------------------
/**
 * Corresponds to the abstract User class at the centre of the class diagram.
 *
 * In the class diagram, User is abstract - it is never instantiated directly.
 * Having used typescript we represent this by having every user object conform to a
 * more specific interface (ConsultantUser | StaffUser) that extends this base.
 *
 * Attributes match the User class attributes from the class diagram:
 *   employeeID          -> Unique FDM employee identifier 
 *   username            -> Unique login username 
 *   passwordHash        -> plain string in mock data for demo purposes, but in a real system this would be a securely hashed password
 *   failedLoginAttempts -> Counter incremented on each failed login attempt 
 *   isLocked            -> True when failedLoginAttempts reaches MAX_LOGIN_ATTEMPTS 
 *   role                -> Enum value determining portal access level 
 *   leaveBalance        -> Number of remaining leave days 
 *   employmentStatus    -> Current employment state 
 *   firstName           -> Employee's first name
 *   lastName            -> Employee's last name
 *   email               -> Work email address
 *   phone               -> Office/landline phone number
 *   mobile              -> Mobile phone number
 *   address             -> Full home address (stored as a single formatted string)
 *   gender              -> Employee's gender 
 *   dateOfBirth         -> Employee's date of birth 
 *   niNumber            -> National Insurance number 
 *   startDate           -> Date the employee joined 
 *   regionID            -> employee's assigned Region
 */
export interface User {
  employeeID: string;
  username: string;
  passwordHash: string;
  failedLoginAttempts: number;
  isLocked: boolean;
  role: Role;
  leaveBalance: number;
  employmentStatus: EmploymentStatus;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  gender: string;
  dateOfBirth: Date;
  niNumber: string;
  startDate: Date;
  regionID: string;

  /* Bank details — self-editable by the employee via the bank details card */
  bankAccountName: string;
  bankAccountNumber: string;
  bankSortCode: string;
  bankName: string;
}

// ---------------------------------------------------------------------------
// ConsultantUser
// ---------------------------------------------------------------------------
/**
 * Extends the base User interface with consultant-specific attributes.
 * Corresponds to the Consultant class which inherits from User in the class diagram.
 *
 * Additional attributes beyond base User:
 *   jobTitle -> The specific role title the consultant holds at their client site
 *              (e.g. "Software Engineer", "Data Analyst", "Business Analyst")
 */
export interface ConsultantUser extends User {
  jobTitle: string;
}

// ---------------------------------------------------------------------------
// StaffUser
// ---------------------------------------------------------------------------
/**
 * Extends the base User interface for internal FDM staff (HR and IT Support).
 * Corresponds to InternalStaff → HumanResources / IT Support in the class diagram.
 *
 * HR and IT Support share the base User attributes but have access to
 * additional portal sections (Employee Directory, Leave Management, User Management,
 * Audit Log) determined by their Role enum value.
 *
 * Additional attributes beyond base User:
 *   department -> The internal FDM department the staff member belongs to
 *                (e.g. "Human Resources", "IT Operations")
 */
export interface StaffUser extends User {
  department: string;
}

// ---------------------------------------------------------------------------
// AppUser
// ---------------------------------------------------------------------------
/**
 * Union type representing any valid user object in the system.
 * Used by AuthContext to type the currently logged-in user, since the
 * logged-in user could be either a ConsultantUser or a StaffUser.
 *
 * Components that need to access role-specific attributes should narrow
 * the type using a type guard (e.g. checking user.role === Role.CONSULTANT).
 */
export type AppUser = ConsultantUser | StaffUser;
