/**
 * Registry.ts
 * -----------
 * The Registry is a Singleton class that acts as the single access point for
 * all data in the FDM Employee Portal prototype.
 *
 * DESIGN PATTERN: Singleton
 * -------------------------
 * The Singleton pattern ensures only one instance of Registry exists at runtime.
 *
 * Why Singleton?
 * Without a backend, all in-memory state changes (leave approvals, personal detail
 * updates, new queries, notification pushes) must persist within a single shared
 * data store for the duration of the session. If each component created its own
 * Registry instance, changes made in one component would not be visible in another.
 * The Singleton guarantees a single shared state across the entire application.
 *
 * How components use Registry:
 * Components never import from mockData.ts directly.
 * They call Registry.getInstance() and then call methods on the returned instance.
 *
 * It is mutable:
 * All arrays are copied from mockData on first instantiation.
 * Mutations (add, update, delete) are performed on the Registry's own
 * internal copies — mockData.ts itself is never mutated.
 * This means all changes persist only for the current browser session
 * and reset on page refresh, which is appropriate for a prototype.
 */

import {
  allUsers,
  announcements as seedAnnouncements,
  acknowledgements as seedAcknowledgements,
  leaveRequests as seedLeaveRequests,
  queries as seedQueries,
  payslips as seedPayslips,
  schedules as seedSchedules,
  timesheets as seedTimesheets,
  trainingRecords as seedTrainingRecords,
  performanceReviews as seedPerformanceReviews,
  auditLogs as seedAuditLogs,
  seedNotifications,
  regions as seedRegions,
} from "../data/mockData";

import type {
  AppUser,
  Announcement,
  Acknowledgement,
  LeaveRequest,
  Query,
  Payslip,
  Schedule,
  TimeSheet,
  TrainingRecord,
  PerformanceReview,
  AuditLog,
  Notification,
  Region,
} from "../models/interfaces";

import { LeaveStatus, QueryStatus, EmploymentStatus } from "../models/enums";

/**
 * The maximum number of consecutive failed login attempts before an account
 * is automatically locked.
 */
const MAX_LOGIN_ATTEMPTS = 5;

// ---------------------------------------------------------------------------
// Registry class
// ---------------------------------------------------------------------------
class Registry {
  // -------------------------------------------------------------------------
  // Singleton instance
  // -------------------------------------------------------------------------
  /**
   * The single private static instance of Registry.
   * null until getInstance() is called for the first time.
   * Corresponds to: -instance : Registry in the class diagram.
   */
  private static instance: Registry | null = null;

  // -------------------------------------------------------------------------
  // Internal data stores
  // -------------------------------------------------------------------------
  /**
   * Deep copies of all seed data. These are the live working copies —
   * all reads and writes operate on these arrays.
   * mockData.ts is only ever used as the initial seed and is not modified.
   */
  private users: AppUser[];
  private announcements: Announcement[];
  private acknowledgements: Acknowledgement[];
  private leaveRequests: LeaveRequest[];
  private queries: Query[];
  private payslips: Payslip[];
  private schedules: Schedule[];
  private timesheets: TimeSheet[];
  private trainingRecords: TrainingRecord[];
  private performanceReviews: PerformanceReview[];
  private auditLogs: AuditLog[];
  private notifications: Notification[];
  private regions: Region[];

  /**
   * Session-level login attempt tracking to prevent brute-force attacks.
   * Incremented on ANY failed login attempt (valid or invalid username).
   * Reset on successful login.
   * Prevents unlimited password guessing with incorrect usernames.
   */
  private globalFailedLoginAttempts: number = 0;

  // -------------------------------------------------------------------------
  // Private constructor
  // -------------------------------------------------------------------------
  /**
   * Private constructor — called only once by getInstance().
   * Initialises all internal data stores from the seed mock data.
   * Spreading into new arrays ensures Registry has its own copies
   * and mockData arrays remain unmodified.
   */
  private constructor() {
    /* Clone seed arrays into mutable working copies */
    this.users = [...allUsers];
    this.announcements = [...seedAnnouncements];
    this.acknowledgements = [...seedAcknowledgements];
    this.leaveRequests = [...seedLeaveRequests];
    this.queries = [...seedQueries];
    this.payslips = [...seedPayslips];
    this.schedules = [...seedSchedules];
    this.timesheets = [...seedTimesheets];
    this.trainingRecords = [...seedTrainingRecords];
    this.performanceReviews = [...seedPerformanceReviews];
    this.auditLogs = [...seedAuditLogs];
    this.notifications = [...seedNotifications];
    this.regions = [...seedRegions];
    /* Session-level attempt tracking starts at 0 */
    this.globalFailedLoginAttempts = 0;
  }

