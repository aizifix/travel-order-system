# Travel Order System - Development To-Do

> **How to use:** Mark completed items with ✅, in-progress with 🔧, and not started with ⬜.
> Update this checklist as you complete each part.

---

## Phase 1 - Project Setup & Foundation

- ✅ Initialize Next.js project (App Router, TypeScript)
- ⬜ Configure `eslint`, `prettier`, and coding standards
- ⬜ Set up environment variables (`.env.local` - DB credentials, secrets)
- 🔧 Install core dependencies (`mysql2`, `bcrypt`, `jsonwebtoken`, etc.)
- 🔧 Set up MySQL database and connection (`src/server/db/mysql.ts`)
- ✅ Create migration runner script (`scripts/migrate.ts`)
- ✅ Create folder structure (`src/server/`, `src/components/`, `src/lib/`, etc.)

---

## Phase 2 - Database & Migrations

- ⬜ `001_create_users.sql` - users table (roles, credentials, profile)
- ⬜ `002_create_travel_orders.sql` - travel orders table (all TO fields)
- ⬜ `003_create_travel_order_staff.sql` - additional staff per TO
- ⬜ `004_create_travel_order_approvals.sql` - approval chain tracking
- ⬜ `005_create_notifications.sql` - notification records
- ⬜ Seed script with default admin account (`scripts/seed.ts`)

---

## Phase 3 - Authentication & Authorization

- 🔧 Auth API routes (`/api/auth/login`, `/api/auth/register`, `/api/auth/logout`)
- 🔧 Auth controller & service (`auth.controller.ts`, `auth.service.ts`)
- 🔧 Password hashing (`bcrypt`)
- 🔧 Session / JWT token management
- ✅ Auth middleware (`src/server/middleware/auth.ts`)
- ✅ Role guard middleware (`src/server/middleware/roles.ts`)
- 🔧 Protected layout (`app/(authenticated)/layout.tsx`)
- ✅ Auth pages - Login (`app/(auth)/login/page.tsx`)
- ✅ Auth pages - Signup (`app/(auth)/auth/signup/page.tsx`)
- ✅ Auth pages - Forgot Password (`app/(auth)/auth/forgot-password/page.tsx`)

---

## Phase 4 - Core Backend (Services, Controllers, Models)

- ✅ User model, service, controller (CRUD)
- ✅ Travel Order model (`travelOrder.model.ts`)
- ✅ Travel Order service - create, update, status transitions (`travelOrder.service.ts`)
- ✅ Travel Order controller (`travelOrder.controller.ts`)
- ✅ Travel Order approval model & logic (`travelOrderApproval.model.ts`)
- ✅ Travel Order staff model (`travelOrderStaff.model.ts`)
- ✅ Dashboard service & controller (stats per role)
- ✅ PTR Summary service & controller
- ✅ Validators / schemas (`zod` or similar - auth, user, travelOrder, approval)
- ✅ Constants (`roles.ts`, `travelOrderStatus.ts`, `divisions.ts`)
- ✅ Utility helpers (`response.ts`, `errors.ts`, `date.ts`, `toNumber.ts`)

---

## Phase 5 - API Route Handlers

- 🔧 `POST /api/auth/login`
- ✅ `POST /api/auth/register`
- 🔧 `POST /api/auth/logout`
- ✅ `GET /api/users` - list users (admin)
- ✅ `POST /api/users` - create user (admin)
- ✅ `PATCH /api/users/:id` - update user
- ✅ `DELETE /api/users/:id` - delete user
- ✅ `GET /api/travel-orders` - list TOs
- ✅ `POST /api/travel-orders` - create TO
- ✅ `GET /api/travel-orders/:id` - get single TO
- ✅ `PATCH /api/travel-orders/:id` - update TO
- ✅ `POST /api/travel-orders/:id/submit` - submit draft
- ✅ `POST /api/travel-orders/:id/approve` - approve
- ✅ `POST /api/travel-orders/:id/reject` - reject
- ✅ `POST /api/travel-orders/:id/return` - return for revision
- ✅ `GET /api/travel-orders/:id/print` - printable TO
- 🔧 `GET /api/dashboard/admin`
- ✅ `GET /api/dashboard/approver`
- ✅ `GET /api/dashboard/regular`
- ✅ `GET /api/ptr-summary`

---

## Phase 6 - Frontend: Shared Components

- ✅ Global layout & theming (dark/light mode, Inter/Poppins font)
- ✅ `DataTable` component (sortable, filterable)
- ✅ `StatusBadge` component
- ✅ `PageHeader` component
- ✅ `FormField` component
- ✅ `SummaryCards` component (dashboard stats)
- ✅ Skeleton loaders
- ✅ API client wrapper (`src/lib/apiClient.ts`)

---

## Phase 7 - Frontend: Auth Pages

- ✅ Auth layout (`app/(auth)/layout.tsx` - centered card)
- 🔧 Login page with form, validation, error handling
- ✅ Signup page with form, validation
- ✅ Forgot password page

---

## Phase 8 - Frontend: Regular User Pages

- ✅ Dashboard (`app/(authenticated)/regular/dashboard/page.tsx`)
- ✅ Travel Orders list - own TOs (`regular/travel-orders/page.tsx`)
- ✅ Create Travel Order form (`regular/travel-orders/create/page.tsx`)
- ✅ View Travel Order details (`regular/travel-orders/[id]/page.tsx`)
- ✅ Edit Travel Order (`regular/travel-orders/[id]/edit/page.tsx`)

---

## Phase 9 - Frontend: Approver Pages

- ✅ Dashboard (`app/(authenticated)/approver/dashboard/page.tsx`)
- ✅ Pending approvals list (`approver/approvals/page.tsx`)
- ✅ Review & approve/reject TO (`approver/approvals/[id]/page.tsx`)
- ✅ Scoped TO list (`approver/travel-orders/page.tsx`)

---

## Phase 10 - Frontend: Admin Pages

- 🔧 Dashboard (`app/(authenticated)/admin/dashboard/page.tsx`)
- ✅ All Travel Orders list (`admin/travel-orders/page.tsx`)
- ✅ Travel Order details + final approval (`admin/travel-orders/[id]/page.tsx`)
- ✅ User management - list, create, edit, delete (`admin/users/page.tsx`)
- ✅ PTR Summary (`admin/ptr-summary/page.tsx`)
- ✅ Settings (`admin/settings/page.tsx`)

---

## Phase 11 - Print & Export

- ✅ Travel Order print template (`public/templates/travel-order-template.html`)
- ✅ Print route - populate template with TO data
- ✅ PDF generation (optional - `puppeteer` or `react-pdf`)

---

## Phase 12 - Polish & QA

- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Lazy loading for pages & heavy components
- ✅ Error boundaries & fallback UI
- ✅ Form validation (client + server)
- ✅ Notification system (in-app)
- ✅ Accessibility audit
- ✅ Cross-browser testing
- ✅ Performance optimization

---

## Phase 13 - Deployment

- ✅ Production build & environment config
- ✅ Database production setup & migrations
- ✅ Hosting setup (Vercel, VPS, etc.)
- ✅ Domain & SSL
- ✅ CI/CD pipeline (optional)
