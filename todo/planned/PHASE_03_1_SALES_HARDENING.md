# Phase 03.1 — Sales hardening (Idempotency + PDF + Paid status)

Date: 2026-03-05

## Scope
This is the follow-up sprint to Phase 03. It hardens the already-shipped invoice lifecycle so it’s safe in production-like conditions.

## Goals (definition of done)

### A) Idempotency
- Support `Idempotency-Key` header on invoice create and payment create.
- If the same key is retried with the same payload, return the original response (no duplicates).
- If the same key is retried with a different payload, return `409 Conflict`.
- Store: company_id, key, route, request_hash, response_code, response_body, created_at, expires_at.

### B) Invoice payment status transitions
- Automatically set invoice status based on outstanding:
  - `issued` + balance_due > 0 => `issued`
  - `issued` + balance_due <= 0 => `paid`
- Cancel rules:
  - Cannot cancel if any payments exist (already enforced).

### C) PDF generation endpoints (MVP)
- Implement endpoints:
  - `POST /api/companies/:cid/invoices/:id/pdf/regenerate`
  - `GET /api/companies/:cid/invoices/:id/pdf`
- Render a simple PDF (MVP template) and store it on local disk in dev.
- Update `Invoice.pdfUrl` so API can return it.

Status: ✅ Implemented (pdfkit + local storage)

Note (2026-03-05): PDF regeneration is now **async** (job-enqueued) as part of Phase 03.2.

## Implementation plan
1. Prisma: add `IdempotencyKey` model + migration.
2. Common: `IdempotencyService` to compute request hashes and store/replay responses.
3. Invoices: wrap create invoice and create payment in idempotency.
4. Payments: set invoice status to `paid` when balance_due <= 0.
5. PDFs: implement `InvoicePdfService` using `pdfkit` (no puppeteer/redis required for MVP).
6. E2E tests:
   - Duplicate invoice create returns same invoice id.
   - Conflicting idempotency key returns 409.
   - Paying full amount marks invoice `paid`.
   - PDF regenerate updates `pdf_url` and GET returns it.

## Non-goals
- Redis/BullMQ worker split (we’ll add in infra phase).
- Rich invoice HTML templates.
- S3 signed URLs.

## Kept in planned (intentional)

Even though the goals above are implemented, we are intentionally keeping Phase 03.1 in `todo/planned/` until the async job runner + storage pipeline is added.

Tracking doc:
- `todo/planned/PHASE_03_2_ASYNC_JOBS_FILES.md`

