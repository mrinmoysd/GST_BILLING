# Phase 05 — Reports + GST exports

Date: 2026-03-05

## Scope (from `todo/ITERATION_PLAN.md`)

- Business reports (sales/purchase/profit/top products/outstanding)
- GST reports (GSTR-1/3B/HSN/ITC) + export job

**Deliverable:** export job persistence + file download

## What shipped

### A) Business reports (API)

All report endpoints are tenant-scoped and require JWT + company scope.

Base route:
- `/api/companies/:companyId/reports`

Endpoints:
- `GET /sales/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`
  - returns invoice aggregate totals (count, subtotal, tax, total, paid, balance)
- `GET /sales/outstanding?page=1&limit=20&q=...`
  - returns invoices where `status='issued'` and `balance_due > 0`
- `GET /sales/top-products?from=...&to=...&limit=10&sort_by=amount|quantity`
  - aggregates `invoice_items` by product
- `GET /purchases/summary?from=...&to=...`
  - returns purchase aggregate totals
- `GET /profit/snapshot?from=...&to=...`
  - **approximation**: revenue (invoice totals) minus purchases totals

### B) Export job persistence + file download (deliverable)

New model (Prisma):
- `ExportJob` mapped to `export_jobs`
  - stores: `company_id`, `type`, `status`, `params`, timestamps, error, result file URL/name

API:
- `POST /api/companies/:companyId/exports/gstr1?from=...&to=...`
  - creates an export job and produces a CSV file under `storage/exports/`
  - sets job status to `succeeded` when file is written
- `GET /api/companies/:companyId/exports/:jobId`
  - returns job status + metadata
- `GET /api/companies/:companyId/exports/:jobId/download`
  - downloads the CSV when job is `succeeded`

### C) GST exports (MVP — current limitations)

We export a **GSTR-1-like CSV** derived from stored invoice totals.

Limitations (deferred to later phases / GST engine work):
- no CGST/SGST/IGST split
- no place-of-supply rules
- no HSN summary / B2B/B2C bucket logic
- no ITC / GSTR-3B computations

## Tests

- Added `apps/api/test/reports-exports.e2e-spec.ts`
  - creates/ मुद्दifies an invoice so report data exists
  - validates:
    - sales summary
    - outstanding list
    - top products
    - GSTR1 export job create → status succeeded → download (content-type `text/csv`)

## Migrations

- Migration created and applied:
  - `prisma/migrations/20260305095632_phase_05_exports_jobs`

## Quality gates

All run and passing:
- Typecheck: PASS
- Unit tests: PASS
- Build: PASS
- E2E: PASS (`app`, `masters`, `invoices`, `purchases`, `reports-exports`)

## Files added/changed

- `prisma/schema.prisma`
  - added: `ExportJob` + `Company.exportJobs`
- `apps/api/src/reports/`
  - `reports.module.ts`
  - `reports.controller.ts`
  - `reports.service.ts`
- `apps/api/src/exports/`
  - `exports.module.ts`
  - `exports.controller.ts`
  - `exports.service.ts`
  - `csv.util.ts`
- `apps/api/src/app.module.ts`
  - imports `ReportsModule`, `ExportsModule`
- `apps/api/test/reports-exports.e2e-spec.ts`

## Follow-ups

- Add GSTR-1/3B/HSN/ITC **true** GST logic once tax engine is implemented.
- Add async export jobs (queue/worker) when Phase 03.2 (async jobs) is implemented.
- Add parameter validation and stronger typing for date ranges.
