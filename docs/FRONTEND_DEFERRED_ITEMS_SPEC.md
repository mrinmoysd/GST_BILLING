# Frontend Deferred Items Spec (FE-01 → FE-11)

**Date**: 2026-03-07

This document consolidates **everything deferred / blocked** across frontend iterations **FE-01 through FE-11**, based on:
- `todo/FRONTEND_ITERATION_PLAN.md` (the plan)
- the shipped implementation + completion docs in `todo/completed/`
- backend surface discovery in `apps/api/src/**/*.controller.ts`
- baseline architecture expectations in `docs/PHASE_08_FRONTEND_REQUIREMENTS.md`

## How to read this
Each deferred item includes:
- **Why deferred**: missing backend API vs placeholder backend vs frontend gap
- **Proposed backend contract** (when missing)
- **Frontend scope**: routes, UI behavior, hooks
- **Definition of Done** and **Acceptance checks**
- **Edge cases**

> Terminology:
> - “Blocked (missing API)” means: no corresponding controller/route exists in `apps/api/src/**`.
> - “Backend placeholder” means: route exists but returns dummy data or throws by design.
> - “Frontend gap” means: backend exists but we didn’t implement the UI yet (or implemented only JSON view).

---

## 1) Master list of deferred/blocked items

### FE-03 — Masters: Customers, Suppliers
1. Customer **update** UI (frontend gap)
2. Customer **delete** UI (frontend gap)
3. Customer ledger view: real statement data (**blocked: missing API**)
4. Supplier ledger view: real statement data (**blocked: missing API**)
5. Customer detail: invoices list tab (frontend gap / depends on filter support)
6. Supplier detail: purchases list tab (frontend gap / depends on filter support)

### FE-04 — Products, Categories; Inventory
7. Categories CRUD + selection/filtering (**blocked: missing API**)

### FE-05 — Sales: Invoices
8. Invoice builder UX (multi-line, search, totals) (frontend gap)
9. Idempotency key on invoice create (frontend gap)
10. Invoice payments UI (frontend gap; backend exists via payments controller)
11. Inline 422 insufficient stock mapping (frontend gap)

### FE-06 — Purchases
12. Purchase payments UI (**blocked/unknown: purchase payment APIs not found**)

### FE-07 — Accounting
13. Cash book page (frontend gap; backend exists)
14. Bank book page (frontend gap; backend exists)
15. Profit & loss UX (currently JSON) (frontend gap)
16. Balance sheet UX (currently JSON) (frontend gap)
17. Journal drill-down page (frontend gap; needs GET-by-id confirmation)

### FE-08 — Reports + GST exports
18. Charts/cards UI for reports (frontend gap)
19. Structured tables for report outputs (frontend gap)

### FE-09 — Settings
20. Company settings (blocked: missing API)
21. Invoice settings / series management (blocked: missing API)
22. Users + roles (blocked: missing API)
23. Subscription status + checkout (blocked: missing tenant API; admin-only endpoints exist)

### FE-10 — POS (MVP)
24. POS billing experience (blocked: missing POS-optimized APIs / contract)
25. Browser-print thermal CSS + receipt route (deferred until POS contract is defined)

### FE-11 — Super-admin
26. Support tickets real module (**backend placeholder**: list empty; patch throws)
27. Admin UI polish (render tables instead of JSON) (frontend gap)

---

## 2) Detailed specs

### FE-03.1 — Customer update/delete UI
**Why deferred**: Frontend gap. Supplier detail already has inline edit/delete; customers need parity.

**Backend status**: Likely exists (hooks in `apps/web/src/lib/masters/hooks.ts` include update/delete).

**Frontend scope**
- Route: `/(app)/c/[companyId]/masters/customers/[customerId]`
- Add:
  - Inline editable fields (name, email, phone, address if present)
  - Save button (PATCH)
  - Delete button with confirm (DELETE)

