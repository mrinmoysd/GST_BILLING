# End-to-End Manual Test Plan

**Date**: 2026-03-22  
**Purpose**: Provide a comprehensive manual QA flow for the full solution.

This document is for human end-to-end testing. It is intentionally step-by-step and feature-by-feature.

---

## Test environment prerequisites

Before testing:

1. Run Postgres and Redis.
2. Apply migrations.
3. Seed baseline users/data.
4. Start API and web.
5. Verify:
   - web responds on `http://localhost:3000`
   - API responds on `http://localhost:4000`

Recommended setup:

```bash
npm --workspace apps/api run prisma:migrate:dev
npm --workspace apps/api run seed:auth
npm --workspace apps/api run dev
npm --workspace apps/web run dev
```

Recommended seed/test identities:

- tenant owner
- one internal admin
- one additional staff/admin user in a company

Company route note:

- after onboarding or tenant login, capture the redirected URL and reuse the active `companyId` from `/c/{companyId}/...` for all tenant-scoped checks below
- if onboarding is not available in the current environment, use the seeded tenant company id `00000000-0000-0000-0000-000000000001`

Environment note:

- some admin analytics, billing-provider, notification, webhook, and support steps depend on seeded records or sandbox provider configuration
- if the route loads but the dataset is empty, record that as "no seeded data for validation" rather than a product defect unless the UI itself is broken

---

## Global smoke checks

1. Open `/`.
2. Verify landing page loads without console-breaking errors.
3. Open `/login`.
4. Open `/signup`.
5. Open `/admin/login`.
6. Verify all pages render and navigation links work.

---

## 1. Public website

### Landing page

1. Open `/`.
2. Verify hero, CTA, navigation, footer.
3. Verify CTA routes to onboarding or signup/login correctly.

### Supporting pages

Verify these routes load and render real content:

- `/features`
- `/pricing`
- `/about`
- `/contact`
- `/help`
- `/security`
- `/demo`
- `/privacy`
- `/terms`

Checks:

- page title present
- nav works
- footer works
- no visible raw JSON or placeholder errors

---

## 2. Tenant onboarding and authentication

### Self-serve onboarding

1. Open `/onboarding`.
2. Enter owner and company details.
3. Submit onboarding form.
4. Verify:
   - company is created
   - owner user is created
   - authenticated session starts
   - app redirects to company dashboard
   - redirected URL exposes the active `companyId`

### Tenant login

1. Open `/login`.
2. Sign in with tenant credentials.
3. Capture the redirected `companyId` from the URL for the remaining tenant tests.
4. Verify refresh-token based session behavior by hard-refreshing the page.

### Forgot/reset password

1. Open `/forgot-password`.
2. Request password reset.
3. Use returned dev token / path.
4. Open `/reset-password`.
5. Set a new password.
6. Log in with the new password.

---

## 3. Company setup and settings

### Company profile

1. Open `/c/{companyId}/settings/company`.
2. Update company profile fields.
3. Upload logo.
4. Trigger GSTIN verification.
5. Verify saved values persist after refresh.

### Invoice series

1. Open `/c/{companyId}/settings/invoice-series`.
2. Create or edit a series if supported by UI.
3. Verify invoice numbering behavior uses expected defaults.

### Notifications

1. Open `/c/{companyId}/settings/notifications`.
2. Verify templates/settings render.
3. Trigger any test action available.

### Subscription settings

1. Open `/c/{companyId}/settings/subscription`.
2. Verify current plan and billing summary load.

---

## 4. RBAC, users, and roles

### Roles

1. Open `/c/{companyId}/settings/roles`.
2. Create a custom role.
3. Assign multiple permissions.
4. Edit the role.
5. Delete the role if safe.

### Users

1. Open `/c/{companyId}/settings/users`.
2. Invite a new user.
3. Assign built-in and custom roles.
4. Edit user role assignment.
5. Verify audit-related UI state if present.

---

## 5. Masters

### Categories

1. Open `/c/{companyId}/masters/categories`.
2. Add a category.
3. Verify it appears immediately.
4. Try adding a duplicate.
5. Verify user-facing conflict message appears.

### Customers

