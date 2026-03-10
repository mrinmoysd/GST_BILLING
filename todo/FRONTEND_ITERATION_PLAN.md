# Frontend Iteration Plan (Phase 08)

This plan turns `docs/PHASE_08_FRONTEND_REQUIREMENTS.md` into an execution roadmap for building the **Next.js frontend**.

Deferred/blocked follow-ups are consolidated in `docs/FRONTEND_DEFERRED_ITEMS_SPEC.md` with an execution roadmap in `todo/FRONTEND_DEFERRED_ITERATION_PLAN.md`.

## Goals
- Ship a usable web UI for GST Billing SaaS that matches the implemented API (Phases 00–07).
- Prioritize: Auth + company-scoped shell → Masters → Invoices + PDF → Purchases + inventory → Accounting → Exports/Reports → Settings → Super-admin.

## Definition of Done (per frontend iteration)
- Feature is wired end-to-end in UI with:
  - consistent loading/empty/error states
  - API hook(s) implemented and reused
  - basic validation (client + server error mapping)
  - tests added (unit for utilities/hooks where relevant; e2e for critical flows)
- The app builds and runs locally.
- A completion/status doc is written in `todo/completed/` following `todo/STATUS_TEMPLATE.md`.

## Assumptions
- Next.js App Router.
- TanStack Query + React Hook Form + Zod.
- UI kit: Tailwind + shadcn/ui.
- API response envelope: `{ data, meta? }` and `{ error: { code, message, details? } }`.

---

## FE-00 — Repo frontend bootstrap (foundation)

**Objective**: Create the runnable frontend app with CI-style quality gates.

### Scope
- Create `apps/web/` Next.js app.
- Add Tailwind + shadcn/ui.
- Add routing groups for:
  - public auth routes
  - company-scoped app routes `/(app)/c/[companyId]/...`
  - super-admin routes `/admin/*`

### Deliverables
- Global layout + theme + typography.
- Component primitives: `Button`, `Input`, `Dialog`, `Table`, `Tabs`, `Toast`.
- Baseline pages:
  - `/login`
  - `/(app)/c/[companyId]/dashboard` (placeholder)
  - `/admin/login` (placeholder)
- Lint/typecheck/test scripts for web.

### Acceptance checks
- `apps/web` builds.
- Navigation works across route groups.

---

## FE-01 — API client + auth session

**Objective**: Reliable auth, token refresh, and route protection.

### Scope
- Implement `apiClient` wrapper:
  - `Authorization` header injection
  - error normalization
  - request/response typing
  - 401 refresh single-flight
- Auth state management:
  - login
  - logout
  - boot-time refresh
- Route guards:
  - redirect unauthenticated to `/login`
  - preserve return URL

### Screens
- `/login` fully functional.

### Hooks
- `useLogin`, `useRefresh`, `useMe` (if present), `useLogout`.

### Acceptance checks
- Login works.
- Refresh works (token expiry simulated).
- Protected routes require auth.

---

## FE-02 — App shell + dashboard MVP

**Objective**: Usable, consistent app layout.

### Scope
- `AppShell`:
  - sidebar navigation (Masters, Sales, Purchases, Inventory, Accounting, Reports, Settings)
  - topbar with user menu
  - company context (from session)
- Dashboard MVP:
  - stat cards + quick actions
  - compose existing report endpoints if no dedicated dashboard API exists

### Acceptance checks
- User lands on dashboard after login.
- Sidebar links render and route.

---

## FE-03 — Masters: Customers, Suppliers

### Scope
Customers
- List + search + pagination
- Create
- Details (tabs): Profile (edit), Ledger, Invoices (optional listing)

Suppliers
- Same pattern; details include ledger + purchases.

### Hooks
- `useCustomers/useCustomer/useCreateCustomer/useUpdateCustomer/useDeleteCustomer/useCustomerLedger`
- supplier equivalents

### Acceptance checks
- CRUD works and error states are consistent.

---

## FE-04 — Masters: Products, Categories; Inventory views

### Scope
Products
- List + search
- Create/edit/delete
- Detail tabs: details + stock movements

Inventory
- stock movements listing (+ filters)
- stock adjustment flow
- low stock filtering

### Hooks
- `useProducts/useProduct/...`
- `useStockMovements/useLowStock/useStockAdjustment`

---

## FE-05 — Sales: Invoices list + invoice builder + invoice detail

**Objective**: Core revenue workflow.

### Scope
- Invoice list
- Invoice builder (new)
  - product search, line items, totals
  - draft save
  - issue
  - idempotency key on create
- Invoice detail
  - summary/items
  - payments
  - PDF tab (download + regenerate)

### Hooks
- `useInvoices/useInvoice/useCreateInvoice/useUpdateInvoice/useIssueInvoice/useCancelInvoice`
- `useCreateInvoicePayment`
- `useRegenerateInvoicePdf/useInvoicePdfUrl`

### Acceptance checks
- Can create invoice → issue → download PDF.
- Insufficient stock (422) is shown in-line.

---

## FE-06 — Purchases + bill upload + payments

### Scope
- Purchases list/create/detail
- Bill upload (two-step if using file signing, or multipart if API supports direct upload)
- Purchase payments listing/record payments (if API exists)

### Acceptance checks
- Can create a purchase and see stock movement effect.

---

## FE-07 — Accounting screens

### Scope
- Ledgers list + create
- Journals list + create
  - client-side balancing validation before submit
- Trial balance
- Profit & loss
- Balance sheet
- Cash/bank books

### Acceptance checks
- Create journal succeeds; unbalanced journal blocked client-side.

---

## FE-08 — Reports + GST export jobs

### Scope
- Reports hub (cards + charts)
- GST export job UI
  - create export
  - job status polling
  - download

### Acceptance checks
- Create GSTR1 export → download file.

---

## FE-09 — Settings: company, invoice, users/roles, notifications, subscription

### Scope
- Company settings
- Invoice settings (series management if endpoint exists)
- Users + roles pages (MVP: display; advanced permissions later)
- Notification templates CRUD + test send
- Subscription status + checkout

---

## FE-10 — POS (MVP, online only) + browser print

### Scope
- POS billing page with barcode-focused UX
- Browser print thermal CSS

**Explicitly deferred**
- Offline mode
- ESC/POS agent integration

---

## FE-11 — Super-admin UI

### Scope
- `/admin/login`
- `/admin/dashboard`
- `/admin/companies`
- `/admin/subscriptions`
- `/admin/usage` (placeholder)
- `/admin/support-tickets` (placeholder)
- queue metrics page

---

## Cross-cutting work streams (do alongside iterations)

### A) Error handling consistency
- Normalized API errors
- Global error pages + toasts

### B) E2E tests (Playwright)
Minimum suite:
- Login → dashboard
- Create customer
- Create product
- Create invoice → issue → PDF
- Record payment
- Create GSTR1 export → download

### C) Performance
- TanStack Query caching defaults
- table virtualization optional for large product lists

---

## Final deliverable

When FE-00 through FE-09 are done, the product has a complete admin-style frontend matching current backend capabilities.

Reference spec: `docs/PHASE_08_FRONTEND_REQUIREMENTS.md`.
