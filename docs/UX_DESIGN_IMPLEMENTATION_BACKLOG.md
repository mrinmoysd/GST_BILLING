# UX Design Implementation Backlog

**Date**: 2026-03-27  
**Purpose**: Convert the approved UX direction into an implementation backlog for redesign execution across `P0`, `P1`, and deferred `P3` bands.  
**Status**: Execution-ready UX backlog

Sources:

- [UX_REDESIGN_PRIORITY_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/UX_REDESIGN_PRIORITY_PLAN.md)
- [UX_EXECUTION_DECISION_SHEET.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/UX_EXECUTION_DECISION_SHEET.md)
- [WORKFLOW_CENTERED_POWER_USER_WIREFRAME_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/WORKFLOW_CENTERED_POWER_USER_WIREFRAME_SPEC.md)

Note:

- I am treating `P3` as the deferred/later redesign band for this backlog.
- This keeps `P0` and `P1` focused on the core tenant operating surface while `P3` captures later specialist or secondary surfaces.

---

## 1. Backlog Format

Each backlog item includes:

- `Objective`
- `UX problems to fix`
- `Target layout pattern`
- `Reusable components needed`
- `Dependencies`
- `Success criteria`

---

## 2. Shared Foundation Work

These are cross-cutting building blocks and should be delivered before or during early `P0`.

## F1. Workflow shell

Objective:

- create the new tenant app frame that all redesigned pages sit inside

UX problems to fix:

- current pages feel disconnected
- navigation is module-driven rather than workflow-driven
- no stable command layer exists

Target layout pattern:

- workflow rail
- top command bar
- sub-workflow strip
- sticky page header

Reusable components needed:

- app shell layout
- workflow nav item
- sub-workflow tab strip
- command bar
- global search launcher
- quick create launcher
- recent items dropdown

Dependencies:

- none

Success criteria:

- shell is live and reusable across tenant pages
- page content can plug into one consistent frame

## F2. Page header system

Status:

- Implemented at code/build level on 2026-03-27
- Shared header primitives now live in `apps/web/src/lib/ui/page-header.tsx`
- Existing workspace heroes route through the same header surface, and representative tenant pages have been upgraded
- Validation passed: `npm --workspace apps/web run lint` and `npm --workspace apps/web run build`

Objective:

- create a single header pattern for queues, detail pages, explorers, and composers

UX problems to fix:

- inconsistent titles, actions, and filter placement

Target layout pattern:

- title
- status / subtitle
- primary action
- secondary actions
- filter slot where needed

Reusable components needed:

- operational page header
- context strip
- action group

Dependencies:

- F1

Success criteria:

- pages no longer invent ad hoc header structures

## F3. Queue + inspector framework

Status:

- Implemented at code/build level on 2026-03-27
- Shared queue primitives now live in `apps/web/src/lib/ui/queue.tsx`
- Representative operational queues upgraded: invoices, dispatch, and collections
- Validation passed: `npm --workspace apps/web run lint` and `npm --workspace apps/web run build`

Objective:

- create the core high-density operational layout used by lists and work queues

UX problems to fix:

- current list pages are not consistently optimized for scan speed
- context is often either hidden or mixed into the table

Target layout pattern:

- segment bar
- filter bar
- dense table / list
- row states
- right inspector

Reusable components needed:

- segment bar
- queue toolbar
- saved view chip set
- dense data table
- inspector rail
- row quick action cluster

Dependencies:

- F1
- F2

Success criteria:

- queue pages can reuse one predictable operational pattern

## F4. Detail tab framework

Status:

- Implemented at code/build level on 2026-03-27
- Shared detail primitives now live in `apps/web/src/lib/ui/detail.tsx`
- Representative detail pages upgraded: customer detail, product detail, and invoice detail
- Validation passed: `npm --workspace apps/web run lint` and `npm --workspace apps/web run build`

Objective:

- create the entity and document detail system

