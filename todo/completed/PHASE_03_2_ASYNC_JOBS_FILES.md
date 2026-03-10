# Phase 03.2 — Async job runner + file storage pipeline (PDFs)

Date: 2026-03-05

## What shipped (✅)

### Async job runner
- Added BullMQ-backed job runner.
- Local dev support via Redis in `docker-compose.yml`.

### PDF regeneration is now async
- `POST /api/companies/:cid/invoices/:id/pdf/regenerate` now enqueues a BullMQ job and returns a job id.
- `GET /api/companies/:cid/jobs/:jobId` returns job state.
- `GET /api/companies/:cid/invoices/:id/pdf` still downloads the generated file.

Implementation notes (current repo):
- PDFs are rendered with `pdfkit` via `InvoicePdfService`.
- A BullMQ worker (`PdfProcessor`) executes `invoice.pdf.regenerate` jobs.

## Notes
- Files are still stored on local disk (`storage/invoices`) as the initial storage driver.
- Future: swap to S3/MinIO using a storage abstraction.

## Quality gates
- Typecheck/build/tests pass.
- For features that enqueue/process PDF jobs, Redis must be available.
