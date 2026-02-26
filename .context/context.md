# Travel Order System — Project Context

> **Last updated:** 2026-02-24

---

## Overview

A web-based Travel Order (TO) management system for an organization. Supports multi-role workflows for creating, approving, and printing travel orders with a clean, modern UI.

---

## User Roles

| Role | Access | Account Creation |
|------|--------|------------------|
| **Admin** (Regional Director) | Full system access, final approval, user management | Default account |
| **Approver** | Review & approve travel orders, scoped TO list | Created by Admin |
| **Regular** (PMED / IDS / AMAD) | Create, edit, view own travel orders | Self-registration |

---

## Travel Order Flow

```
[Regular User] → Creates TO → [Pending]
                                  ↓
                          [Approver Review]
                                  ↓
                          First Approval → Second Approval
                                  ↓
                          [Status: Approved]
                                  ↓
                          [Print TO] → Outputs filled template
```

---

## Travel Order Fields

### Personal Information
- Date Filled *(auto-populated with current date)*
- Name
- Position / Designation
- Division Unit
- Place of Assignment
- Employment Status *(multiple options)*

### Travel Details
- Type of Travel *(multiple options)*
- Location
- Other Staff *(optional)*
- Objectives
- Remarks / Special Instructions
- Specific Destination
- Specific Purpose

### Schedule
- Number of Days Travel
- Departure Date
- Return Date

### Logistics & Approval
- Means of Transportation *(multiple options)*
- Funding Source
- Recommending Approval *(HR, multiple signatories)*
- Designation *(HR)*
- Approved By — *Jose Apollo Y. Pacamalan*
- Designation / Division — *RED (default)*
- Upload Letter in PDF *(optional)*
- Travel Status *(multiple options)*
- Travel Status Remarks
- Submitted By *(from login session)*

---

## Master Pages

### Dashboard
- "+ Create Travel Order" action button
- Recent travel orders summary

### Travel Orders
- Filters for all / by status
- TO Status Summary cards
- Data table *(default view)*
- Scoped to user unless Admin or Approver

### PTR Summary
- Post-Travel Report summary view

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js (App Router) |
| **Database** | MySQL (`mysql2` driver) |
| **HTTP Client** | Fetch API by default; Axios only if needed for interceptors / token refresh |
| **Language** | TypeScript |

### Fetch vs Axios Guidelines

| Use **Fetch API** when… | Use **Axios** when… |
|---|---|
| Using Server Components / Route Handlers | Need request/response interceptors |
| Standard JSON requests only | Want automatic JSON transform + consistent error object |
| Want native APIs (AbortController, streams) | Heavy client-side app with many calls |
| — | Need built-in timeout config |

**Recommendation:** Start with Fetch. Add Axios later only if you hit pain points (interceptors, token refresh, centralized error handling).

---

## Frontend Guidelines

| Aspect | Standard |
|--------|----------|
| **Theme** | Modern — dark mode & light mode |
| **Font** | Inter or Poppins |
| **UI Components** | Component library (ShadCN, Radix, or similar) |
| **Performance** | Lazy loading, skeleton loaders, fast requests |
| **UX** | Proper data handling, accessible, responsive |

---

## Folder Structure

> **Key rule:** `app/api/` is for route handlers only. No controllers, models, or migrations inside `app/`.