1. Open `/c/{companyId}/masters/customers`.
2. Add a customer.
3. Verify list shows the customer.
4. Open customer detail/ledger if available.

### Suppliers

1. Open `/c/{companyId}/masters/suppliers`.
2. Add a supplier.
3. Verify list and ledger flows.

### Products

1. Open `/c/{companyId}/masters/products/new`.
2. Create a product with:
   - category
   - selling price
   - cost price
   - GST settings
   - stock/reorder values
3. Verify it appears in product list and detail.

---

## 6. Inventory

### Inventory dashboard

1. Open `/c/{companyId}/inventory`.
2. Verify stock summary cards and inventory links render.

### Stock movements

1. Open `/c/{companyId}/inventory/movements`.
2. Verify movement list loads.

### Stock adjustments

1. Open `/c/{companyId}/inventory/adjustments`.
2. Create an adjustment.
3. Verify stock changes are reflected on product detail or inventory summary.

### Low stock

1. Set a product quantity near/below reorder level.
2. Verify low-stock reporting shows the product.

---

## 7. Sales invoices

### Draft invoice creation

1. Open `/c/{companyId}/sales/invoices/new`.
2. Select customer.
3. Add product lines.
4. Verify tax breakdown updates.
5. Save/create draft.

### Issue invoice

1. Open the created invoice detail.
2. Issue the invoice.
3. Verify:
   - status changes
   - invoice number is assigned
   - accounting and GST values appear consistent

### PDF generation

1. On invoice detail, trigger PDF generation if needed.
2. Verify async status updates.
3. Download/view PDF when ready.

### Payments

1. Record a payment against the invoice.
2. Verify outstanding balance updates.
3. Verify payment appears in payments view/reporting.

### Credit note

1. Create a credit note from invoice detail.
2. Verify invoice lifecycle history records it.

### Sales return

1. Create a sales return from invoice detail.
2. Verify stock and accounting consequences are reflected.

### Share logging

1. Trigger invoice share/send action if available.
2. Verify lifecycle/share history entry exists.

---

## 8. Purchases

### Purchase draft and receive

1. Open `/c/{companyId}/purchases/new`.
2. Select supplier.
3. Add product lines.
4. Save draft.
5. Receive/finalize purchase.
6. Verify stock increases.

### Purchase payments

1. Record purchase payment.
2. Verify payable/outstanding values update.

### Bill upload

1. Upload a bill attachment.
2. Verify it is stored and downloadable.

### Purchase return

1. Create purchase return.
2. Verify lifecycle, stock, and financial changes.

---

## 9. Payments workspace

1. Open `/c/{companyId}/payments`.
2. Verify payment summaries and lists load.
3. Cross-check recorded invoice and purchase payments.

---

## 10. Reports

### Reports hub

1. Open `/c/{companyId}/reports`.
2. Verify cards/links for all business and GST reports.

### Sales summary

1. Open `/c/{companyId}/reports/sales-summary`.
2. Verify summary metrics and no raw JSON.

### Purchases summary

1. Open `/c/{companyId}/reports/purchases-summary`.
2. Verify totals and presentation.

### Outstanding

1. Open `/c/{companyId}/reports/outstanding`.
2. Verify receivables rows link back to invoices.

### Top products

1. Open `/c/{companyId}/reports/top-products`.
2. Verify leaderboard/table instead of JSON.

### Profit snapshot

1. Open `/c/{companyId}/reports/profit-snapshot`.
2. Verify snapshot renders correctly.

### GST compliance

1. Open `/c/{companyId}/reports/gst/gstr1`.
2. Verify:
   - GSTR-1 sections
   - GSTR-3B summary
   - HSN summary
   - ITC summary
   - export job status/download

---

## 11. Accounting

### Accounting hub

1. Open `/c/{companyId}/accounting`.
2. Verify ledgers/books/reports navigation.

### Journals

1. Open `/c/{companyId}/accounting/journals`.
2. Verify auto-posted journals exist for invoices, purchases, payments, returns.
3. Open a journal detail page and verify source traceability.

### Trial balance

1. Open `/c/{companyId}/accounting/reports/trial-balance`.
2. Verify totals and balance-difference presentation.

### Profit & loss

