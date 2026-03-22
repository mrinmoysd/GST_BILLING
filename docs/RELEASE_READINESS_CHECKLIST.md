# Release Readiness Checklist

## Build and validation

- Run `npm --workspace apps/api run prisma:generate`
- Run `npm --workspace apps/api run typecheck`
- Run `npm --workspace apps/api run build`
- Run `npm --workspace apps/api run test`
- Run `npm --workspace apps/api run test:e2e`
- Run `npm --workspace apps/web run lint`
- Run `npx next build --webpack` in `apps/web`
- Run `npm --workspace apps/web run test:e2e` against a live API-backed environment

## Database and migrations

- Confirm all Prisma migrations are committed and ordered
- Run `npm --workspace apps/api run prisma:migrate:deploy` on staging before production
- Verify staging data can be read after the latest migration set
- Validate rollback approach for the most recent schema changes

## Required environment configuration

### Auth and core

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

### Billing

- `BILLING_STRIPE_SECRET_KEY`
- `BILLING_STRIPE_WEBHOOK_SECRET`
- `BILLING_RAZORPAY_KEY_ID`
- `BILLING_RAZORPAY_KEY_SECRET`
- `BILLING_RAZORPAY_WEBHOOK_SECRET`

### Files

- `FILE_SIGNING_SECRET`
- `FILE_STORAGE_DRIVER`
- If using object storage:
  - `FILE_STORAGE_BUCKET`
  - `FILE_STORAGE_REGION`
  - `FILE_STORAGE_ACCESS_KEY_ID`
  - `FILE_STORAGE_SECRET_ACCESS_KEY`
  - `FILE_STORAGE_ENDPOINT` for MinIO or custom S3-compatible targets

### Notifications

- `NOTIFICATIONS_EMAIL_WEBHOOK_URL`
- `NOTIFICATIONS_SMS_WEBHOOK_URL`
- `NOTIFICATIONS_WHATSAPP_WEBHOOK_URL`

## Functional release checks

- Create company through onboarding
- Create and issue invoice
- Record full and partial payment
- Create purchase and receive stock
- Run GST export and download result
- Create POS sale and print receipt
- Upload and download a file attachment
- Trigger and process a notification outbox row
- Trigger a billing checkout session in the configured provider
- Post webhook payload in staging and verify subscription state sync

## Operational checks

- Confirm admin queue metrics return PDF, export-job, and notification-outbox counters
- Confirm admin usage summary returns aggregate meter data
- Confirm audit history is present under role administration
- Confirm Redis and background queue infrastructure is healthy
- Confirm object storage bucket permissions are correct

## Known pre-release follow-ups

- Playwright coverage depends on a live API-backed environment and seeded credentials
- Browser-print POS is production-ready for MVP, but offline mode and direct ESC/POS printing remain intentionally out of scope