UX problems to fix:

- long mixed-purpose detail pages
- edit, history, financial, and operational context all stacked vertically

Target layout pattern:

- page header
- context strip
- sticky tab row
- tab content
- optional right rail

Reusable components needed:

- detail tab bar
- context strip
- linked-doc rail
- activity rail
- tab content shell

Dependencies:

- F1
- F2

Success criteria:

- customer, invoice, product, and similar pages can use one detail architecture

## F5. Composer framework

Status:

- Implemented at code/build level on 2026-03-27
- Shared composer primitives now live in `apps/web/src/lib/ui/composer.tsx`
- Representative create pages upgraded: sales order create, invoice create, and purchase create
- Validation passed: `npm --workspace apps/web run lint` and `npm --workspace apps/web run build`

Objective:

- make create flows step-based and easier to complete

UX problems to fix:

- current forms are too vertical
- users have to process too much at once

Target layout pattern:

- step bar
- focused main form area
- live summary rail

Reusable components needed:

- stepper
- summary rail
- warning stack
- sticky submit area

Dependencies:

- F1
- F2

Success criteria:

- new document and master creation flows become easier to complete and review

---

## 3. P0 Backlog

Status:

- Implemented at code/build level on 2026-03-27
- The `P0` band now has the new shell, queue + inspector, detail tabs, and composer patterns applied across the main operational families
- Newly completed `P0` redesign surfaces in this pass: tenant dashboard, payments workspace, banking workspace, customer queue, product queue, customer create, and product create
- Previously completed `P0` supporting surfaces in earlier passes: invoice list, invoice detail, invoice create, collections queue, dispatch queue, customer detail, and product detail
- Validation passed: `npm --workspace apps/web run lint` and `npm --workspace apps/web run build`
- Remaining work for `P0` is browser-level visual QA and interaction polish, not missing page architecture

## P0-01. Tenant dashboard redesign

Routes:

- [dashboard/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/dashboard/page.tsx)

Objective:

- turn the dashboard into an operational control surface

UX problems to fix:

- likely too generic or too broad
- not enough emphasis on bottlenecks, overdue work, and urgent decisions

Target layout pattern:

- workflow overview

Reusable components needed:

- F1
- F2
- KPI band
- priority queue blocks
- recent activity feed

Dependencies:

- F1
- F2

Success criteria:

- top of the dashboard answers what needs attention today

## P0-02. Invoice list redesign

Routes:

- [sales/invoices/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/invoices/page.tsx)

Objective:

- make invoice operations faster and more scannable

UX problems to fix:

- insufficient queue-first organization
- weak exception visibility
- likely too much card or generic list behavior

Target layout pattern:

- queue + inspector

Reusable components needed:

- F3
- status chips
- aging / due indicators
- compliance state chip
- saved views

Dependencies:

- F1
- F2
- F3

Success criteria:

- operator can quickly separate draft, issued, overdue, paid, and compliance-problem invoices

## P0-03. Invoice detail redesign

Routes:

- [sales/invoices/[invoiceId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/invoices/[invoiceId]/page.tsx)

Objective:

- make invoice detail an operational workspace, not a stacked summary page

UX problems to fix:

- too much detail in one vertical flow
- compliance, payments, and linked docs compete for space

Target layout pattern:

- detail with segmented tabs

Reusable components needed:

- F4
- linked-document rail
- financial summary strip
- audit timeline

Dependencies:

- F4

Success criteria:

- invoice detail clearly separates summary, items, payments, compliance, linked docs, and audit

## P0-04. Invoice create redesign

Routes:

- [sales/invoices/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/invoices/new/page.tsx)

Objective:

- reduce creation friction while keeping commercial and compliance signals visible

UX problems to fix:

- likely too many fields visible at once
- credit, scheme, batch, and compliance context not staged well enough

Target layout pattern:

- composer / create screen

Reusable components needed:

- F5
- credit warning panel
- batch allocation summary
- commercial summary rail

Dependencies:

- F5

Success criteria:

- users can create invoices step-by-step without losing visibility into key warnings

## P0-05. Collections queue redesign

Routes:

- [payments/collections/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/payments/collections/page.tsx)

Objective:

- turn collections into an action-oriented recovery board

UX problems to fix:

- collection priority, promises, and overdue action probably not separated cleanly enough

Target layout pattern:

- queue + inspector

Reusable components needed:

- F3
- task urgency states
- promise-to-pay markers
- next-action chip
- customer risk mini-panel

Dependencies:

- F3

Success criteria:

- users can work overdue, promise, and open-task queues directly from one surface

## P0-06. Payments queue redesign

Routes:

- [payments/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/payments/page.tsx)

Objective:

- make payment receipt operations easier to scan and manage

UX problems to fix:

- payment method, instrument state, and reconciliation likely need stronger row language

Target layout pattern:

- queue + inspector

Reusable components needed:

- F3
- instrument status chip
- payment method badge
- linked invoice preview

Dependencies:

- F3

Success criteria:

- operators can distinguish receipt state and linked document context immediately

## P0-07. Banking and reconciliation redesign

Routes:

- [payments/banking/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/payments/banking/page.tsx)

Objective:

- create the first strong split-view reconciliation workspace

UX problems to fix:

- matching work is cognitively heavy
- page likely needs better separation between list, candidate match, and selected context

Target layout pattern:

- queue + inspector with split-view center

Reusable components needed:

- F3
- reconciliation split panel
- candidate match list
- match confidence or status row

Dependencies:

- F3

Success criteria:

- operators can review a statement line, compare candidates, and act without page jumping

## P0-08. Dispatch board redesign

Routes:

- [sales/dispatch/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/dispatch/page.tsx)

Objective:

- make dispatch a true operational board

UX problems to fix:

- dispatch likely lacks lane-based urgency and exception clarity

Target layout pattern:

- queue + inspector

Reusable components needed:

- F3
- dispatch stage segments
- fulfillment progress bar
- short supply warning
- transporter context block

Dependencies:

- F3

Success criteria:

- teams can separate to-pick, to-pack, to-dispatch, and exception work clearly

## P0-09. Challan family redesign

Routes:

- [sales/challans/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/challans/page.tsx)
- [sales/challans/[challanId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/challans/[challanId]/page.tsx)

Objective:

- align challan management with dispatch flow and invoice linkage

UX problems to fix:

- detail likely mixes transport, quantities, and history too closely

Target layout pattern:

- queue + inspector for list
- detail with segmented tabs for single challan

Reusable components needed:

- F3
- F4
- transport metadata block
- line fulfillment grid

Dependencies:

- P0-08
- F4

Success criteria:

- challans feel like part of the dispatch flow rather than a side page

## P0-10. Customer list redesign

Routes:

- [masters/customers/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/customers/page.tsx)

Objective:

- make customers an operational directory, not just a master list

UX problems to fix:

- insufficient visibility into due risk, salesperson, and route ownership at list level

Target layout pattern:

- queue + inspector

Reusable components needed:

- F3
- customer risk chip
- salesperson / route labels
- latest activity snippet

Dependencies:

- F3

Success criteria:

- the list itself helps users decide who needs action

## P0-11. Customer detail redesign

Routes:

- [masters/customers/[customerId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/customers/[customerId]/page.tsx)
- [masters/customers/[customerId]/ledger/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/customers/[customerId]/ledger/page.tsx)

Objective:

- complete the customer workspace with clear layers and less vertical overload

UX problems to fix:

- customer data spans profile, collections, coverage, sales, and ledger
- this should not live in one long page

Target layout pattern:

- detail with segmented tabs
- ledger as explorer

Reusable components needed:

- F4
- F3
- customer summary strip
- tabbed transaction panes
- ledger filter bar

Dependencies:

- P0-10
- F4

Success criteria:

- customer detail becomes a full workspace with clear tabs and quick navigation

## P0-12. Customer create redesign

Routes:

- [masters/customers/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/customers/new/page.tsx)

Objective:

- make customer onboarding easier and less form-heavy

UX problems to fix:

- identity, commercial, and address data likely appear too flat or too long

Target layout pattern:

- composer / create screen

Reusable components needed:

- F5
- address step
- commercial policy step

Dependencies:

- F5

Success criteria:

- customer creation is short, staged, and easier to complete correctly

## P0-13. Product list redesign

Routes:

- [masters/products/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/products/page.tsx)

Objective:

- make product browsing operational for stock, pricing, and batch users

UX problems to fix:

- low-stock, batch, and pricing signals likely are not organized as well as they could be

Target layout pattern:

- queue + inspector

Reusable components needed:

- F3
- stock state chip
- batch policy label
- low-stock indicator

Dependencies:

- F3

Success criteria:

- product list becomes useful for action, not only maintenance

## P0-14. Product detail and create redesign

Routes:

- [masters/products/[productId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/products/[productId]/page.tsx)
- [masters/products/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/products/new/page.tsx)

Objective:

- organize product maintenance around pricing, stock, batches, and settings

UX problems to fix:

- product data is multi-domain and likely needs clearer tab separation

Target layout pattern:

- detail with segmented tabs
- composer / create screen

Reusable components needed:

- F4
- F5
- pricing summary strip
- stock and batch subpanes

Dependencies:

- P0-13
- F4
- F5

Success criteria:

- product detail supports quick reading across pricing, stock, and batch contexts

---

## 4. P1 Backlog

## P1-01. Orders family redesign

Routes:

- [sales/orders/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/orders/page.tsx)
- [sales/orders/[salesOrderId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/orders/[salesOrderId]/page.tsx)
- [sales/orders/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/orders/new/page.tsx)

Objective:

- align order UX with invoice and dispatch flows

UX problems to fix:

- order state, fulfillment, and dispatch readiness need clearer hierarchy

Target layout pattern:

- queue + inspector
- detail tabs
- composer

Reusable components needed:

- F3
- F4
- F5
- fulfillment progress components

Dependencies:

- invoice family
- dispatch family

Success criteria:

- orders feel structurally aligned with invoices and dispatch

## P1-02. Quotation family redesign

Routes:

- [sales/quotations/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/quotations/page.tsx)
- [sales/quotations/[quotationId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/quotations/[quotationId]/page.tsx)
- [sales/quotations/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/quotations/new/page.tsx)

Objective:

- make quotation workflows easier to scan and convert

UX problems to fix:

- conversion state and commercial context likely need stronger placement

Target layout pattern:

- queue + inspector
- detail tabs
- composer

Reusable components needed:

- F3
- F4
- F5
- conversion panel

Dependencies:

- invoice and order patterns

Success criteria:

- quote-to-order or quote-to-invoice flow is clearer and faster

## P1-03. Purchases family redesign

Routes:

- [purchases/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/purchases/page.tsx)
- [purchases/[purchaseId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/purchases/[purchaseId]/page.tsx)
- [purchases/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/purchases/new/page.tsx)

Objective:

- modernize the purchase receive and payable flow

UX problems to fix:

- receive, batch, payable, and return context need stronger layout separation

Target layout pattern:

- queue + inspector
- detail tabs
- composer

Reusable components needed:

- F3
- F4
- F5
- batch receive summary

Dependencies:

- invoice composer and detail patterns

Success criteria:

- purchase flow becomes consistent with sales-side document flow

## P1-04. Inventory overview redesign

Routes:

- [inventory/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/inventory/page.tsx)

Objective:

- make inventory overview a stock-control center

UX problems to fix:

- likely insufficient hierarchy across stock value, low stock, near expiry, and transfer pressure

Target layout pattern:

- workflow overview

Reusable components needed:

- KPI band
- exception queue blocks
- warehouse health block

Dependencies:

- dashboard overview components

Success criteria:

- inventory overview becomes useful for operational action, not just reading numbers

## P1-05. Inventory specialty surfaces redesign

Routes:

- [inventory/warehouses/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/inventory/warehouses/page.tsx)
- [inventory/transfers/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/inventory/transfers/page.tsx)
- [inventory/batches/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/inventory/batches/page.tsx)
- [inventory/movements/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/inventory/movements/page.tsx)
- [inventory/adjustments/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/inventory/adjustments/page.tsx)

Objective:

- bring the new queue and explorer standards into inventory-heavy pages

UX problems to fix:

- inventory specialty pages likely vary too much in layout and emphasis

Target layout pattern:

- queue + inspector
- explorer
- hybrid form where needed

Reusable components needed:

- F3
- explorer filter bar
- inventory state chips

Dependencies:

- inventory overview
- product workspace

Success criteria:

- inventory pages feel like one cohesive subsystem

## P1-06. Supplier workspace redesign

Routes:

- [masters/suppliers/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/suppliers/page.tsx)
- [masters/suppliers/[supplierId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/suppliers/[supplierId]/page.tsx)
- [masters/suppliers/[supplierId]/ledger/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/suppliers/[supplierId]/ledger/page.tsx)
- [masters/suppliers/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/suppliers/new/page.tsx)

Objective:

- mirror customer improvements for suppliers in a payable-focused way

UX problems to fix:

- supplier directory and detail likely lag behind customer structure

Target layout pattern:

- queue + inspector
- detail tabs
- composer

Reusable components needed:

- customer workspace components adapted for payables

Dependencies:

- customer workspace

Success criteria:

- suppliers feel like a first-class operational workspace

## P1-07. Reports framework redesign

Routes:

- [reports/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/page.tsx)
- all report pages under `/reports/*`

Objective:

- standardize the report explorer model

UX problems to fix:

- report pages often drift into inconsistent filters, headers, and result layouts

Target layout pattern:

- explorer / report surface

Reusable components needed:

- explorer header
- variable/filter bar
- summary strip
- result table shell
- export area

Dependencies:

- F2
- dashboard KPI language

Success criteria:

- reports become consistent and faster to interpret

## P1-08. Settings framework redesign

Routes:

- [settings/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/page.tsx)
- all routes under `/settings/*`

Objective:

- establish the settings studio model

UX problems to fix:

- settings pages likely vary too much in composition and depth handling

Target layout pattern:

- settings studio

Reusable components needed:

- left settings nav
- studio section layout
- preview rail
- validation summary block

Dependencies:

- F1
- F2

Success criteria:

- settings pages feel quieter and more structured than operational pages

## P1-09. Field sales workspace redesign

Routes:

- [sales/field/today/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/field/today/page.tsx)
- [sales/field/visits/[visitId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/field/visits/[visitId]/page.tsx)
- [sales/field/dcr/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/field/dcr/page.tsx)
- [settings/sales/assignments/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/sales/assignments/page.tsx)

Objective:

- give field sales a mobile-aware but still structured workspace

UX problems to fix:

- desktop density and field mobility have conflicting needs

Target layout pattern:

- queue + inspector for desktop
- simplified queue and detail for mobile

Reusable components needed:

- responsive queue shell
- visit action stack
- route / beat chips
- DCR summary band

Dependencies:

- F3
- F4

Success criteria:

- field reps and managers both get usable flows without overloading mobile

---

## 5. Deferred P3 Backlog

## P3-01. Accounting workspace modernization

Routes:

- [accounting/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/page.tsx)
- [accounting/ledgers/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/ledgers/page.tsx)
- [accounting/journals/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/journals/page.tsx)
- [accounting/journals/[journalId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/journals/[journalId]/page.tsx)
- [accounting/books/cash/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/books/cash/page.tsx)
- [accounting/books/bank/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/books/bank/page.tsx)
- financial statement routes

Objective:

- modernize accounting without weakening trust or familiarity

UX problems to fix:

- accounting pages often resist aggressive redesign and need careful operator-safe refinement

Target layout pattern:

- overview
- queue + inspector
- explorer
- detail tabs where justified

Reusable components needed:

- explorer framework
- accounting-specific table density settings

Dependencies:

- reports framework
- shell maturity

Success criteria:

- accounting feels modern but still serious and trustworthy

## P3-02. GST specialist surfaces redesign

Routes:

- [reports/gst/gstr1/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/gst/gstr1/page.tsx)
- [reports/gst/compliance/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/gst/compliance/page.tsx)

Objective:

- improve specialist compliance reading and exception handling

UX problems to fix:

- these pages need clearer sectioning, exception handling, and export structure

Target layout pattern:

- explorer
- queue + inspector for compliance exceptions

Reusable components needed:

- explorer framework
- exception queue patterns from invoices and collections

Dependencies:

- invoice compliance model
- reports framework

Success criteria:

- GST pages become clearer for periodic specialist use

## P3-03. POS refinement

Routes:

- [pos/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/pos/page.tsx)
- [pos/billing/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/pos/billing/page.tsx)
- [pos/receipt/[invoiceId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/pos/receipt/[invoiceId]/page.tsx)

Objective:

- tailor POS for faster touch and counter use

UX problems to fix:

- POS interaction needs differ from the standard tenant shell

Target layout pattern:

- dedicated power-user composer
- print surface for receipts

Reusable components needed:

- touch-friendly bill line grid
- numeric action pad
- checkout rail

Dependencies:

- shell decisions
- invoice composer learnings

Success criteria:

- POS feels purpose-built instead of adapted from document forms

## P3-04. Admin surface refinement

Routes:

- all `/admin/*`

Objective:

- align admin with the same design system without slowing down tenant redesign

UX problems to fix:

- platform operators need a different tone and priority model

Target layout pattern:

- overview
- queue + inspector
- detail tabs

Reusable components needed:

- shell variant
- admin queue presets

Dependencies:

- tenant shell and patterns mature

Success criteria:

- admin inherits consistency without blocking tenant priority work

## P3-05. Public and auth surface refinement

Routes:

- all public/auth routes outside tenant app

Objective:

- give public and auth a distinct branded system

UX problems to fix:

- public surface should not inherit dense tenant application language

Target layout pattern:

- branded marketing shell
- focused auth forms

Reusable components needed:

- marketing navigation
- auth split layout
- branded section system

Dependencies:

- separate from tenant rollout

Success criteria:

- public and auth become stronger without consuming core tenant redesign capacity early

---

## 6. Delivery Order

### Recommended order across bands

1. F1-F5 shared foundations
2. all `P0`
3. all `P1`
4. deferred `P3`

### Exact recommended first sequence

1. F1 workflow shell
2. F2 page header system
3. F3 queue + inspector framework
4. F4 detail tab framework
5. F5 composer framework
6. P0-01 dashboard
7. P0-02 invoice list
8. P0-03 invoice detail
9. P0-04 invoice create
10. P0-05 collections
11. P0-06 payments
12. P0-07 banking
13. P0-08 dispatch
14. P0-09 challans
15. P0-10 customer list
16. P0-11 customer detail
17. P0-12 customer create
18. P0-13 product list
19. P0-14 product detail and create

---

## 7. Review Rules

Use this backlog with these rules:

1. do not redesign a page family before its required shared foundation exists
2. do not redesign detail pages without redesigning the related list pattern
3. do not treat public/auth polish as a blocker for tenant operational UX
4. do not let aesthetic cleanup weaken scan speed, row status visibility, or action density
