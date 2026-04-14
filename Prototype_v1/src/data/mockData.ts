/**
 * mockData.ts
 * -----------
 * The single source of truth for all data in the FDM Employee Portal prototype.
 *
 * Since this prototype has no backend or database, all data is defined here as
 * typed TypeScript objects that conform to the interfaces in models/interfaces.ts.
 *
 * The Registry singleton (services/Registry.ts) imports from this file and
 * exposes methods that components use to read and write data — meaning no
 * component ever imports from this file directly. All access goes through Registry.
 *
 * DATA ORGANISATION:
 *   1. Regions
 *   2. Users (Consultants, HR Staff, IT Support)
 *   3. Announcements
 *   4. Acknowledgements (pre-seeded — some announcements already acknowledged)
 *   5. Leave Requests (pre-seeded across various states)
 *   6. Queries (pre-seeded across various states and categories)
 *   7. Payslips (12 months per employee)
 *   8. Schedules (current and next month)
 *   9. Timesheets (last 8 weeks)
 *  10. Training Records (consultant-only)
 *  11. Performance Reviews (consultant-only)
 *  12. Audit Logs (pre-seeded last 30 days of activity)
 *  13. Notifications (pre-seeded per user)
 *
 * IMPORTANT: All dates are created with `new Date(...)` so they are proper
 * Date objects, not strings. Components must use date formatting utilities
 * to display them rather than calling .toString() directly.
 */

import {
  Role,
  EmploymentStatus,
  LeaveType,
  LeaveStatus,
  QueryStatus,
  QueryCategory,
  TrainingStatus,
} from "../models/enums";

import type {
  Region,
  ConsultantUser,
  StaffUser,
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
} from "../models/interfaces";

// ===========================================================================
// 1. REGIONS
// ===========================================================================

export const regions: Region[] = [
  { regionID: "R001", regionName: "London" },
  { regionID: "R002", regionName: "Leeds" },
  { regionID: "R003", regionName: "Glasgow" },
  { regionID: "R004", regionName: "Birmingham" },
  { regionID: "R005", regionName: "Manchester" },
];

// ===========================================================================
// 2. USERS
// ===========================================================================
// ---------------------------------------------------------------------------
// CONSULTANTS
// ---------------------------------------------------------------------------
/**
 * Aisha Patel — FDM001
 * Software Engineer based in London. One of the primary demo accounts.
 * Has 18 days leave remaining and is ACTIVE.
 * Pre-seeded with pending and approved leave requests, queries, and payslips.
 */
export const consultantAisha: ConsultantUser = {
  // Identity & Access 
  employeeID: "FDM001",
  username: "aisha.patel",
  passwordHash: "Password1!", // Plain string for demo — no real hashing in prototype
  failedLoginAttempts: 0,
  isLocked: false,
  role: Role.CONSULTANT,

  // Employment 
  employmentStatus: EmploymentStatus.ACTIVE,
  jobTitle: "Software Engineer",
  startDate: new Date("2023-09-04"),
  regionID: "R001", // London

  // Leave 
  leaveBalance: 18,

  // Personal Details
  firstName: "Aisha",
  lastName: "Patel",
  gender: "Female",
  dateOfBirth: new Date("1998-03-14"),
  niNumber: "AB123456C",
  email: "aisha.patel@fdmgroup.com",
  phone: "020 7946 0123",
  mobile: "07700 900123",
  address: "14 Canary Wharf Lane, Flat 3, London, E14 5AB",

  // Bank Details 
  bankAccountName: "Aisha Patel",
  bankAccountNumber: "12345678",
  bankSortCode: "20-15-40",
  bankName: "Barclays Bank",
};

/**
 * Marcus Webb — FDM002
 * Data Analyst based in Leeds. ACTIVE with 12 days leave remaining.
 * Has a rejected leave request in his history (good for demo of rejection flow).
 */
export const consultantMarcus: ConsultantUser = {
  employeeID: "FDM002",
  username: "marcus.webb",
  passwordHash: "Password1!",
  failedLoginAttempts: 0,
  isLocked: false,
  role: Role.CONSULTANT,

  employmentStatus: EmploymentStatus.ACTIVE,
  jobTitle: "Data Analyst",
  startDate: new Date("2024-01-15"),
  regionID: "R002", // Leeds

  leaveBalance: 12,

  firstName: "Marcus",
  lastName: "Webb",
  gender: "Male",
  dateOfBirth: new Date("1995-07-22"),
  niNumber: "CD234567E",
  email: "marcus.webb@fdmgroup.com",
  phone: "0113 496 0456",
  mobile: "07700 900456",
  address: "7 Headingley Avenue, Leeds, LS6 3BT",

  bankAccountName: "Marcus Webb",
  bankAccountNumber: "23456789",
  bankSortCode: "30-96-26",
  bankName: "HSBC Bank",
};

/**
 * Chloe Nguyen — FDM003
 * Business Analyst based in Glasgow. Currently ON_LEAVE.
 * Has only 3 days remaining — her low balance is visible on the entitlement bar.
 * Good demo account to show a depleted leave balance.
 */
export const consultantChloe: ConsultantUser = {
  employeeID: "FDM003",
  username: "chloe.nguyen",
  passwordHash: "Password1!",
  failedLoginAttempts: 0,
  isLocked: false,
  role: Role.CONSULTANT,

  employmentStatus: EmploymentStatus.ON_LEAVE,
  jobTitle: "Business Analyst",
  startDate: new Date("2023-03-20"),
  regionID: "R003", // Glasgow

  leaveBalance: 3,

  firstName: "Chloe",
  lastName: "Nguyen",
  gender: "Female",
  dateOfBirth: new Date("1997-11-05"),
  niNumber: "EF345678G",
  email: "chloe.nguyen@fdmgroup.com",
  phone: "0141 496 0789",
  mobile: "07700 900789",
  address: "32 West End Park Street, Glasgow, G11 5BQ",

  bankAccountName: "Chloe Nguyen",
  bankAccountNumber: "34567890",
  bankSortCode: "83-06-08",
  bankName: "Bank of Scotland",
};

/**
 * Jordan Smith — FDM004
 * Java Developer based in Birmingham. ACTIVE with a full 20 days remaining.
 * Newest consultant — good contrast to show a fresh starter.
 */
