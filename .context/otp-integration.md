# OTP & Email Integration — Implementation Checklist

> **Last updated:** 2026-03-05
> **Stack:** Next.js (App Router) · MySQL · Nodemailer (SMTP)

---

## Overview

Two core email features for the Travel Order System:

1. **OTP Verification** — Secure one-time password sent via email when a user forgets, updates, or changes their password.
2. **Admin Account-Creation Email** — When a user registers (self-registration) or an admin creates an account, an email is sent to the user with their login credentials and a welcome message.

---

## Phase 1 — Environment & Dependencies

- [ ] Install `nodemailer` and `@types/nodemailer`
- [ ] Add SMTP environment variables to `.env`
  ```env
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_USER=your-email@gmail.com
  SMTP_PASS=your-app-password
  SMTP_FROM="Travel Order System <noreply@yourdomain.com>"
  OTP_EXPIRY_MINUTES=5
  ```
- [ ] Add `JWT_SECRET` to `.env` (for signed reset tokens)
- [ ] Validate all new env vars on server startup

---

## Phase 2 — Database: OTP Tokens Table

- [ ] Create migration `011_create_otp_tokens.sql`

  ```
  otp_tokens
  ├── otp_id          INT AUTO_INCREMENT  PK
  ├── user_id         INT                 FK → users
  ├── otp_code        VARCHAR(6)          NOT NULL
  ├── otp_purpose     ENUM('FORGOT_PASSWORD','CHANGE_PASSWORD')
  ├── is_used         TINYINT(1)          DEFAULT 0
  ├── expires_at      TIMESTAMP           NOT NULL
  ├── created_at      TIMESTAMP           DEFAULT CURRENT_TIMESTAMP
  ```

- [ ] Add index on `(user_id, otp_purpose, is_used)`
- [ ] Run migration against the database

---

## Phase 3 — Email Service (Core Utility)

- [ ] Create `src/server/services/email.service.ts`
  - [ ] Configure Nodemailer SMTP transporter
  - [ ] `sendMail(to, subject, html)` — generic send function
  - [ ] Error handling & logging for email failures
- [ ] Create `src/server/utils/email-templates.ts`
  - [ ] `otpEmailTemplate(userName, otpCode, expiryMinutes)` — styled HTML
  - [ ] `welcomeEmailTemplate(userName, email, tempPassword?, role)` — styled HTML
  - [ ] `passwordChangedTemplate(userName)` — confirmation email

---

## Phase 4 — OTP Generation & Verification Logic

- [ ] Create `src/server/services/otp.service.ts`
  - [ ] `generateOTP()` — 6-digit cryptographically random code
  - [ ] `createOTP(userId, purpose)` — insert into `otp_tokens`, invalidate old ones
  - [ ] `verifyOTP(userId, code, purpose)` — validate code, check expiry, mark used
  - [ ] `cleanExpiredOTPs()` — optional cleanup utility
- [ ] Create `src/server/models/otp.model.ts`
  - [ ] `insertOTP(userId, code, purpose, expiresAt)`
  - [ ] `findValidOTP(userId, code, purpose)`
  - [ ] `markOTPUsed(otpId)`
  - [ ] `invalidateUserOTPs(userId, purpose)`
- [ ] Create `src/server/validators/otp.validator.ts`
  - [ ] Schema for forgot-password request (email)
  - [ ] Schema for OTP verification (email + otp_code)
  - [ ] Schema for password reset (email + otp_code + new_password)

---

## Phase 5 — Forgot Password API Flow

> Flow: **Request OTP → Verify OTP → Reset Password**

- [ ] `POST /api/auth/forgot-password` — Request OTP
  - [ ] Accept `{ email }`
  - [ ] Look up user by email
  - [ ] Generate OTP, save to DB, email to user
  - [ ] Return success (do NOT reveal if email exists — security)
- [ ] `POST /api/auth/verify-otp` — Verify OTP
  - [ ] Accept `{ email, otp_code }`
  - [ ] Validate OTP from DB (not expired, not used)
  - [ ] Return a short-lived signed reset token (JWT, 10 min TTL)
- [ ] `POST /api/auth/reset-password` — Reset Password
  - [ ] Accept `{ reset_token, new_password }`
  - [ ] Verify JWT token, hash new password, update `users` table
  - [ ] Mark OTP as used
  - [ ] Send "password changed" confirmation email
  - [ ] Invalidate all sessions for the user (optional)

---

## Phase 6 — Change Password (Authenticated)

- [ ] `POST /api/auth/change-password`
  - [ ] Require authentication (session/token)
  - [ ] Accept `{ current_password, new_password }`
  - [ ] Verify current password with `bcryptjs`
  - [ ] Optional: send OTP to email for extra verification before applying change
  - [ ] Hash & update new password
  - [ ] Send "password changed" confirmation email

