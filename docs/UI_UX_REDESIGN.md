# UI/UX Redesign (Tailwind + shadcn) — Comprehensive Audit + Implementation Roadmap

This document is the working plan to modernize the **entire GST Billing** web app UI/UX using **Tailwind CSS** and **shadcn/ui** patterns.

It’s grounded in the current route structure under `apps/web/src/app/(app)/c/[companyId]/**` and in the existing UI primitives in `apps/web/src/lib/ui/*`.

---

## Goals ✅

### Product goals
- A clean, modern, consistent UI across all pages.
- Fast, forgiving workflows for billing/accounting needs.
- Strong user feedback loops: loading, success, error, and empty states.
- Predictable and discoverable navigation.

### Engineering goals
- Consistent component library: prefer **shadcn/ui** components over ad-hoc HTML.
- Shared patterns for tables, filters, forms, dialogs, and toasts.
- Fewer custom one-off components.
- Accessibility baseline: keyboard navigation, focus states, readable contrast.

---

## Current UI foundation (what exists today)

### Layout
- App shell: `apps/web/src/app/(app)/c/[companyId]/layout.tsx`
  - Left sidebar links + top header.
  - Basic responsive behavior is limited (fixed 2-column layout).

### UI primitives
Current primitives live in `apps/web/src/lib/ui/*`:
- `state.tsx`: `PageHeader`, `InlineError`, `LoadingBlock`, `EmptyState`
- `form.tsx`: `TextField`, `PrimaryButton`, `SecondaryButton`
- `stat.tsx`: `StatCard`

**Gap:** primitives are minimal and aren’t a design system. Tables, dialogs, toasts, dropdowns, tabs, skeletons aren’t standardized.

---

## Design system direction (shadcn-first)

### Visual language
- Neutral palette, subtle borders, consistent radius.
- Typography hierarchy:
  - Page title: `text-2xl font-semibold`
  - Section title: `text-base font-semibold`
  - Muted help text: `text-sm text-muted-foreground`

### shadcn components to adopt
Core set (Phase 1):
- `button`, `input`, `label`, `textarea`
- `card`, `badge`, `separator`
- `table`
- `dialog`, `alert-dialog`, `drawer` (or `sheet`)
- `dropdown-menu`, `popover`, `command`
- `tabs`
- `toast` (sonner)
- `skeleton`

### Interaction patterns (standard contracts)

#### 1) Loading
- Use skeletons for tables and detail pages.
- Use inline spinners on small actions (Save/Delete).

#### 2) Errors
- Inline banner for page-level errors.
- Field-level validation errors next to inputs.
- Toast for action errors that don’t block the page.

#### 3) Empty states
- Provide the *next action*.
  - Example: “No invoices yet” + a **Create invoice** button.

#### 4) Destructive actions
- Always use `AlertDialog` confirmation.
- Show resource name in the confirmation.

#### 5) Forms
- Use `react-hook-form` + `zod` schema.
- Disable Save while pending.
- Keep dirty-state detection: prompt before leaving.

#### 6) Tables / lists
Canonical list contract for every “index” page:
- Top row: title + primary action button.
- Filter row: search + status/date filters.
- Table:
  - sticky header
  - row actions menu (⋯)
  - clickable first column
- Pagination:
  - page size selector
  - next/prev
  - total count

---

## App-wide UX improvements (cross-cutting)

### Navigation
- Add active link styling in sidebar.
- Add breadcrumbs on detail pages.
- Ensure mobile/tablet usability:
  - sidebar becomes a `Sheet`.

### Notifications
- Add global toasts for:
  - create/update/delete success
  - file upload success/failure
  - background job started/completed

### Permissions + auth
- Standard “Session expired” handling (redirect to login + toast).

### Data formatting
- Currency formatting everywhere: INR locale.
- Dates: consistent format (e.g. `dd MMM yyyy`).
- Status: render as `Badge`.

---

## Page inventory (what exists) + UX work items

Routes detected (tenant scope):

### Dashboard
- `dashboard/page.tsx`

**Work items:**
- KPI cards: use `Card` + `Stat` + skeleton.
- Quick actions: Create invoice / Record payment / New purchase.
- Recent activity (invoices, payments) as compact tables.

### Masters
- `masters/customers/page.tsx`
- `masters/customers/new/page.tsx`
- `masters/customers/[customerId]/page.tsx`
- `masters/customers/[customerId]/ledger/page.tsx`

- `masters/suppliers/page.tsx`
- `masters/suppliers/new/page.tsx`
- `masters/suppliers/[supplierId]/page.tsx`
- `masters/suppliers/[supplierId]/ledger/page.tsx`

- `masters/products/page.tsx`
- `masters/products/new/page.tsx`
- `masters/products/[productId]/page.tsx`
- `masters/products/[productId]/stock-movements/page.tsx`

- `masters/categories/page.tsx`

**Work items (masters, shared):**
- Standardize list pages to canonical list contract.
- Replace inline delete buttons with row action menu.
- Add import/export (CSV) later.

**Categories specific:**
- Convert create form into `Card` + `Form`.
- Add rename + activate/deactivate toggles.

### Sales — Invoices
- `sales/invoices/page.tsx` (list)
- `sales/invoices/new/page.tsx` (create)
- `sales/invoices/[invoiceId]/page.tsx` (detail)

