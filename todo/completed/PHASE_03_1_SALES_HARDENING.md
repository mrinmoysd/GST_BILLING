# Phase 03.1 — Sales hardening (Idempotency + PDF + Paid status)

Date: 2026-03-06

## Goal
Harden the invoicing flow with:
- DB-backed idempotency for write endpoints
- robust payment tracking and “paid” transitions
- invoice PDF generation endpoints

## What shipped (✅)

### A) Idempotency (DB-backed)
- DB-backed idempotency store and replay behavior for supported write endpoints.

### B) Paid status + transitions
- Payment recording updates `amountPaid` and `balanceDue`.
- Cancel is blocked once payments exist.

### C) PDF generation endpoints
- Implemented minimal PDF rendering using `pdfkit`.
- Files stored on local disk (`storage/invoices`).
- `GET /api/companies/:cid/invoices/:id/pdf` downloads the generated file.

### D) Async regeneration (moved into Phase 03.2)
- `POST /api/companies/:cid/invoices/:id/pdf/regenerate` is now async (job-enqueued).

## Tests (✅)
- Covered via existing e2e flows (invoice lifecycle includes pdf regenerate + fetch).

## Quality gates (✅)
- Typecheck: PASS
- E2E: PASS

## Notes
- Phase 03.1 was kept in planned earlier due to the gating rule “only mark complete once async job runner exists”. Phase 03.2 is now implemented, so Phase 03.1 can be considered completed.
