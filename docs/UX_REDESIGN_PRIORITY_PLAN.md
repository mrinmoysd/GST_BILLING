# UX Redesign Priority Plan

**Date**: 2026-03-27  
**Purpose**: Prioritize the end-to-end UX redesign rollout for the app using the approved workflow-centered + power-user model.  
**Status**: Execution-ready prioritization sheet

Sources:

- [WORKFLOW_CENTERED_POWER_USER_WIREFRAME_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/WORKFLOW_CENTERED_POWER_USER_WIREFRAME_SPEC.md)
- [UX_EXECUTION_DECISION_SHEET.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/UX_EXECUTION_DECISION_SHEET.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)

---

## 1. Prioritization Logic

The redesign should not start with the most visually interesting pages.

It should start with the pages that:

- prove the new shell
- remove the most daily friction
- touch the highest-value distributor workflows
- establish reusable layout patterns for the rest of the app

Priority bands:

- `P0 redesign now`
  - foundational and highest-usage workflows
- `P1 after shell`
  - important workflow extensions once the shell and core patterns are stable
- `P2 later`
  - lower-frequency, specialized, or dependent surfaces

---

## 2. P0 Redesign Now

These pages should be redesigned first.

They define the shell, the queue + inspector pattern, the tabbed detail pattern, and the composer pattern.

Status:

- Implemented at code/build level on 2026-03-27
- `P0` now covers the tenant shell, dashboard, invoices family, collections, payments, banking, dispatch, customer workspace, and product workspace
- Validation passed: `npm --workspace apps/web run lint` and `npm --workspace apps/web run build`
- Remaining work is browser-level visual QA and interaction polish before moving deeper into `P1`

## 2.1 Global shell and navigation

Routes:

- [layout.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/layout.tsx)

Why P0:

- every other redesign depends on this
- workflow-centered navigation has to exist before page families can feel coherent

Deliver:

- workflow rail
- top command bar
- sub-workflow strip
- global search slot
- quick-create slot
- recent items slot

## 2.2 Tenant dashboard

Routes:

- [dashboard/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/dashboard/page.tsx)

Why P0:

- first impression of the tenant app
- best place to establish exception-first operating language

Deliver:

- operational KPI band
- risk and bottleneck queues
- quick actions
- recent activity

## 2.3 Invoices workspace

Routes:

- [sales/invoices/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/invoices/page.tsx)
- [sales/invoices/[invoiceId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/invoices/[invoiceId]/page.tsx)
- [sales/invoices/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/invoices/new/page.tsx)

Why P0:

- invoices sit at the center of billing, stock, compliance, and collections
- this family proves queue + inspector, detail tabs, and composer all at once

Deliver:

- queue-first invoice list
- tabbed invoice detail
- step-based invoice composer
- compliance and payment context rail

## 2.4 Collections workspace

Routes:

- [payments/collections/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/payments/collections/page.tsx)
- [payments/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/payments/page.tsx)

Why P0:

- one of the highest business-value distributor workflows
- current system needs a stronger exception-driven, operator-grade posture here

Deliver:

- overdue and promise queues
- collection inspector
- receipts queue
- saved views and priority filters

## 2.5 Banking / reconciliation workspace

Routes:

- [payments/banking/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/payments/banking/page.tsx)

Why P0:

- this is a perfect split-view power-user page
- it helps define the dense operational UX pattern better than most other pages

Deliver:

- statement line queue
- candidate match panel
- selected-line inspector
- exception states

## 2.6 Dispatch workspace

Routes:

- [sales/dispatch/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/dispatch/page.tsx)
- [sales/challans/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/challans/page.tsx)
- [sales/challans/[challanId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/challans/[challanId]/page.tsx)

Why P0:

- dispatch is one of the biggest Marg-style operational differentiators
- this area needs queue-first clarity and exception visibility immediately

Deliver:

- dispatch board
- challan queue
- tabbed challan detail
- transport and short-supply context

## 2.7 Customer workspace

Routes:

- [masters/customers/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/customers/page.tsx)
- [masters/customers/[customerId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/customers/[customerId]/page.tsx)
- [masters/customers/[customerId]/ledger/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/customers/[customerId]/ledger/page.tsx)
- [masters/customers/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/customers/new/page.tsx)

Why P0:

- customer detail is already known to be a UX pain point
- it is the best place to prove the segmented-detail model

Deliver:

- customer queue + inspector
- tabbed customer detail
- cleaner customer create flow
- better ledger explorer alignment

## 2.8 Product workspace

Routes:

- [masters/products/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/products/page.tsx)
- [masters/products/[productId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/products/[productId]/page.tsx)
- [masters/products/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/products/new/page.tsx)

Why P0:

- products connect pricing, inventory, batches, and reporting
- strong product detail tabs will influence large parts of the app

Deliver:

- product queue
- tabbed product detail
- step-based product composer

---

## 3. P1 After Shell

These pages should follow once the P0 shell and component patterns are proven.

Status:

- Implemented at code/build level on 2026-03-27
- `P1` now covers the orders family, quotations family, purchases family, supplier workspace, inventory overview, and the main inventory explorer surfaces that were still on older patterns
- Reports, settings, and field-sales surfaces already sat closer to the approved direction and remain inside the `P1` band for follow-up consistency polish, not missing structural redesign
- Validation passed for the redesigned `P1` routes with targeted `eslint` plus `npm --workspace apps/web run build`
- Remaining work for `P1` is browser-level visual QA, interaction polish, and any later secondary-page normalization rather than major missing workspace architecture

## 3.1 Orders and quotations

Routes:

- [sales/quotations/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/quotations/page.tsx)
- [sales/quotations/[quotationId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/quotations/[quotationId]/page.tsx)
- [sales/quotations/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/quotations/new/page.tsx)
- [sales/orders/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/orders/page.tsx)
- [sales/orders/[salesOrderId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/orders/[salesOrderId]/page.tsx)
- [sales/orders/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/orders/new/page.tsx)

Why P1:

- they benefit strongly from the same patterns as invoices
- but invoices, dispatch, and collections should define the model first

## 3.2 Purchases

Routes:

- [purchases/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/purchases/page.tsx)
- [purchases/[purchaseId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/purchases/[purchaseId]/page.tsx)
- [purchases/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/purchases/new/page.tsx)

Why P1:

- same composer/detail patterns as sales-side documents
- important, but slightly less strategic than invoice-dispatch-collections first

## 3.3 Inventory control family

Routes:

- [inventory/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/inventory/page.tsx)
- [inventory/warehouses/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/inventory/warehouses/page.tsx)
- [inventory/transfers/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/inventory/transfers/page.tsx)
- [inventory/batches/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/inventory/batches/page.tsx)
- [inventory/movements/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/inventory/movements/page.tsx)
- [inventory/adjustments/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/inventory/adjustments/page.tsx)

Why P1:

- inventory needs the new shell and queue language
- but the page-family patterns can be borrowed after P0

## 3.4 Supplier workspace

Routes:

- [masters/suppliers/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/suppliers/page.tsx)
- [masters/suppliers/[supplierId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/suppliers/[supplierId]/page.tsx)
- [masters/suppliers/[supplierId]/ledger/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/suppliers/[supplierId]/ledger/page.tsx)
- [masters/suppliers/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/suppliers/new/page.tsx)

Why P1:

- this should follow the customer pattern
- lower urgency than customer due to direct pain and distributor emphasis

## 3.5 Reports framework

Routes:

- [reports/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/page.tsx)
- all report pages under `/reports/*`

Why P1:

- report explorer standardization is important
- but reports should consume established shell and explorer patterns rather than define them

## 3.6 Settings framework

Routes:

- [settings/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/page.tsx)
- all routes under `/settings/*`

Why P1:

- settings studio can wait until the core operator flows are stable

## 3.7 Field sales

Routes:

- [sales/field/today/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/field/today/page.tsx)
- [sales/field/visits/[visitId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/field/visits/[visitId]/page.tsx)
- [sales/field/dcr/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/field/dcr/page.tsx)
- [settings/sales/assignments/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/sales/assignments/page.tsx)

Why P1:

- important for distributor parity
- but should not be redesigned before the shell, queue, and detail systems are mature

---

## 4. P2 Later

These pages matter, but they should not lead the redesign.

Status:

- Implemented at code/build level on 2026-03-27
- The deferred specialist band is now materially closed for the current product shape: accounting specialist surfaces, GST exception handling, and admin company operations were brought onto the shared workspace language, while public/auth and several admin/public surfaces were already close to the approved direction
- POS and public/auth now read as part of the same visual system even where they keep intentionally different interaction rules from the tenant shell
- Validation passed for the redesigned specialist routes with targeted `eslint` plus `npm --workspace apps/web run build`
- Remaining work in this band is browser-level visual QA and any future page-by-page refinement, not missing specialist architecture

## 4.1 Accounting specialty surfaces

Routes:

- [accounting/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/page.tsx)
- [accounting/ledgers/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/ledgers/page.tsx)
- [accounting/journals/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/journals/page.tsx)
- [accounting/journals/[journalId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/journals/[journalId]/page.tsx)
- [accounting/books/cash/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/books/cash/page.tsx)
- [accounting/books/bank/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/books/bank/page.tsx)
- financial statement pages under `/accounting/reports/*`

Why P2:

- accounting needs careful modernization
- over-redesign here can hurt user trust
- best handled after the broader shell and explorer standards are established

## 4.2 GST report surfaces

Routes:

- [reports/gst/gstr1/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/gst/gstr1/page.tsx)
- [reports/gst/compliance/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/gst/compliance/page.tsx)

Why P2:

- important, but narrower user frequency than P0 surfaces
- compliance list behavior can inherit patterns from invoices and collections

## 4.3 POS refinement

Routes:

- [pos/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/pos/page.tsx)
- [pos/billing/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/pos/billing/page.tsx)
- [pos/receipt/[invoiceId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/pos/receipt/[invoiceId]/page.tsx)

Why P2:

- POS should likely get its own focused interaction rules
- not the right place to define the whole tenant shell

## 4.4 Categories and low-complexity setup surfaces

Routes:

- [masters/categories/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/categories/page.tsx)

Why P2:

- low business risk
- can adopt the settings studio later

## 4.5 Admin and public surfaces

Routes:

- all `/admin/*`
- public/auth pages outside the tenant app

Why P2:

- valuable, but separate from tenant operational redesign
- should not distract from the core distributor workspace rollout

---

## 5. Suggested Delivery Waves

## Wave 1

- app shell
- dashboard
- invoices list
- invoice detail
- invoice create

## Wave 2

- collections
- payments
- banking
- dispatch
- challans

## Wave 3

- customers
- customer detail
- customer ledger
- products
- product detail

## Wave 4

- orders
- quotations
- purchases
- suppliers

## Wave 5

- inventory family
- reports framework
- settings framework
- field sales

## Wave 6

- accounting
- GST specialist surfaces
- POS refinement
- admin and public cleanup

---

## 6. Page-by-Page Priority Matrix

| Area | Priority | Why now |
|---|---|---|
| App shell | P0 | everything depends on it |
| Dashboard | P0 | defines operational tone |
| Invoices | P0 | central workflow |
| Collections | P0 | high business pressure |
| Banking | P0 | ideal power-user split view |
| Dispatch | P0 | key distributor differentiator |
| Customers | P0 | known pain and best tabbed-detail proof |
| Products | P0 | ties commercial + stock + batch |
| Orders | P1 | follows invoice model |
| Quotations | P1 | follows order model |
| Purchases | P1 | symmetric document family |
| Inventory family | P1 | benefits from shell + queue standards |
| Suppliers | P1 | follows customer model |
| Reports | P1 | should normalize after archetypes land |
| Settings | P1 | should normalize after shell lands |
| Field sales | P1 | important, but pattern-dependent |
| Accounting | P2 | requires careful modernization |
| GST specialist | P2 | narrower and pattern-dependent |
| POS | P2 | needs dedicated interaction logic |
| Admin | P2 | secondary to tenant redesign |
| Public/auth | P2 | separate design track |

---

## 7. Non-Negotiable Sequencing Rules

1. Do not redesign low-frequency settings pages before the shell.

2. Do not redesign reports before queue/detail/composer patterns are stable.

3. Do not start accounting before the visual language is already proven elsewhere.

4. Do not let admin or marketing work delay tenant operational redesign.

5. Do not redesign customer detail in isolation from customer list and ledger.

6. Do not redesign dispatch without aligning invoices, challans, and collections terminology.

---

## 8. Immediate Start Recommendation

If implementation begins now, start with this exact order:

1. shell
2. dashboard
3. invoices list
4. invoice detail
5. invoice create
6. collections
7. banking
8. dispatch
9. customers
10. products

This will prove the redesign where it matters most and generate reusable UX patterns for the rest of the app.