export const consultantJordan: ConsultantUser = {
  employeeID: "FDM004",
  username: "jordan.smith",
  passwordHash: "Password1!",
  failedLoginAttempts: 0,
  isLocked: false,
  role: Role.CONSULTANT,

  employmentStatus: EmploymentStatus.ACTIVE,
  jobTitle: "Java Developer",
  startDate: new Date("2024-06-10"),
  regionID: "R004", // Birmingham

  leaveBalance: 20,

  firstName: "Jordan",
  lastName: "Smith",
  gender: "Male",
  dateOfBirth: new Date("1996-08-30"),
  niNumber: "GH456789I",
  email: "jordan.smith@fdmgroup.com",
  phone: "0121 496 0321",
  mobile: "07700 900321",
  address: "19 Jewellery Quarter Road, Birmingham, B18 6NF",

  bankAccountName: "Jordan Smith",
  bankAccountNumber: "45678901",
  bankSortCode: "40-47-84",
  bankName: "Lloyds Bank",
};

/**
 * Priya Sharma — FDM005
 * QA Engineer based in London. ACTIVE with 15 days remaining.
 * Has a pending query about payroll — good for demoing the query lifecycle.
 */
export const consultantPriya: ConsultantUser = {
  employeeID: "FDM005",
  username: "priya.sharma",
  passwordHash: "Password1!",
  failedLoginAttempts: 0,
  isLocked: false,
  role: Role.CONSULTANT,

  employmentStatus: EmploymentStatus.ACTIVE,
  jobTitle: "QA Engineer",
  startDate: new Date("2023-11-03"),
  regionID: "R001", // London

  leaveBalance: 15,

  firstName: "Priya",
  lastName: "Sharma",
  gender: "Female",
  dateOfBirth: new Date("1999-01-18"),
  niNumber: "IJ567890K",
  email: "priya.sharma@fdmgroup.com",
  phone: "020 7946 0654",
  mobile: "07700 900654",
  address: "8 Borough Market Close, London, SE1 9AF",

  bankAccountName: "Priya Sharma",
  bankAccountNumber: "56789012",
  bankSortCode: "20-15-40",
  bankName: "Barclays Bank",
};

// ---------------------------------------------------------------------------
// HR STAFF
// ---------------------------------------------------------------------------
/**
 * Sandra Collins — FDM006
 * HR Manager based in London. Primary HR demo account.
 * Can approve/reject leave, post announcements, respond to queries,
 * and manage employee records in the Employee Directory.
 */
export const hrSandra: StaffUser = {
  employeeID: "FDM006",
  username: "sandra.collins",
  passwordHash: "Password1!",
  failedLoginAttempts: 0,
  isLocked: false,
  role: Role.HUMAN_RESOURCES,

  employmentStatus: EmploymentStatus.ACTIVE,
  department: "Human Resources",
  startDate: new Date("2021-04-19"),
  regionID: "R001", // London

  leaveBalance: 25,

  firstName: "Sandra",
  lastName: "Collins",
  gender: "Female",
  dateOfBirth: new Date("1985-06-12"),
  niNumber: "KL678901M",
  email: "sandra.collins@fdmgroup.com",
  phone: "020 7946 0987",
  mobile: "07700 900987",
  address: "22 Kensington Park Road, London, W11 3BU",

  bankAccountName: "Sandra Collins",
  bankAccountNumber: "67890123",
  bankSortCode: "20-00-00",
  bankName: "NatWest Bank",
};

/**
 * David Okafor — FDM007
 * HR Officer based in Leeds. Secondary HR demo account.
 * Has the same HR permissions as Sandra but based in a different region.
 */
export const hrDavid: StaffUser = {
  employeeID: "FDM007",
  username: "david.okafor",
  passwordHash: "Password1!",
  failedLoginAttempts: 0,
  isLocked: false,
  role: Role.HUMAN_RESOURCES,

  employmentStatus: EmploymentStatus.ACTIVE,
  department: "Human Resources",
  startDate: new Date("2022-08-22"),
  regionID: "R002", // Leeds

  leaveBalance: 22,

  firstName: "David",
  lastName: "Okafor",
  gender: "Male",
  dateOfBirth: new Date("1990-09-03"),
  niNumber: "MN789012O",
  email: "david.okafor@fdmgroup.com",
  phone: "0113 496 0654",
  mobile: "07700 900222",
  address: "15 Chapel Allerton Crescent, Leeds, LS7 4NE",

  bankAccountName: "David Okafor",
  bankAccountNumber: "78901234",
  bankSortCode: "30-96-26",
  bankName: "HSBC Bank",
};

// ---------------------------------------------------------------------------
// IT SUPPORT
// ---------------------------------------------------------------------------
/**
 * Tom Reeves — FDM008
 * IT Administrator based in London. Primary IT Support demo account.
 * Can create/lock/unlock user accounts, assign roles, and view the full audit log.
 * The account lock simulation is best demonstrated through this account.
 */
export const itTom: StaffUser = {
  employeeID: "FDM008",
  username: "tom.reeves",
  passwordHash: "Password1!",
  failedLoginAttempts: 0,
  isLocked: false,
  role: Role.IT_SUPPORT,

  employmentStatus: EmploymentStatus.ACTIVE,
  department: "IT Operations",
  startDate: new Date("2020-02-14"),
  regionID: "R001", // London

  leaveBalance: 24,

  firstName: "Tom",
  lastName: "Reeves",
  gender: "Male",
  dateOfBirth: new Date("1988-04-27"),
  niNumber: "OP890123Q",
  email: "tom.reeves@fdmgroup.com",
  phone: "020 7946 0111",
  mobile: "07700 900111",
  address: "5 Shoreditch High Street, Flat 9, London, E1 6JE",

  bankAccountName: "Tom Reeves",
  bankAccountNumber: "89012345",
  bankSortCode: "20-15-40",
  bankName: "Barclays Bank",
};

/**
 * Rachel Burns — FDM009
 * Operations Manager based in London.
 * Role is set to IT_SUPPORT (the closest available enum value — see build plan notes).
 * Gets the IT Support portal view. Senior employee — longest tenure in the cast.
 */