1. Open `/c/{companyId}/accounting/reports/profit-loss`.
2. Verify sectioned income/expense statement.

### Balance sheet

1. Open `/c/{companyId}/accounting/reports/balance-sheet`.
2. Verify assets/liabilities/equity sections.

### Period lock

1. Lock an accounting period if supported by current UI/API.
2. Attempt a modifying accounting operation in that period.
3. Verify expected restriction behavior.

---

## 12. POS

### POS entry

1. Open `/c/{companyId}/pos`.
2. Start billing.
3. Verify POS billing route opens.

### POS sale

1. Search/select products.
2. Add products to cart.
3. Complete sale.
4. Verify invoice/payment creation.

### Receipt

1. Open receipt page.
2. Verify print-friendly layout.
3. Trigger print action.

---

## 13. Admin auth and shell

### Admin login

1. Open `/admin/login`.
2. Sign in with internal admin credentials.
3. Verify redirect to `/admin/dashboard`.
4. If sandbox billing/webhook data exists, confirm dashboard cards and recent incidents hydrate with live values instead of empty placeholders.

### Admin nav

1. Verify navigation to:
   - dashboard
   - companies
   - subscriptions
   - usage
   - support tickets
   - queues
   - internal users
   - audit logs

---

## 14. Admin companies

### Company list

1. Open `/admin/companies`.
2. Search/filter if available.
3. Open a company detail page.

### Create company

1. Open `/admin/companies/new`.
2. Create a company and owner.
3. Verify company is available in admin list and tenant login context.

### Company lifecycle

1. Open company detail.
2. Suspend company.
3. Verify lifecycle state updates.
4. Reactivate company.

---

## 15. Admin subscriptions

### Subscription list/detail

1. Open `/admin/subscriptions`.
2. Open subscription detail.
3. Verify provider, plan, status, and usage sections.

### Subscription operations

1. Change plan.
2. Mark past due / mark active.
3. Cancel/reactivate if supported by current record.
4. Reconcile local record.

---

## 16. Admin support

1. Open `/admin/support-tickets`.
2. Filter tickets by status.
3. Move a ticket to in-progress.
4. Resolve/close a ticket.
5. Verify assignee/internal note behavior and company linking.

---

## 17. Admin usage and queues

### Usage

1. Open `/admin/usage`.
2. Change reporting window.
3. Verify top companies and usage summary update.

### Queues

1. Open `/admin/queues`.
2. Verify PDF queue metrics.
3. Verify failed exports, notifications, webhooks render.

---

## 18. Admin governance

### Internal users

1. Open `/admin/internal-users`.
2. Create an internal admin user.
3. Change role.
4. Deactivate/reactivate.
5. Trigger password reset action if available.

### Audit logs

1. Open `/admin/audit-logs`.
2. Verify recent admin actions appear:
   - company create/lifecycle
   - subscription change
   - support update
   - internal user create/update
3. Filter by action.
4. Search by actor or target id.

---

## 19. Files, notifications, billing providers

These are partly UI-driven and partly API/ops-driven.

### Files

1. Verify invoice PDF and purchase bill flows upload/download correctly.

### Notifications

1. Trigger any notification test flow available in settings/platform workflow.
2. Verify notification outbox or admin queue visibility.

### Billing providers

1. In sandbox mode, trigger checkout/session flow from subscription settings if configured.
2. Verify webhook event persistence and admin subscription reflection.

---

## 20. Regression checklist after any major release

Run at minimum:

1. public pages smoke
2. onboarding
3. tenant login
4. customer/product/category creation
5. invoice create -> issue -> payment -> PDF
6. purchase create -> receive -> payment
7. GST report rendering
8. accounting statements rendering
9. POS sale + receipt
10. admin login
11. admin company create
12. admin subscription action
13. admin support update
14. admin internal user create/update
15. admin audit log visibility

---

## Exit criteria for release testing

A release candidate should not pass unless:

- all critical routes load
- no raw JSON/debug pages are visible in production workflows
- invoice, purchase, GST, accounting, POS, and admin critical flows complete
- migrations apply cleanly
- seeded users can authenticate
- file flows, export flows, and queue/admin views behave correctly
