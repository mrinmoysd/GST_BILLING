# Phase 08 — Frontend Requirements (Specs)

**Scope**: Comprehensive frontend spec based on the currently implemented backend (Phases 00–07) and the documents in `docs/`.

**Primary goals**
- Ship a production-grade web frontend for GST Billing SaaS.
- Cover: auth, onboarding, company-scoped app, admin/super-admin, errors/loading, dashboard, masters, sales/invoices + PDF, purchases, payments, inventory, accounting, exports/reports, notifications, files, subscription/billing.

**Non-goals (for Phase 08 MVP)**
- Offline POS mode (explicitly deferred in `docs/POS_PRINTING.md`).
- ESC/POS direct thermal printing agent.
- Credit notes / sales returns UI (backend currently treated as deferred in Phase 03 docs).
- Portal-grade GST reports beyond MVP export jobs.

---

## 1) Product principles and UX guardrails

### 1.1 Tenancy / routing model
- The app is **company-scoped**.
- Recommended routing pattern (from `docs/UI_UX_ROUTE_MAP.md`):
  - `/(app)/c/[companyId]/...`
- The backend enforces tenant isolation; frontend must:
  - Always include the correct `companyId` in route + API path.
  - On mismatch (403), redirect to a safe page and show an actionable message.

### 1.2 Design system
- Suggested stack (per route map docs): Next.js App Router + Tailwind + shadcn/ui.
- Requirements:
  - Keyboard-first UX in POS and invoice builder.
  - Responsive layouts; ensure tables remain usable on small screens.
  - Standard component states: `idle | loading | empty | error | success`.

### 1.3 Accessibility + i18n
- A11y MVP:
  - Proper labels for inputs.
  - Focus management on dialogs/drawers.
  - Announce async events (e.g., “PDF queued”).
- i18n:
  - English only for MVP but everything should be string-externalized.

---

## 2) Frontend technical architecture

### 2.1 Recommended tech stack
- Next.js (App Router).
- TanStack Query for server state, mutations, caching, retries.
- Zod for client-side validation.
- React Hook Form for forms.
- A thin `apiClient` wrapper implementing:
  - `Authorization: Bearer <accessToken>`
  - Automatic refresh on 401 (single-flight refresh)
  - Request correlation IDs (optional)
  - Structured error mapping

### 2.2 Environment configuration
- `NEXT_PUBLIC_API_BASE_URL` (e.g. `http://localhost:4000/api`).
- Optional: `NEXT_PUBLIC_FILE_BASE_URL` if file download URLs differ.

### 2.3 Auth token storage
- MVP option A (simpler): store access token in memory; refresh token in HTTP-only cookie via backend.
- MVP option B (current backend appears to return refresh token in JSON): store refresh token in secure storage.

**Requirement**: Whatever method is chosen, implement:
- Logout clearing local session.
- Refresh flow on app load.
- Safe handling of token expiry mid-session.

---

## 3) Error handling, loading, and observability

### 3.1 API error envelope
Backend docs specify:
- Success: `{ "data": ..., "meta"?: ... }`
- Error: `{ "error": { "code": "STRING_CODE", "message": "...", "details"?: {} } }`

Frontend must standardize errors into:
- `kind`: `network | auth | forbidden | not_found | validation | conflict | business_rule | unknown`
- `status`: HTTP status
- `code`: backend error code if present
- `message`: safe message for UI
- `details`: optional

### 3.2 Global error UX
- A global toast system for non-blocking errors.
- Error pages:
  - 401: go to `/login` and preserve deep link to return after login.
  - 403: “Access denied” with link back to dashboard.
  - 404: “Not found” with link back.
  - 500: “Something went wrong” with “Try again” + report ID (optional).

### 3.3 Form field errors
- Map server validation errors to field paths when possible.
- Always show both:
  - Field-level error
  - Form-level summary (“Please fix highlighted fields”).

### 3.4 Empty and loading states
- Skeleton loaders for list pages.
- Empty state CTA buttons:
  - Customers: “Create first customer”.
  - Products: “Create first product”.
  - Invoices: “Create invoice”.

---

## 4) API hooks (TanStack Query) — canonical list

Naming convention:
- Queries: `useCustomers`, `useCustomer(customerId)`
- Mutations: `useCreateCustomer`, `useUpdateCustomer`, `useDeleteCustomer`