export const itRachel: StaffUser = {
  employeeID: "FDM009",
  username: "rachel.burns",
  passwordHash: "Password1!",
  failedLoginAttempts: 0,
  isLocked: false,
  role: Role.IT_SUPPORT,

  employmentStatus: EmploymentStatus.ACTIVE,
  department: "IT Operations",
  startDate: new Date("2019-07-07"),
  regionID: "R001", // London

  leaveBalance: 28,

  firstName: "Rachel",
  lastName: "Burns",
  gender: "Female",
  dateOfBirth: new Date("1983-02-09"),
  niNumber: "QR901234S",
  email: "rachel.burns@fdmgroup.com",
  phone: "020 7946 0222",
  mobile: "07700 900222",
  address: "3 Greenwich Park Street, London, SE10 8PQ",

  bankAccountName: "Rachel Burns",
  bankAccountNumber: "90123456",
  bankSortCode: "20-00-00",
  bankName: "NatWest Bank",
};

/**
 * Master list of all users in the system.
 * The Registry singleton uses this array as its user "database".
 * IT Support User Management page renders this list.
 */
export const allUsers = [
  consultantAisha,
  consultantMarcus,
  consultantChloe,
  consultantJordan,
  consultantPriya,
  hrSandra,
  hrDavid,
  itTom,
  itRachel,
];

// ===========================================================================
// 3. ANNOUNCEMENTS
// ===========================================================================
/**
 * Company-wide announcements posted by HR.
 * The first two (ANN001, ANN002) are marked as unacknowledged for Aisha on login,
 * meaning she will see them sequentially when she first logs in.
 * HR users can see all announcements and post new ones.
 */
export const announcements: Announcement[] = [
  {
    announcementID: "ANN001",
    title: "Updated Remote Working Policy — Effective 1 April 2026",
    body: "Dear FDM Team,\n\nWe are pleased to confirm updates to our Remote Working Policy, effective from 1 April 2026. Consultants on client placements should review the updated guidelines with their line managers. Key changes include: updated expense claim procedures for home office equipment, revised expectations for client site attendance, and a new quarterly check-in framework.\n\nPlease read the full policy document in the Documents section of your portal. If you have any questions, raise a query via the Queries section and select the HR category.\n\nBest regards,\nFDM Human Resources",
    postDate: new Date("2026-03-10"),
    expiryDate: new Date("2026-06-30"),
    postedByUserID: "FDM006",
  },
  {
    announcementID: "ANN002",
    title: "Easter Bank Holiday — Office Closure Dates",
    body: "Please be advised that FDM offices will be closed on the following dates for Easter:\n\n• Good Friday: 3 April 2026\n• Easter Monday: 6 April 2026\n\nConsultants on client sites should check with their line manager regarding client-site specific arrangements. Emergency IT support will remain available on 020 7946 0111.\n\nWishing everyone a restful Easter break.\n\nFDM Operations Team",
    postDate: new Date("2026-03-15"),
    expiryDate: new Date("2026-04-07"),
    postedByUserID: "FDM006",
  },
  {
    announcementID: "ANN003",
    title: "New Mental Health & Wellbeing Resources Available",
    body: "FDM is committed to the wellbeing of all our employees. We are pleased to announce the launch of our expanded Employee Assistance Programme (EAP).\n\nNew resources now available include:\n• 24/7 confidential counselling helpline\n• Mindfulness and stress management workshops (see Learning & Development)\n• Monthly virtual wellbeing webinars\n• Dedicated wellbeing contact in each regional HR team\n\nAll resources are free, confidential, and available to all FDM employees and their immediate family members. Full details are available in the Documents section.\n\nFDM HR Team",
    postDate: new Date("2026-02-20"),
    expiryDate: new Date("2026-12-31"),
    postedByUserID: "FDM007",
  },
  {
    announcementID: "ANN004",
    title: "Payroll Processing Date Change — March 2026",
    body: "Please note that due to the Easter bank holidays, the March 2026 payroll will be processed one day earlier than usual.\n\nExpected payment date: Wednesday 25 March 2026 (instead of Thursday 26 March).\n\nIf you have any questions regarding your pay, please raise a query via the portal and select the PAYROLL category. Our payroll team will aim to respond within 2 working days.\n\nFDM Payroll Team",
    postDate: new Date("2026-03-01"),
    expiryDate: new Date("2026-03-31"),
    postedByUserID: "FDM006",
  },
  {
    announcementID: "ANN005",
    title: "FDM Leadership Summit 2026 — Save the Date",
    body: "We are excited to announce that the FDM Leadership Summit 2026 will take place on 15–16 May 2026 at the London headquarters.\n\nThis year's theme is 'Innovation Through People'. All internal staff are invited to attend. Consultants who have been with FDM for 12 months or more are also eligible to attend — please speak with your HR contact to register your interest.\n\nFull agenda and registration details will follow via a subsequent announcement.\n\nFDM Executive Team",
    postDate: new Date("2026-03-18"),
    expiryDate: new Date("2026-05-17"),
    postedByUserID: "FDM006",
  },
];

// ===========================================================================
// 4. ACKNOWLEDGEMENTS (pre-seeded)
// ===========================================================================
/**
 * Records of which users have acknowledged which announcements.
 * ANN003, ANN004, ANN005 are already acknowledged by Aisha — so only
 * ANN001 and ANN002 will appear in her login announcement flow.
 * Other consultants have different acknowledgement states for variety.
 */
