# D5 Distributor Analytics Implementation Spec

**Date**: 2026-03-25  
**Status**: Implemented

This document records the delivered D5 slice for distributor / wholesaler V2.

---

## Goal

Turn the reporting layer into an owner-facing distributor operating cockpit instead of a generic billing summary.

Delivered scope:

- outstanding by customer with salesperson context
- stock by warehouse with stock value and low-stock pressure
- fast-moving and slow-moving product views
- distributor dashboard aggregation for owner review
- distributor analytics report route in the tenant app
- tenant dashboard enrichment using distributor operating metrics

Out of scope:

- branch P&L
- route / beat intelligence
- demand forecasting
- reorder recommendation engine

---

## Backend API

New report endpoints:

- `GET /api/companies/:companyId/reports/distributor/outstanding-by-customer?as_of=`
- `GET /api/companies/:companyId/reports/distributor/stock-by-warehouse`
- `GET /api/companies/:companyId/reports/distributor/product-movement?from=&to=&limit=`
- `GET /api/companies/:companyId/reports/distributor/dashboard?from=&to=&as_of=`

Behavior:

- outstanding by customer groups open issued invoices and carries salesperson ownership from invoice attribution
- stock by warehouse reads warehouse stock rows and calculates:
  - SKU count
  - total quantity
  - stock value using `products.cost_price`
  - low-stock lines using `products.reorder_level`
- product movement ranks invoice-item movement for the selected window and returns both `fast_moving` and `slow_moving`
- distributor dashboard composes:
  - sales by salesperson
  - collections by salesperson
  - outstanding by salesperson
  - outstanding by customer
  - warehouse stock snapshot
  - product movement

Schema impact:

- no new Prisma models were required for D5
- D5 builds on the D3 warehouse model and D4 salesperson attribution model

---

## Frontend

Delivered surfaces:

- tenant dashboard now shows an owner operating view with:
  - gross sales
  - collections
  - outstanding
  - stock value
  - top salespeople
  - top due customers
  - warehouse snapshot
  - fast-moving and slow-moving products
- new distributor report route:
  - `/c/:companyId/reports/distributor/analytics`
- reports hub now links to:
  - `/c/:companyId/reports/distributor/sales-team`
  - `/c/:companyId/reports/distributor/analytics`

UI intent:

- keep the owner view compact and operational
- show who sold, who collected, who owes, where stock sits, and what is moving

---

## Validation

Verified:

- API typecheck
- API build
- web lint
- web typecheck
- e2e:
  - `apps/api/test/distributor-analytics.e2e-spec.ts`

What the e2e proves:

- customer-level outstanding returns salesperson context
- warehouse stock snapshot reflects received and transferred stock correctly
- product movement returns sold SKU ranking
- distributor dashboard aggregates rep, customer, warehouse, and movement views into one payload

---

## Notes

- D5 also corrected a frontend contract issue in distributor report pages where response data was being unwrapped inconsistently
- the familiar BullMQ/ioredis teardown warning still appears after local e2e runs, but it did not block D5 verification

---

## Remaining follow-up after D5

D5 intentionally stops at analytics visibility.

Still future work:

- seeded distributor demo dataset and polished pilot walkthroughs in D6
- deeper branch / territory analytics
- reorder and replenishment suggestions
- salesperson-specific operational worklists
