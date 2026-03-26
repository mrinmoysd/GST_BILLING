# Current Implementation State

**Date**: 2026-03-22  
**Purpose**: Current truth snapshot after execution phases A-K and reports phases R1-R5.

This document summarizes what is implemented, what is partial, and what remains missing in the codebase based on the current repository state.

---

## Implemented

### Backend

- Auth: login, refresh, me, logout, forgot-password, reset-password
- Onboarding: public bootstrap flow for company + owner creation
- Company setup: company read/update, GSTIN verification trigger, company logo upload/download
- RBAC: role catalog, role CRUD, role assignment, permission-aware session access
- Masters: customers, suppliers, products, categories
- Inventory: stock adjustment, stock movements, low stock, inventory workflow routes
- Distributor V2 D3: warehouse master, warehouse stock balances, warehouse-aware purchase/invoice context, stock transfer workflow
- Distributor V2 D4: salesperson role, customer assignment, document/payment attribution, and rep-wise distributor reports
- Sales: invoice draft, issue, cancel, payments, credit notes, sales returns, share logging, PDF jobs/download
- Purchases: draft, receive, cancel, purchase returns, bill upload/download, payments
- GST: GSTR-1, GSTR-3B, HSN summary, ITC reports, GST export jobs/downloads
- Accounting: ledgers, journals, auto-posted business transactions, trial balance, P&L, balance sheet, cash book, bank book, period lock
- Platform: files, notifications, billing/webhooks, admin audit logs, queue metrics, subscription flows
- Admin APIs: auth, companies, subscriptions, usage, support tickets, queue metrics, internal admin users, audit logs
- Admin company lifecycle APIs: company create, company detail, suspend/reactivate
- Admin subscription operation APIs: subscription detail, plan/status update, plan catalog
- Admin dashboard API and enriched observability APIs for support, usage, queue/job failures, webhooks, notifications, and file storage
- POS: retail billing and receipt route support

### Frontend

- Auth and onboarding pages
- Company-scoped shell and modernized UI foundation
- Dashboard, payments, inventory, masters, invoices, purchases, reports, GST, accounting, settings
- Roles and user access management pages
- POS routes and receipt print page
- Admin pages for dashboard, companies, subscriptions, usage, queues, and support tickets
- Admin governance pages for internal users and audit logs
- Admin company create page and company detail workspace
- Admin subscription detail workspace
- Admin dashboard, usage, support, and queues are now data-backed operator screens rather than raw payload previews
- Report pages now render shaped business, GST, and accounting outputs rather than JSON payload previews

### Quality

- API build and typecheck pass
- Web lint and production build pass
- Unit coverage exists for GST, accounting, billing, and reports service contracts
- Playwright specs exist for smoke, customers, POS, and reports route coverage

---

## Partial

### Public / marketing surface

- Public route set now exists for landing, features, pricing, about, contact, help, security, demo, privacy, and terms
- Public pages now share a marketing shell, navigation, footer, CTA structure, and sitemap/robots support
- Public content and legal pages are now structurally present, but copy and legal text should still be finalized before production launch

### Admin surface

- `/admin/login` is now implemented with a dedicated internal-admin auth flow
- admin route protection now exists for `/admin/*`
- admin shell/navigation is now implemented with a dedicated sidebar, header, and mobile admin navigation
- Companies now have admin create and detail/action workflows
- Subscriptions now have detail and admin operations workflows
- Usage, support, and queue observability now have operator-grade dashboards and failure feeds
- Internal admin users now have a dedicated management workspace with role assignment and activation controls
- Audit logs now have a dedicated explorer backed by the `internal_admin_audit_logs` table
- Usage analytics are functional, but deeper revenue/cohort analytics are still a future enhancement rather than a missing admin foundation
- Queue metrics route is now aligned with super-admin protection instead of tenant company scoping

### Validation / release confidence

- Browser-level end-to-end execution depends on a live API + web environment plus seeded credentials
- DB-backed API e2e requires reachable Postgres and Redis
- No live staging validation evidence is stored in the repo yet

---

## Missing

### Admin completion

- No major admin implementation slice remains open after Phase M
- Remaining admin work is now validation-oriented:
  - live seeded environment execution
  - deeper admin e2e coverage beyond smoke routes
  - optional future enhancements like impersonation, cohort analytics, or provider-operation drilldowns

### Environment / validation

- Full API e2e execution in a reachable integration environment
- Full Playwright execution against a live seeded app
- Staging validation checklist results captured in docs

### Distributor / wholesaler V2

- the V2 readiness track is now started
- D1 quotations is implemented end to end:
  - quotation storage and numbering
  - quotation list / create / detail workspace
  - status transitions
  - quotation to invoice draft conversion
- D2 sales orders is implemented end to end:
  - sales order storage and numbering
  - direct sales order create / list / detail workspace
  - quotation to sales order conversion
  - sales order to invoice conversion
  - partial fulfillment tracking
- D3 warehouses / transfers is implemented end to end:
  - warehouse master and default warehouse handling
  - stock by warehouse
  - transfer request / dispatch / receive flow
  - warehouse-aware purchase and invoice draft creation
- D4 sales staff model is implemented end to end:
  - built-in salesperson role
  - customer salesperson assignment
  - quotation / sales-order / invoice / payment attribution
  - sales, collections, and outstanding by salesperson
- D5 distributor analytics is implemented end to end:
  - outstanding by customer with salesperson context
  - stock by warehouse with stock value and low-stock pressure
  - fast-moving and slow-moving product views
  - distributor analytics workspace
  - owner dashboard enrichment for distributor operations
- D6 QA, packaging, and pilot proof is implemented:
  - distributor demo seed
  - distributor Playwright smoke baseline
  - distributor QA/demo documentation and pilot packaging

---

## Conclusion

The product application itself is broad and largely implemented across tenant workflows, GST, accounting, platform integrations, POS, reports, and public-facing pages. The largest remaining gaps are now:

- live environment validation and deployment confidence
- vertical expansion if targeting distributor / wholesaler workflows beyond the current trading-business fit