export const acknowledgements: Acknowledgement[] = [
  /* Aisha has acknowledged ANN003, ANN004, ANN005 — ANN001 and ANN002 still pending */
  { announcementID: "ANN003", userID: "FDM001", isMandatory: false, acknowledgedAt: new Date("2026-02-21T09:15:00") },
  { announcementID: "ANN004", userID: "FDM001", isMandatory: false, acknowledgedAt: new Date("2026-03-02T08:45:00") },
  { announcementID: "ANN005", userID: "FDM001", isMandatory: false, acknowledgedAt: new Date("2026-03-19T10:00:00") },

  /* Marcus has acknowledged all announcements — no modal on login */
  { announcementID: "ANN001", userID: "FDM002", isMandatory: false, acknowledgedAt: new Date("2026-03-11T09:00:00") },
  { announcementID: "ANN002", userID: "FDM002", isMandatory: false, acknowledgedAt: new Date("2026-03-16T08:30:00") },
  { announcementID: "ANN003", userID: "FDM002", isMandatory: false, acknowledgedAt: new Date("2026-02-21T11:00:00") },
  { announcementID: "ANN004", userID: "FDM002", isMandatory: false, acknowledgedAt: new Date("2026-03-02T09:00:00") },
  { announcementID: "ANN005", userID: "FDM002", isMandatory: false, acknowledgedAt: new Date("2026-03-19T11:30:00") },

  /* Chloe — on leave, has only acknowledged ANN003 */
  { announcementID: "ANN003", userID: "FDM003", isMandatory: false, acknowledgedAt: new Date("2026-02-22T14:00:00") },

  /* Jordan — new starter, has not acknowledged anything */

  /* Priya has acknowledged ANN003 and ANN004 */
  { announcementID: "ANN003", userID: "FDM005", isMandatory: false, acknowledgedAt: new Date("2026-02-21T10:30:00") },
  { announcementID: "ANN004", userID: "FDM005", isMandatory: false, acknowledgedAt: new Date("2026-03-02T10:00:00") },

  /* HR and IT staff — acknowledge all (they post them, they've seen them) */
  { announcementID: "ANN001", userID: "FDM006", isMandatory: false, acknowledgedAt: new Date("2026-03-10T09:00:00") },
  { announcementID: "ANN002", userID: "FDM006", isMandatory: false, acknowledgedAt: new Date("2026-03-15T09:00:00") },
  { announcementID: "ANN003", userID: "FDM006", isMandatory: false, acknowledgedAt: new Date("2026-02-20T09:00:00") },
  { announcementID: "ANN004", userID: "FDM006", isMandatory: false, acknowledgedAt: new Date("2026-03-01T09:00:00") },
  { announcementID: "ANN005", userID: "FDM006", isMandatory: false, acknowledgedAt: new Date("2026-03-18T09:00:00") },

  { announcementID: "ANN001", userID: "FDM007", isMandatory: false, acknowledgedAt: new Date("2026-03-10T10:00:00") },
  { announcementID: "ANN002", userID: "FDM007", isMandatory: false, acknowledgedAt: new Date("2026-03-15T10:00:00") },
  { announcementID: "ANN003", userID: "FDM007", isMandatory: false, acknowledgedAt: new Date("2026-02-20T10:00:00") },
  { announcementID: "ANN004", userID: "FDM007", isMandatory: false, acknowledgedAt: new Date("2026-03-01T10:00:00") },
  { announcementID: "ANN005", userID: "FDM007", isMandatory: false, acknowledgedAt: new Date("2026-03-18T10:00:00") },

  { announcementID: "ANN001", userID: "FDM008", isMandatory: false, acknowledgedAt: new Date("2026-03-10T11:00:00") },
  { announcementID: "ANN002", userID: "FDM008", isMandatory: false, acknowledgedAt: new Date("2026-03-15T11:00:00") },
  { announcementID: "ANN003", userID: "FDM008", isMandatory: false, acknowledgedAt: new Date("2026-02-20T11:00:00") },
  { announcementID: "ANN004", userID: "FDM008", isMandatory: false, acknowledgedAt: new Date("2026-03-01T11:00:00") },
  { announcementID: "ANN005", userID: "FDM008", isMandatory: false, acknowledgedAt: new Date("2026-03-18T11:00:00") },
];

// ===========================================================================
// 5. LEAVE REQUESTS (pre-seeded)
// ===========================================================================
/**
 * Leave requests across various consultants and states.
 * Provides:
 *   - APPROVED requests -> appear as green on the Absence calendar
 *   - PENDING requests  -> appear as amber on the Absence calendar
 *   - REJECTED requests -> appear in leave history for Marcus (demo of rejection reason)
 */
export const leaveRequests: LeaveRequest[] = [
  /* ---- AISHA (FDM001) ---- */
  {
    /* Approved summer leave — shows green on calendar */
    leaveRequestID: "LR001",
    userID: "FDM001",
    startDate: new Date("2026-04-07"),
    endDate: new Date("2026-04-11"),
    numberOfDays: 5,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.APPROVED,
    submissionDate: new Date("2026-03-01T10:30:00"),
  },
  {
    /* Pending request — shows amber on calendar, visible in HR queue */
    leaveRequestID: "LR002",
    userID: "FDM001",
    startDate: new Date("2026-05-04"),
    endDate: new Date("2026-05-06"),
    numberOfDays: 3,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.PENDING,
    submissionDate: new Date("2026-03-20T14:15:00"),
  },

  /* ---- MARCUS (FDM002) ---- */
  {
    /* Approved leave taken earlier this year */
    leaveRequestID: "LR003",
    userID: "FDM002",
    startDate: new Date("2026-02-16"),
    endDate: new Date("2026-02-20"),
    numberOfDays: 5,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.APPROVED,
    submissionDate: new Date("2026-01-20T09:00:00"),
  },
  {
    /* REJECTED request — demonstrates the rejection reason flow */
    leaveRequestID: "LR004",
    userID: "FDM002",
    startDate: new Date("2026-03-23"),
    endDate: new Date("2026-03-27"),
    numberOfDays: 5,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.REJECTED,
    rejectionReason:
      "Unfortunately this request cannot be approved as it conflicts with a critical project deadline for your client placement. Please discuss alternative dates with your line manager.",
    submissionDate: new Date("2026-03-05T11:00:00"),
  },
  {
    /* Pending sick leave — shows in HR queue */
    leaveRequestID: "LR005",
    userID: "FDM002",
    startDate: new Date("2026-04-14"),
    endDate: new Date("2026-04-15"),
    numberOfDays: 2,
    type: LeaveType.SICK,
    status: LeaveStatus.PENDING,
    submissionDate: new Date("2026-03-22T08:00:00"),
  },

  /* ---- CHLOE (FDM003) ---- */
  {
    /* Currently ON_LEAVE — this approved request covers the current period */
    leaveRequestID: "LR006",
    userID: "FDM003",
    startDate: new Date("2026-03-17"),
    endDate: new Date("2026-03-28"),
    numberOfDays: 10,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.APPROVED,
    submissionDate: new Date("2026-02-28T15:00:00"),
  },

  /* ---- JORDAN (FDM004) ---- */
  {
    /* Jordan's first leave request as a newer starter */
    leaveRequestID: "LR007",
    userID: "FDM004",
    startDate: new Date("2026-04-22"),
    endDate: new Date("2026-04-24"),
    numberOfDays: 3,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.PENDING,
    submissionDate: new Date("2026-03-21T10:00:00"),
  },

  /* ---- PRIYA (FDM005) ---- */
  {
    /* Approved leave over the Easter period */
    leaveRequestID: "LR008",
    userID: "FDM005",
    startDate: new Date("2026-04-01"),
    endDate: new Date("2026-04-03"),
    numberOfDays: 3,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.APPROVED,
    submissionDate: new Date("2026-02-15T09:30:00"),
  },

  /* ---- SANDRA - HR (FDM006) ---- */
  {
    /* HR staff also take leave — Sandra has an approved request */
    leaveRequestID: "LR009",
    userID: "FDM006",
    startDate: new Date("2026-05-25"),
    endDate: new Date("2026-05-29"),
    numberOfDays: 5,
    type: LeaveType.ANNUAL,
    status: LeaveStatus.APPROVED,
    submissionDate: new Date("2026-03-10T09:00:00"),
  },
];