  // -------------------------------------------------------------------------
  // getInstance() — the Singleton accessor
  // -------------------------------------------------------------------------
  /**
   * Returns the single shared Registry instance, creating it on first call.
   * All subsequent calls return the same instance with its accumulated state.
   */
  public static getInstance(): Registry {
    if (Registry.instance === null) {
      /* First call — create and store the singleton instance */
      Registry.instance = new Registry();
    }
    return Registry.instance;
  }

  // =========================================================================
  // AUTHENTICATION METHODS
  // =========================================================================

  /**
   * Attempts to authenticate a user with the given username and password.
   * Implements account lock logic at 2 separate levels:
   *   
   *   LEVEL 1 - Session level brute force protection(invalid usernames only):
   *   - Tracks failed attempts against non-existent usernames
   *   - After MAX_LOGIN_ATTEMPTS failures with invalid usernames, blocks further attempts
   *   - This prevents unlimited brute-force guessing of username/password combinations
   *   - Does not interfere with known users attempting with wrong passwords
   *   
   *   LEVEL 2 - user level account locking (valid usernames only):
   *   - Tracks failed password attempts for valid usernames
   *   - When a user's counter reaches MAX_LOGIN_ATTEMPTS, the account is locked
   *   - A locked account cannot log in even with the correct password
   *   - User-level failures are independent of global session attempts
   *   
   *
   * Also logs the login attempt to the audit log.
   *
   * @param username - The username entered on the login screen
   * @param password - The password entered on the login screen
   * @returns The matched AppUser if credentials are correct and account is not locked,
   *          or null if authentication fails.
   *          Also returns a descriptive error reason string for UI display.
   */
  public attemptLogin(
    username: string,
    password: string
  ): { user: AppUser | null; reason: string } {
    // Find user by username — usernames are unique 
    const userIndex = this.users.findIndex((u) => u.username === username);

    if (userIndex === -1) {
      // Username not found — increment ONLY the global/session counter 
      // This protects against brute-force guessing of username/password combinations 
      this.globalFailedLoginAttempts += 1;

      // Block further invalid username attempts after MAX_LOGIN_ATTEMPTS
      if (this.globalFailedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        return {
          user: null,
          reason:
            "Too many failed login attempts. Please refresh the page or contact IT Support.",
        };
      }

      return { user: null, reason: "Invalid username or password." };
    }

    const user = this.users[userIndex];

    // Once a valid username is found, the global session counter no longer applies
    // This user can attempt up to MAX_LOGIN_ATTEMPTS for their own account

    // Check if the account is already locked
    if (user.isLocked) {
      this.addAuditLog(
        user.employeeID,
        "Failed login attempt on locked account"
      );
      return {
        user: null,
        reason:
          "Your account has been locked due to too many failed login attempts. Please contact IT Support to unlock your account.",
      };
    }

    // Validate password (plain string comparison — demo only, no real hashing)
    if (user.passwordHash !== password) {
      // Increment the USER-LEVEL counter only (not global session counter)
      const newAttempts = user.failedLoginAttempts + 1;
      const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

      // Update the user record in our internal array 
      this.users[userIndex] = {
        ...user,
        failedLoginAttempts: newAttempts,
        isLocked: shouldLock,
      };

      // Log the failed attempt
      this.addAuditLog(
        user.employeeID,
        `Failed login attempt (${newAttempts} of ${MAX_LOGIN_ATTEMPTS})`
      );

      if (shouldLock) {
        // Log the lock event separately 
        this.addAuditLog(
          user.employeeID,
          "Account automatically locked after 5 consecutive failed login attempts"
        );
        return {
          user: null,
          reason: `Your account has been locked after ${MAX_LOGIN_ATTEMPTS} failed attempts. Please contact IT Support.`,
        };
      }

      const attemptsRemaining = MAX_LOGIN_ATTEMPTS - newAttempts;
      return {
        user: null,
        reason: `Invalid username or password. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? "s" : ""} remaining before your account is locked.`,
      };
    }

    // Successful login — reset both counters
    this.globalFailedLoginAttempts = 0;
    this.users[userIndex] = {
      ...user,
      failedLoginAttempts: 0,
    };

    // Log the successful login 
    this.addAuditLog(user.employeeID, "User logged in successfully");

    return { user: this.users[userIndex], reason: "" };
  }