All hooks accept `{ companyId }` and any filtering params.

### 4.1 Auth hooks
- `useLogin()` → POST `/auth/login`
- `useRefresh()` → POST `/auth/refresh`
- `useMe()` → GET `/auth/me` (if implemented; otherwise infer from login)
- `useLogout()` → POST `/auth/logout` (if implemented)

### 4.2 Company / onboarding hooks
- `useCreateCompany()` → POST `/companies`
- `useCompany(companyId)` → GET `/companies/{companyId}`
- `useUpdateCompany(companyId)` → PATCH `/companies/{companyId}`
- `useVerifyGstin(companyId)` → POST `/companies/{companyId}/verify-gstin`

### 4.3 Masters hooks
Customers
- `useCustomers({ companyId, page, limit, q })`
- `useCustomer({ companyId, customerId })`
- `useCreateCustomer({ companyId })`
- `useUpdateCustomer({ companyId, customerId })`
- `useDeleteCustomer({ companyId, customerId })`
- `useCustomerLedger({ companyId, customerId, from, to })`

Suppliers
- equivalents to customers + supplier ledger

Products / Categories
- `useProducts({ companyId, page, limit, q, category, lowStockOnly })`
- `useProduct({ companyId, productId })`
- `useCreateProduct({ companyId })`
- `useUpdateProduct({ companyId, productId })`
- `useDeleteProduct({ companyId, productId })`
- `useCategories({ companyId })`
- `useCreateCategory({ companyId })`

Inventory
- `useStockMovements({ companyId, productId, from, to, page, limit })`
- `useLowStock({ companyId, threshold })`
- `useStockAdjustment({ companyId, productId })` (mutation)

### 4.4 Sales / invoices hooks
Invoices
- `useInvoices({ companyId, page, limit, q, status, from, to })`
- `useInvoice({ companyId, invoiceId })`
- `useCreateInvoice({ companyId })`
- `useUpdateInvoice({ companyId, invoiceId })` (draft-only)
- `useIssueInvoice({ companyId, invoiceId })`
- `useCancelInvoice({ companyId, invoiceId })`

Payments
- `useInvoicePayments({ companyId, invoiceId })`
- `useCreateInvoicePayment({ companyId, invoiceId })` → POST `/invoices/{id}/payments`

PDF / sharing
- `useRegenerateInvoicePdf({ companyId, invoiceId })` → POST `/invoices/{id}/pdf/regenerate`
- `useInvoicePdfUrl({ companyId, invoiceId })` → GET `/invoices/{id}/pdf` (may redirect)
- `useSendInvoice({ companyId, invoiceId })` → POST `/invoices/{id}/send`

Jobs
- `useJob({ companyId, jobId })` → GET `/jobs/{jobId}`

Idempotency
- For create flows: add `Idempotency-Key` header for mutations.

### 4.5 Purchases hooks
- `usePurchases({ companyId, page, limit, q, from, to })`
- `usePurchase({ companyId, purchaseId })`
- `useCreatePurchase({ companyId })`
- `useUpdatePurchase({ companyId, purchaseId })`
- `useCancelPurchase({ companyId, purchaseId })`
- `usePurchasePayments(...)` (if available)
- `useUploadPurchaseBill({ companyId, purchaseId })` (multipart)

### 4.6 Reports / exports hooks
Business reports
- `useSalesSummary({ companyId, from, to, groupBy })`
- `usePurchaseSummary({ companyId, from, to, groupBy })`
- `useCustomerOutstanding({ companyId, asOf })`
- `useVendorOutstanding({ companyId, asOf })`
- `useTopProducts({ companyId, from, to, limit })`
- `useProfit({ companyId, from, to })`

GST export jobs (MVP implemented)
- `useCreateGstr1Export({ companyId })` → POST `/exports/gstr1`
- `useExportJob({ companyId, jobId })` → GET `/exports/{jobId}`
- `useDownloadExport({ companyId, jobId })` → GET `/exports/{jobId}/download`

### 4.7 Accounting hooks
Ledgers
- `useLedgers({ companyId })`
- `useCreateLedger({ companyId })`

Journals
- `useJournals({ companyId, from, to, page, limit })`
- `useCreateJournal({ companyId })` → POST `/journals`

