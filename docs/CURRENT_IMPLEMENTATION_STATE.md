# Current Implementation State

**Date**: 2026-03-18
**Purpose**: Working baseline for Phase A truth alignment.

This document summarizes what is currently implemented, what is partial, and what remains missing in the codebase as of the latest review.

---

## Implemented

### Backend

- Auth: login, refresh, me, logout
- Company settings: get and patch existing company
- Masters: customers, suppliers, products, categories
- Inventory: stock adjustment, stock movements, low stock
- Sales: invoice draft, issue, cancel, payment recording, PDF regenerate, PDF download
- Purchases: draft, receive, cancel, bill upload/download, purchase-linked payments via generic payment flow
- Reports: sales summary, purchases summary, outstanding, top products, profit snapshot
- GST exports: MVP GSTR1-like CSV export job
- Accounting: ledgers, journals, trial balance, P&L, balance sheet, cash book, bank book
- Settings/platform: notification templates, test send, files, subscription read/checkout placeholder, users, built-in roles listing
- Admin: companies, subscriptions, usage, support tickets, queue metrics

### Frontend

- Auth login and refresh-based session bootstrap
- Company-scoped app shell
- Dashboard route
- Customers, suppliers, products, categories
- Invoices list/create/detail
- Purchases list/create/detail
- Inventory page
- Reports pages
- Accounting pages
- Settings pages for company, invoice series, users, notifications, subscription
- Admin pages for dashboard, companies, subscriptions, usage, queues, support tickets

---

## Partial

### Backend

- RBAC is MVP-only and not permissions-driven
- Billing checkout is placeholder-only
- Notifications stop at templates and test send, not full provider delivery
- Files are local-first and not production storage-grade
- GST export is minimal and not compliance-grade
- Accounting exists but is not auto-posted from business transactions
- Profit reporting is approximate rather than valuation-accurate

### Frontend

- Dashboard is operationally light and visually placeholder-grade
- Invoice builder is functional but below planned UX depth
- Purchase UX is functional but below planned UX depth
- Accounting report presentation is only partially polished
- Route guarding relies heavily on client session bootstrap
- Route structure has drifted from canonical docs

---

## Missing

### Backend

- Public company creation/onboarding endpoint
- GSTIN verification flow
- Full permissions model
- Role create/update/assign flows
- Credit notes and sales returns
- Purchase returns
- Invoice send/share endpoint
- GST engine with CGST/SGST/IGST breakdown
- GSTR-3B, HSN, ITC, portal-grade GST exports
- Auto-posting accounting engine
- Real provider-driven billing completion flow
- Full entitlement updates from webhooks
- Production notification delivery integrations
- POS APIs/contract if required

### Frontend

- Onboarding routes and flow
- Reset-password route
- Logout route parity
- Dedicated roles page
- Dedicated payments page
- Dedicated inventory stock/movements/adjustments route group
- GST hub with full report set
- POS routes and print experience
- Fully modernized/pixel-perfect design system rollout

---

## Notes

- Some older planning docs are now stale because they still mark implemented items as deferred.
- This file should be used to drive updates to legacy docs during Phase A.
