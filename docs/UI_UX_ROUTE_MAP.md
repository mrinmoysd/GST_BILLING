UI/UX Route Map (Next.js) + POS Flow + Invoice Builder States
============================================================

This document defines the product navigation, Next.js route structure (App Router), and state machines for critical workflows (Invoice Builder, POS).

Assumptions
- Next.js App Router (`app/`) and route groups.
- Shadcn UI + Tailwind.
- Multi-tenant: a user belongs to one `companyId`. If multi-company is allowed later, can switch company.

Information architecture
- Global areas
  - Auth
  - Onboarding
  - Application (company-scoped)
  - Super-admin

Route structure (recommended)

### Public / Auth
- `/login`
  - Email/password login
  - Forgot password link
- `/reset-password`
- `/logout`

### Onboarding
- `/onboarding`
  - Wizard layout
- `/onboarding/company`
  - Company profile: business name, GSTIN, PAN, address, state
- `/onboarding/verification`
  - GSTIN verification status UI
- `/onboarding/invoice-settings`
  - Invoice series, prefixes, rounding, logo upload
- `/onboarding/done`

### App (Company scoped)
Recommended pattern: `/(app)/c/[companyId]/...`

- `/(app)/c/[companyId]/dashboard`
  - KPIs: sales this month, outstanding, low stock, quick actions

#### Master data
- `/(app)/c/[companyId]/customers`
- `/(app)/c/[companyId]/customers/new`
- `/(app)/c/[companyId]/customers/[customerId]`
  - Tabs: Profile, Ledger, Invoices

- `/(app)/c/[companyId]/suppliers`
- `/(app)/c/[companyId]/suppliers/new`
- `/(app)/c/[companyId]/suppliers/[supplierId]`
  - Tabs: Profile, Ledger, Purchases

- `/(app)/c/[companyId]/products`
- `/(app)/c/[companyId]/products/new`
- `/(app)/c/[companyId]/products/[productId]`
  - Tabs: Details, Stock Movements, Barcode

- `/(app)/c/[companyId]/categories`

#### Invoicing
- `/(app)/c/[companyId]/invoices`
  - Filters: date range, status, customer, invoice type
- `/(app)/c/[companyId]/invoices/new`
  - Invoice Builder (non-POS)
- `/(app)/c/[companyId]/invoices/[invoiceId]`
  - Tabs: Summary, Items, Payments, PDF/Share, Audit

#### Purchases
- `/(app)/c/[companyId]/purchases`
- `/(app)/c/[companyId]/purchases/new`
- `/(app)/c/[companyId]/purchases/[purchaseId]`
  - Tabs: Summary, Items, Bill Upload, Payments

#### Payments
- `/(app)/c/[companyId]/payments`
  - Unified payments listing (invoice + purchase)

#### Inventory
- `/(app)/c/[companyId]/inventory/stock`
  - Stock report + low stock
- `/(app)/c/[companyId]/inventory/movements`
  - Stock movements with filters
- `/(app)/c/[companyId]/inventory/adjustments/new`

#### GST & Reports
- `/(app)/c/[companyId]/gst`
  - Period picker, export actions
- `/(app)/c/[companyId]/gst/gstr1`
- `/(app)/c/[companyId]/gst/gstr3b`
- `/(app)/c/[companyId]/gst/hsn-summary`
- `/(app)/c/[companyId]/gst/itc`

- `/(app)/c/[companyId]/reports`
  - Sales, purchase, outstanding, profit, top products

#### Accounting
- `/(app)/c/[companyId]/accounting/ledgers`
- `/(app)/c/[companyId]/accounting/journals`
- `/(app)/c/[companyId]/accounting/trial-balance`
- `/(app)/c/[companyId]/accounting/profit-loss`
- `/(app)/c/[companyId]/accounting/balance-sheet`
- `/(app)/c/[companyId]/accounting/books/cash`
- `/(app)/c/[companyId]/accounting/books/bank`

#### Settings
- `/(app)/c/[companyId]/settings/company`
- `/(app)/c/[companyId]/settings/invoice`
- `/(app)/c/[companyId]/settings/users`
- `/(app)/c/[companyId]/settings/roles`
- `/(app)/c/[companyId]/settings/notifications`
- `/(app)/c/[companyId]/settings/subscription`

#### POS (Retail)
- `/(app)/c/[companyId]/pos`
  - POS Home: open session (optional), choose counter, start billing
- `/(app)/c/[companyId]/pos/billing`
  - Fullscreen POS billing interface
- `/(app)/c/[companyId]/pos/orders/[invoiceId]`
  - Receipt view

### Super-admin
- `/admin/login`
- `/admin/dashboard`
- `/admin/companies`
- `/admin/subscriptions`
- `/admin/usage`
- `/admin/support-tickets`


Invoice Builder (non-POS) state machine
--------------------------------------

Goal: predictable UI that supports autosave drafts, prevents invalid tax totals, and handles async PDF generation.

States
1. `idle`
   - Initial load of defaults (series, date, company settings)
2. `editing`
   - User can edit customer, items, discounts
   - Background recalculation on every change
3. `validating`
   - Client-side schema validation (required fields, qty>0)
   - Optional: server-side validation call (stock check)
4. `savingDraft`
   - POST draft OR autosave PATCH if draft exists
5. `readyToIssue`
   - Valid invoice ready for issue
6. `issuing`
   - POST /invoices/:id/issue OR create+issue
7. `issued`
   - Server returns invoice_number; show success
8. `pdfQueued`
   - PDF generation is async; show “Generating PDF…”
9. `pdfReady`
   - PDF URL available
10. `failed`
   - Error (validation, network, insufficient stock)

Transitions
- idle -> editing
- editing -> validating (on Submit)
- validating -> readyToIssue | failed
- readyToIssue -> issuing -> issued
- issued -> pdfQueued -> pdfReady

Key UI components
- Line item table with product search
- Tax breakdown panel: CGST/SGST/IGST, round off
- Payment panel: add payment later or record now
- Actions: Save draft, Issue invoice, Download PDF, Share


POS Billing flow (fast path)
----------------------------

Primary loop
1. `pos/billing` initial
   - Focus on barcode input
2. Scan barcode or search product
   - Add to cart; update quantities
3. Customer selection (optional for B2C)
4. Apply discount (optional)
5. Choose payment mode: Cash/UPI/Bank
6. Complete sale
   - POST /invoices with invoice_type=tax_invoice
   - Optionally auto-issue (no draft in POS)
7. Print receipt

POS-specific states
- `syncingCatalog` (optional offline support)
- `offlineQueueing` (if network down, queue locally)
- `checkoutOpen`
- `paymentProcessing`
- `paymentSuccess`
- `paymentFailed`

Thermal printing approach
- MVP: CSS print template and browser print dialog.
- Advanced: ESC/POS via local print agent (desktop app) if required.


UX guardrails
- Always show “stock left” for scanned products (configurable).
- Prevent negative stock if company setting disallows it.
- Keep keyboard navigation: +/− qty, Enter to checkout, Esc to clear.