// ===========================================================================
// 6. QUERIES (pre-seeded)
// ===========================================================================
/**
 * Support queries from employees across various states and categories.
 * Provides a realistic range of content for the Queries page grid.
 * RESOLVED queries demonstrate the response display in the detail view.
 */
export const queries: Query[] = [
  {
    /* Resolved payroll query from Aisha — shows full response in detail view */
    queryID: "QRY001",
    userID: "FDM001",
    title: "March Payslip — Tax Deduction Query",
    message:
      "Hi, I noticed my tax deduction for March 2026 appears higher than usual. My gross pay was the same as previous months but the deduction increased by approximately £45. Could you please clarify what has caused this change? Thank you.",
    category: QueryCategory.PAYROLL,
    status: QueryStatus.RESOLVED,
    response:
      "Hi Aisha, thank you for your query. The slight increase in your March tax deduction is due to the annual PAYE code adjustment that takes effect in the new tax year (April 2025 onward). Your personal allowance threshold has been updated by HMRC, which has resulted in a minor adjustment to your monthly deduction. This is completely normal and your cumulative tax position will be reviewed at year end. Please don't hesitate to raise another query if you have further questions. — FDM Payroll Team",
    postDate: new Date("2026-03-05T10:00:00"),
  },
  {
    /* In-progress query from Aisha — shows blue badge */
    queryID: "QRY002",
    userID: "FDM001",
    title: "Portal Access — Unable to View Training Modules",
    message:
      "I am unable to access the training modules in the Learning & Development section. When I click on the module it shows a loading screen and then returns to the dashboard. This has been happening for 3 days now. I have tried clearing my browser cache and the issue persists. Could IT please investigate?",
    category: QueryCategory.IT,
    status: QueryStatus.IN_PROGRESS,
    postDate: new Date("2026-03-18T14:30:00"),
  },
  {
    /* Pending query from Marcus — sits in HR queue */
    queryID: "QRY003",
    userID: "FDM002",
    title: "Holiday Entitlement — Carry Over from Previous Year",
    message:
      "I believe I had 3 unused leave days from the 2024/2025 leave year that were agreed to be carried forward to this year. However, my current leave balance does not appear to reflect this. Could HR please confirm whether my carry-over days have been applied?",
    category: QueryCategory.HR,
    status: QueryStatus.PENDING,
    postDate: new Date("2026-03-22T09:15:00"),
  },
  {
    /* Resolved query from Marcus — about rejected leave */
    queryID: "QRY004",
    userID: "FDM002",
    title: "Rejected Leave Request — Alternative Dates Discussion",
    message:
      "My leave request for 23–27 March was rejected due to a project deadline. I understand this but would like to discuss alternative dates. Is there a recommended window that would work better from the project perspective? I am flexible and happy to split the leave across two shorter periods if needed.",
    category: QueryCategory.HR,
    status: QueryStatus.RESOLVED,
    response:
      "Hi Marcus, thank you for your understanding regarding the rejection of your previous leave request. We have spoken with your line manager and can confirm that the weeks of 18 May and 8 June 2026 are both clear of major deadlines and would be suitable for your annual leave. Please submit a new leave request via the portal for your preferred dates and we will aim to process it within 2 working days. — Sandra Collins, HR Manager",
    postDate: new Date("2026-03-08T11:00:00"),
  },
  {
    /* Pending query from Priya — payroll related */
    queryID: "QRY005",
    userID: "FDM005",
    title: "P60 Document — When Will It Be Available?",
    message:
      "I need my P60 document for the tax year ending April 2026 for a mortgage application. Could you advise when this will be available through the portal and whether I can request it earlier if needed?",
    category: QueryCategory.PAYROLL,
    status: QueryStatus.PENDING,
    postDate: new Date("2026-03-21T16:00:00"),
  },
  {
    /* Resolved query from Jordan — IT access issue on first day */
    queryID: "QRY006",
    userID: "FDM004",
    title: "Initial Portal Login — Password Reset Required",
    message:
      "I have just joined FDM and I am trying to log in to the portal for the first time. I received my username but the temporary password does not seem to be working. Could IT Support please assist with a password reset?",
    category: QueryCategory.IT,
    status: QueryStatus.RESOLVED,
    response:
      "Hi Jordan, welcome to FDM! Your portal password has been reset. Your new temporary password is: Welcome2024! — please log in and change this immediately via the My Details page → Edit. If you experience any further issues, please call IT Support on 020 7946 0111. — Tom Reeves, IT Administrator",
    postDate: new Date("2024-06-10T09:00:00"),
  },
];

// ===========================================================================
// 7. PAYSLIPS (12 months per employee)
// ===========================================================================
/**
 * Helper function to generate a consistent set of 12 monthly payslips for a given employee.
 * Gross pay and deductions are fixed per employee based on their salary.
 * A slight random variation (±£20) is applied to deductions each month
 * to make the data feel realistic rather than identical across all months.
 *
 * @param userID      - The employeeID of the employee
 * @param grossPay    - Monthly gross pay in GBP
 * @param deductions  - Approximate monthly deductions in GBP
 * @returns           - Array of 12 Payslip objects, newest first
 */
function generatePayslips(
  userID: string,
  grossPay: number,
  deductions: number
): Payslip[] {
  const payslips: Payslip[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    /* Calculate the month: i=0 is current month, i=1 is last month, etc. */
    const payDate = new Date(now.getFullYear(), now.getMonth() - i, 25);

    /* Apply a small variation to deductions for realism (±£20) */
    const variationSeed = (userID.charCodeAt(3) + i) % 40 - 20;
    const monthlyDeductions = deductions + variationSeed;
    const monthlyNet = grossPay - monthlyDeductions;

    /* Determine the tax year label */
    const year = payDate.getFullYear();
    const month = payDate.getMonth(); // 0-indexed: 3 = April
    const taxYear =
      month >= 3
        ? `${year}/${year + 1}`
        : `${year - 1}/${year}`;

    /* Format the pay period label (e.g. "March 2026") */
    const payPeriod = payDate.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });

    payslips.push({
      payslipID: `PAY-${userID}-${i.toString().padStart(2, "0")}`,
      userID,
      payPeriod,
      payDate,
      taxYear,
      grossPay,
      deductions: monthlyDeductions,
      netPay: monthlyNet,
    });
  }

  return payslips; // Already in newest-first order
}