Statements
- `useTrialBalance({ companyId, asOf })`
- `useProfitLoss({ companyId, from, to })`
- `useBalanceSheet({ companyId, asOf })`
- `useCashBook({ companyId, from, to })`
- `useBankBook({ companyId, from, to })`

### 4.8 Notifications hooks
- `useNotificationTemplates({ companyId })`
- `useCreateNotificationTemplate({ companyId })`
- `useUpdateNotificationTemplate({ companyId, templateId })`
- `useSendTestNotification({ companyId })`

### 4.9 Files hooks
- `useSignUpload({ companyId })` → POST `/files/sign-upload`
- `useFile({ companyId, fileId })` → GET `/files/{id}`

### 4.10 Subscription / billing hooks
- `useSubscription({ companyId })`
- `useStartCheckout({ companyId })`

### 4.11 Super-admin hooks
- `useAdminLogin()` → `/admin/login`
- `useAdminCompanies({ page, limit, q })`
- `useAdminSubscriptions({ page, limit, status })`
- `useAdminUsage({ from, to })`
- `useAdminSupportTickets()`
- `useAdminQueueMetrics()`

---

## 5) Screen-by-screen requirements

> Route list is aligned with `docs/UI_UX_ROUTE_MAP.md`. For each screen: required UI, components, API hooks, error cases.

### 5.1 Public/Auth

#### Screen: `/login`
**Purpose**: Authenticate a user and establish company context.
- Components
  - Email input, password input
  - “Remember me” (optional)
  - Submit button + loading state
  - Error banner
- API
  - `useLogin()`
- Post-login behavior
  - Redirect to `/(app)/c/[companyId]/dashboard` using company returned by login.
- Error handling
  - 401: “Invalid email or password”
  - 429 (if added later): “Too many attempts”

#### Screen: `/reset-password`
- MVP placeholder unless backend endpoints exist.

#### Screen: `/logout`
- Calls `useLogout()` if available; always clear local session.

### 5.2 Onboarding

#### Screen group: `/onboarding/*`
**Wizard steps**
1) Company profile (`/onboarding/company`)
- Fields: company name, GSTIN, PAN, address, state.
- API: `useCreateCompany()` or `useUpdateCompany()`.
- Validation: GSTIN format, state required.

2) GSTIN verification (`/onboarding/verification`)
- Button: “Verify GSTIN” → `useVerifyGstin()`.
- Show status: pending/verified/failed.

3) Invoice settings (`/onboarding/invoice-settings`)
- Fields: invoice series/prefix, rounding, logo upload.
- API: company update + files upload.

4) Done (`/onboarding/done`)
- CTA: “Go to dashboard”.

### 5.3 App shell (company-scoped)

#### Shared layout (all `/(app)/c/[companyId]/*`)
- Left sidebar nav with sections (Dashboard, Masters, Sales, Purchases, Inventory, Accounting, Reports/GST, Settings).
- Top bar
  - Company name
  - User menu (profile/logout)
  - Optional search
- Global components
  - `CompanySwitcher` (optional; future)
  - `NotificationBell` (placeholder)

### 5.4 Dashboard

#### Screen: `/(app)/c/[companyId]/dashboard`
- KPIs
  - Sales this month
  - Outstanding receivables
  - Purchases this month
  - Low stock count
- Quick actions
  - New invoice
  - New purchase
  - Add customer
  - Add product
- API
  - If no dedicated dashboard endpoint exists: compose from existing report endpoints.
- Errors
  - Partial failures should still render other cards.

### 5.5 Masters — Customers

#### Screen: `/(app)/c/[companyId]/customers`
- Table columns
  - Name, GSTIN, Mobile, Outstanding (if available), Updated at
- Filters
  - Search `q`, pagination
- Components
  - `DataTable`, `SearchInput`, `Pagination`
- API
  - `useCustomers()`

#### Screen: `/(app)/c/[companyId]/customers/new`
- Form fields: name, GSTIN, mobile, email, billing/shipping address, credit limit.
- API: `useCreateCustomer()`

#### Screen: `/(app)/c/[companyId]/customers/[customerId]`
- Tabs
  - Profile (edit)
  - Ledger
  - Invoices
- API
  - `useCustomer()`, `useUpdateCustomer()`, `useCustomerLedger()`

