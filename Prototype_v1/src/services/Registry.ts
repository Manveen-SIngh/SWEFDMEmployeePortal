// singleton data store for portal data
// modified for hr features: performance reviews, activate/deactivate accounts

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

const MAX_LOGIN_ATTEMPTS = 5;

class Registry {
  private static instance: Registry | null = null;

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
  private globalFailedLoginAttempts: number = 0;

  private constructor() {
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
    this.globalFailedLoginAttempts = 0;
  }

  public static getInstance(): Registry {
    if (Registry.instance === null) {
      Registry.instance = new Registry();
    }
    return Registry.instance;
  }

  // auth methods
  
  public attemptLogin(
    username: string,
    password: string
  ): { user: AppUser | null; reason: string } {
    const userIndex = this.users.findIndex((u) => u.username === username);

    if (userIndex === -1) {
      this.globalFailedLoginAttempts += 1;
      if (this.globalFailedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
        return {
          user: null,
          reason: "Too many failed login attempts. Please contact IT.",
        };
      }
      return { user: null, reason: "Invalid username or password." };
    }

    const user = this.users[userIndex];

    if (user.isLocked) {
      this.addAuditLog(user.employeeID, "Failed login attempt on locked account");
      return {
        user: null,
        reason: "Your account is locked. Please contact IT Support.",
      };
    }

    if (user.passwordHash !== password) {
      const newAttempts = user.failedLoginAttempts + 1;
      const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

      this.users[userIndex] = {
        ...user,
        failedLoginAttempts: newAttempts,
        isLocked: shouldLock,
      };

      this.addAuditLog(
        user.employeeID,
        `Failed login attempt (${newAttempts} of ${MAX_LOGIN_ATTEMPTS})`
      );

      if (shouldLock) {
        this.addAuditLog(
          user.employeeID,
          "Account automatically locked after 5 failed attempts"
        );
        return {
          user: null,
          reason: `Account locked after ${MAX_LOGIN_ATTEMPTS} failed attempts.`,
        };
      }

      const attemptsRemaining = MAX_LOGIN_ATTEMPTS - newAttempts;
      return {
        user: null,
        reason: `Invalid password. ${attemptsRemaining} attempts remaining.`,
      };
    }

    // success - reset counters
    this.globalFailedLoginAttempts = 0;
    this.users[userIndex] = { ...user, failedLoginAttempts: 0 };
    this.addAuditLog(user.employeeID, "User logged in successfully");
    return { user: this.users[userIndex], reason: "" };
  }

  public logout(userID: string): void {
    this.addAuditLog(userID, "User logged out");
  }

  // user and account methods

  public getUserByID(userID: string): AppUser | undefined {
    return this.users.find((u) => u.employeeID === userID);
  }

  public findUsers(filters: {
    firstName?: string;
    lastName?: string;
    email?: string;
    role?: string;
    employmentStatus?: string;
    regionID?: string;
  }): AppUser[] {
    return this.users.filter((user) => {
      if (filters.firstName && !user.firstName.toLowerCase().includes(filters.firstName.toLowerCase())) return false;
      if (filters.lastName && !user.lastName.toLowerCase().includes(filters.lastName.toLowerCase())) return false;
      if (filters.email && !user.email.toLowerCase().includes(filters.email.toLowerCase())) return false;
      if (filters.role && user.role !== filters.role) return false;
      if (filters.employmentStatus && user.employmentStatus !== filters.employmentStatus) return false;
      if (filters.regionID && user.regionID !== filters.regionID) return false;
      return true;
    });
  }

  public updatePersonalDetails(
    userID: string,
    updates: Partial<AppUser>
  ): AppUser | undefined {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return undefined;
    
    const { employeeID, ...safeUpdates } = updates as any;
    this.users[index] = { ...this.users[index], ...safeUpdates };
    this.addAuditLog(userID, "Personal details updated");
    
    return this.users[index];
  }

  public lockAccount(userID: string): void {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return;
    
    this.users[index] = { ...this.users[index], isLocked: true };
    this.addAuditLog(userID, "Account locked by IT Support");
  }