---

## Phase 7 — Admin Account-Creation Email

- [ ] Hook into existing user registration flow:
  - [ ] **Self-registration** (`POST /api/auth/register`)
    - [ ] After successful registration, email user a welcome message with their credentials
    - [ ] Email admin notification that a new user has registered
  - [ ] **Admin-created accounts** (`POST /api/users` or admin panel)
    - [ ] Generate a temporary password (or let admin set one)
    - [ ] Email the new user their login credentials (email + temp password)
    - [ ] Include "change your password on first login" prompt in email
- [ ] Create admin notification email template
- [ ] Add `force_password_change` TINYINT(1) column to `users` table (migration `012`)
  - [ ] If `1`, redirect user to change-password page after login

---

## Phase 8 — Frontend Pages

- [ ] **Forgot Password Page** — `app/(auth)/auth/forgot-password/page.tsx`
  - [ ] Step 1: Email input form → request OTP
  - [ ] Step 2: OTP input (6-digit code) → verify OTP
  - [ ] Step 3: New password form → reset password
  - [ ] Success state → redirect to login
  - [ ] Timer for OTP expiry countdown
  - [ ] "Resend OTP" button with rate limiting
- [ ] **Change Password Page** — `app/(authenticated)/profile/change-password/page.tsx`
  - [ ] Current password + new password + confirm password
  - [ ] Password strength indicator
  - [ ] Success notification
- [ ] **Force Change Password Page** (if `force_password_change = 1`)
  - [ ] Shown after login if flag is set
  - [ ] Cannot navigate away until changed

---

## Phase 9 — Security Hardening

- [ ] Rate limit OTP requests (max 3 per 15 minutes per email)
- [ ] Rate limit OTP verification attempts (max 5 per OTP)
- [ ] OTP codes expire after `OTP_EXPIRY_MINUTES` (default 5 min)
- [ ] Old OTPs for same user+purpose are invalidated when new one is generated
- [ ] Reset token (JWT) has short TTL (10 min)
- [ ] Use `crypto.randomInt()` for OTP generation (not `Math.random()`)
- [ ] Never reveal whether an email exists in forgot-password response
- [ ] Log all password changes and OTP events for audit
- [ ] Sanitize and validate all inputs with validators

---

## Phase 10 — Testing & Verification

- [ ] Test email sending with a real SMTP or Ethereal (fake SMTP for dev)
- [ ] Test full forgot-password flow end-to-end
- [ ] Test change-password flow end-to-end
- [ ] Test admin-created user receives email
- [ ] Test self-registered user receives welcome email
- [ ] Test OTP expiry behavior
- [ ] Test rate limiting
- [ ] Test invalid/expired OTP handling
- [ ] Test force-password-change redirect
- [ ] Verify emails render correctly across email clients

---

## File Map (New & Modified)

| Status | File | Purpose |
|--------|------|---------|
| **NEW** | `app/migrations/011_create_otp_tokens.sql` | OTP tokens table |
| **NEW** | `app/migrations/012_alter_users_force_pw.sql` | Add `force_password_change` column |
| **NEW** | `src/server/services/email.service.ts` | Nodemailer transporter + send |
| **NEW** | `src/server/services/otp.service.ts` | OTP generate / verify logic |
| **NEW** | `src/server/models/otp.model.ts` | OTP database queries |
| **NEW** | `src/server/validators/otp.validator.ts` | Input validation schemas |
| **NEW** | `src/server/utils/email-templates.ts` | HTML email templates |
| **MODIFY** | `app/api/auth/forgot-password/route.ts` | Wire up forgot-password endpoints |
| **NEW** | `app/api/auth/verify-otp/route.ts` | OTP verification endpoint |
| **NEW** | `app/api/auth/reset-password/route.ts` | Password reset endpoint |
| **NEW** | `app/api/auth/change-password/route.ts` | Authenticated password change |
| **MODIFY** | `app/api/auth/register/route.ts` | Add welcome email on registration |
| **MODIFY** | `app/api/users/route.ts` | Add credential email on admin-create |
| **MODIFY** | `app/(auth)/auth/forgot-password/page.tsx` | 3-step forgot password UI |
| **NEW** | `app/(authenticated)/profile/change-password/page.tsx` | Change password UI |
| **MODIFY** | `.env` | Add SMTP + OTP config vars |
| **MODIFY** | `package.json` | Add `nodemailer` dependency |

---

## Notes

- **Gmail SMTP:** Requires an [App Password](https://support.google.com/accounts/answer/185833) (not your normal password). Enable 2FA first on the Gmail account.
- **Production:** Consider a transactional email provider (SendGrid, AWS SES, Resend) instead of Gmail SMTP for reliability and deliverability.
- **Nodemailer** is the industry-standard Node.js library for sending emails — equivalent to PHPMailer in PHP.
