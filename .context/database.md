# Travel Order System — Database Schema

> **Last updated:** 2026-02-26  
> **Engine:** MySQL 8 · InnoDB · utf8mb4_unicode_ci

---

## Entity-Relationship Overview

```
┌──────────┐       ┌──────────────┐       ┌─────────────┐
│  users   │──1:N──│ travel_orders │──1:N──│ TO_staff    │
│          │       │              │       │ (junction)  │
│  • admin │       │  FK → users  │       └─────────────┘
│  • approver      │  FK → all    │
│  • regular│      │    lookups   │──1:N──┌─────────────┐
└──────────┘       │              │       │ TO_approvals│
     │             └──────────────┘       │ (audit)     │
     │                    │               └─────────────┘
     │                    │
     │                    ├──1:N──┌──────────────────┐
     │                    │       │ TO_attachments   │
     │                    │       └──────────────────┘
     │                    │
     └────────1:N─────────┼───────┌──────────────┐
                                  │ notifications│
                                  └──────────────┘

Lookup Tables (8):
  divisions · employment_statuses · designations · positions
  travel_types · transportations · programs · travel_statuses
```

---

## Tables Summary

| # | Table | Type | Migration | Rows |
|---|-------|------|-----------|------|
| 1 | `users` | Core | 001, 003 | — |
| 2 | `divisions` | Lookup | 002 | 29 |
| 3 | `employment_statuses` | Lookup | 002 | 7 |
| 4 | `designations` | Lookup | 002 | 7 |
| 5 | `positions` | Lookup | 002 | — |
| 6 | `travel_types` | Lookup | 002 | 8 |
| 7 | `transportations` | Lookup | 002 | 4 |
| 8 | `programs` | Lookup | 002 | 38 |
| 9 | `travel_statuses` | Lookup | 002 | 10 |
| 10 | `travel_orders` | Core | 004 | — |
| 11 | `travel_order_staff` | Junction | 005 | — |
| 12 | `travel_order_approvals` | Audit | 006 | — |
| 13 | `travel_order_attachments` | Child | 007 | — |
| 14 | `notifications` | Core | 008 | — |

---

## Table Schemas

### 1. `users`

| Column | Type | Null | Default | Constraint |
|--------|------|------|---------|------------|
| `user_id` | INT AUTO_INCREMENT | NO | — | **PK** |
| `user_firstName` | VARCHAR(100) | NO | — | |
| `user_lastName` | VARCHAR(100) | NO | — | |
| `user_email` | VARCHAR(255) | NO | — | **UQ** |
| `user_password` | VARCHAR(255) | NO | — | |
| `user_role` | ENUM('admin','approver','regular') | NO | `'regular'` | IDX |
| `user_isActive` | TINYINT(1) | NO | `1` | IDX |
| `division_id` | INT | YES | NULL | **FK → divisions** |
| `position_id` | INT | YES | NULL | **FK → positions** |
| `designation_id` | INT | YES | NULL | **FK → designations** |
| `employment_status_id` | INT | YES | NULL | **FK → employment_statuses** |
| `created_at` | TIMESTAMP | NO | `CURRENT_TIMESTAMP` | |
| `updated_at` | TIMESTAMP | NO | `CURRENT_TIMESTAMP ON UPDATE` | |

**Roles:**
- **Admin** — Default account, full access, final approver, user management
- **Approver** — Created by admin, reviews TOs at step 1 (recommending)
- **Regular** — Self-registration, creates/edits own travel orders

---

### 2–9. Lookup Tables (shared structure)

All lookup tables follow the same pattern:

| Column | Type | Null | Default | Constraint |
|--------|------|------|---------|------------|
| `<name>_id` | INT AUTO_INCREMENT | NO | — | **PK** |
| `<name>_name` | VARCHAR(100–255) | NO | — | **UQ** |
| `is_active` | TINYINT(1) | NO | `1` | |
| `created_at` | TIMESTAMP | NO | `CURRENT_TIMESTAMP` | |
| `updated_at` | TIMESTAMP | NO | `CURRENT_TIMESTAMP ON UPDATE` | |