  public unlockAccount(userID: string): void {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return;
    
    this.users[index] = {
      ...this.users[index],
      isLocked: false,
      failedLoginAttempts: 0,
    };
    this.addAuditLog(userID, "Account unlocked by IT Support");
  }

  // hr account activation
  
  public activateAccount(userID: string, activatorID: string): boolean {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return false;

    this.users[index] = {
      ...this.users[index],
      isLocked: false,
      failedLoginAttempts: 0,
    };

    this.addAuditLog(activatorID, `Account ${userID} activated by HR`);

    this.pushNotification({
      userID,
      message: "Your portal account has been activated. You can now log in.",
      type: "success",
    });

    return true;
  }

  // hr account deactivation
  
  public deactivateAccount(userID: string, deactivatorID: string): boolean {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return false;

    this.users[index] = {
      ...this.users[index],
      isLocked: true,
    };

    this.addAuditLog(deactivatorID, `Account ${userID} deactivated by HR`);

    this.pushNotification({
      userID,
      message: "Your portal account has been deactivated. Contact HR.",
      type: "danger",
    });

    return true;
  }

  public getAllUsers(): AppUser[] {
    return [...this.users];
  }

  // regions
  
  public getRegions(): Region[] {
    return [...this.regions];
  }

  public getRegionByID(regionID: string): Region | undefined {
    return this.regions.find((r) => r.regionID === regionID);
  }

  // announcements
  
  public getUnacknowledgedAnnouncements(userID: string): Announcement[] {
    const acknowledgedIDs = new Set(
      this.acknowledgements
        .filter((a) => a.userID === userID)
        .map((a) => a.announcementID)
    );
    
    return this.announcements
      .filter((ann) => !acknowledgedIDs.has(ann.announcementID))
      .sort((a, b) => a.postDate.getTime() - b.postDate.getTime());
  }