### 5.6 Masters — Suppliers
- Mirror of customers.

### 5.7 Masters — Products & categories

#### Screen: `/(app)/c/[companyId]/products`
- Table columns: SKU, Name, HSN, GST%, Stock, Selling price, Low stock.
- Filters: category, lowStockOnly, search.
- API: `useProducts()`, `useCategories()`

#### Screen: `/(app)/c/[companyId]/products/new`
- Fields: sku, name, hsn, unit, gst_percent, purchase_price, selling_price, opening stock, barcode, category.
- API: `useCreateProduct()`

#### Screen: `/(app)/c/[companyId]/products/[productId]`
- Tabs: Details, Stock movements, Barcode.
- API: `useProduct()`, `useStockMovements()`

### 5.8 Sales — Invoice list

#### Screen: `/(app)/c/[companyId]/invoices`
- Table columns: Invoice no, Date, Customer, Total, Status, Outstanding.
- Actions: View, Download PDF.
- API: `useInvoices()`

### 5.9 Sales — Invoice builder (non-POS)

#### Screen: `/(app)/c/[companyId]/invoices/new`
- State machine: use `docs/UI_UX_ROUTE_MAP.md` state machine.
- Components
  - Customer selector (combobox)
  - Invoice meta: date, due date, series
  - Line items grid
    - Product search
    - Qty, rate, discount
    - Tax preview
  - Totals panel
  - Actions: Save Draft, Issue, Cancel.
- API
  - Create draft: `useCreateInvoice()`
  - Issue: `useIssueInvoice()` (or create+issue if API supports)
  - PDF regeneration: `useRegenerateInvoicePdf()`
  - PDF download: `useInvoicePdfUrl()`
- Error cases
  - 422 `INSUFFICIENT_STOCK`: highlight offending line.
  - 409 conflict for invoice numbering: show “Please retry”.

#### Screen: `/(app)/c/[companyId]/invoices/[invoiceId]`
- Tabs
  - Summary
  - Items
  - Payments
  - PDF/Share
  - Audit (MVP: show created/updated timestamps)
- PDF tab
  - Status badge: `Generating | Ready | Failed`
  - Button: Regenerate

### 5.10 Payments

#### Screen: `/(app)/c/[companyId]/payments`
- Unified listing for invoice + purchase payments.
- Filters: date range, method.

### 5.11 Purchases

#### Screen: `/(app)/c/[companyId]/purchases`
- Table columns: Bill no, Date, Supplier, Total, Status, Outstanding.
- API: `usePurchases()`

#### Screen: `/(app)/c/[companyId]/purchases/new`
- Form similar to invoices but with supplier and input GST.
- Bill upload section (optional)
- API: `useCreatePurchase()`, `useUploadPurchaseBill()`

#### Screen: `/(app)/c/[companyId]/purchases/[purchaseId]`
- Tabs: Summary, Items, Bill Upload, Payments.

### 5.12 Inventory

#### Screen: `/(app)/c/[companyId]/inventory/stock`
- Stock table + low stock highlight.
- API: stock report endpoint if present; otherwise reuse products list.

#### Screen: `/(app)/c/[companyId]/inventory/movements`
- Movement listing filtered by product/date.
- API: `useStockMovements()`

#### Screen: `/(app)/c/[companyId]/inventory/adjustments/new`
- UI to select product and adjust qty.
- API: `useStockAdjustment()`

### 5.13 GST & Reports

#### Screen: `/(app)/c/[companyId]/gst`
- Period picker
- CTA cards for:
  - “GSTR1 Export (CSV)”
  - “Download last export”
- API: `useCreateGstr1Export()`, `useExportJob()`

#### Screen: `/(app)/c/[companyId]/reports`
- Sales summary chart
- Purchase summary chart
- Outstanding
- Top products

### 5.14 Accounting

#### Screen: `/(app)/c/[companyId]/accounting/ledgers`
- List ledgers with type/category.
- Create ledger drawer.
- API: `useLedgers()`, `useCreateLedger()`

#### Screen: `/(app)/c/[companyId]/accounting/journals`
- Journal list + filters.
- Create journal entry modal.
- Validation requirement
  - Client must enforce balanced totals (sum debit == sum credit) before enabling submit.
- API: `useJournals()`, `useCreateJournal()`