**Exception:** `travel_statuses` has an additional `travel_status_desc` VARCHAR(255) NULL column.

#### Travel Status Values

| ID | Status Name | Description |
|----|-------------|-------------|
| 1 | `DRAFT` | Created but not submitted |
| 2 | `PENDING` | Submitted, awaiting step 1 |
| 3 | `STEP1_APPROVED` | Recommending approval done, awaiting final |
| 4 | `APPROVED` | Final approval — printable |
| 5 | `REJECTED` | Rejected by approver |
| 6 | `RETURNED` | Returned for revision |
| 7 | `CANCELLED` | Cancelled |
| 8 | `EXTENSION` | Approved TO extension |
| 9 | `ADDITIONAL_DEST` | Additional destinations to approved TO |
| 10 | `RESCHEDULED` | Reschedule of cancelled TO |

---

### 10. `travel_orders`

| Column | Type | Null | Default | Constraint |
|--------|------|------|---------|------------|
| `travel_order_id` | INT AUTO_INCREMENT | NO | — | **PK** |
| `travel_order_no` | VARCHAR(50) | NO | — | **UQ** |
| `travel_order_date` | DATE | NO | `CURRENT_DATE` | |
| `requester_user_id` | INT | NO | — | **FK → users** · IDX |
| `division_id` | INT | NO | — | **FK → divisions** |
| `position_id` | INT | YES | NULL | **FK → positions** |
| `designation_id` | INT | YES | NULL | **FK → designations** |
| `employment_status_id` | INT | NO | — | **FK → employment_statuses** |
| `travel_type_id` | INT | NO | — | **FK → travel_types** |
| `transportation_id` | INT | NO | — | **FK → transportations** |
| `program_id` | INT | YES | NULL | **FK → programs** |
| `travel_order_specDestination` | TEXT | NO | — | |
| `travel_order_specPurpose` | TEXT | NO | — | |
| `travel_order_fundingSource` | VARCHAR(255) | YES | NULL | |
| `travel_order_remarks` | TEXT | YES | NULL | |
| `travel_order_days` | INT | NO | `1` | |
| `travel_order_deptDate` | DATE | NO | — | IDX |
| `travel_order_returnDate` | DATE | NO | — | |
| `has_other_staff` | TINYINT(1) | NO | `0` | |
| `travel_status_id` | INT | NO | `1` (DRAFT) | **FK → travel_statuses** · IDX |
| `travel_status_remarks` | TEXT | YES | NULL | |
| `recommending_approver_id` | INT | YES | NULL | **FK → users** |
| `approved_by_user_id` | INT | YES | NULL | **FK → users** |
| `created_at` | TIMESTAMP | NO | `CURRENT_TIMESTAMP` | |
| `updated_at` | TIMESTAMP | NO | `CURRENT_TIMESTAMP ON UPDATE` | |

**Foreign Key Summary (10 FKs):**

| FK | References | On Delete |
|----|-----------|-----------|
| `requester_user_id` | `users.user_id` | RESTRICT |
| `division_id` | `divisions.division_id` | RESTRICT |
| `position_id` | `positions.position_id` | SET NULL |
| `designation_id` | `designations.designation_id` | SET NULL |
| `employment_status_id` | `employment_statuses.employment_status_id` | RESTRICT |
| `travel_type_id` | `travel_types.travel_type_id` | RESTRICT |
| `transportation_id` | `transportations.transportation_id` | RESTRICT |
| `program_id` | `programs.program_id` | SET NULL |
| `travel_status_id` | `travel_statuses.travel_status_id` | RESTRICT |
| `recommending_approver_id` | `users.user_id` | SET NULL |
| `approved_by_user_id` | `users.user_id` | SET NULL |

---

### 11. `travel_order_staff` (Junction)

| Column | Type | Null | Default | Constraint |
|--------|------|------|---------|------------|
| `travel_order_staff_id` | INT AUTO_INCREMENT | NO | — | **PK** |
| `travel_order_id` | INT | NO | — | **FK → travel_orders** |
| `user_id` | INT | NO | — | **FK → users** · IDX |
| `created_at` | TIMESTAMP | NO | `CURRENT_TIMESTAMP` | |

