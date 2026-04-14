# FDM Employee Portal
## ECS506U Software Engineering Group Project — Group 30

A functional React + TypeScript prototype of the FDM Group Employee Portal.

---

## Quick Start

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Demo Accounts

All accounts use password: `Password1!`

| Username | Role | Notes |
|---|---|---|
| `aisha.patel` | Consultant | 2 unacknowledged announcements on login |
| `marcus.webb` | Consultant | Has a rejected leave request in history |
| `chloe.nguyen` | Consultant | Currently ON_LEAVE, 3 days balance remaining |
| `jordan.smith` | Consultant | New starter, nothing acknowledged yet |
| `priya.sharma` | Consultant | Has a pending payroll query |
| `sandra.collins` | HR Staff | Primary HR demo account |
| `david.okafor` | HR Staff | Leeds-based HR |
| `tom.reeves` | IT Support | Primary IT demo account |
| `rachel.burns` | IT Support | Senior IT staff |

---

## Tech Stack

- **React 18** with TypeScript
- **React Router v6** (createBrowserRouter)
- **Vite** build tool
- **No backend** — all data lives in the Registry singleton (in-memory)
- **No external UI libraries** — all components built from scratch

---

## Design Patterns Implemented

| Pattern | Location | Class Diagram Reference |
|---|---|---|
| **Singleton** | `Registry.ts` | Registry class with `getInstance()` |
| **Observer** | `NotificationContext.tsx` + Registry | Observer/Observable interfaces |
| **Factory Method** | `Registry.createUserAccount()` | HumanResources.createConsultantProfile() |
| **State (Enumeration)** | `enums.ts` | All <<enumeration>> types |

---

## Requirements Traceability

| Requirement | Implementation |
|---|---|
| RQ1 — Authenticate with username/password | `Registry.attemptLogin()`, `LoginPage.tsx` |
| RQ2 — Role-based access control | `RoleRoute` in `App.tsx`, role-aware `Navbar.tsx` |
| RQ3 — Secure logout | `AuthContext.logout()`, navbar profile dropdown |
| RQ5 — Lock after 5 failed attempts | `Registry.attemptLogin()` — `MAX_LOGIN_ATTEMPTS = 5` |
| RQ6 — IT can unlock accounts | `ITDashboard.tsx`, `UserManagement.tsx` |
| RQ7 — Unique usernames | Enforced in `Registry.createUserAccount()` |
| RQ8/9 — View/update personal details | `MyDetails.tsx` |
| RQ11 — Cannot modify employee ID | `Registry.updatePersonalDetails()` strips `employeeID` |
| RQ14 — Submit annual leave | `AbsenceHolidays.tsx` → `Registry.submitLeaveRequest()` |
| RQ15 — Unique leave request ID | `Registry.submitLeaveRequest()` — sequential LR IDs |
| RQ16 — Display leave balance | `AbsenceHolidays.tsx` entitlement card |
| RQ17 — View leave status | `AbsenceHolidays.tsx` history list + calendar |
| RQ18 — HR approve/reject leave | `HRDashboard.tsx`, `LeaveManagement.tsx` |
| RQ19 — Rejection reason mandatory | `Registry.rejectLeaveRequest()` + canvas validation |
| RQ25 — HR update employment records | `EmployeeDirectory.tsx` edit canvas |
| RQ27 — HR assign region | Region dropdown in employment record canvas |
| RQ28 — HR search by ID or name | `EmployeeDirectory.tsx` search input |
| RQ36 — IT assign roles | Inline role select in `UserManagement.tsx` |
| RQ38 — IT deactivate accounts | Lock button in `UserManagement.tsx` |
| RQ39 — Log all login activity | `Registry.addAuditLog()` called on every significant action |
| RQ40 — IT view audit logs | `AuditLog.tsx` |

---