```
project-root/
├─ app/
│  ├─ layout.tsx
│  ├─ globals.css
│  │
│  ├─ (public)/
│  │  ├─ layout.tsx
│  │  └─ page.tsx                        # Landing page
│  │
│  ├─ (auth)/
│  │  ├─ layout.tsx                      # Auth layout (centered card)
│  │  └─ auth/
│  │     ├─ login/page.tsx
│  │     ├─ signup/page.tsx
│  │     └─ forgot-password/page.tsx
│  │
│  ├─ (authenticated)/
│  │  ├─ layout.tsx                      # Protected layout wrapper
│  │  │
│  │  ├─ admin/
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ travel-orders/page.tsx
│  │  │  ├─ travel-orders/[id]/page.tsx
│  │  │  ├─ users/page.tsx
│  │  │  ├─ ptr-summary/page.tsx
│  │  │  └─ settings/page.tsx
│  │  │
│  │  ├─ approver/
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ approvals/page.tsx
│  │  │  ├─ approvals/[id]/page.tsx
│  │  │  └─ travel-orders/page.tsx
│  │  │
│  │  └─ regular/
│  │     ├─ dashboard/page.tsx
│  │     ├─ travel-orders/page.tsx
│  │     ├─ travel-orders/create/page.tsx
│  │     ├─ travel-orders/[id]/page.tsx
│  │     └─ travel-orders/[id]/edit/page.tsx
│  │
│  └─ api/
│     ├─ auth/        (login, register, logout, forgot-password)
│     ├─ users/       (CRUD)
│     ├─ travel-orders/ (CRUD, submit, approve, reject, return, print)
│     ├─ dashboard/   (admin, approver, regular)
│     └─ ptr-summary/
│
├─ src/
│  ├─ server/
│  │  ├─ db/          (mysql.ts, transaction.ts)
│  │  ├─ middleware/   (auth.ts, roles.ts)
│  │  ├─ controllers/  (auth, user, travelOrder, dashboard, ptrSummary)
│  │  ├─ services/     (auth, user, travelOrder, dashboard, ptrSummary)
│  │  ├─ models/       (user, travelOrder, travelOrderApproval, travelOrderStaff)
│  │  ├─ validators/   (auth, user, travelOrder, approval schemas)
│  │  ├─ constants/    (roles, travelOrderStatus, divisions)
│  │  ├─ utils/        (response, errors, date, toNumber)
│  │  └─ types/        (auth, user, travelOrder)
│  │
│  ├─ components/
│  │  ├─ shared/       (DataTable, StatusBadge, PageHeader, FormField)
│  │  ├─ travel-orders/ (TravelOrderForm, TravelOrderDetails, TravelOrderActions)
│  │  └─ dashboard/    (SummaryCards)
│  │
│  ├─ lib/             (apiClient.ts, auth-client.ts)
│  ├─ hooks/           (useCurrentUser, useTravelOrders)
│  └─ stores/          (auth.store.ts — optional, zustand)
│
├─ migrations/         (SQL schema files: users, travel_orders, staff, approvals, notifications)
├─ scripts/            (migrate.ts, seed.ts)
├─ public/templates/   (travel-order-template.html — print template)
│
├─ .env.local
├─ package.json
├─ tsconfig.json
└─ next.config.js
```

---

## Architecture Layers

```
Route Handler  →  Controller  →  Service  →  Model  →  MySQL
   (thin)        (parse input)   (business    (SQL queries,
                                  logic)       no logic)
```

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Route Handler** | `app/api/*/route.ts` | Receive request, call controller, return JSON |
| **Controller** | `src/server/controllers/` | Parse input, call service, handle errors |
| **Service** | `src/server/services/` | Status transitions, approval rules, role-based validation |
| **Model** | `src/server/models/` | SQL queries only — no business rules |
| **Migrations** | `migrations/*.sql` | Schema changes, optional seeds |

---

## Route Protection

### `app/(authenticated)/layout.tsx`
- Check session / token
- If not logged in → redirect to `/auth/login`
- If logged in → render layout

### Role Guard per Route Group
- `admin/` → require role `admin`
- `approver/` → require role `approver`
- `regular/` → require role `regular`

Enforce via server-side checks in layout/page **or** `middleware.ts` with route matching.

---

## Shared Authenticated Pages (Optional)

Common pages accessible to **all** logged-in users:

```
app/(authenticated)/
├─ profile/page.tsx
└─ notifications/page.tsx
```

---

## Naming Conventions

| Item | Convention |
|------|-----------|
| Routes | `kebab-case` (`travel-orders`, `forgot-password`, `ptr-summary`) |
| UI signup | `/auth/signup` |
| API register | `/api/auth/register` |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Login |
| `POST` | `/api/auth/register` | Register |
| `GET` | `/api/travel-orders` | List travel orders |
| `POST` | `/api/travel-orders` | Create travel order |
| `GET` | `/api/travel-orders/:id` | Get single TO |
| `PATCH` | `/api/travel-orders/:id` | Update TO |
| `POST` | `/api/travel-orders/:id/approve` | Approve TO |
| `POST` | `/api/travel-orders/:id/reject` | Reject TO |
| `POST` | `/api/travel-orders/:id/return` | Return for revision |
| `GET` | `/api/travel-orders/:id/print` | Generate printable TO |

---

## Non-Functional Requirements

- ⚡ Fast request handling
- 🔄 Lazy loading for pages and components
- 💀 Skeleton loaders during data fetches
- 📱 Responsive design (mobile, tablet, desktop)
- ♿ Accessible UI practices
- 🎨 Dark mode & light mode support
