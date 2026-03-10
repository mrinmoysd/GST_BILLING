# Iteration plan (phased delivery)

This repo currently contains **specs/docs only** (no app code yet). This plan breaks implementation into phases and defines what “done” means per phase.

## How we’ll work

- Each phase is a time-boxed iteration.
- Each phase ends with:
  - working code (build/run instructions)
  - CI-quality gates (lint/typecheck + tests)
  - a status report saved to `todo/completed/PHASE_<NN>_<NAME>.md`
- Keep changes small and mergeable:
  - 1 feature per PR/merge (even if local-only for now)
  - tests added with the feature
  - minimal docs updates

## Definition of Done (per phase)

A phase is “done” only if all are true:

- ✅ Build / run steps documented (and actually run successfully)
- ✅ Lint + typecheck pass
- ✅ Unit tests added for the key modules of the phase
- ✅ Minimal smoke test script exists (CLI or curl-like script)
- ✅ Security basics in place (auth guards, tenant scoping enforced)
- ✅ DB migrations are reproducible
- ✅ Status doc written in `todo/completed/`

## Phase 00 — Project bootstrap (repo becomes runnable)

### Scope
- Backend skeleton (NestJS recommended) OR minimal Node service with:
  - health endpoint
  - OpenAPI served via Swagger UI
- DB layer scaffold (Prisma + Postgres) + first migration
- Option A decision: create canonical Prisma schema at `prisma/schema.prisma` during bootstrap.
  - `docs/DB_SCHEMA.sql` stays canonical only until Phase 00 is complete.
  - After Phase 00: Prisma migrations become the canonical schema evolution path.
- Common middleware:
  - request logging
  - request id
  - error envelope

### Deliverables
- `apps/api/` runnable service
- `docker-compose.yml` for local Postgres (optional but strongly preferred)
- `todo/completed/PHASE_00_BOOTSTRAP.md`

## Phase 01 — Auth + tenant + RBAC foundation

### Scope
- Auth: register/login/refresh/logout/me
- Multi-tenant enforcement: `companyId` scoping on every route
- RBAC: roles/permissions, middleware/guards

### Deliverables
- Auth endpoints implemented per `docs/API_OPENAPI.yaml`
- Tests for auth + tenant guard
- `todo/completed/PHASE_01_AUTH_TENANT_RBAC.md`

## Phase 02 — Masters (customers, suppliers, products)

### Scope
- Customers CRUD + ledger endpoint (skeleton)
- Suppliers CRUD + ledger endpoint (skeleton)
- Products CRUD + stock adjustment

### Deliverables
- DB migrations for masters
- Pagination/search behavior
- `todo/completed/PHASE_02_MASTERS.md`

## Phase 03 — Sales (invoices, PDFs, payments)

### Scope
- Invoice drafts -> issue -> cancel
- PDF generation pipeline (async job + storage)
- Payments module
- Credit notes / sales returns

### Deliverables
- Invariants enforced (numbering, idempotency, stock policy)
- `todo/completed/PHASE_03_SALES.md`

## Phase 04 — Purchases + inventory movements

### Scope
- Purchases lifecycle + bill upload
- Stock movements queries + low-stock report

### Deliverables
- Stock movement ledger consistency tests
- `todo/completed/PHASE_04_PURCHASES_INVENTORY.md`

## Phase 05 — Reports + GST exports

### Scope
- Business reports (sales/purchase/profit/top products/outstanding)
- GST reports (GSTR-1/3B/HSN/ITC) + export job

### Deliverables
- Export job persistence + file download
- `todo/completed/PHASE_05_REPORTS_GST.md`

## Phase 06 — Accounting module

### Scope
- Ledgers, journals
- Trial balance, P&L, balance sheet, cash/bank book

### Deliverables
- Journal balancing invariant tests
- `todo/completed/PHASE_06_ACCOUNTING.md`

## Phase 07 — Notifications, files, billing, admin

### Scope
- Notification templates + test send
- Files signed upload/download
- Subscription checkout + webhooks
- Super-admin endpoints

### Deliverables
- Webhook signature verification
- `todo/completed/PHASE_07_PLATFORM_ADMIN.md`

## Phase 08 — Frontend (Next.js) + POS flows (optional if building UI now)

### Scope
- The detailed frontend requirements live in `docs/PHASE_08_FRONTEND_REQUIREMENTS.md`.
- The execution roadmap lives in `todo/FRONTEND_ITERATION_PLAN.md`.
- Next.js app shell + auth pages + dashboard
- Invoice builder UX per `docs/UI_UX_ROUTE_MAP.md`
- POS route + print pipeline

### Deliverables
- Playwright e2e smoke test
- `todo/completed/PHASE_08_FRONTEND.md`