export const payslips: Payslip[] = [
  ...generatePayslips("FDM001", 2850, 620), // Aisha
  ...generatePayslips("FDM002", 2650, 570), // Marcus
  ...generatePayslips("FDM003", 2750, 595), // Chloe
  ...generatePayslips("FDM004", 2700, 580), // Jordan
  ...generatePayslips("FDM005", 2600, 555), // Priya
  ...generatePayslips("FDM006", 3800, 890), // Sandra
  ...generatePayslips("FDM007", 3200, 740), // David
  ...generatePayslips("FDM008", 3500, 810), // Tom
  ...generatePayslips("FDM009", 4100, 970), // Rachel
];

// ===========================================================================
// 8. SCHEDULES
// ===========================================================================
/**
 * Work schedules for all employees.
 * Covers the current month. Standard 09:00–17:30 working day, Monday–Friday.
 * Weekends are excluded from workDays so the calendar displays them differently.
 *
 * Helper function generates all Monday–Friday dates within the current month.
 */
function getWeekdaysInMonth(year: number, month: number): Date[] {
  const dates: Date[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dates.push(date);
    }
  }
  return dates;
}

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

export const schedules: Schedule[] = [
  {
    scheduleID: "SCH001",
    userID: "FDM001",
    workDays: getWeekdaysInMonth(currentYear, currentMonth),
    shiftStart: "09:00",
    shiftEnd: "17:30",
  },
  {
    scheduleID: "SCH002",
    userID: "FDM002",
    workDays: getWeekdaysInMonth(currentYear, currentMonth),
    shiftStart: "09:00",
    shiftEnd: "17:30",
  },
  {
    scheduleID: "SCH003",
    userID: "FDM003",
    /* Chloe is ON_LEAVE — fewer work days this month */
    workDays: getWeekdaysInMonth(currentYear, currentMonth).slice(0, 10),
    shiftStart: "09:00",
    shiftEnd: "17:30",
  },
  {
    scheduleID: "SCH004",
    userID: "FDM004",
    workDays: getWeekdaysInMonth(currentYear, currentMonth),
    shiftStart: "08:30",
    shiftEnd: "17:00",
  },
  {
    scheduleID: "SCH005",
    userID: "FDM005",
    workDays: getWeekdaysInMonth(currentYear, currentMonth),
    shiftStart: "09:00",
    shiftEnd: "17:30",
  },
  {
    scheduleID: "SCH006",
    userID: "FDM006",
    workDays: getWeekdaysInMonth(currentYear, currentMonth),
    shiftStart: "09:00",
    shiftEnd: "17:30",
  },
  {
    scheduleID: "SCH007",
    userID: "FDM007",
    workDays: getWeekdaysInMonth(currentYear, currentMonth),
    shiftStart: "09:00",
    shiftEnd: "17:30",
  },
  {
    scheduleID: "SCH008",
    userID: "FDM008",
    workDays: getWeekdaysInMonth(currentYear, currentMonth),
    shiftStart: "08:00",
    shiftEnd: "16:30",
  },
  {
    scheduleID: "SCH009",
    userID: "FDM009",
    workDays: getWeekdaysInMonth(currentYear, currentMonth),
    shiftStart: "09:00",
    shiftEnd: "17:30",
  },
];

// ===========================================================================
// 9. TIMESHEETS
// ===========================================================================
/**
 * Weekly timesheet records for the last 8 weeks per employee.
 * The Timesheets page is a placeholder — this data exists in the Registry
 * but the page itself shows a "coming soon" view.
 */
function generateTimesheets(userID: string): TimeSheet[] {
  const timesheets: TimeSheet[] = [];
  const now = new Date();

  for (let i = 0; i < 8; i++) {
    /* Find the most recent Friday for each week */
    const weekEnding = new Date(now);
    weekEnding.setDate(now.getDate() - (now.getDay() + 2) % 7 - i * 7);

    timesheets.push({
      timesheetID: `TS-${userID}-${i.toString().padStart(2, "0")}`,
      userID,
      weekEnding,
      hoursWorked: 37.5, // Made up contracted hours
    });
  }
  return timesheets;
}

export const timesheets: TimeSheet[] = [
  ...generateTimesheets("FDM001"),
  ...generateTimesheets("FDM002"),
  ...generateTimesheets("FDM003"),
  ...generateTimesheets("FDM004"),
  ...generateTimesheets("FDM005"),
  ...generateTimesheets("FDM006"),
  ...generateTimesheets("FDM007"),
  ...generateTimesheets("FDM008"),
  ...generateTimesheets("FDM009"),
];

// ===========================================================================
// 10. TRAINING RECORDS (consultant-only)
// ===========================================================================
/**
 * Training module records for each consultant.
 * Displayed on the Learning & Development page.
 * Completion percentage is derived by components from this data.
 */