  public acknowledgeAnnouncement(userID: string, announcementID: string): void {
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

  // leave requests
  
  public getLeaveRequestsForUser(userID: string): LeaveRequest[] {
    return this.leaveRequests
      .filter((lr) => lr.userID === userID)
      .sort((a, b) => b.submissionDate.getTime() - a.submissionDate.getTime());
  }

  public getAllLeaveRequests(): LeaveRequest[] {
    return [...this.leaveRequests].sort(
      (a, b) => b.submissionDate.getTime() - a.submissionDate.getTime()
    );
  }

  public getPendingLeaveRequests(): LeaveRequest[] {
    return this.leaveRequests.filter((lr) => lr.status === LeaveStatus.PENDING);
  }

  public submitLeaveRequest(
    leaveRequest: Omit<LeaveRequest, "leaveRequestID" | "status" | "submissionDate">
  ): { success: boolean; leaveRequest?: LeaveRequest; error?: string } {
    const userIndex = this.users.findIndex((u) => u.employeeID === leaveRequest.userID);
    if (userIndex === -1) return { success: false, error: "User not found." };

    const user = this.users[userIndex];

    if (leaveRequest.numberOfDays > user.leaveBalance) {
      return {
        success: false,
        error: `Insufficient leave balance. You have ${user.leaveBalance} days left.`,
      };
    }

    const conflictingRequest = this.leaveRequests.find((lr) => {
      if (lr.userID !== leaveRequest.userID) return false;
      if (lr.status === LeaveStatus.REJECTED || lr.status === LeaveStatus.CANCELLED) return false;
      return leaveRequest.startDate <= lr.endDate && leaveRequest.endDate >= lr.startDate;
    });

    if (conflictingRequest) {
      return { success: false, error: "Dates conflict with an existing request." };
    }

    const newID = `LR${String(this.leaveRequests.length + 1).padStart(3, "0")}`;
    const newRequest: LeaveRequest = {
      ...leaveRequest,
      leaveRequestID: newID,
      status: LeaveStatus.PENDING,
      submissionDate: new Date(),
    };

    this.leaveRequests.push(newRequest);
    this.addAuditLog(leaveRequest.userID, `Leave request ${newID} submitted`);

    // notify hr
    const hrUsers = this.users.filter((u) => u.role === "HUMAN_RESOURCES");
    hrUsers.forEach((hr) => {
      this.pushNotification({
        userID: hr.employeeID,
        message: `New leave request submitted by ${user.firstName} ${user.lastName}.`,
        type: "info",
      });
    });

    return { success: true, leaveRequest: newRequest };
  }

  public approveLeaveRequest(leaveRequestID: string, approverID: string): boolean {
    const lrIndex = this.leaveRequests.findIndex((lr) => lr.leaveRequestID === leaveRequestID);
    if (lrIndex === -1) return false;

    const leaveRequest = this.leaveRequests[lrIndex];
    this.leaveRequests[lrIndex] = { ...leaveRequest, status: LeaveStatus.APPROVED };

    const userIndex = this.users.findIndex((u) => u.employeeID === leaveRequest.userID);
    if (userIndex !== -1) {
      this.users[userIndex] = {
        ...this.users[userIndex],
        leaveBalance: Math.max(0, this.users[userIndex].leaveBalance - leaveRequest.numberOfDays),
      };
    }

    this.addAuditLog(approverID, `Leave request ${leaveRequestID} approved`);

    this.pushNotification({
      userID: leaveRequest.userID,
      message: `Your leave request for ${leaveRequest.startDate.toLocaleDateString("en-GB")} was approved.`,
      type: "success",
    });

    return true;
  }

  public rejectLeaveRequest(leaveRequestID: string, rejectionReason: string, approverID: string): boolean {
    if (!rejectionReason || rejectionReason.trim() === "") return false;

    const lrIndex = this.leaveRequests.findIndex((lr) => lr.leaveRequestID === leaveRequestID);
    if (lrIndex === -1) return false;

    const leaveRequest = this.leaveRequests[lrIndex];
    this.leaveRequests[lrIndex] = {
      ...leaveRequest,
      status: LeaveStatus.REJECTED,
      rejectionReason: rejectionReason.trim(),
    };

    this.addAuditLog(approverID, `Leave request ${leaveRequestID} rejected`);

    this.pushNotification({
      userID: leaveRequest.userID,
      message: `Your leave request has been rejected. Check history for details.`,
      type: "danger",
    });

    return true;
  }

  // queries
  
  public getOpenQueries(): Query[] {
    return this.queries.filter(
      (q) => q.status === QueryStatus.PENDING || q.status === QueryStatus.IN_PROGRESS
    );
  }

  // payslips
  
  public getPayslipsForUser(userID: string): Payslip[] {
    return this.payslips
      .filter((p) => p.userID === userID)
      .sort((a, b) => b.payDate.getTime() - a.payDate.getTime());
  }

  // schedules
  
  public getScheduleForUser(userID: string): Schedule | undefined {
    return this.schedules.find((s) => s.userID === userID);
  }

  // training
  
  public getTrainingRecordsForUser(userID: string): TrainingRecord[] {
    return this.trainingRecords.filter((t) => t.userID === userID);
  }

  // performance reviews
  
  public getPerformanceReviewsForUser(userID: string): PerformanceReview[] {
    return this.performanceReviews
      .filter((r) => r.userID === userID)
      .sort((a, b) => b.reviewPeriodEnd.getTime() - a.reviewPeriodEnd.getTime());
  }

  public submitPerformanceReview(
    review: Omit<PerformanceReview, "reviewID">
  ): { success: boolean; review?: PerformanceReview; error?: string } {
    const employee = this.users.find((u) => u.employeeID === review.userID);
    if (!employee) return { success: false, error: "Employee not found." };

    const reviewer = this.users.find((u) => u.employeeID === review.reviewerID);
    if (!reviewer) return { success: false, error: "Reviewer not found." };

    if (review.rating < 1 || review.rating > 5) {
      return { success: false, error: "Rating must be between 1 and 5." };
    }

    if (!review.writtenEvaluation || review.writtenEvaluation.trim().length < 20) {
      return { success: false, error: "Written evaluation must be at least 20 characters." };
    }

    if (review.reviewPeriodEnd <= review.reviewPeriodStart) {
      return { success: false, error: "Review period end must be after start date." };
    }

    const newID = `PR${String(this.performanceReviews.length + 1).padStart(3, "0")}`;

    const newReview: PerformanceReview = {
      ...review,
      reviewID: newID,
      writtenEvaluation: review.writtenEvaluation.trim(),
    };

    this.performanceReviews.push(newReview);

    this.addAuditLog(
      review.reviewerID,
      `Performance review submitted for ${employee.firstName} ${employee.lastName}`
    );

    // notify consultant
    this.pushNotification({
      userID: review.userID,
      message: `A new performance review has been submitted for you (${review.rating}/5).`,
      type: "info",
    });

    return { success: true, review: newReview };
  }

  // audit logs
  
  public getAuditLogs(): AuditLog[] {
    return [...this.auditLogs].sort((a, b) => b.timeStamp.getTime() - a.timeStamp.getTime());
  }

  public getRecentAuditLogs(count: number = 8): AuditLog[] {
    return this.getAuditLogs().slice(0, count);
  }

  private addAuditLog(userID: string, action: string): void {
    const newLog: AuditLog = {
      logID: `AL${String(this.auditLogs.length + 1).padStart(3, "0")}`,
      userID,
      action,
      timeStamp: new Date(),
    };
    this.auditLogs.unshift(newLog);
  }

  // notifications 
  
  public getNotificationsForUser(userID: string): Notification[] {
    return this.notifications
      .filter((n) => n.userID === userID)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  public getUnreadNotificationCount(userID: string): number {
    return this.notifications.filter((n) => n.userID === userID && !n.isRead).length;
  }

  public markNotificationAsRead(notificationID: string): void {
    const index = this.notifications.findIndex((n) => n.notificationID === notificationID);
    if (index !== -1) {
      this.notifications[index] = { ...this.notifications[index], isRead: true };
    }
  }

  public markAllNotificationsAsRead(userID: string): void {
    this.notifications = this.notifications.map((n) =>
      n.userID === userID ? { ...n, isRead: true } : n
    );
  }

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

  // it support account management
  
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
    const usernameExists = this.users.some((u) => u.username === data.username);
    if (usernameExists) return undefined;

    const lastID = this.users
      .map((u) => parseInt(u.employeeID.replace("FDM", ""), 10))
      .filter((n) => !isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0);
      
    const newID = `FDM${String(lastID + 1).padStart(3, "0")}`;

    const newUser: AppUser = {
      employeeID: newID,
      username: data.username,
      passwordHash: "Welcome1!",
      failedLoginAttempts: 0,
      isLocked: false,
      role: data.role as any,
      leaveBalance: 25,
      employmentStatus: EmploymentStatus.ACTIVE,
      firstName: data.firstName,
      lastName: data.lastName,
      gender: "",
      dateOfBirth: new Date("1990-01-01"),
      niNumber: "",
      email: `${data.username}@fdmgroup.com`,
      phone: "",
      mobile: "",
      address: "",
      startDate: new Date(),
      regionID: data.regionID,
      bankAccountName: "",
      bankAccountNumber: "",
      bankSortCode: "",
      bankName: "",
      ...(data.role === "CONSULTANT"
        ? { jobTitle: "Consultant" }
        : { department: data.role === "HUMAN_RESOURCES" ? "Human Resources" : "IT Operations" }),
    } as AppUser;

    this.users.push(newUser);
    this.addAuditLog(
      creatorID,
      `User account created for ${data.firstName} ${data.lastName}`
    );

    return newUser;
  }

  // hr profile creation flow
  
  public createConsultantProfile(
    data: {
      firstName: string;
      lastName: string;
      username: string;
      role: string;
      regionID: string;
      jobTitle?: string;
      gender?: string;
      dateOfBirth?: string;
    },
    creatorID: string
  ): { success: boolean; user?: AppUser; error?: string } {
    const usernameExists = this.users.some((u) => u.username === data.username);
    
    if (usernameExists) {
      return { success: false, error: "Username already exists." };
    }

    if (!data.firstName.trim() || !data.lastName.trim()) {
      return { success: false, error: "First and last name are required." };
    }

    if (!data.username.trim()) {
      return { success: false, error: "Username is required." };
    }

    const lastID = this.users
      .map((u) => parseInt(u.employeeID.replace("FDM", ""), 10))
      .filter((n) => !isNaN(n))
      .reduce((max, n) => Math.max(max, n), 0);
      
    const newID = `FDM${String(lastID + 1).padStart(3, "0")}`;

    const newUser: AppUser = {
      employeeID: newID,
      username: data.username.trim(),
      passwordHash: "Welcome1!",
      failedLoginAttempts: 0,
      isLocked: false,
      role: data.role as any,
      leaveBalance: 25,
      employmentStatus: EmploymentStatus.ACTIVE,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      gender: data.gender || "",
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : new Date("1990-01-01"),
      niNumber: "",
      email: `${data.username.trim()}@fdmgroup.com`,
      phone: "",
      mobile: "",
      address: "",
      startDate: new Date(),
      regionID: data.regionID,
      bankAccountName: "",
      bankAccountNumber: "",
      bankSortCode: "",
      bankName: "",
      ...(data.role === "CONSULTANT"
        ? { jobTitle: data.jobTitle?.trim() || "Consultant" }
        : { department: data.role === "HUMAN_RESOURCES" ? "Human Resources" : "IT Operations" }),
    } as AppUser;

    this.users.push(newUser);

    this.addAuditLog(
      creatorID,
      `Consultant profile created for ${data.firstName} ${data.lastName}`
    );

    // notify it
    const itUsers = this.users.filter((u) => u.role === "IT_SUPPORT");
    itUsers.forEach((it) => {
      this.pushNotification({
        userID: it.employeeID,
        message: `New employee profile created by HR: ${data.firstName} ${data.lastName}.`,
        type: "info",
      });
    });

    return { success: true, user: newUser };
  }

  public resetUserPassword(userID: string, newPassword: string, resetterID: string): boolean {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return false;
    
    this.users[index] = {
      ...this.users[index],
      passwordHash: newPassword,
      failedLoginAttempts: 0,
      isLocked: false,
    };
    
    this.addAuditLog(resetterID, `Password reset for user ${userID}`);
    return true;
  }

  public assignRole(userID: string, newRole: string, assignerID: string): boolean {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return false;
    
    this.users[index] = { ...this.users[index], role: newRole as any };
    this.addAuditLog(assignerID, `User ${userID} role updated to ${newRole}`);
    
    return true;
  }

  public updateEmploymentRecord(
    userID: string,
    updates: Partial<AppUser>,
    updaterID: string
  ): AppUser | undefined {
    const index = this.users.findIndex((u) => u.employeeID === userID);
    if (index === -1) return undefined;
    
    const { employeeID, ...safeUpdates } = updates as any;
    this.users[index] = { ...this.users[index], ...safeUpdates };
    
    this.addAuditLog(updaterID, `Employment record updated for user ${userID}`);
    return this.users[index];
  }

  // dashboard stats
  
  public getHRDashboardStats(): {
    totalConsultants: number;
    onLeaveToday: number;
    pendingLeaveRequests: number;
    openQueries: number;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const consultants = this.users.filter((u) => u.role === "CONSULTANT");

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

  public getITDashboardStats(): {
    totalAccounts: number;
    lockedAccounts: number;
    recentLogins: number;
  } {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogins = this.auditLogs.filter(
      (log) => log.action.includes("logged in successfully") && log.timeStamp >= twentyFourHoursAgo
    ).length;

    return {
      totalAccounts: this.users.length,
      lockedAccounts: this.users.filter((u) => u.isLocked).length,
      recentLogins,
    };
  }

  public getLockedAccounts(): AppUser[] {
    return this.users.filter((u) => u.isLocked);
  }
}

export const getRegistry = (): Registry => Registry.getInstance();
export default Registry;