  /**
   * Logs the user out and records the event in the audit log.
   *
   * @param userID - The employeeID of the user who is logging out
   */
  public logout(userID: string): void {
    this.addAuditLog(userID, "User logged out");
  }

  // =========================================================================
  // USER / ACCOUNT METHODS
  // =========================================================================

  /**
   * Returns a user by their unique employee ID.
   * Used by the HR Employee Directory, profile views, and the Registry itself.
   *
   * @param userID - The employeeID to look up 
   * @returns The matching AppUser, or undefined if not found
   */
  public getUserByID(userID: string): AppUser | undefined {
    return this.users.find((u) => u.employeeID === userID);
  }

  /**
   * Searches for users matching the given optional filter criteria.
   * Used by HR Employee Directory and IT Support User Management.
   *
   * All parameters are optional — calling with no arguments returns all users.
   * Matching is case-insensitive partial string matching for name/email fields.
   *
   * @param firstName        - Partial first name filter
   * @param lastName         - Partial last name filter
   * @param email            - Partial email filter
   * @param role             - Exact role enum filter
   * @param employmentStatus - Exact employment status enum filter
   * @param regionID         - Exact region ID filter
   * @returns Filtered array of AppUser objects
   */
  public findUsers(filters: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    employmentStatus?: string;
    regionID?: string;
  }): AppUser[] {
    return this.users.filter((user) => {
      /* Check each filter — skip (pass) if the filter value is not provided */
      if (
        filters.firstName &&
        !user.firstName.toLowerCase().includes(filters.firstName.toLowerCase())
      )
        return false;

      if (
        filters.lastName &&
        !user.lastName.toLowerCase().includes(filters.lastName.toLowerCase())
      )
        return false;

      if (
        filters.email &&
        !user.email.toLowerCase().includes(filters.email.toLowerCase())
      )
        return false;

      if (filters.role && user.role !== filters.role) return false;

      if (
        filters.employmentStatus &&
        user.employmentStatus !== filters.employmentStatus
      )
        return false;

      if (filters.regionID && user.regionID !== filters.regionID) return false;

      return true;
    });
  }

  /**
   * Updates the personal details of a user.
   * Called when an employee saves changes in the My Details right-side canvas.
   * Only the fields permitted for self-editing are updated — employee ID is
   * never modified through this method .
   *
   * Logs the update event to the audit trail .
   *
   * @param userID  - The employeeID of the user to update
   * @param updates - Partial User object containing only the changed fields
   * @returns The updated AppUser, or undefined if userID not found
   */
  public updatePersonalDetails(
    userID: string,
    updates: Partial<AppUser>
  ): AppUser | undefined {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return undefined;

    /* Merge updates — employeeID is explicitly excluded from any update */
    const { employeeID, ...safeUpdates } = updates as any;
    this.users[index] = { ...this.users[index], ...safeUpdates };

    /* Log the update */
    this.addAuditLog(userID, "Personal details updated");

    return this.users[index];
  }

  /**
   * Locks a user account. Called by IT Support from the User Management page.
   * Also triggered automatically by attemptLogin after MAX_LOGIN_ATTEMPTS failures.
   *
   * @param userID - The employeeID of the account to lock
   */
  public lockAccount(userID: string): void {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return;
    this.users[index] = { ...this.users[index], isLocked: true };
    this.addAuditLog(userID, "Account locked by IT Support");
  }

  /**
   * Unlocks a user account. Called by IT Support from the User Management page
   * or the locked accounts card on the IT Support dashboard.
   * Also resets the failed login attempt counter.
   *
   * @param userID - The employeeID of the account to unlock
   */
  public unlockAccount(userID: string): void {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return;
    this.users[index] = {
      ...this.users[index],
      isLocked: false,
      failedLoginAttempts: 0,
    };
    this.addAuditLog(userID, "Account unlocked by IT Support — failed attempt counter reset");
  }

  /**
   * Returns all user accounts in the system.
   * Used by IT Support User Management page and HR Employee Directory.
   */
  public getAllUsers(): AppUser[] {
    return [...this.users];
  }

  // =========================================================================
  // REGION METHODS
  // =========================================================================

  /**
   * Returns all regions in the system.
   * Used by HR when assigning a consultant to a region
   * and as filter options in the Employee Directory.
   */
  public getRegions(): Region[] {
    return [...this.regions];
  }

  /**
   * Returns a region by its ID.
   * Used by components that need to display the region name from a regionID.
   *
   * @param regionID - The regionID to look up
   */
  public getRegionByID(regionID: string): Region | undefined {
    return this.regions.find((r) => r.regionID === regionID);
  }

  // =========================================================================
  // ANNOUNCEMENT METHODS
  // =========================================================================



  /**
   * Returns all announcements that a specific user has NOT yet acknowledged.
   * These are shown sequentially on login.
   *
   * @param userID - The employeeID of the logged-in user
   * @returns Unacknowledged announcements, sorted by postDate ascending
   *          (oldest unacknowledged shown first)
   */
  public getUnacknowledgedAnnouncements(userID: string): Announcement[] {
    /* Collect the IDs of announcements this user has already acknowledged */
    const acknowledgedIDs = new Set(
      this.acknowledgements
        .filter((a) => a.userID === userID)
        .map((a) => a.announcementID)
    );

    /* Return announcements not in the acknowledged set, oldest first */
    return this.announcements
      .filter((ann) => !acknowledgedIDs.has(ann.announcementID))
      .sort((a, b) => a.postDate.getTime() - b.postDate.getTime());
  }

  /**
   * Records that a user has acknowledged a specific announcement.
   * Called when the user clicks "Acknowledge" in the login modal flow.
   * If "Skip" is clicked, this method is not called — the announcement
   * will appear again on next login.
   *
   * @param userID         - The employeeID of the user acknowledging
   * @param announcementID - The ID of the announcement being acknowledged
   */
  public acknowledgeAnnouncement(
    userID: string,
    announcementID: string
  ): void {
    /* Prevent duplicate acknowledgement records */
    const alreadyAcknowledged = this.acknowledgements.some(
      (a) => a.userID === userID && a.announcementID === announcementID
    );
    if (alreadyAcknowledged) return;

    this.acknowledgements.push({
      announcementID,
      userID,
      isMandatory: false,
      acknowledgedAt: new Date(),
    });
  }





  // =========================================================================
  // LEAVE REQUEST METHODS
  // =========================================================================

  /**
   * Returns all leave requests for a specific user.
   * Used on the Absence & Holidays page to colour the calendar
   * and populate the leave history list.
   *
   * @param userID - The employeeID of the user
   * @returns Leave requests sorted by submissionDate descending
   */
  public getLeaveRequestsForUser(userID: string): LeaveRequest[] {
    return this.leaveRequests
      .filter((lr) => lr.userID === userID)
      .sort((a, b) => b.submissionDate.getTime() - a.submissionDate.getTime());
  }

  /**
   * Returns all leave requests across all users.
   * Used by the HR Leave Management page to show the full queue.
   *
   * @returns All leave requests sorted by submissionDate descending
   */
  public getAllLeaveRequests(): LeaveRequest[] {
    return [...this.leaveRequests].sort(
      (a, b) => b.submissionDate.getTime() - a.submissionDate.getTime()
    );
  }

  /**
   * Returns all PENDING leave requests.
   * Used by the HR dashboard compact list and the HR Leave Management Pending tab.
   */
  public getPendingLeaveRequests(): LeaveRequest[] {
    return this.leaveRequests.filter(
      (lr) => lr.status === LeaveStatus.PENDING
    );
  }

  /**
   * Submits a new leave request on behalf of a user.
   * Validates that the user has sufficient leave balance before accepting.
   * Dispatches a notification to all HR users.
   *
   * @param leaveRequest - The leave request to submit (without leaveRequestID)
   * @returns Object containing the new request (if successful) or an error message
   */
  public submitLeaveRequest(
    leaveRequest: Omit<LeaveRequest, "leaveRequestID" | "status" | "submissionDate">
  ): { success: boolean; leaveRequest?: LeaveRequest; error?: string } {
    /* Find the requesting user */
    const userIndex = this.users.findIndex(
      (u) => u.employeeID === leaveRequest.userID
    );
    if (userIndex === -1) {
      return { success: false, error: "User not found." };
    }

    const user = this.users[userIndex];

    // Check sufficient leave balance
    if (leaveRequest.numberOfDays > user.leaveBalance) {
      return {
        success: false,
        error: `Insufficient leave balance. You have ${user.leaveBalance} days remaining but requested ${leaveRequest.numberOfDays} days.`,
      };
    }

    // Check for date conflicts with existing approved/pending requests
    const conflictingRequest = this.leaveRequests.find((lr) => {
      if (lr.userID !== leaveRequest.userID) return false;
      if (
        lr.status === LeaveStatus.REJECTED ||
        lr.status === LeaveStatus.CANCELLED
      )
        return false;
      // Check if date ranges overlap 
      return (
        leaveRequest.startDate <= lr.endDate &&
        leaveRequest.endDate >= lr.startDate
      );
    });

    if (conflictingRequest) {
      return {
        success: false,
        error: "Your requested dates conflict with an existing leave request. Please choose different dates.",
      };
    }

    // All checks passed — create the leave request 
    const newID = `LR${String(this.leaveRequests.length + 1).padStart(3, "0")}`;
    const newRequest: LeaveRequest = {
      ...leaveRequest,
      leaveRequestID: newID,
      status: LeaveStatus.PENDING,
      submissionDate: new Date(),
    };

    this.leaveRequests.push(newRequest);
    this.addAuditLog(
      leaveRequest.userID,
      `Leave request ${newID} submitted (${leaveRequest.type}, ${leaveRequest.numberOfDays} days)`
    );

    // Notify all HR users of the new request 
    const hrUsers = this.users.filter((u) => u.role === "HUMAN_RESOURCES");
    hrUsers.forEach((hr) => {
      this.pushNotification({
        userID: hr.employeeID,
        message: `New leave request submitted by ${user.firstName} ${user.lastName} (${leaveRequest.numberOfDays} days, ${leaveRequest.type}).`,
        type: "info",
      });
    });

    return { success: true, leaveRequest: newRequest };
  }

  /**
   * Approves a leave request. Called by HR from the Leave Management page.
   * Deducts the approved days from the employee's leave balance.
   * Dispatches a success notification to the requesting employee.
   *
   * @param leaveRequestID - The ID of the request to approve
   * @param approverID     - The employeeID of the HR staff approving it
   */
  public approveLeaveRequest(
    leaveRequestID: string,
    approverID: string
  ): boolean {
    const lrIndex = this.leaveRequests.findIndex(
      (lr) => lr.leaveRequestID === leaveRequestID
    );
    if (lrIndex === -1) return false;

    const leaveRequest = this.leaveRequests[lrIndex];
    this.leaveRequests[lrIndex] = {
      ...leaveRequest,
      status: LeaveStatus.APPROVED,
    };

    // Deduct days from user's leave balance 
    const userIndex = this.users.findIndex(
      (u) => u.employeeID === leaveRequest.userID
    );
    if (userIndex !== -1) {
      this.users[userIndex] = {
        ...this.users[userIndex],
        leaveBalance: Math.max(
          0,
          this.users[userIndex].leaveBalance - leaveRequest.numberOfDays
        ),
      };
    }

    this.addAuditLog(
      approverID,
      `Leave request ${leaveRequestID} approved (${leaveRequest.numberOfDays} days for user ${leaveRequest.userID})`
    );

    // Notify the requesting employee — Observer pattern
    this.pushNotification({
      userID: leaveRequest.userID,
      message: `Your leave request (${leaveRequest.numberOfDays} days from ${leaveRequest.startDate.toLocaleDateString("en-GB")}) has been approved.`,
      type: "success",
    });

    return true;
  }

  /**
   * Rejects a leave request. HR must provide a rejection reason.
   * sendds a warning notification to the requesting employee.
   *
   * @param leaveRequestID  - The ID of the request to reject
   * @param rejectionReason - The mandatory reason for rejection
   * @param approverID      - The employeeID of the HR staff rejecting it
   */
  public rejectLeaveRequest(
    leaveRequestID: string,
    rejectionReason: string,
    approverID: string
  ): boolean {
    if (!rejectionReason || rejectionReason.trim() === "") {
      // Rejection reason is mandatory
      console.error("Registry.rejectLeaveRequest: rejectionReason is required");
      return false;
    }

    const lrIndex = this.leaveRequests.findIndex(
      (lr) => lr.leaveRequestID === leaveRequestID
    );
    if (lrIndex === -1) return false;

    const leaveRequest = this.leaveRequests[lrIndex];
    this.leaveRequests[lrIndex] = {
      ...leaveRequest,
      status: LeaveStatus.REJECTED,
      rejectionReason: rejectionReason.trim(),
    };

    this.addAuditLog(
      approverID,
      `Leave request ${leaveRequestID} rejected — rejection reason recorded`
    );

    // Notify the requesting employee — Observer pattern 
    this.pushNotification({
      userID: leaveRequest.userID,
      message: `Your leave request has been rejected. Please check the leave history for the reason.`,
      type: "danger",
    });

    return true;
  }

  // =========================================================================
  // QUERY METHODS
  // =========================================================================

  /**
   * Returns all unresolved (PENDING or IN_PROGRESS) queries.
   * Used on the HR dashboard compact list.
   */
  public getOpenQueries(): Query[] {
    return this.queries.filter(
      (q) =>
        q.status === QueryStatus.PENDING ||
        q.status === QueryStatus.IN_PROGRESS
    );
  }


  // =========================================================================
  // PAYSLIP METHODS
  // =========================================================================

  /**
   * Returns all payslips for a specific user, newest first.
   * Used on the Payments -> Payslips page and the dashboard payslip card.
   *
   * @param userID - The employeeID of the user
   * @returns Payslips sorted by payDate descending
   */
  public getPayslipsForUser(userID: string): Payslip[] {
    return this.payslips
      .filter((p) => p.userID === userID)
      .sort((a, b) => b.payDate.getTime() - a.payDate.getTime());
  }

  // =========================================================================
  // SCHEDULE METHODS
  // =========================================================================

  /**
   * Returns the schedule for a specific user.
   * Used on the Schedule -> Planner calendar and the dashboard planner card.
   *
   * @param userID - The employeeID of the user
   * @returns The user's Schedule, or undefined if no schedule exists
   */
  public getScheduleForUser(userID: string): Schedule | undefined {
    return this.schedules.find((s) => s.userID === userID);
  }


  // =========================================================================
  // TRAINING RECORD METHODS
  // =========================================================================

  /**
   * Returns all training records for a specific consultant.
   * Used on the Learning & Development page (consultant-only).
   *
   * @param userID - The employeeID of the consultant
   * @returns The consultant's training records
   */
  public getTrainingRecordsForUser(userID: string): TrainingRecord[] {
    return this.trainingRecords.filter((t) => t.userID === userID);
  }

  // =========================================================================
  // PERFORMANCE REVIEW METHODS
  // =========================================================================

  /**
   * Returns all performance reviews for a specific consultant.
   * Used on the Performance Review page (consultant read-only view).
   *
   * @param userID - The employeeID of the consultant being reviewed
   * @returns The consultant's performance reviews, newest first
   */
  public getPerformanceReviewsForUser(userID: string): PerformanceReview[] {
    return this.performanceReviews
      .filter((r) => r.userID === userID)
      .sort(
        (a, b) =>
          b.reviewPeriodEnd.getTime() - a.reviewPeriodEnd.getTime()
      );
  }

  // =========================================================================
  // AUDIT LOG METHODS
  // =========================================================================

  /**
   * Returns all audit log entries, newest first.
   * Used on the IT Support Audit Log full-page view.
   *
   * @returns All AuditLog entries sorted by timeStamp descending
   */
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort(
      (a, b) => b.timeStamp.getTime() - a.timeStamp.getTime()
    );
  }

  /**
   * Returns the most recent N audit log entries.
   * Used by the IT Support dashboard recent activity feed.
   *
   * @param count - Number of entries to return (default: 8)
   */
  public getRecentAuditLogs(count: number = 8): AuditLog[] {
    return this.getAuditLogs().slice(0, count);
  }

  /**
   * Internal method — adds a new entry to the audit log.
   * Called automatically by every Registry method that performs
   * a significant system action. Components never call this directly.
   *
   * Corresponds to: AuditLog class recording events.
   *
   * @param userID - The employeeID of the user who triggered the event
   * @param action - Human-readable description of the action taken
   */
  private addAuditLog(userID: string, action: string): void {
    const newLog: AuditLog = {
      logID: `AL${String(this.auditLogs.length + 1).padStart(3, "0")}`,
      userID,
      action,
      timeStamp: new Date(),
    };
    /* Prepend so newest entries are at the start of the array */
    this.auditLogs.unshift(newLog);
  }

  // =========================================================================
  // NOTIFICATION METHODS (Observer Pattern implementation)
  // =========================================================================

  /**
   * Returns all notifications for a specific user, newest first.
   * Used by the notification bell component in the header.
   *
   * @param userID - The employeeID of the user
   * @returns The user's notifications, newest first
   */
  public getNotificationsForUser(userID: string): Notification[] {
    return this.notifications
      .filter((n) => n.userID === userID)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Returns the count of unread notifications for a user.
   * Used by the notification bell badge in the header.
   *
   * @param userID - The employeeID of the user
   * @returns Count of notifications where isRead === false
   */
  public getUnreadNotificationCount(userID: string): number {
    return this.notifications.filter(
      (n) => n.userID === userID && !n.isRead
    ).length;
  }

  /**
   * Marks a specific notification as read.
   * Called when the user opens the notification panel.
   *
   * @param notificationID - The ID of the notification to mark as read
   */
  public markNotificationAsRead(notificationID: string): void {
    const index = this.notifications.findIndex(
      (n) => n.notificationID === notificationID
    );
    if (index !== -1) {
      this.notifications[index] = {
        ...this.notifications[index],
        isRead: true,
      };
    }
  }

  /**
   * Marks all notifications for a user as read.
   * Called when the user opens the notification panel dropdown.
   *
   * @param userID - The employeeID of the user
   */
  public markAllNotificationsAsRead(userID: string): void {
    this.notifications = this.notifications.map((n) =>
      n.userID === userID ? { ...n, isRead: true } : n
    );
  }

  /**
   * Internal method — pushes a new notification into a user's queue.
   * This is the notifyObservers() call from the Observer pattern in the class diagram.
   * Called automatically by approveLeaveRequest, rejectLeaveRequest, resolveQuery, etc.
   * Components never call this directly.
   *
   * Corresponds to: +notifyObservers(event : String) in the Observable interface.
   *
   * @param notification - Notification data (without notificationID or timestamp)
   */
  private pushNotification(
    notification: Omit<Notification, "notificationID" | "timestamp" | "isRead">
  ): void {
    const newNotification: Notification = {
      ...notification,
      notificationID: `N${String(this.notifications.length + 1).padStart(3, "0")}`,
      timestamp: new Date(),
      isRead: false,
    };
    this.notifications.unshift(newNotification);
  }

  // =========================================================================
  // IT SUPPORT — ACCOUNT MANAGEMENT METHODS 
  // =========================================================================

  /**
   * Creates a new user account in the system. Called by IT Support.
   * Generates a unique employeeID and sets default values.
   * Logs the creation in the audit trail.
   *
   * @param data - Partial user data: firstName, lastName, username, role, regionID
   * @param creatorID - The employeeID of the IT Support staff creating the account
   * @returns The newly created AppUser, or undefined if username already exists
   */
  public createUserAccount(
    data: {
      firstName: string;
      lastName: string;
      username: string;
      role: string;
      regionID: string;
    },
    creatorID: string
  ): AppUser | undefined {
    // Check username uniqueness 
    const usernameExists = this.users.some((u) => u.username === data.username);
    if (usernameExists) return undefined;

    // Generate the next employeeID sequentially 
    const lastID = this.users
      .map((u) => parseInt(u.employeeID.replace("FDM", ""), 10))
      .filter((n) => !isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0);
    const newID = `FDM${String(lastID + 1).padStart(3, "0")}`;

    // Build the new user — defaults appropriate for a fresh account 
    const newUser: AppUser = {
      employeeID:          newID,
      username:            data.username,
      passwordHash:        "Welcome1!", // Default password — IT will advise user to reset
      failedLoginAttempts: 0,
      isLocked:            false,
      role:                data.role as any,
      leaveBalance:        25,          // Default annual allowance
      employmentStatus:    EmploymentStatus.ACTIVE,
      firstName:           data.firstName,
      lastName:            data.lastName,
      gender:              "",
      dateOfBirth:         new Date("1990-01-01"),
      niNumber:            "",
      email:               `${data.username}@fdmgroup.com`,
      phone:               "",
      mobile:              "",
      address:             "",
      startDate:           new Date(),
      regionID:            data.regionID,
      bankAccountName:     "",
      bankAccountNumber:   "",
      bankSortCode:        "",
      bankName:            "",
      // Role-specific field — populated based on role 
      ...(data.role === "CONSULTANT"
        ? { jobTitle: "Consultant" }
        : { department: data.role === "HUMAN_RESOURCES" ? "Human Resources" : "IT Operations" }),
    } as AppUser;

    this.users.push(newUser);
    this.addAuditLog(
      creatorID,
      `User account created for ${data.firstName} ${data.lastName} (${newID}, role: ${data.role})`
    );

    return newUser;
  }

  /**
   * Resets a user's password to a new value. Called by IT Support.
   * Logs the reset in the audit trail.
   *
   * @param userID      - The employeeID of the account to reset
   * @param newPassword - The new password to set
   * @param resetterID  - The employeeID of the IT Support staff performing the reset
   * @returns true if the reset was successful, false if the user was not found
   */
  public resetUserPassword(
    userID: string,
    newPassword: string,
    resetterID: string
  ): boolean {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return false;

    this.users[index] = {
      ...this.users[index],
      passwordHash:        newPassword,
      failedLoginAttempts: 0,     // Clear any failed attempts on reset
      isLocked:            false, // Unlock if was locked — a reset implies IT verification
    };

    this.addAuditLog(
      resetterID,
      `Password reset performed for user ${userID} by IT Support`
    );

    return true;
  }

  /**
   * Assigns a role to a user account. Called by IT Support.
   * Logs the role assignment in the audit trail.
   *
   * @param userID    - The employeeID of the user to update
   * @param newRole   - The new Role enum value to assign
   * @param assignerID - The employeeID of the IT Support staff making the change
   */
  public assignRole(userID: string, newRole: string, assignerID: string): boolean {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return false;

    this.users[index] = { ...this.users[index], role: newRole as any };
    this.addAuditLog(
      assignerID,
      `User ${userID} role updated to ${newRole} by IT Support`
    );

    return true;
  }

  /**
   * Updates an employee's employment record (status, region, job title).
   * Called by HR from the Employee Directory.
   * Logs the update in the audit trail.
   *
   * @param userID  - The employeeID of the employee to update
   * @param updates - Fields to update: employmentStatus, regionID, jobTitle/department
   * @param updaterID - The employeeID of the HR staff making the change
   */
  public updateEmploymentRecord(
    userID: string,
    updates: Partial<AppUser>,
    updaterID: string
  ): AppUser | undefined {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return undefined;

    /* employeeID is never modifiable */
    const { employeeID, ...safeUpdates } = updates as any;
    this.users[index] = { ...this.users[index], ...safeUpdates };

    this.addAuditLog(
      updaterID,
      `Employment record updated for user ${userID} by HR`
    );

    return this.users[index];
  }

  // =========================================================================
  // DASHBOARD HELPER METHODS
  // =========================================================================

  /**
   * Returns summary statistics for the HR dashboard stat cards.
   * Calculates totals from the live user and leave request arrays.
   *
   * @returns Object with counts for: totalConsultants, onLeaveToday,
   *          pendingLeaveRequests, openQueries
   */
  public getHRDashboardStats(): {
    totalConsultants: number;
    onLeaveToday: number;
    pendingLeaveRequests: number;
    openQueries: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const consultants = this.users.filter((u) => u.role === "CONSULTANT");

    // Count consultants with an APPROVED leave request covering today
    const onLeaveToday = this.leaveRequests.filter((lr) => {
      if (lr.status !== LeaveStatus.APPROVED) return false;
      const start = new Date(lr.startDate);
      const end = new Date(lr.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return today >= start && today <= end;
    }).length;

    return {
      totalConsultants: consultants.length,
      onLeaveToday,
      pendingLeaveRequests: this.getPendingLeaveRequests().length,
      openQueries: this.getOpenQueries().length,
    };
  }

  /**
   * Returns summary statistics for the IT Support dashboard stat cards.
   *
   * @returns Object with counts for: totalAccounts, lockedAccounts, recentLogins
   */
  public getITDashboardStats(): {
    totalAccounts: number;
    lockedAccounts: number;
    recentLogins: number;
  } {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentLogins = this.auditLogs.filter(
      (log) =>
        log.action.includes("logged in successfully") &&
        log.timeStamp >= twentyFourHoursAgo
    ).length;

    return {
      totalAccounts: this.users.length,
      lockedAccounts: this.users.filter((u) => u.isLocked).length,
      recentLogins,
    };
  }

  /**
   * Returns all currently locked user accounts.
   * Used by the IT Support dashboard locked accounts card.
   */
  public getLockedAccounts(): AppUser[] {
    return this.users.filter((u) => u.isLocked);
  }
}

// ---------------------------------------------------------------------------
// Export the getInstance method directly for convenience
// ---------------------------------------------------------------------------
/**
 * Do this:
 *   import { getRegistry } from '../services/Registry';
 *   const registry = getRegistry();
 *
 * Rather than:
 *   import Registry from '../services/Registry';
 *   const registry = Registry.getInstance();
 */
export const getRegistry = (): Registry => Registry.getInstance();

export default Registry;
