# V2 Distributor / Wholesaler Readiness Plan

**Date**: 2026-03-24  
**Purpose**: Define the concrete execution plan for turning the current product into a distributor / wholesaler-ready V2.

This plan assumes:

- the current product remains the base platform
- V2 is a focused vertical expansion for distribution / wholesale workflows
- manufacturing is **not** included in this V2

Source context:

- [SEGMENT_READINESS_AND_POSITIONING_RESEARCH.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/SEGMENT_READINESS_AND_POSITIONING_RESEARCH.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)
- [DOMAIN_MODEL.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/DOMAIN_MODEL.md)

---

## V2 objective

Make the product credible for:

- distributors
- wholesalers
- stockists
- trade businesses with sales staff

Specifically, V2 should let you sell a stronger promise around:

- quotations to order to invoice flow
- cleaner stock movement across godowns / warehouses
- staff and salesperson control
- faster collections and due follow-up
- owner-level sales, dues, and stock visibility

It should still avoid claiming full manufacturing ERP capability.

---

## Product thesis for V2

The current product already solves:

- billing
- GST
- payments
- inventory visibility
- accounting and reports

V2 should solve the missing distributor workflow layer:

- pre-invoice commercial flow
- sales-team operating model
- godown / stock transfer model
- distribution analytics

That is the shortest path to a stronger market wedge.

---

## Phase V2.1

### Quotations / estimates foundation

Status:

- Completed on 2026-03-25 in the current product line as D1

Goal:

- introduce pre-invoice commercial workflow

Scope:

- quotation / estimate entity
- draft / sent / approved / expired / converted states
- quotation items aligned with current product, tax, and pricing models
- quotation to invoice conversion
- quotation list and detail pages
- print / PDF support where useful

Why this is first:

- distributors and wholesalers often start with quote or negotiated rate flow before invoice
- this is also reusable later for manufacturing and sales-order workflows

Acceptance criteria:

- a quotation can be created, edited, issued, and converted to invoice
- converted invoices preserve item, tax, and customer data
- quotation status and history are visible

---

## Phase V2.2

### Sales order workflow

Status:

- Completed on 2026-03-25 in the current product line as D2

Goal:

- separate demand capture from final invoice issue

Scope:

- sales order entity
- order statuses:
  - draft
  - confirmed
  - partially fulfilled
  - fulfilled
  - canceled
- quotation to sales order conversion
- sales order to invoice conversion
- backorder / partial fulfillment support

Why this matters:

- serious distribution businesses do not always invoice immediately
- this is core to dispatch-driven workflows

Acceptance criteria:

- a sales order can be created without immediately creating an invoice
- partial and full fulfillment are visible
- invoice generation can be tied to fulfilled quantities

---

## Phase V2.3

### Sales staff / salesperson operating model

Status:

- Completed on 2026-03-25 in the current product line as D4

Goal:

- add the minimum viable sales-team layer

Scope:

- salesperson master or staff role extension
- assignment of customers to salesperson
- salesperson tagging on quotation, order, invoice, and collection activity
- basic rep-wise dashboards:
  - sales
  - collections
  - outstanding
- optional mobile-friendly order-entry screen for rep-assisted order capture

Not in scope for V2.3:

- full beat / route planning
- attendance / field tracking
- GPS-based salesman app

Why this matters:

- without rep attribution, the product remains office-centric

Acceptance criteria:

- owner/admin can assign staff to accounts
- documents and payments can be attributed to a rep
- rep-wise sales and due performance can be filtered in reports

---

## Phase V2.4

### Warehouse / godown and stock transfer model

Status:

- Completed on 2026-03-25 in the current product line as D3

Goal:

- move inventory from single-location assumptions toward distributor reality

Scope:

- warehouse / godown master
- product stock by location
- stock transfer workflow:
  - requested
  - in transit
  - received
  - canceled
- document and report filtering by location
- optional default warehouse on users or operating units

Not in scope:

- full branch accounting separation
- legal entity split by branch

Why this matters:

- stock visibility across locations is one of the main distributor pains

Acceptance criteria:

- stock can be tracked by warehouse
- transfers adjust location balances correctly
- invoices and purchases can be tied to a location

---

## Phase V2.5

### Distributor analytics and collections control

Goal:

- turn existing reports into distributor-operating reports