**Unique:** (`travel_order_id`, `user_id`)  
**On Delete:** CASCADE (both FKs)

---

### 12. `travel_order_approvals` (Audit Trail)

| Column | Type | Null | Default | Constraint |
|--------|------|------|---------|------------|
| `approval_id` | INT AUTO_INCREMENT | NO | — | **PK** |
| `travel_order_id` | INT | NO | — | **FK → travel_orders** · IDX |
| `step_no` | INT | NO | — | `1` = recommending, `2` = final |
| `approver_user_id` | INT | NO | — | **FK → users** · IDX |
| `action` | ENUM('APPROVED','REJECTED','RETURNED') | NO | — | |
| `remarks` | TEXT | YES | NULL | |
| `action_at` | TIMESTAMP | NO | `CURRENT_TIMESTAMP` | IDX |

**On Delete:** `travel_order_id` CASCADE, `approver_user_id` RESTRICT

---

### 13. `travel_order_attachments`

| Column | Type | Null | Default | Constraint |
|--------|------|------|---------|------------|
| `attachment_id` | INT AUTO_INCREMENT | NO | — | **PK** |
| `travel_order_id` | INT | NO | — | **FK → travel_orders** · IDX |
| `file_name` | VARCHAR(255) | NO | — | |
| `file_path` | VARCHAR(500) | NO | — | |
| `file_size` | INT | YES | NULL | Bytes |
| `mime_type` | VARCHAR(100) | YES | `'application/pdf'` | |
| `uploaded_by` | INT | NO | — | **FK → users** · IDX |
| `uploaded_at` | TIMESTAMP | NO | `CURRENT_TIMESTAMP` | |

---

### 14. `notifications`

| Column | Type | Null | Default | Constraint |
|--------|------|------|---------|------------|
| `notification_id` | INT AUTO_INCREMENT | NO | — | **PK** |
| `user_id` | INT | NO | — | **FK → users** · IDX |
| `travel_order_id` | INT | YES | NULL | **FK → travel_orders** |
| `notification_title` | VARCHAR(255) | NO | — | |
| `notification_message` | TEXT | NO | — | |
| `notification_type` | ENUM('INFO','APPROVAL','REJECTION','RETURN','SYSTEM') | NO | `'INFO'` | |
| `is_read` | TINYINT(1) | NO | `0` | IDX |
| `created_at` | TIMESTAMP | NO | `CURRENT_TIMESTAMP` | IDX |

---

## Migration Files

Run in order inside `app/migrations/`:

| File | Action |
|------|--------|
| `001_create_users.sql` | Create `users` table (no FKs yet) |
| `002_create_lookup_tables.sql` | Create all 8 lookup tables |
| `003_alter_users_add_fks.sql` | Add FK columns to `users` → lookup tables |
| `004_create_travel_orders.sql` | Create `travel_orders` with all FKs |
| `005_create_travel_order_staff.sql` | Create `travel_order_staff` junction |
| `006_create_travel_order_approvals.sql` | Create `travel_order_approvals` audit |
| `007_create_travel_order_attachments.sql` | Create `travel_order_attachments` |
| `008_create_notifications.sql` | Create `notifications` |
| `009_seed_lookup_data.sql` | INSERT seed data for all lookups |
| `010_seed_admin_account.sql` | INSERT admin + 18 approver accounts |

---

## Approval Workflow

```
Regular User submits TO  →  status = PENDING
         ↓
Step 1: Recommending Approver
  → APPROVED  → status = STEP1_APPROVED
  → REJECTED  → status = REJECTED
  → RETURNED  → status = RETURNED (user can edit & resubmit)
         ↓
Step 2: Final Approver (Admin / RED)
  → APPROVED  → status = APPROVED ✅ (printable)
  → REJECTED  → status = REJECTED
  → RETURNED  → status = RETURNED
```

Each action is recorded in `travel_order_approvals` with: who, what, when, remarks, step_no.

---

## Seed Data Reference

### Divisions (29)

