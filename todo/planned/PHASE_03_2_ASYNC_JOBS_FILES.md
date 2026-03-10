# Phase 03.2 — Async job runner + file storage pipeline (PDFs)

Date: 2026-03-05

## Why this phase exists

Phase 03.1 shipped **synchronous** invoice PDF generation (pdfkit + local filesystem) as an MVP.

You asked to keep Phase 03.1 in `todo/planned/` until we add a production-leaning pipeline:
- async job runner
- durable job state
- reliable file storage (local now; S3/MinIO optional later)

This phase captures that remaining work so we can implement it later without changing the already-working MVP.

## Scope / Definition of Done

### A) Job runner foundation
- Add an async job runner (recommended: BullMQ + Redis) OR a DB-backed job queue.
- Persist job state:
  - `queued | running | succeeded | failed`
  - timestamps (`created_at`, `started_at`, `finished_at`)
  - error details (safe/truncated)
- Provide a standard envelope for job responses.

### B) PDF generation becomes a job
- Change `POST /api/companies/:cid/invoices/:id/pdf/regenerate` to enqueue a job.
  - Response returns `{ job_id, status }`.
- Add endpoint to poll job status:
  - `GET /api/companies/:cid/jobs/:jobId`
- Keep `GET /api/companies/:cid/invoices/:id/pdf` as download.
  - Returns `404` if not generated yet.

### C) Storage abstraction
- Introduce a `FilesService` abstraction (or similar) with at least:
  - `put()` (store bytes/stream)
  - `getPath()`/`getStream()` for download
- Implement local filesystem driver first.
- Optional later driver:
  - S3/MinIO (signed URLs, bucket/key mapping)

### D) Tests
- E2E tests for:
  - enqueue PDF job
  - poll until succeeded (or simulate with direct worker execution in test mode)
  - download PDF and assert content-type

## Non-goals
- HTML invoice rendering (puppeteer) — separate template phase.
- Multi-region storage / CDN.

## Notes / Open questions
- Do we want Redis as a hard dependency now, or a DB job queue first?
- Should jobs be company-scoped (recommended) to prevent cross-tenant access.
- Should we add idempotency for job creation (likely yes: `Idempotency-Key`).
