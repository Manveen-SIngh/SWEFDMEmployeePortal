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
