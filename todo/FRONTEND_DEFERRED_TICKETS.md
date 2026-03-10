# Frontend Deferred Work — Ticket Backlog

**Date**: 2026-03-07

This is the actionable ticket backlog to implement items listed in:
- `docs/FRONTEND_DEFERRED_ITEMS_SPEC.md`
- `todo/FRONTEND_DEFERRED_ITERATION_PLAN.md`

Conventions:
- **Type**: FE (frontend), BE (backend), FULL (both)
- **Size**: S/M/L (relative)
- **Deps**: must land first

---

## DE-01 — Tenant Settings (unblock missing APIs)

**Status** (live):
- T-001: ✅ Done
- T-002: ✅ Done
- T-003: ✅ Done
- T-004: ✅ Done
- T-005: ✅ Done (MVP/dev-mode invite)
- T-006: ✅ Done
- T-007: ✅ Done for MVP (GET + checkout exist). Portal endpoint still optional.
- T-008: ✅ Done

### T-001 — Company settings API
- **Type**: BE
- **Size**: M
- **Spec ref**: FE-09.1
- **Deps**: none
- **Deliverables**
  - `GET /api/companies/:companyId`
  - `PATCH /api/companies/:companyId`
  - ✅ Implemented in `apps/api/src/companies/*`
- **Acceptance**
  - Returns company core fields (name, gstin, address/state_code, email/phone, logo URL if applicable)
  - PATCH validates GSTIN format and state_code constraints
  - Tenant guard enforced (cannot access other company)

### T-002 — Company settings UI
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-09.1
- **Deps**: T-001
- **Deliverables**
  - Route: `/(app)/c/[companyId]/settings/company`
  - ✅ Implemented in `apps/web/src/app/(app)/c/[companyId]/settings/company/page.tsx`
  - Form with save + optimistic UX
  - Optional logo upload if backend supports multipart
- **Acceptance**
  - Edit + save persists and reflects on reload
  - Shows field errors + generic server errors

### T-003 — Invoice series/settings API
- **Type**: BE
- **Size**: M
- **Spec ref**: FE-09.2
- **Deps**: none
- **Deliverables**
  - `GET/POST/PATCH/DELETE /api/companies/:companyId/invoice-series`
  - ✅ Implemented via `apps/api/src/invoices/invoice-series.controller.ts`
- **Acceptance**
  - Prevent deleting a series that has issued invoices (return 409 with message)
  - Unique constraint on series code/name within company

### T-004 — Invoice series UI
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-09.2
- **Deps**: T-003
- **Deliverables**
  - Route: `/(app)/c/[companyId]/settings/invoice-series`
  - ✅ Implemented in `apps/web/src/app/(app)/c/[companyId]/settings/invoice-series/page.tsx`
  - CRUD table + modal/drawer
- **Acceptance**
  - Create/edit/delete works; 409 shows friendly message

### T-005 — Users & roles APIs (tenant)
- **Type**: BE
- **Size**: L
- **Spec ref**: FE-09.3
- **Deps**: auth/rbac baseline
- **Deliverables**
  - `GET /api/companies/:companyId/users`
  - `POST /api/companies/:companyId/users` (invite)
  - `PATCH /api/companies/:companyId/users/:userId` (role/status)
  - `GET /api/companies/:companyId/roles`
  - ✅ Implemented in `apps/api/src/users/*` (invite is dev-mode and returns a temporary password)
- **Acceptance**
  - Invite flow emits email or returns token (dev mode)
  - Only owners/admin can manage users

### T-006 — Users & roles UI
- **Type**: FE
- **Size**: L
- **Spec ref**: FE-09.3
- **Deps**: T-005
- **Deliverables**
  - Route: `/(app)/c/[companyId]/settings/users`
  - ✅ Implemented in `apps/web/src/app/(app)/c/[companyId]/settings/users/page.tsx`
  - List users, invite user, change role, deactivate
- **Acceptance**
  - UI prevents self-demotion if backend enforces it; error message shown

### T-007 — Subscription APIs (tenant self-serve)
- **Type**: BE
- **Size**: L
- **Spec ref**: FE-09.4
- **Deps**: payment provider decision (Stripe/Razorpay/etc)
- **Deliverables**
  - ✅ `GET /api/companies/:companyId/subscription` (exists)
  - ✅ `POST /api/companies/:companyId/subscription/checkout` (exists; MVP creates pending subscription)
  - ⏳ `POST /api/companies/:companyId/subscription/portal` (not found yet)
- **Acceptance**
  - `GET` returns the latest subscription row for the company.
  - `checkout` creates a `pending` subscription row and returns `{ checkout_url: null, subscription_id }` (current MVP).
  - If portal is implemented: returns provider management URL.

### T-008 — Subscription UI
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-09.4
- **Deps**: T-007
- **Deliverables**
  - Route: `/(app)/c/[companyId]/settings/subscription`
  - Plan/status display + CTA to checkout/portal
  - ✅ Implemented in `apps/web/src/app/(app)/c/[companyId]/settings/subscription/page.tsx`
- **Acceptance**
  - If no subscription: show choose plan CTA
  - If active: show renewal + manage button

---

## DE-02 — Customer/Supplier Ledgers

**Status** (live):
- T-020: ✅ Done
- T-021: ✅ Done (purchases-only; supplier payments deferred to DE-04/T-042)
- T-022: ✅ Done

### T-020 — Customer ledger API
- **Type**: BE
- **Size**: M
- **Spec ref**: FE-03.2
- **Deps**: accounting posting rules finalized
- **Deliverables**
  - `GET /api/companies/:companyId/customers/:customerId/ledger?from&to&page&limit`
