# D4 Sales Staff Model Implementation Spec

**Date**: 2026-03-25  
**Status**: Implemented

This document records the delivered D4 slice for distributor / wholesaler V2.

---

## Goal

Introduce the minimum viable sales-team operating model without creating a separate field-force subsystem.

Delivered scope:

- customer assignment to a primary salesperson
- built-in `salesperson` role
- salesperson attribution on quotations, sales orders, invoices, and invoice payments
- rep-wise reports for sales, collections, and outstanding

Out of scope:

- route planning
- beat management
- GPS / attendance tracking
- strict row-level visibility enforcement by salesperson

---

## Data model

New nullable attribution fields:

- `customers.salesperson_user_id`
- `quotations.salesperson_user_id`
- `sales_orders.salesperson_user_id`
- `invoices.salesperson_user_id`
- `payments.salesperson_user_id`

Migration:

- `prisma/migrations/20260325143000_d4_sales_staff_model/migration.sql`

Behavior:

- customer is the primary assignment anchor
- quotations, sales orders, and invoices inherit salesperson from the customer unless an explicit salesperson is supplied
- invoice payments inherit salesperson from the linked invoice

---

## Backend API

New / extended endpoints:

- `GET /api/companies/:companyId/users/salespeople`
- `POST /api/companies/:companyId/customers`
- `PATCH /api/companies/:companyId/customers/:customerId`
- `POST /api/companies/:companyId/quotations`
- `PATCH /api/companies/:companyId/quotations/:quotationId`
- `POST /api/companies/:companyId/sales-orders`
- `PATCH /api/companies/:companyId/sales-orders/:salesOrderId`
- `POST /api/companies/:companyId/invoices`
- `POST /api/companies/:companyId/payments`

New report endpoints:

- `GET /api/companies/:companyId/reports/distributor/sales-by-salesperson`
- `GET /api/companies/:companyId/reports/distributor/collections-by-salesperson`
- `GET /api/companies/:companyId/reports/distributor/outstanding-by-salesperson`

Role model:

- added built-in `salesperson` role
- permissions focus on dashboard, masters, sales, payments, and reports

---

## Frontend

Delivered surfaces:

- salesperson selector on customer create and customer detail pages
- salesperson selector on quotation, sales-order, and invoice create pages
- customer list now shows assigned salesperson
- new distributor report route:
  - `/c/:companyId/reports/distributor/sales-team`
- reports hub now links to the distributor sales-team report

---

## Validation

Verified:

- Prisma client generation
- API typecheck
- API build
- web lint
- web typecheck
- e2e:
  - `apps/api/test/sales-staff-model.e2e-spec.ts`

What the e2e proves:

- assigned salesperson is stored on customer
- quotation inherits salesperson
- sales order inherits salesperson
- invoice inherits salesperson
- payment inherits salesperson
- distributor report endpoints return correct salesperson totals

---

## Remaining follow-up after D4

D4 intentionally stops at attribution and owner reporting baseline.

Still future work:

- salesperson-scoped dashboards and filtered worklists
- outstanding follow-up workflow for reps
- richer distributor analytics in D5
- deeper mobile-first order entry for sales reps