**Work items:**
- List: filters (status/date), totals row, badges, pagination.
- New invoice: multi-step UI (customer → items → taxes → preview → issue).
- Detail: actions toolbar (Download PDF, Cancel, Record payment).
- Use slimmer typographic hierarchy and better line-item table.

### Purchases
- `purchases/page.tsx` (list)
- `purchases/new/page.tsx` (create)
- `purchases/[purchaseId]/page.tsx` (detail)

**Work items:**
- List: status badges, supplier column, totals, pagination.
- New purchase: supplier → items → receive stock; bill upload card.
- Detail: receive/cancel actions, bill preview/download.

### Inventory
- `inventory/page.tsx`

**Work items:**
- Low stock table with threshold filter.
- Stock movements link per product.

### Accounting
- `accounting/page.tsx`
- `accounting/ledgers/page.tsx`
- `accounting/journals/page.tsx`
- `accounting/journals/[journalId]/page.tsx`
- `accounting/books/cash/page.tsx`
- `accounting/books/bank/page.tsx`
- `accounting/reports/profit-loss/page.tsx`
- `accounting/reports/balance-sheet/page.tsx`
- `accounting/reports/trial-balance/page.tsx`

**Work items:**
- Reports: cohesive report layout, export PDF/CSV, drilldown drawers.
- Books: date filters + running totals + printable view.

### Reports
- `reports/page.tsx`
- `reports/sales-summary/page.tsx`
- `reports/purchases-summary/page.tsx`
- `reports/outstanding/page.tsx`
- `reports/profit-snapshot/page.tsx`
- `reports/top-products/page.tsx`
- `reports/gst/gstr1/page.tsx`

**Work items:**
- Use consistent filters (from/to) and same layout.
- Add skeletons and export CTA.

### Settings
- `settings/page.tsx`
- `settings/company/page.tsx`
- `settings/users/page.tsx`
- `settings/invoice-series/page.tsx`
- `settings/notifications/page.tsx`
- `settings/subscription/page.tsx`

**Work items:**
- Convert to tabs or left-subnav.
- Better empty states (no users, no invoice series).

---

## Implementation roadmap (phased) 🧭

The order below is chosen to:
1) establish UI primitives first,
2) standardize list/detail patterns,
3) then deeply improve core transactional flows,
4) then polish accounting/reports.

### Phase 0 — Baseline + tooling (0.5–1 day)
**Outcome:** shadcn installed + theme foundation + lint/format and icon setup.
- Add shadcn/ui (init) and standard `components/ui/*`.
- Add icon set (lucide-react) (if not already used).
- Define Tailwind design tokens and container widths.

Acceptance:
- One sample page uses shadcn `Button/Card/Input`.

### Phase 1 — UI primitives + app shell (1–2 days)
**Outcome:** a reusable system used everywhere.
- Replace `PrimaryButton/SecondaryButton/TextField` with shadcn wrappers (or migrate callsites).
- Add:
  - `ToastProvider` (sonner)
  - `Skeleton` components
  - `DataTable` base (table header, empty row, loading row)
  - `ConfirmDialog` wrapper
- Improve company layout:
  - active sidebar link styling
  - mobile sidebar sheet
  - breadcrumbs slot

Acceptance:
- All pages compile.
- At least 3 pages migrated to shadcn primitives.

### Phase 2 — Masters overhaul (2–4 days)
**Outcome:** fast, consistent CRUD.
- Customers/Suppliers/Products/Categories:
  - list pages: canonical list layout + pagination + filters
  - detail pages: header action bar + sections as cards
  - create pages: RHF+Zod forms, better validation

Acceptance:
- Create/update/delete flows show toasts.
- No destructive action without confirmation.

### Phase 3 — Sales & purchases core UX (3–6 days)
**Outcome:** invoice/purchase workflows feel “product-grade”.
- Invoices:
  - new invoice: restructure into step-like sections, computed totals sticky card
  - list: status badges + totals, normalized columns
  - detail: download PDF, cancel, record payment actions
- Purchases:
  - new purchase: items editor + receive step
  - detail: receive/cancel + bill upload and preview

Acceptance:
- Users can complete an invoice end-to-end without confusion.

### Phase 4 — Inventory + accounting polish (3–6 days)
**Outcome:** finance screens are readable and actionable.
- Inventory: low stock, thresholds, quick navigate to stock movements
- Journals: drilldown drawer, search/date filters
- Cash/Bank book: date filters, export
- P&L / Balance Sheet / Trial Balance: export, drilldowns, consistent layout

Acceptance:
- Reports share one cohesive layout system.

### Phase 5 — Reports + settings + admin polish (2–5 days)
**Outcome:** clean finishing pass.
- Reports: unify filters, add exports, consistent empty states.
- Settings: tabs and better form UX.
- Admin/support: align styling + tables.

Acceptance:
- No “unstyled” pages remain.

---

## QA + validation (must-have)

### Visual QA
- Check all pages at common widths: 375, 768, 1024, 1440.
- Check dark mode (optional; if enabled, ensure correct tokens).

### UX QA
- Every mutation: pending state + success toast + errors.
- Keyboard navigation through forms.

### Automated QA (recommended)
- Expand Playwright coverage:
  - list renders rows for categories/invoices/purchases
  - detail page opens
  - edit/save flow works
  - no requests to `/companies/undefined/...`

---

## Next concrete step

Implement Phase 0 + Phase 1 first (shadcn init + primitives + shell). Once those primitives exist, every page migration becomes mechanical and fast.