**Hooks**
- `useUpdateCustomer({ companyId, customerId })`
- `useDeleteCustomer({ companyId, customerId })`

**DoD**
- Field-level errors + form-level error banner.
- Query invalidation (detail + list).
- Delete redirects to customers list.

**Acceptance**
- Update persists and is visible after refresh.
- Delete removes customer and list no longer shows them.

**Edge cases**
- Backend rejects delete when invoices exist: show friendly message.

---

### FE-03.2 — Customer/Supplier ledger endpoints + UI
**Why deferred**: Blocked (missing API).

**Current UI**: placeholder pages exist but no data.

**Proposed backend contract**
- Customer ledger:
  - `GET /api/companies/:companyId/customers/:customerId/ledger?from=YYYY-MM-DD&to=YYYY-MM-DD&page&limit`
- Supplier ledger:
  - `GET /api/companies/:companyId/suppliers/:supplierId/ledger?from&to&page&limit`

**Response (suggested)**
```json
{
  "data": {
    "opening_balance": "0.00",
    "closing_balance": "1234.00",
    "rows": [
      {
        "date": "2026-03-01",
        "ref_type": "invoice",
        "ref_id": "inv_...",
        "narration": "Invoice INV-0001",
        "debit": "1180.00",
        "credit": "0.00",
        "balance": "1180.00"
      }
    ]
  },
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

**Frontend scope**
- Add filters (from/to) and table with running balance.
- Link `ref_id` to invoice/purchase/payment pages.

**DoD**
- Pagination controls.
- Export CSV optional.

---

### FE-04.1 — Categories module
**Why deferred**: Blocked (missing API). No `apps/api/src/categories/*`.

**Proposed backend contract**
- `GET /api/companies/:companyId/categories?page&limit&q`
- `POST /api/companies/:companyId/categories`
- `PATCH /api/companies/:companyId/categories/:categoryId`
- `DELETE /api/companies/:companyId/categories/:categoryId`

**Data model**
- Category: `id, name, created_at, updated_at`
- Product includes optional `category_id`

**Frontend scope**
- New route group:
  - `/(app)/c/[companyId]/masters/categories`
- Product create/edit forms:
  - category select
- Products list:
  - category filter

**Acceptance**
- Create category → assign to product → filter works.

---

### FE-05.1 — Invoice builder (multi-line, totals)
**Why deferred**: Frontend gap.

**Backend status**: Invoice draft create/patch/issue exist.

**Frontend scope**
- Route: `/(app)/c/[companyId]/sales/invoices/new`
- Replace minimal form with invoice builder:
  - customer select/search
  - line items table with add/remove rows
  - product search/select → auto-fill GST/tax rate + unit price (editable)
  - qty, discount, unit price validations
  - totals panel (subtotal/tax/grand total)
  - save draft (PATCH) and issue flow

**DoD**
- Proper inline validation; map server errors.
- Works with 422 insufficient stock and shows row-level error.

---

### FE-05.2 — Idempotency key header (invoice create)
**Why deferred**: Frontend gap.

**Backend status**: Invoices controller accepts `idempotency-key`.

**Frontend spec**
- On create draft, generate UUID and pass `idempotency-key` header.
- Prevent double-submit by disabling submit while pending.

---

### FE-05.3 — Payments UI (invoice)
**Why deferred**: Frontend gap.

**Backend status**
- Payments controller exists:
  - `GET /api/companies/:companyId/payments`
  - `POST /api/companies/:companyId/payments` (idempotency supported)

**Missing detail to confirm**
- `RecordPaymentDto` fields (needs review); likely includes `invoice_id`.

**Frontend scope**
- Invoice detail page: add Payments section/tab
  - list payments filtered by invoice (either API supports `invoice_id` filter or add new endpoint)
  - record payment form: date/method/amount/reference

**Acceptance**
- Record payment succeeds and outstanding changes (if invoice endpoint includes totals/outstanding).

---

### FE-06.1 — Purchase payments
**Why deferred**: Blocked/unknown.

**Backend status**
- No purchase payment controller discovered.

**Proposed contract**
Option A: extend `/payments` to support `purchase_id`.
Option B: `/purchases/:purchaseId/payments`.

**Frontend scope**
- Purchase detail page: Payments section.

---

### FE-07.1 — Cash/Bank books
**Why deferred**: Frontend gap.

**Backend status**
- Accounting controller exposes:
  - `GET /api/companies/:companyId/books/cash`
  - `GET /api/companies/:companyId/books/bank`

**Frontend scope**
- Add routes:
  - `/(app)/c/[companyId]/accounting/books/cash`
  - `/(app)/c/[companyId]/accounting/books/bank`
- UI: date range filters + paginated table.

---

### FE-07.2 — P&L and Balance sheet layout
**Why deferred**: Frontend gap (currently JSON render).

**Frontend scope**
- Implement structured sections:
  - P&L: income lines + expense lines + net profit.
  - Balance sheet: assets vs liabilities/equity.

**DoD**
- Totals displayed; empty state if no rows.

---

### FE-08.1 — Report charts/cards
**Why deferred**: Frontend gap.

**Frontend scope**
- Sales summary cards
- Top products table
- Profit snapshot cards
- Optional charts (later): keep as non-blocking enhancement.

---

### FE-09.1 — Company settings
**Why deferred**: Blocked (missing API in repo scan).

**Proposed contract**
- `GET /api/companies/:companyId`
- `PATCH /api/companies/:companyId`

**Fields**
- name, gstin, address, state_code, email, phone, logo file (optional).

---

### FE-09.2 — Invoice series/settings
**Why deferred**: Blocked (missing API).

**Proposed contract**
- `GET/POST/PATCH/DELETE /api/companies/:companyId/invoice-series`

---

### FE-09.3 — Users/roles
**Why deferred**: Blocked (missing API).

**Proposed contract**
- `GET /api/companies/:companyId/users`
- `POST /api/companies/:companyId/users` (invite)
- `PATCH /api/companies/:companyId/users/:userId`
- `GET /api/companies/:companyId/roles`

---

### FE-09.4 — Subscription + checkout (tenant)
**Why deferred**: Blocked (missing tenant subscription API). Admin list exists.

**Proposed contract**
- `GET /api/companies/:companyId/subscription`
- `POST /api/companies/:companyId/subscription/checkout`
- `POST /api/companies/:companyId/subscription/portal`

---

### FE-10 — POS + print
**Why deferred**: Blocked (missing POS API contract) + explicitly deferred sub-items.

**Proposed POS contract (minimum)**
- Barcode/SKU lookup endpoint
- Atomic sale endpoint or clearly documented mapping to invoice draft+issue.

**Print**
- Receipt route with print CSS.

---

### FE-11.1 — Support tickets
**Why deferred**: Backend placeholder.

**Backend current behavior**
- List returns empty.
- Patch throws BadRequest.

**Needed backend**
- Ticket persistence + status transitions.

**Frontend**
- Once backend exists: admin list, detail view, status update.

---

## 3) Implementation notes (repo-specific)

### What’s already implemented (high-level)
- FE-01 through FE-09 (partial) and FE-11 MVP pages exist and `apps/web` builds.
- FE-08 reports + GST export job UI exists.
- FE-09 notifications settings exists.
- FE-11 admin pages exist (many render JSON pending UI polish).

### Testing
- The plan mentions Playwright, but no Playwright config is present yet in `apps/web`.

---

## 4) Recommended priority order (unblocking sequence)
1. Missing backend APIs: company settings, invoice series, users/roles, subscription.
2. Ledger endpoints for customer/supplier.
3. Categories endpoints.
4. Purchase payments contract.
5. POS contract (only if POS is a requirement for MVP).
6. Frontend-only polish (invoice builder, charts, accounting report layouts).