1. ADMIN AND FINANCE DIVISION
2. AGRIBUSINESS AND MARKETING ASSISTANCE DIVISION
3. FIELD OPERATIONS DIVISION
4. INTEGRATED LABORATORIES DIVISION
5. OFFICE OF THE REGIONAL EXECUTIVE DIRECTOR
6. OFFICE OF THE PROJECT DIRECTOR/DEPUTY PROJECT DIRECTOR (OPD/DPD)
7. PLANNING MONITORING AND EVALUATION DIVISION
8. REGIONAL AGRICULTURAL AND FISHERY COUNCIL
9. REGIONAL CROP PROTECTION CENTER
10. REGIONAL AGRICULTURAL AND FISHERIES INFORMATION SECTION
11. REGIONAL AGRICULTURAL ENGINEERING DIVISION
12. REGULATORY DIVISION
13. RESEARCH DIVISION
14. MINDANAO INCLUSIVE AGRICULTURE DEVELOPMENT PROJECT
15. PHILIPPINE RURAL DEVELOPMENT PROJECT
16. MIADP Component 1: Ancestral Domain Planning and Social Preparation
17. MIADP Component 2: Resilient Ancestral Domain Agri-Fisheries Infrastructure
18. MIADP Component 3: Ancestral Domain Agri-Fisheries Production and Enterprise Development
19. MIADP Component 4: Project Management and Support, Monitoring, and Evaluation
20. MIADP M&E
21. MIADP SES
22. MIADP PROCUREMENT
23. MIADP ADMIN and FINANCE
24. PRDP I-PLAN
25. PRDP I-BUILD
26. PRDP I-REAP
27. PRDP I-SUPPORT
28. RTD for OPERATION
29. RTD for RESEARCH and REGULATION

### Employment Statuses (7)

REGULAR · CONTRACT OF SERVICE · JOB ORDER · PRDP-COS · MIADP-COS · GOVERNMENT · PRIVATE

### Designations (7)

COMPONENT HEAD · DEPUTY PROJECT DIRECTOR · DIVISION CHIEF · OIC · RTD for Operation · RTD for Research and Regulation · UNIT HEAD

### Travel Types (8)

1. Attendance to Trainings, Seminar
2. Facilitator to Training and Seminar
3. Monitoring of Programs/Projects
4. To accompany Visitors
5. To Submit Documents
6. To Transport Staff (for Drivers)
7. Other related Project Travel
8. Other related Travel

### Transportations (4)

PUJ/Bus · Plane · Boat · RP

### Programs (38)

4Ks - FOD · AMIA PROGRAM · BIDS and AWARDS COMMITTEE - GOODS · CCAMIA · CERRMU/FOD · CFIDP · COA · CONVERGENCE · CORN · F2C2 · FMRDP · GAD · HVCDP · I-PLAN Component · LIVESTOCK · MIADP · NUPAP · OA · PRDP - IBUILD · PRDP I-REAP · PRDP I-SUPPORT · PRDP - RPCO · PRIME · PRISM · RICE · RSBSA · RSBSA - Geotagging · RSL · SAAD · SPIS · STO DOPP - FOD · STO-ILD · TECHNOLOGY BUSINESS INCUBATION PROGRAM (TBI) · VPSS/IPM · YOUTH PARTICIPANTS · VARIOUS · Other Programs and Projects · Others

### Recommending Approvers (18)

DELIZA T. CAMARO · GAY NANETTE R. ALERIA · GLADYS A. EMPERADO · FERDINAND F. CARABALLE · JESS ERICK Y. CO · JOEL S. RUDINAS · JULESBEN CAESAR C. MAQUILING · JUNEL W. ABLANQUE · LANA MAY S. RACINES · LORENA V. DUNA · LUCILLE T. MINGUEZ · LUZ I. GUZMAN · MAE CARMELA G. FABELA · MARY GRACE B. STA. ELENA · ORYZA KRISTY B. BAYLO · PATRICK IAN F. PEDARSE · RICHELLE T. WONG · WILSON V. LAGDAMIN

### Final Approver

**JOSE APOLLO Y. PACAMALAN** — Regional Executive Director (RED)
