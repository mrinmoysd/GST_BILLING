# Phase 03 — Sales (Invoices + Payments)

Date: 2026-03-05

## Goal
Deliver a working sales (invoicing) lifecycle on top of the Phase 00–02 foundation, with:
- Draft invoices + issue/cancel lifecycle
- Atomic invoice numbering per-company/series
- Stock deduction on issue and stock reversal on cancel
- Payment recording and outstanding tracking
- E2E coverage and green quality gates

## What shipped (✅)

### Database (Prisma)
Added these models to `prisma/schema.prisma` (and applied migration `20260305085436_phase_03_invoices_payments`):
- `InvoiceSeries`
- `Invoice`
- `InvoiceItem`
- `Payment`

Also adjusted inventory linkage:
- `StockMovement.sourceId` expanded from UUID to `VarChar(64)` so it can link to non-UUID sources safely.

### API modules
New Nest module: `apps/api/src/invoices/*`

#### Invoices
- `GET /api/companies/:cid/invoices?page=&limit=&q=&status=&from=&to=`
- `GET /api/companies/:cid/invoices/:id`
- `POST /api/companies/:cid/invoices`
  - Creates a **draft** invoice.
- `PATCH /api/companies/:cid/invoices/:id`
  - Allowed only when the invoice is `draft`.
- `POST /api/companies/:cid/invoices/:id/issue`
  - Transitions `draft -> issued`
  - Allocates invoice number from `InvoiceSeries`.
  - Decrements stock via `InventoryService.adjustStock(source_type=invoice, source_id=invoice.id)`.
- `POST /api/companies/:cid/invoices/:id/cancel`
  - Transitions `issued -> cancelled`
  - Reverses stock via `InventoryService.adjustStock(source_type=invoice_cancel, source_id=invoice.id)`
  - Blocks cancel if payments exist.

- `POST /api/companies/:cid/invoices/:id/pdf/regenerate`
  - Enqueues an async BullMQ job to regenerate an invoice PDF.
- `GET /api/companies/:cid/invoices/:id/pdf`
  - Downloads the generated PDF from local storage (`storage/invoices`).

#### Payments
- `GET /api/companies/:cid/payments?from=&to=&method=&page=&limit=`
- `POST /api/companies/:cid/payments`
  - Currently supports `invoice_id` payments.
  - Updates `Invoice.amountPaid` and `Invoice.balanceDue`.

### Seed changes
Updated `apps/api/src/auth/auth.seed.ts` to ensure a `DEFAULT` invoice series exists for the seeded demo company.

## Tests (✅)
- Added `apps/api/test/invoices.e2e-spec.ts` covering:
  - Create customer + product
  - Seed stock (manual adjustment)
  - Create invoice draft
  - Issue invoice (asserts stock-movement source linkage)
  - Record payment
  - Cancel blocked (409) once payment exists

## Quality gates (✅)
Verified locally:
- `npm --workspace apps/api run typecheck` — PASS
- `npm --workspace apps/api run test` — PASS
- `npm --workspace apps/api run build` — PASS
- `npm --workspace apps/api run test:e2e` — PASS

## Notes / Decisions
- Invoice numbering uses `InvoiceSeries.nextNumber` with an optimistic update guard inside the same transaction.
  - Carry-forward: add retry loop for rare contention and/or DB-level locking.
- Tax calculations are currently simple per-line using `Product.taxRate`.
  - Carry-forward: full GST engine (CGST/SGST/IGST split, place-of-supply rules).
- PDF generation is implemented using `pdfkit` and stored on local disk (dev MVP).
- Async PDF regeneration is implemented via BullMQ (see `todo/completed/PHASE_03_2_ASYNC_JOBS_FILES.md`).

## Hardening present in repo (post Phase 03)
- DB-backed idempotency exists and is used for supported write endpoints (see `todo/completed/PHASE_03_1_SALES_HARDENING.md`).

## Carry-forward (next)

### Phase 03.1 (Sales hardening)
- Proper idempotency (`Idempotency-Key` table + replays + conflict detection)
- Invoice status transitions: `partial` / `paid` based on `balanceDue` + rules around cancel/void
- PDF generation endpoints (`/pdf/regenerate`, `/pdf`) + minimal storage strategy (local/dev) and a simple async job runner

### Phase 04 (Adjustments + Purchases alignment)
- Credit notes / sales returns (invoice adjustments) with optional stock impact and reversal rules (not implemented yet)
- Align stock source linkage for adjustments (use existing `stock_movements.source_type/source_id`)

### Phase 05 (Accounting + GST compliance)
- Accounting journal postings (AR / Sales / Tax Payable; Cash/Bank) + balanced-entry enforcement
- Full GST engine (CGST/SGST/IGST split, place-of-supply, rounding policies) and report-ready stored breakdowns