#### Screen: `/(app)/c/[companyId]/accounting/trial-balance`
- Table with debit/credit columns.
- Export CSV (client-side) optional.

#### Screen: `/(app)/c/[companyId]/accounting/profit-loss`
- P&L statement for date range.

#### Screen: `/(app)/c/[companyId]/accounting/balance-sheet`
- As-of statement.

#### Screen: cash/bank books
- Simple ledger-like listing.

### 5.15 Settings

#### Screen: `/(app)/c/[companyId]/settings/company`
- Update company profile.

#### Screen: `/(app)/c/[companyId]/settings/invoice`
- Invoice series management.

#### Screen: `/(app)/c/[companyId]/settings/users`
- List users, invite/create user, deactivate.

#### Screen: `/(app)/c/[companyId]/settings/roles`
- Minimal role management.

#### Screen: `/(app)/c/[companyId]/settings/notifications`
- Notification templates CRUD.
- Test send.

#### Screen: `/(app)/c/[companyId]/settings/subscription`
- Current plan + status.
- CTA to checkout.

### 5.16 POS

#### Screen: `/(app)/c/[companyId]/pos`
- “Start billing” CTA.

#### Screen: `/(app)/c/[companyId]/pos/billing`
- Fullscreen layout
- Components
  - Barcode input (always focused)
  - Cart table
  - Totals
  - Payment mode selector
  - “Complete sale”
- Printing
  - Use browser print with thermal CSS.

### 5.17 Super-admin

#### Screen: `/admin/login`
- Admin login.

#### Screen: `/admin/dashboard`
- Summary cards; queue metrics.

#### Screen: `/admin/companies`
- Company list + search.

#### Screen: `/admin/subscriptions`
- Subscription list.

#### Screen: `/admin/usage`
- Usage lines (MVP placeholder).

#### Screen: `/admin/support-tickets`
- Ticket list + status update (MVP placeholder).

---

## 6) Shared component library (must-have)

Layout / navigation
- `AppShell`, `SidebarNav`, `Topbar`, `Breadcrumbs`.

Data display
- `DataTable` (sorting optional), `EmptyState`, `Skeleton`, `StatCard`.

Forms
- `Form`, `FormField`, `MoneyInput`, `DateInput`, `GstinInput`, `AddressForm`.

Domain widgets
- `CustomerSelect`, `SupplierSelect`, `ProductSelect` (combobox + async search)
- `TaxBreakdown`
- `TotalsPanel`
- `PaymentMethodSelect`
- `InvoiceStatusBadge`

Feedback
- `Toast`, `ConfirmDialog`, `ErrorBanner`.

---

## 7) Permissions / RBAC UI behavior

Backend RBAC is currently coarse in MVP.
Frontend must still:
- Hide admin-only screens unless role allows.
- Soft-block actions by checking user roles/flags in session.
- Always handle server-side 403 regardless of client gating.

---

## 8) File upload flows

Two-step upload pattern (per API docs):
1) Call `POST /companies/:cid/files/sign-upload` to get `{ upload_url, file_id }`.
2) Upload bytes to `upload_url`.
3) Store `file_id` on the owning entity if required.

UI requirements
- Progress bar
- Retry on network failure
- Validate MIME + max size client-side before requesting token

---

## 9) Testing requirements (frontend)

### 9.1 Unit tests
- Money/tax computations on client (if any).
- Hooks error mapping.

### 9.2 E2E (Playwright)
Minimum flows:
- Login → dashboard
- Create customer
- Create product
- Create invoice → issue → download PDF
- Record payment
- Create purchase
- Create GSTR1 export job → download

---

## 10) Open questions (must be resolved before implementation)

1) **Auth token handling**: Are refresh tokens stored in cookie or returned to frontend?
2) **Dashboard endpoint**: Do we add a dedicated `/dashboard/summary` API or compose from existing reports?
3) **Invoice builder**: Does backend support create-as-draft vs create+issue? If both exist, define the preferred UX.
4) **POS**: Is POS auto-issue always on? Any cashier session requirement?
5) **Roles/permissions matrix**: Define which roles can discount/void invoices/adjust stock.

---

## 11) Deliverable for Phase 08

- This document is the baseline for creating a frontend iteration plan.
- Next step: turn each screen section into tickets (UI + hooks + tests) and order by dependency.
