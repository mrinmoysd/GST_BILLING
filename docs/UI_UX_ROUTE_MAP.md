UI/UX Route Map (Next.js) + Workflow States
===========================================

Updated: 2026-03-18

This document is the **current canonical frontend route map** for the application as implemented in `apps/web/src/app/**`.

Important:
- This file reflects the **actual current route structure**.
- It does **not** describe all future desired routes from older planning docs.
- Missing future areas such as onboarding and POS remain tracked in:
  - `docs/GAP_ANALYSIS_AND_EXECUTION_PLAN.md`
  - `todo/EXECUTION_MASTER_PLAN.md`

Assumptions
- Next.js App Router
- Company-scoped application routing under `/(app)/c/[companyId]/...`
- Super-admin routes under `/admin/*`


Information architecture
------------------------

Global areas
- Public auth
- Application (company-scoped)
- Super-admin


Current route structure
-----------------------

### Public / Auth
- `/`
  - home / developer landing page
- `/login`
  - user login
- `/dashboard`
  - redirect helper page

Currently missing from implementation
- `/reset-password`
- `/logout`
- `/onboarding/*`


### App (Company scoped)
Canonical pattern: `/(app)/c/[companyId]/...`

#### Dashboard
- `/(app)/c/[companyId]/dashboard`

#### Masters
- `/(app)/c/[companyId]/masters/customers`
- `/(app)/c/[companyId]/masters/customers/new`
- `/(app)/c/[companyId]/masters/customers/[customerId]`
- `/(app)/c/[companyId]/masters/customers/[customerId]/ledger`

- `/(app)/c/[companyId]/masters/suppliers`
- `/(app)/c/[companyId]/masters/suppliers/new`
- `/(app)/c/[companyId]/masters/suppliers/[supplierId]`
- `/(app)/c/[companyId]/masters/suppliers/[supplierId]/ledger`

- `/(app)/c/[companyId]/masters/products`
- `/(app)/c/[companyId]/masters/products/new`
- `/(app)/c/[companyId]/masters/products/[productId]`
- `/(app)/c/[companyId]/masters/products/[productId]/stock-movements`

- `/(app)/c/[companyId]/masters/categories`

#### Sales
- `/(app)/c/[companyId]/sales/invoices`
- `/(app)/c/[companyId]/sales/invoices/new`
- `/(app)/c/[companyId]/sales/invoices/[invoiceId]`

#### Purchases
- `/(app)/c/[companyId]/purchases`
- `/(app)/c/[companyId]/purchases/new`
- `/(app)/c/[companyId]/purchases/[purchaseId]`

#### Inventory
- `/(app)/c/[companyId]/inventory`

Currently missing from implementation
- `/(app)/c/[companyId]/inventory/stock`
- `/(app)/c/[companyId]/inventory/movements`
- `/(app)/c/[companyId]/inventory/adjustments/new`

#### Reports
- `/(app)/c/[companyId]/reports`
- `/(app)/c/[companyId]/reports/sales-summary`
- `/(app)/c/[companyId]/reports/purchases-summary`
- `/(app)/c/[companyId]/reports/outstanding`
- `/(app)/c/[companyId]/reports/profit-snapshot`
- `/(app)/c/[companyId]/reports/top-products`
- `/(app)/c/[companyId]/reports/gst/gstr1`

Currently missing from implementation
- `/(app)/c/[companyId]/gst`
- `/(app)/c/[companyId]/gst/gstr3b`
- `/(app)/c/[companyId]/gst/hsn-summary`
- `/(app)/c/[companyId]/gst/itc`

#### Accounting
- `/(app)/c/[companyId]/accounting`
- `/(app)/c/[companyId]/accounting/ledgers`
- `/(app)/c/[companyId]/accounting/journals`
- `/(app)/c/[companyId]/accounting/journals/[journalId]`
- `/(app)/c/[companyId]/accounting/books/cash`
- `/(app)/c/[companyId]/accounting/books/bank`
- `/(app)/c/[companyId]/accounting/reports/trial-balance`
- `/(app)/c/[companyId]/accounting/reports/profit-loss`
- `/(app)/c/[companyId]/accounting/reports/balance-sheet`

#### Settings
- `/(app)/c/[companyId]/settings`
- `/(app)/c/[companyId]/settings/company`
- `/(app)/c/[companyId]/settings/invoice-series`
- `/(app)/c/[companyId]/settings/notifications`
- `/(app)/c/[companyId]/settings/users`
- `/(app)/c/[companyId]/settings/subscription`

Currently missing from implementation
- `/(app)/c/[companyId]/settings/roles`

#### Payments
Currently missing from implementation
- `/(app)/c/[companyId]/payments`

Payments are currently handled inside:
- invoice detail pages
- purchase detail pages

#### POS
Currently missing from implementation
- `/(app)/c/[companyId]/pos`
- `/(app)/c/[companyId]/pos/billing`
- `/(app)/c/[companyId]/pos/orders/[invoiceId]`


### Super-admin
- `/admin/login`
- `/admin/dashboard`
- `/admin/companies`
- `/admin/subscriptions`
- `/admin/usage`
- `/admin/support-tickets`
- `/admin/queues`


Route-structure notes
---------------------

The actual implementation uses:
- `masters/*` for customers, suppliers, products, categories
- `sales/invoices/*` for invoicing
- `reports/gst/gstr1` for the current GST export screen
- `settings/invoice-series` rather than `settings/invoice`

This differs from older route planning that assumed flatter paths like:
- `/customers`
- `/invoices`
- `/gst/*`
- `/settings/invoice`

For Phase A truth alignment, the current implemented paths above are the canonical source of truth.


Workflow-state notes
--------------------

The state models below remain useful as **target workflow guidance**, but they are not fully implemented in the frontend yet.

### Invoice Builder target states
- `idle`
- `editing`
- `validating`
- `savingDraft`
- `readyToIssue`
- `issuing`
- `issued`
- `pdfQueued`
- `pdfReady`
- `failed`

Current implementation status
- Draft creation exists
- Issue exists
- PDF regenerate exists
- The richer autosave / inline tax / async status UX is still pending

### POS target states
- `syncingCatalog`
- `offlineQueueing`
- `checkoutOpen`
- `paymentProcessing`
- `paymentSuccess`
- `paymentFailed`

Current implementation status
- POS routes are not implemented yet


UX guardrails
-------------

Current product direction:
- Keep company-scoped routing explicit
- Keep operational flows keyboard-friendly where practical
- Preserve strong loading, error, and empty states
- Move toward a modern, pixel-consistent design system in Phase B

See also:
- `docs/UI_UX_REDESIGN.md`
- `docs/GAP_ANALYSIS_AND_EXECUTION_PLAN.md`