- **Acceptance**
  - Returns opening/closing and running-balance rows

### T-021 — Supplier ledger API
- **Type**: BE
- **Size**: M
- **Spec ref**: FE-03.2
- **Deps**: same as above
- **Deliverables**
  - `GET /api/companies/:companyId/suppliers/:supplierId/ledger?from&to&page&limit`

### T-022 — Ledger UI (customer + supplier)
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-03.2
- **Deps**: T-020, T-021
- **Deliverables**
  - Date range controls + table + pagination
  - Deep-links to invoice/purchase/payment refs
- **Acceptance**
  - Handles empty range and large ledgers

---

## DE-03 — Categories

### T-030 — Categories API
- **Type**: BE
- **Size**: M
- **Spec ref**: FE-04.1
- **Deps**: none
- **Deliverables**
  - `GET/POST/PATCH/DELETE /api/companies/:companyId/categories`
- **Acceptance**
  - Unique category name within company
  - Deleting a category used by products returns 409 or auto-unassign by rule
 - [x] T-030: Add Category model and wire Products.categoryId
 - [x] T-031: Categories CRUD UI + filter in Products list

### T-031 — Categories UI + product integration
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-04.1
- **Deps**: T-030
- **Deliverables**
  - Categories CRUD page
  - Product forms: category select
  - Products list: category filter

---

## DE-04 — Payments completeness

- Status: ✅ Done

### T-040 — Sales payments UI (invoice payments)
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-05.3
- **Deps**: confirm `RecordPaymentDto` fields / filters
- **Deliverables**
  - Invoice detail: payments section
  - Record payment form
  - Payment list filtered by invoice (via API filter or local filtering)
- **Acceptance**
  - Payment appears after create; errors mapped

### T-041 — Idempotency header wiring (invoice create + payment record)
- **Type**: FE
- **Size**: S
- **Spec ref**: FE-05.2
- **Deps**: none
- **Deliverables**
  - Generate UUID per create action
  - Send `idempotency-key` header
- **Acceptance**
  - Double-click submit doesn’t create duplicates (verified by backend logs/DB)

### T-042 — Define purchase payments contract
- **Type**: FULL
- **Size**: M
- **Spec ref**: FE-06.1
- **Deps**: decision: reuse `/payments` vs nested endpoint
- **Deliverables**
  - API + DTO + DB mapping
  - Minimal UI in purchase detail

---

## DE-05 — Invoice/Purchase Builder UX upgrades

- Status: ✅ Done

### T-050 — Invoice builder table UI
- **Type**: FE
- **Size**: L
- **Spec ref**: FE-05.1
- **Deps**: none
- **Deliverables**
  - Line-items grid (add/remove)
  - Product search/select integration
  - Totals panel with tax breakdown
  - Map 422 insufficient stock to line

### T-051 — Purchase entry UX improvements
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-06 builder gaps
- **Deps**: confirm purchase DTO supports line items fully
- **Deliverables**
  - Render items breakdown + totals
  - Optional editable draft flow (if supported)

---

## DE-06 — Accounting UX

### T-060 — Cash book page

Status: ✅ Done
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-07.1
- **Deps**: backend books endpoints exist
- **Deliverables**
  - Route: `/(app)/c/[companyId]/accounting/books/cash`
  - Date filters + table + pagination

### T-061 — Bank book page

Status: ✅ Done
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-07.1
- **Deps**: backend books endpoints exist

### T-062 — Profit & loss UX

Status: ✅ Done
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-07.2
- **Deps**: report payload stability

### T-063 — Balance sheet UX

Status: ✅ Done
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-07.2

### T-064 — Journal drill-down

Status: ✅ Done
- **Type**: FE/BE (confirm)
- **Size**: M
- **Spec ref**: accounting drill-down
- **Deps**: confirm `GET /journals/:id` (or add)

---

## DE-07 — Reports UI polish

### T-070 — Reports cards/tables polish

Status: ✅ Done
- **Type**: FE
- **Size**: S
- **Spec ref**: FE-08.1
- **Deps**: none

### T-071 — Add charts (optional)
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-08.1
- **Deps**: choose chart lib (Recharts is typical)

Status: ⏭️ Skipped (optional)

---

## DE-08 — Super-admin support tickets

### T-080 — Implement real support tickets backend

Status: ✅ Done
- **Type**: BE
- **Size**: L
- **Spec ref**: FE-11.1
- **Deps**: DB schema + workflow
- **Acceptance**
  - List shows tickets
  - Patch updates status without throwing

### T-081 — Support tickets admin UI

Status: ✅ Done
- **Type**: FE
- **Size**: M
- **Spec ref**: FE-11.1
- **Deps**: T-080

---

## DE-09 — POS MVP (only if required)

### T-090 — Define POS MVP contract
- **Type**: FULL
- **Size**: M
- **Spec ref**: FE-10
- **Deps**: decide POS architecture (invoice-based vs separate)

### T-091 — POS UI + receipt printing
- **Type**: FE
- **Size**: L
- **Spec ref**: FE-10
- **Deps**: T-090

---

## Cross-cutting tickets (recommended)

### T-100 — Add Playwright e2e skeleton (if not present)
- **Type**: FE
- **Size**: M
- **Deps**: none
- **Acceptance**
  - One smoke test: login → dashboard loads for a company

### T-101 — Admin JSON-to-table polish pass
- **Type**: FE
- **Size**: M
- **Deps**: none

---

## Working agreement
- Every completed ticket should add or update a completion note under `todo/completed/` (e.g., `DE_01_SETTINGS_COMPANY.md`).
- Keep API contracts in sync with `docs/API_SPEC.md` or `docs/API_OPENAPI.yaml` (if used as source of truth).