Scope:

- salesperson-wise sales
- salesperson-wise collections
- customer aging / outstanding by rep
- product movement by warehouse
- fast-moving / slow-moving products
- top customers, overdue accounts, and stock-at-risk views
- owner dashboard enrichment:
  - dues
  - collections
  - stock risk
  - salesperson performance

Why this matters:

- this is where buyer value becomes visible quickly

Acceptance criteria:

- owner can answer:
  - who sold
  - who collected
  - who still owes
  - which warehouse is carrying stock
  - which products are moving fast or slowing down

Current implementation status:

- completed in D5
- delivered through distributor analytics endpoints, tenant dashboard enrichment, and `/reports/distributor/analytics`
  - who collected
  - who still owes
  - where stock is stuck
  - which products are moving

---

## Phase V2.6

### Distribution packaging, QA, and launch proof

Goal:

- turn V2 from feature-complete into sellable

Scope:

- seeded distributor demo data
- E2E manual and automated coverage for V2 flows
- sales demo narrative for distributors / wholesalers
- pricing/package language for the vertical
- staging validation and live customer pilot proof

Acceptance criteria:

- quotation → order → invoice → payment works end to end
- warehouse and transfer scenarios are validated
- rep-wise reporting is validated
- buyer-facing messaging is updated to match V2

Current implementation status:

- completed in D6
- delivered through a distributor demo seed, distributor-specific smoke automation, and demo / QA packaging docs

---

## Suggested implementation order

1. V2.1 quotations
2. V2.2 sales orders
3. V2.4 warehouse / godown + transfers
4. V2.3 sales staff model
5. V2.5 distributor analytics
6. V2.6 QA + GTM packaging

Reason:

- quotation and order flows establish the commercial backbone first
- warehouse logic is more important than sales rep logic for many wholesalers
- analytics should come after operational entities exist

---

## Data-model direction

Likely new bounded additions:

- `Quotation`
- `QuotationItem`
- `SalesOrder`
- `SalesOrderItem`
- `Warehouse`
- `StockTransfer`
- `StockTransferItem`
- `SalespersonAssignment` or equivalent salesperson mapping

Likely existing models to extend:

- `Invoice`
- `Purchase`
- `Payment`
- `Product`
- `StockMovement`
- reports and dashboard aggregates

---

## UX direction for V2

Use the current authenticated-surface grammar as the base.

Add these new archetypes:

- quotation list + detail
- order pipeline board or status-first list
- warehouse-centric stock views
- rep-performance filters and report slices

Do not fork the product visually.

V2 should feel like:

- the current system becoming deeper for distribution

Not like:

- a second unrelated app

---

## Technical strategy

## Recommendation

**Do not create a separate repo for V2 right now.**

### Why staying in the same repo is better

V2 reuses too much of the current system:

- auth
- onboarding
- company model
- RBAC
- products, customers, suppliers
- invoices, payments, purchases
- inventory and accounting
- admin, billing, files, notifications
- existing web and API apps

A separate repo now would create:

- duplicate auth and platform work
- duplicate design system work
- duplicate schema evolution
- much harder shared maintenance
- unclear source of truth for the core product

### When a separate repo would make sense

Only consider a separate repo if one of these becomes true:

1. V2 becomes a fundamentally different product with a separate domain model
2. distribution workflows require a different frontend stack or mobile-first product not compatible with the current web app
3. you want separate teams, release cycles, and data boundaries

### Better structure right now

Keep:

- same repo
- same apps
- same shared platform

Add:

- a dedicated V2 execution track
- feature flags or role/config-based visibility if needed
- careful domain boundaries inside the same codebase

---

## Delivery recommendation

The best way to build V2 is:

- same repo
- same product family
- focused vertical track
- pilot with 3 to 5 distributor / wholesaler customers before broad positioning

Do not try to solve manufacturing in the same V2 track.

That would broaden the scope too early and weaken the distributor wedge.

---

## Final recommendation

V2 should be:

- the distributor / wholesaler readiness release of the current product

It should stay in:

- the current repo

And it should aim to make these statements true:

- quotation to invoice flow works
- warehouse and stock transfer workflows work
- salesperson attribution and reporting work
- owner can see sales, dues, stock, and collections clearly

That is the shortest path from the current product to a genuinely stronger market fit.
