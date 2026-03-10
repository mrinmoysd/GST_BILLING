# Frontend Deferred Iteration Plan (Post FE-11)

**Goal**: Implement all deferred/blocked items captured in `docs/FRONTEND_DEFERRED_ITEMS_SPEC.md`.

This plan is intentionally split into **backend-unblocking** iterations and **frontend-only** iterations, so work can progress even when some APIs are pending.

## Prereqs
- Confirm which deferred items are **in-scope** for the next release.
- For each “missing API” item, merge backend endpoints first (or at least stub them with stable DTOs).

---

## DE-01 — Tenant Settings APIs + UI (Company / Invoice series / Users-Roles / Subscription)
**Depends on**: backend adds endpoints described in:
- Company settings: FE-09.1
- Invoice series: FE-09.2
- Users/roles: FE-09.3
- Subscription: FE-09.4

**Frontend deliverables**
- `/(app)/c/[companyId]/settings/company`
- `/(app)/c/[companyId]/settings/invoice-series`
- `/(app)/c/[companyId]/settings/users`
- `/(app)/c/[companyId]/settings/subscription`

**DoD**
- CRUD flows with toasts, loading/empty/error.
- RBAC gating if roles exist.

---

## DE-02 — Customer/Supplier Ledgers
**Depends on**: ledger endpoints (FE-03.2)

**Frontend deliverables**
- Ledger tables with date range + pagination.
- Links to invoices/purchases/payments.

---

## DE-03 — Categories
**Depends on**: categories endpoints (FE-04.1)

**Frontend deliverables**
- Categories CRUD pages.
- Product forms: category select.
- Product list: category filter.

---

## DE-04 — Payments completeness (Sales + Purchases)
**Part A (Sales payments)**: frontend-only (backend exists)
- Implement invoice payments UI (FE-05.3)
- Add idempotency header wiring (FE-05.2)

**Part B (Purchase payments)**: depends on backend contract (FE-06.1)
- Add purchase payments to purchase detail page.

---

## DE-05 — Invoice & Purchase builder UX upgrades
**Frontend-only**
- Invoice builder (FE-05.1)
- Better purchase entry UX (items table + totals rendering)

---

## DE-06 — Accounting report UX
**Frontend-only**
- Cash/Bank book pages (FE-07.1)
- P&L and Balance Sheet layout upgrade (FE-07.2)
- Journal drill-down (FE-07.2/17)

---

## DE-07 — Reports UI polish
**Frontend-only**
- Cards/tables/charts improvements (FE-08.1)

---

## DE-08 — Super-admin support tickets
**Depends on**: backend replaces placeholder support tickets module (FE-11.1)

**Frontend deliverables**
- Admin support tickets list/detail + status updates.

---

## DE-09 — POS MVP (only if required)
**Depends on**: POS API contract (FE-10)

**Frontend deliverables**
- POS route + flow + print.

---

## Execution notes
- Each iteration should end with:
  - `apps/web` lint + build green
  - at least 1 happy-path manual smoke check
  - a completion doc in `todo/completed/DE_XX_....md`
