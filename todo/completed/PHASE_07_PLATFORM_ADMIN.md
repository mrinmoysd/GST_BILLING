# Phase 07 — Notifications, files, billing, admin (Platform/Admin)

Date: 2026-03-06

## Scope checklist

- ✅ Notification templates + test send
- ✅ Files signed upload/download
- ✅ Subscription checkout + webhooks
- ✅ Super-admin endpoints

## What’s implemented

### Notifications
Tenant-scoped module providing:
- `GET /api/companies/:companyId/notification-templates`
- `POST /api/companies/:companyId/notification-templates`
- `PATCH /api/companies/:companyId/notification-templates/:templateId`
- `POST /api/companies/:companyId/notifications/test`

Implementation notes:
- Templates are stored in `NotificationTemplate`.
- “Test send” persists an outbox record in `NotificationOutbox` (MVP: persistence only).

### Files
Tenant-scoped module providing:
- `POST /api/companies/:companyId/files/sign-upload`
- `POST /api/companies/:companyId/files/upload?token=...` (MVP local upload)
- `GET /api/companies/:companyId/files/:fileId`

Implementation notes:
- `sign-upload` creates a `File` row and returns a signed token.
- `upload` verifies the token (HMAC) and writes bytes to local disk.
- `FILE_SIGNING_SECRET` is required.
- Local storage root can be configured with `FILE_STORAGE_ROOT` (defaults to `apps/api/storage`).

### Billing + webhooks
Billing module providing:
- `GET /api/companies/:companyId/subscription` (MVP: returns latest)
- `POST /api/companies/:companyId/subscription/checkout` (MVP: creates pending subscription)
- `POST /api/billing/webhooks/:provider` where provider ∈ { stripe, razorpay }

Webhook security:
- Signature scheme: `x-signature: sha256=<hex_hmac>`
- Secret env vars:
  - `BILLING_STRIPE_WEBHOOK_SECRET`
  - `BILLING_RAZORPAY_WEBHOOK_SECRET`
- Raw body capture is enabled for `/api/billing/webhooks/*` in `src/main.ts` so signature verification uses exact bytes.
- All webhook payloads are persisted in `WebhookEvent` with status `received|rejected`.

### Super-admin endpoints
Platform-level admin (SUPER-ADMIN) endpoints:
- `GET /api/admin/companies?page=&limit=&q=`
- `GET /api/admin/subscriptions?page=&limit=&status=`
- `GET /api/admin/usage?from=&to=`
- `GET /api/admin/support-tickets` (MVP placeholder)
- `PATCH /api/admin/support-tickets/:id` (MVP placeholder)

Auth notes:
- Protected by `JwtAccessAuthGuard` + `SuperAdminGuard`.
- `SuperAdminGuard` currently checks `req.user.isSuperAdmin === true` OR `req.user.roles` includes `super_admin`.

## DB / migrations
- Prisma models added for:
  - Files, notifications templates/outbox
  - Subscriptions/plans/usage meters
  - Webhook events
- Migration created and applied:
  - `prisma/migrations/20260306073332_phase07_platform_admin`

## Verification
Quality gates (apps/api):
- ✅ `npm run typecheck`
- ✅ `npm run lint`
- ✅ `npm test`

## Known gaps / next steps (post Phase 07 MVP)
- Support tickets: add actual Prisma model + CRUD/patch semantics.
- Usage metering: add events table + aggregation.
- Files: implement streaming downloads from local storage (currently only metadata endpoint).
- Billing: implement real provider checkout sessions + subscription state transitions from webhook events.
