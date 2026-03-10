AI Agent Session Handover Script (New Chat Bootstrap)
====================================================

Purpose
This file is a **copy/paste bootstrap** you can use at the start of a new chat session so another AI agent can take over the project with full context and minimal back-and-forth.

---

## Copy/paste into a new chat (verbatim)

Project: GST_BILLING_SOFTWARE

Role:
- You are the lead engineer. Your task is to implement a VedBill-like GST Billing + Inventory + Accounting SaaS for Indian businesses.
- Use the documentation in `/docs` as the source of truth.

Repository context:
- Workspace path: `/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE`
- Specs live in `docs/`.

Docs index:
- `docs/SPECIFICATION.md` (overview + coverage matrix)
- `docs/DB_SCHEMA.sql` (Postgres schema incl. RBAC, notifications, files, metering, webhooks, adjustments)
- `docs/API_SPEC.md` (human-readable API contracts)
- `docs/API_OPENAPI.yaml` (OpenAPI 3.1 strict base spec; extend to full endpoint coverage)
- `docs/LLD.md` (service design + flows)
- `docs/UI_UX_ROUTE_MAP.md` (Next.js routes, Invoice Builder states, POS flow)
- `docs/INFRA.md`, `docs/SECURITY.md`, `docs/TESTING.md`, `docs/ROADMAP.md`
- `docs/VALIDATION_REPORT.md` (what’s complete & what’s left)

Decisions already made:
- Multi-tenant model: single Postgres DB with `company_id` on business tables.
- Suggested backend: NestJS + Prisma; frontend: Next.js + Tailwind + Shadcn.
- Async jobs: BullMQ + Redis. Storage: S3. PDF: Puppeteer.

Non-negotiable invariants:
- Every query must be tenant-scoped by `company_id`.
- Invoice numbering must be atomic per series (no duplicates).
- Idempotency-Key supported on create operations.
- Stock policy: configurable negative stock allowed/blocked.
- Accounting entries must balance (sum debit = sum credit).

Immediate next implementation goals (prioritized):
1) Scaffold backend (NestJS) + Prisma migrations from `DB_SCHEMA.sql`.
2) Scaffold frontend (Next.js) routes from `UI_UX_ROUTE_MAP.md`.
3) Implement core flows: login, company onboarding, products/customers CRUD, invoice create/issue, stock movement, PDF job.
4) Add Jest unit tests for TaxEngine + InvoiceNumberService, and integration tests for invoice create.

Required quality gates:
- No untyped any-heavy business logic; keep DTO validation.
- Lint + typecheck + unit tests must pass.

When you start:
- First read the following files fully: `docs/DB_SCHEMA.sql`, `docs/API_OPENAPI.yaml`, `docs/LLD.md`.
- Then propose the minimal repo scaffold and implement in small PR-sized steps.

---

## Agent checklist (use during execution)
- [ ] Confirm framework choices (NestJS vs Express; Next.js app router)
- [ ] Create DB migrations and Prisma schema matching `DB_SCHEMA.sql`
- [ ] Implement Auth + RBAC
- [ ] Implement companies + customers + products
- [ ] Implement invoice lifecycle + stock movements + PDF job
- [ ] Add OpenAPI generation from code or update `docs/API_OPENAPI.yaml`
- [ ] Add tests and CI pipeline

## Notes
- `docs/API_OPENAPI.yaml` is strict and intentionally starts with core endpoints; it should be extended until it matches `API_SPEC.md` 1:1.