export const trainingRecords: TrainingRecord[] = [
  /* ---- AISHA (FDM001) ---- */
  { trainingID: "TR001", userID: "FDM001", moduleName: "Introduction to FDM Processes", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2023-09-15") },
  { trainingID: "TR002", userID: "FDM001", moduleName: "Data Protection & GDPR Awareness", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2023-10-01") },
  { trainingID: "TR003", userID: "FDM001", moduleName: "Agile & Scrum Fundamentals", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2024-01-20") },
  { trainingID: "TR004", userID: "FDM001", moduleName: "Cloud Computing Essentials (AWS)", trainingStatus: TrainingStatus.IN_PROGRESS },

  /* ---- MARCUS (FDM002) ---- */
  { trainingID: "TR005", userID: "FDM002", moduleName: "Introduction to FDM Processes", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2024-01-25") },
  { trainingID: "TR006", userID: "FDM002", moduleName: "Data Protection & GDPR Awareness", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2024-02-10") },
  { trainingID: "TR007", userID: "FDM002", moduleName: "Python for Data Analysis", trainingStatus: TrainingStatus.IN_PROGRESS },
  { trainingID: "TR008", userID: "FDM002", moduleName: "Business Intelligence & Power BI", trainingStatus: TrainingStatus.NOT_STARTED },

  /* ---- CHLOE (FDM003) ---- */
  { trainingID: "TR009", userID: "FDM003", moduleName: "Introduction to FDM Processes", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2023-04-01") },
  { trainingID: "TR010", userID: "FDM003", moduleName: "Data Protection & GDPR Awareness", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2023-04-15") },
  { trainingID: "TR011", userID: "FDM003", moduleName: "Business Analysis Fundamentals", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2023-06-30") },
  { trainingID: "TR012", userID: "FDM003", moduleName: "Stakeholder Management", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2023-09-01") },

  /* ---- JORDAN (FDM004) ---- */
  { trainingID: "TR013", userID: "FDM004", moduleName: "Introduction to FDM Processes", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2024-06-20") },
  { trainingID: "TR014", userID: "FDM004", moduleName: "Data Protection & GDPR Awareness", trainingStatus: TrainingStatus.IN_PROGRESS },
  { trainingID: "TR015", userID: "FDM004", moduleName: "Java Spring Boot Development", trainingStatus: TrainingStatus.NOT_STARTED },
  { trainingID: "TR016", userID: "FDM004", moduleName: "DevOps & CI/CD Pipelines", trainingStatus: TrainingStatus.NOT_STARTED },

  /* ---- PRIYA (FDM005) ---- */
  { trainingID: "TR017", userID: "FDM005", moduleName: "Introduction to FDM Processes", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2023-11-15") },
  { trainingID: "TR018", userID: "FDM005", moduleName: "Data Protection & GDPR Awareness", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2023-12-01") },
  { trainingID: "TR019", userID: "FDM005", moduleName: "Software Testing & QA Methodologies", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2024-02-28") },
  { trainingID: "TR020", userID: "FDM005", moduleName: "Selenium & Automated Testing", trainingStatus: TrainingStatus.IN_PROGRESS },
];

// ===========================================================================
// 11. PERFORMANCE REVIEWS (consultant-only)
// ===========================================================================
/**
 * Formal performance reviews for consultants, written by HR staff.
 * Displayed on the Performance Review page (consultant read-only view).
 * HR can create and manage these through their portal section.
 */
export const performanceReviews: PerformanceReview[] = [
  {
    reviewID: "PR001",
    userID: "FDM001",
    reviewerID: "FDM006",
    rating: 4,
    writtenEvaluation:
      "Aisha has demonstrated exceptional technical ability during her first placement. She quickly adapted to the client environment and has received consistently positive feedback from the client team lead. Her communication skills have improved significantly over the review period and she shows strong initiative in problem-solving. Areas for development include further broadening her cloud architecture knowledge, which she has already begun addressing through the AWS training module. Recommended for a performance-related pay review in the next cycle.",
    reviewPeriodStart: new Date("2025-09-01"),
    reviewPeriodEnd: new Date("2026-02-28"),
  },
  {
    reviewID: "PR002",
    userID: "FDM002",
    reviewerID: "FDM007",
    rating: 3,
    writtenEvaluation:
      "Marcus has performed well in his data analyst role, delivering consistent output to his client team. His Python skills are strong and he has been proactive in upskilling in Power BI. The main development area identified this period is stakeholder communication — Marcus should focus on translating technical findings into clear business language for non-technical audiences. His attendance and timekeeping have been exemplary throughout the review period.",
    reviewPeriodStart: new Date("2025-01-15"),
    reviewPeriodEnd: new Date("2026-01-14"),
  },
  {
    reviewID: "PR003",
    userID: "FDM003",
    reviewerID: "FDM006",
    rating: 5,
    writtenEvaluation:
      "Chloe has delivered outstanding performance across this review period. She has consistently exceeded client expectations, taken on additional responsibilities beyond her initial role scope, and mentored two junior team members at the client site. Her business analysis deliverables have been cited as best-in-class by the client director. We strongly recommend Chloe for the FDM Senior Consultant track and have flagged her for the next internal promotion review.",
    reviewPeriodStart: new Date("2025-03-20"),
    reviewPeriodEnd: new Date("2026-03-19"),
  },
  {
    reviewID: "PR004",
    userID: "FDM005",
    reviewerID: "FDM006",
    rating: 4,
    writtenEvaluation:
      "Priya has shown strong performance in her QA role, bringing a methodical and thorough approach to testing that the client team values highly. She has reduced bug escape rates significantly through the introduction of improved regression testing processes. Her work on automated testing using Selenium is progressing well. Development area: Priya should aim to build stronger relationships with the development team to enable earlier defect detection in the SDLC.",
    reviewPeriodStart: new Date("2025-11-03"),
    reviewPeriodEnd: new Date("2026-03-28"),
  },
];

// ===========================================================================
// 12. AUDIT LOGS (pre-seeded)
// ===========================================================================
/**
 * System audit trail for the last 30 days of activity.
 * Displayed in full on the IT Support Audit Log page.
 * Summarised (most recent 8 entries) on the IT Support dashboard.
 */
export const auditLogs: AuditLog[] = [
  { logID: "AL001", userID: "FDM001", action: "User logged in successfully", timeStamp: new Date("2026-03-29T08:45:00") },
  { logID: "AL002", userID: "FDM006", action: "User logged in successfully", timeStamp: new Date("2026-03-29T08:30:00") },
  { logID: "AL003", userID: "FDM008", action: "User logged in successfully", timeStamp: new Date("2026-03-29T08:15:00") },
  { logID: "AL004", userID: "FDM002", action: "User logged in successfully", timeStamp: new Date("2026-03-28T09:00:00") },
  { logID: "AL005", userID: "FDM002", action: "Leave request LR005 submitted (SICK, 2 days)", timeStamp: new Date("2026-03-28T08:05:00") },
  { logID: "AL006", userID: "FDM006", action: "Leave request LR005 status updated to PENDING (awaiting review)", timeStamp: new Date("2026-03-28T08:06:00") },
  { logID: "AL007", userID: "FDM005", action: "User logged in successfully", timeStamp: new Date("2026-03-27T09:10:00") },
  { logID: "AL008", userID: "FDM005", action: "Query QRY005 submitted (PAYROLL)", timeStamp: new Date("2026-03-27T16:02:00") },
  { logID: "AL009", userID: "FDM001", action: "Leave request LR002 submitted (ANNUAL, 3 days)", timeStamp: new Date("2026-03-26T14:17:00") },
  { logID: "AL010", userID: "FDM004", action: "Leave request LR007 submitted (ANNUAL, 3 days)", timeStamp: new Date("2026-03-25T10:03:00") },
  { logID: "AL011", userID: "FDM006", action: "Announcement ANN005 posted (Leadership Summit 2026)", timeStamp: new Date("2026-03-24T09:00:00") },
  { logID: "AL012", userID: "FDM001", action: "Personal details updated (phone number changed)", timeStamp: new Date("2026-03-23T11:30:00") },
  { logID: "AL013", userID: "FDM006", action: "Leave request LR004 rejected — rejection reason recorded", timeStamp: new Date("2026-03-22T14:45:00") },
  { logID: "AL014", userID: "FDM002", action: "Failed login attempt (1 of 5)", timeStamp: new Date("2026-03-22T08:58:00") },
  { logID: "AL015", userID: "FDM002", action: "User logged in successfully", timeStamp: new Date("2026-03-22T09:00:00") },
  { logID: "AL016", userID: "FDM008", action: "User account FDM004 role assigned: CONSULTANT", timeStamp: new Date("2026-03-21T10:00:00") },
  { logID: "AL017", userID: "FDM003", action: "User logged in successfully", timeStamp: new Date("2026-03-20T08:45:00") },
  { logID: "AL018", userID: "FDM006", action: "Consultant profile FDM003 employment status updated to ON_LEAVE", timeStamp: new Date("2026-03-19T17:00:00") },
  { logID: "AL019", userID: "FDM006", action: "Leave request LR006 approved (Chloe Nguyen, 10 days)", timeStamp: new Date("2026-03-10T11:00:00") },
  { logID: "AL020", userID: "FDM008", action: "Password reset performed for user FDM004", timeStamp: new Date("2026-03-10T09:30:00") },
];

// ===========================================================================
// 13. NOTIFICATIONS (pre-seeded per user)
// ===========================================================================
/**
 * In-app notifications pre-seeded for each user on login.
 * These represent the Observer pattern from the class diagram in action —
 * events from LeaveRequest and Announcement objects have triggered
 * notifications that are waiting in each user's queue.
 *
 * Additional notifications are pushed at runtime when actions are taken
 * (e.g. HR approves a leave → consultant receives a notification).
 */
export const seedNotifications: Notification[] = [
  /* Aisha — leave approved, new announcement */
  { notificationID: "N001", userID: "FDM001", message: "Your leave request (7–11 April) has been approved.", timestamp: new Date("2026-03-15T11:30:00"), isRead: false, type: "success" },
  { notificationID: "N002", userID: "FDM001", message: "New announcement: Updated Remote Working Policy.", timestamp: new Date("2026-03-10T09:00:00"), isRead: false, type: "info" },
  { notificationID: "N003", userID: "FDM001", message: "Your payroll query (QRY001) has been resolved.", timestamp: new Date("2026-03-06T14:00:00"), isRead: true, type: "success" },

  /* Marcus — leave rejected, query resolved */
  { notificationID: "N004", userID: "FDM002", message: "Your leave request (23–27 March) has been rejected. Please check the reason.", timestamp: new Date("2026-03-22T14:46:00"), isRead: false, type: "danger" },
  { notificationID: "N005", userID: "FDM002", message: "Your query (QRY004) about alternative leave dates has been resolved.", timestamp: new Date("2026-03-09T10:00:00"), isRead: true, type: "success" },

  /* Jordan — welcome notification */
  { notificationID: "N006", userID: "FDM004", message: "Welcome to the FDM Employee Portal, Jordan!", timestamp: new Date("2024-06-10T09:00:00"), isRead: true, type: "info" },
  { notificationID: "N007", userID: "FDM004", message: "Your portal access query (QRY006) has been resolved.", timestamp: new Date("2024-06-10T09:30:00"), isRead: true, type: "success" },

  /* Sandra — HR: new leave requests pending */
  { notificationID: "N008", userID: "FDM006", message: "New leave request submitted by Aisha Patel (3 days, May).", timestamp: new Date("2026-03-26T14:17:00"), isRead: false, type: "info" },
  { notificationID: "N009", userID: "FDM006", message: "New leave request submitted by Marcus Webb (2 days, SICK).", timestamp: new Date("2026-03-28T08:05:00"), isRead: false, type: "info" },
  { notificationID: "N010", userID: "FDM006", message: "New query submitted by Priya Sharma (PAYROLL).", timestamp: new Date("2026-03-27T16:02:00"), isRead: false, type: "info" },

  /* Tom — IT: query assigned */
  { notificationID: "N011", userID: "FDM008", message: "IT query QRY002 assigned to IT Support (Aisha Patel — portal access).", timestamp: new Date("2026-03-18T14:31:00"), isRead: false, type: "warning" },
];

export const LearningData = {
    upcoming: [
      {
        trainingID: "TR001",
        userID: "FDM001",
        moduleName: "Cloud Computing Essentials (AWS)",
        trainingStatus: TrainingStatus.IN_PROGRESS,
      },
      { trainingID: "TR002", userID: "FDM002", moduleName: "Business Intelligence & Power BI", trainingStatus: TrainingStatus.NOT_STARTED },
      { trainingID: "TR003", userID: "FDM004", moduleName: "Data Protection & GDPR Awareness", trainingStatus: TrainingStatus.IN_PROGRESS },
      { trainingID: "TR004", userID: "FDM004", moduleName: "Java Spring Boot Development", trainingStatus: TrainingStatus.NOT_STARTED },
      { trainingID: "TR005", userID: "FDM004", moduleName: "DevOps & CI/CD Pipelines", trainingStatus: TrainingStatus.NOT_STARTED },
    ],
    completed: [
      { trainingID: "TR006", userID: "FDM001", moduleName: "Introduction to FDM Processes", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2023-09-15") },
      { trainingID: "TR007", userID: "FDM001", moduleName: "Data Protection & GDPR Awareness", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2023-10-01") },
      { trainingID: "TR008", userID: "FDM001", moduleName: "Agile & Scrum Fundamentals", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2024-01-20") },
      { trainingID: "TR009", userID: "FDM002", moduleName: "Introduction to FDM Processes", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2024-01-25") },
      { trainingID: "TR010", userID: "FDM002", moduleName: "Data Protection & GDPR Awareness", trainingStatus: TrainingStatus.COMPLETED, completionDate: new Date("2024-02-10")},
    ],
};


