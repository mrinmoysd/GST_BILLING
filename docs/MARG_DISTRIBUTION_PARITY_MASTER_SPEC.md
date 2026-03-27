# Marg Distribution Parity Master Spec

**Date**: 2026-03-27  
**Purpose**: Define the capability-by-capability product specification required to make the current solution competitive with Marg ERP9 Distribution for distributor and wholesaler use cases while preserving the current SaaS-native product strengths.

This document is grounded in:

- current repository state
- current implementation-state and validation docs
- current distributor V2 docs
- current public feature signals from Marg ERP

It is not intended to replace existing implementation specs. It is the master planning and scoping document that connects:

- what is already built
- what is only partial
- what is missing for Marg-like distribution parity
- what "production ready" means for each capability family

---

## 1. Executive summary

The current product is already strong in:

- SaaS architecture
- tenant onboarding and RBAC
- billing, purchases, inventory, GST, accounting, and reports
- warehouses, transfers, quotations, sales orders, salesperson attribution, and distributor analytics
- admin, subscriptions, internal operations, and auditability

The current product is still behind Marg-style distribution software in these high-importance areas:

- pricing control depth
- scheme and trade-promotion handling
- batch / expiry / near-expiry inventory handling
- field-sales operating workflows
- route / beat / territory execution
- delivery / dispatch operations
- bank reconciliation and cheque-heavy collection operations
- e-invoice / e-way bill operational flows
- customization and data-migration utilities
- mobile and ecosystem tooling

The correct goal is **not** to clone all of Marg. The correct goal is to reach or exceed Marg for the distribution use cases we want to win:

- GST-heavy trading businesses
- distributors
- wholesalers
- stockists
- owner-led and operator-led supply businesses

The product should avoid claiming full manufacturing ERP parity until BOM, production order, costing, WIP, and job-work capabilities exist.

### 1.1 Validation update on 2026-03-27

The D7-D13 implementation pass has materially changed the gap picture:

- D7 pricing and scheme engine is implemented at code/build level
- D8 batch, expiry, and clearance is implemented at code/build level
- D9 collections, banking, and credit control is implemented at code/build level
- D10 dispatch, delivery, and challan is implemented at code/build level
- D11 e-invoice and e-way bill is implemented internally, but still needs live provider-backed IRP/EWB integration
- D12 field sales and route operations is implemented at code/build level
- D13 import, migration, and customization is implemented at code/build level

So the main remaining parity gaps are no longer the entire D7-D12 tracks themselves. The biggest remaining gaps are:

- live provider-backed D11 integration
- D13 live workflow validation across migrations, print, and integrations
- retailer/customer self-ordering
- broader branch-oriented operating controls beyond the current warehouse model
- live staging proof and release readiness across the expanded scope

---

## 2. Product positioning target

After the work in this spec is complete, the product should be credibly sellable as:

- a distributor and wholesaler operating system for billing, stock, due control, GST, accounting, warehouse flow, and sales-team visibility
- a SaaS-native alternative to desktop-first trade software for India

It should be strong enough for:

- office-led distributors
- warehouse-led wholesalers
- companies with inside sales plus field sales reps
- companies with due follow-up, dispatch coordination, and multi-warehouse stock movement

It should still avoid claiming:

- full manufacturing ERP
- deep pharma-regulated workflow parity
- advanced enterprise supply-chain planning

---

## 3. Current capability baseline

### 3.1 Already implemented well enough to build on

- auth, refresh-session, forgot/reset-password
- onboarding and company bootstrap
- company settings and GST identity basics
- tenant RBAC, roles, users, permissions
- customers, suppliers, products, categories
- invoice lifecycle, payments, credit notes, returns, PDF generation
- purchase lifecycle, returns, bill attachments, supplier payments
- stock adjustments, stock movements, low-stock visibility
- quotations
- sales orders with partial fulfillment
- warehouses and stock transfers
- salesperson attribution on customers, quotations, sales orders, invoices, and payments
- distributor analytics for sales, dues, warehouse stock, and product movement
- GST reports and exports
- ledgers, journals, auto-posting, statements, period lock
- POS billing and receipt printing
- notifications, files, billing webhooks, jobs, queues
- super-admin auth, admin dashboard, company lifecycle, subscriptions, support, usage, internal users, audit logs

### 3.2 Partially implemented or not yet proven

- public/legal launch perimeter
- live staging validation
- full environment-backed e2e proof
- provider-integrated billing, storage, and notification proof
- broader regression coverage

### 3.3 Missing for Marg-like distribution parity

- live provider-backed e-invoice / e-way bill operations
- retailer / customer self-ordering surface
- live validation and operational hardening of the implemented D13 migration/integration surface
- branch-oriented operating controls beyond current warehouse scope

---

## 4. Capability map

| Capability family | Current state | Target state |
|---|---|---|
| Platform and release readiness | Strong but not fully live-validated | Production-proven |
| Identity, tenant setup, RBAC | Strong | Keep and harden |
| Masters and commercial setup | Strong baseline | Add distributor-grade pricing and terms |
| Sales lifecycle | Strong | Add dispatch/commercial depth |
| Purchases lifecycle | Strong | Add trade-operational depth |
| Inventory and warehouse control | Strong baseline | Add batch / expiry / clearance depth |
| Collections, credit, and banking | Partial | Distributor-grade control |
| GST and Indian trade compliance | Strong reports, lighter ops integration | Full operational compliance workflows |
| Field sales and order capture | Minimal | Full distribution-ready operating model |
| Delivery and dispatch | Partial | Full workflow |
| Reporting and analytics | Strong baseline | Deep operator dashboards |
| POS and counter billing | MVP-ready | Harden for trade counters |
| Customization, import, and integrations | Light | Migration and extensibility grade |
| Admin and SaaS operations | Strong | Keep and harden |

---

## 5. Capability specs

## 5.1 Platform and production readiness

### Goal

Move the product from "broadly implemented" to "production proven".

### Already present

- API build/typecheck passes
- web lint/build passes
- unit and Playwright coverage exists
- release-readiness checklist exists
- staging and QA plans exist

### Missing

- live staging environment evidence
- full seeded environment walkthroughs
- provider validation evidence
- operational runbooks and go/no-go signoff

### Scope

- staging deployment repeatability
- migration safety checks
- seeded QA dataset
- full manual and automated e2e against staging
- provider sandbox execution
- observability and incident checklist

### Definition of done

- staging app is live and reproducible
- all critical flows pass in a live environment
- no P0/P1 defects remain
- billing, storage, notifications, and queue flows are proven
- launch signoff document exists

---

## 5.2 Identity, tenant setup, and RBAC

### Goal

Keep the current SaaS-native identity foundation and make it distributor-safe under heavier operational usage.

### Current shipped capabilities

- login, logout, refresh, forgot/reset password
- onboarding
- company bootstrap
- role catalog and custom-role management
- user creation and assignment
- permission-aware UI access
- internal admin auth for `/admin/*`

### Full feature list for this capability

- tenant login and session lifecycle
- password reset and recovery
- onboarding with company creation
- company profile and GST identity
- multi-user team management
- role creation and permission assignment
- salesperson role
- admin-side operator roles
- audit trail for sensitive changes

### Gaps

- stronger route-level protection hardening across full reloads and deep links
- optional approval workflows for high-risk actions
- stricter separation between internal admin roles and tenant roles
- bulk user onboarding/import

### Definition of done

- all protected routes gate correctly
- all sensitive permission changes are audited
- user onboarding, deactivation, and reassignment are regression-covered
- permission matrix is documented and tested

---

## 5.3 Masters and commercial setup

### Goal

Turn current masters into distributor-grade commercial control masters.

### Current shipped capabilities

- customers
- suppliers
- products
- categories
- barcode field support in contracts
- customer salesperson assignment
- credit limit baseline in specs/contracts

### Full feature list for this capability

- customer master
- supplier master
- product master
- category / brand / product grouping
- barcode and SKU identity
- HSN and GST defaults
- customer credit profile
- payment terms
- route / beat / territory assignment
- salesperson assignment
- warehouse preference
- party category / channel / outlet type
- price list and commercial eligibility

### Missing or weak areas

- party-wise pricing model
- customer-class / channel pricing rules
- route / beat / territory fields
- customer payment-term templates
- outlet segmentation for distributor selling
- alternate item / substitute mapping
- product packing hierarchy and bundle logic

### Data-model additions

- `customer_channels`
- `customer_groups`
- `customer_payment_terms`
- `price_lists`
- `price_list_items`
- `party_special_rates`
- `routes`
- `beats`
- `territories`
- `product_substitutes`
- `product_packings`

### API surface target

- CRUD for price lists and party special rates
- CRUD for routes / beats / territories
- bulk customer classification update
- bulk product commercial update

### UI target

- customer commercial tab
- product pricing tab
- route and beat master pages
- price-list workbench
- customer-segment filters across sales screens

### Definition of done

- users can define reusable commercial rules
- invoice and order screens can resolve the correct customer-specific rate
- route/beat assignment is visible on customer and salesperson workflows

---

## 5.4 Sales lifecycle and commercial flow

### Goal

Make sales operations as strong as a distribution desk, not just an invoicing screen.

### Current shipped capabilities

- quotations
- sales orders
- invoice draft / issue / cancel
- payments
- credit notes
- sales returns
- invoice sharing
- PDF generation
- salesperson attribution
- warehouse-aware invoice creation

### Full feature list for this capability

- quotation create / send / expire / convert
- sales order create / confirm / partially fulfill / fulfill / cancel
- invoice draft / issue / cancel
- sales return and credit note
- invoice PDF and sharing
- invoice series and numbering
- salesperson attribution
- warehouse-aware issue flow
- outstanding and receivable visibility
- expected dispatch date

### Missing or weak areas

- delivery challan as a first-class workflow
- dispatch planning against order lines
- staged dispatch to invoice mapping
- approval workflow for discount-heavy or over-credit invoices
- commercial rule engine for automatic schemes and customer rates
- retail / wholesale mode switching within the same company policy engine

### Data-model additions

- `delivery_challans`
- `delivery_challan_items`
- `sales_approvals`
- `sales_scheme_applications`

### API surface target

- challan create / dispatch / close / convert to invoice
- invoice pre-check endpoint for pricing, credit, and stock warnings
- approval request / approve / reject

### UI target

- sales desk with quote -> order -> challan -> invoice visibility
- line-level fulfillment and dispatch progress
- operator warnings for over-credit, low margin, low stock, expired price rules

### Definition of done

- a distributor can capture demand, dispatch partially, invoice correctly, and trace the chain end to end
- high-risk commercial deviations are visible and optionally approval-gated

---

## 5.5 Pricing, scheme, and discount engine

### Goal

Close one of the largest distribution gaps versus Marg.

### Why this matters

Distributors often compete on negotiated rates, schemes, slab discounts, free quantity, channel-specific pricing, and temporary promotions. Without this, the product will feel too generic in demos.

### Full feature list for this capability

- customer-specific rates
- group / channel-specific rates
- product-wise special rates
- date-bound promotions
- slab discount rules
- buy-X-get-Y/free quantity rules
- invoice-line and order-line scheme application
- operator override with audit
- margin guardrails and discount ceilings
- scheme performance reporting

### Current state

- only basic line discount patterns are visible
- no scheme engine
- no party-specific commercial automation

### Data-model additions

- `commercial_schemes`
- `commercial_scheme_rules`
- `commercial_scheme_targets`
- `commercial_scheme_applications`
- `discount_policies`
- `margin_guardrails`

### API surface target

- scheme CRUD
- dry-run pricing resolution
- applied-scheme breakdown endpoint
- discount override audit endpoint

### UI target

- commercial scheme workbench
- resolved-pricing drawer in quotation/order/invoice forms
- operator explanation banner showing why a rate or discount was applied

### Reports

- scheme utilization
- discount leakage
- margin-at-risk report
- sales by customer class and scheme

### Definition of done

- the system can deterministically resolve the final commercial rate for a customer and document line
- every override is auditable
- operators do not need manual spreadsheets to manage trade schemes

---

## 5.6 Purchases and supplier operations

### Goal

Keep purchases strong for distributor replenishment, bill control, and return workflows.

### Current shipped capabilities

- purchase draft / receive / cancel
- purchase returns
- bill upload/download
- supplier payments
- warehouse-aware purchase flow

### Full feature list for this capability

- purchase draft and receive
- purchase returns
- supplier payment recording
- bill attachment storage
- warehouse-aware receiving
- cost and stock intake
- payable visibility
- supplier ledger
- supplier commercial terms
- inward stock validation

### Missing or weak areas

- purchase-order workflow if needed for larger distributor operations
- supplier scheme / free-item handling
- inward discrepancy handling
- landed-cost allocation workflow
- purchase import tooling

### Data-model additions

- `purchase_orders`
- `purchase_order_items`
- `goods_receipt_notes`
- `landed_cost_allocations`

### Definition of done

- purchase planning, receipt, discrepancy recording, and payable visibility work cleanly for normal distributor volume

---

## 5.7 Inventory, warehouse, batch, and stock control

### Goal

Move from baseline stock control to trade-grade inventory control.

### Current shipped capabilities

- stock movements
- stock adjustments
- low-stock view
- warehouses
- warehouse stock balances
- stock transfers
- warehouse-aware invoices and purchases
- stock by warehouse reporting

### Full feature list for this capability

- company stock summary
- warehouse stock summary
- transfer request / dispatch / receive
- stock adjustments
- movement history
- low-stock visibility
- reorder level
- stock value by warehouse
- fast/slow-moving views
- batch tracking
- expiry-date tracking
- near-expiry and expired stock reports
- stock clearance workflows
- shortage and damage recording
- replacement and return stock treatment

### Current biggest gap

Batch / expiry / near-expiry handling is not yet first-class in the current implemented product and is a major parity gap for FMCG, pharma, and stockist demos.

### Data-model additions

- `product_batches`
- `warehouse_batch_stocks`
- `inventory_adjustment_reasons`
- `stock_clearance_programs`
- `near_expiry_actions`

### API surface target

- batch-aware receipt
- batch-aware sale issue selection
- near-expiry and expired-stock reports
- batch transfer support
- stock-clearance tagging and reporting

### UI target

- batch picker in purchase and sales flows
- expiry alerts on sales desk
- near-expiry workspace
- stock clearance action list

### Definition of done

- stock can be traced by warehouse and batch where required
- the system can prevent or warn against issuing expired inventory
- near-expiry stock can be surfaced for liquidation actions

---

## 5.8 Collections, credit control, banking, and cheque operations

### Goal

Upgrade from payment recording to distributor-grade due control.

### Current shipped capabilities

- invoice payments
- purchase payments
- outstanding reports
- customer ledgers
- supplier ledgers
- cash book and bank book

### Full feature list for this capability

- receivable and payable aging
- customer credit limit
- payment follow-up
- collection performance by salesperson
- payment reminders
- bank-entry recording
- cheque and PDC tracking
- bank reconciliation
- bounced instrument handling
- customer account freeze / hold
- interest or overdue-charge reporting where applicable

### Missing or weak areas

- no strong bank reconciliation workflow
- no cheque/PDC lifecycle
- no collection call/task workflow
- no temporary credit-expansion approval flow

### Data-model additions

- `bank_accounts`
- `bank_statement_imports`
- `bank_statement_lines`
- `bank_reconciliation_matches`
- `payment_instruments`
- `collection_tasks`
- `credit_override_requests`

### API surface target

- import bank statement
- match and reconcile payments
- create cheque/PDC record
- mark deposit / clear / bounce
- create collection follow-up task

### UI target

- credit-control dashboard
- bank reconciliation workspace
- cheque register
- collections taskboard

### Reports

- overdue aging
- collection efficiency by rep
- credit-limit breach report
- unreconciled bank-entry report

### Definition of done

- finance teams can control dues, reconcile banks, and manage cheque-heavy collections without leaving the product

---

## 5.9 GST and Indian trade compliance operations

### Goal

Preserve current GST strength and add the trade-operational integrations buyers expect.

### Current shipped capabilities

- GSTR-1
- GSTR-3B
- HSN summary
- ITC report
- GST exports
- GSTIN-aware company and party fields

### Full feature list for this capability

- GST-compliant sales and purchase tax treatment
- GST reports and exports
- GSTIN validation support
- e-invoice generation
- IRN / acknowledgement storage
- e-way bill generation
- cancellation / amendment handling
- portal-status visibility
- tax exception and error audit

### Missing or weak areas

- no clearly implemented e-invoice workflow
- no clearly implemented e-way bill workflow
- no operational reconciliation between generated compliance documents and business documents

### Data-model additions

- `e_invoices`
- `e_invoice_events`
- `e_way_bills`
- `gst_exception_logs`

### API surface target

- generate e-invoice
- cancel e-invoice
- generate e-way bill
- cancel e-way bill
- sync compliance status

### UI target

- invoice detail compliance panel
- compliance job status list
- GST exception workspace

### Definition of done

- users can create, track, and correct core GST operational documents from the app with auditable status history

---

## 5.10 Field sales, route, beat, and assisted order capture

### Goal

Close the largest operational gap between the current product and serious distribution software.

### Current shipped capabilities

- salesperson role
- customer assignment
- salesperson attribution on documents and payments
- rep-wise reports

### Explicit current out-of-scope areas

- route planning
- beat management
- GPS / attendance tracking
- strict salesperson worklists

### Full feature list for this capability

- salesperson master
- route / beat / territory assignment
- daily worklist
- customer visit planning
- order capture on behalf of customer
- collection update capture
- field note / visit note
- DCR-style daily summary
- optional geotag / attendance events
- manager visibility by rep and route

### Data-model additions

- `sales_routes`
- `sales_beats`
- `sales_visit_plans`
- `sales_visits`
- `sales_visit_outcomes`
- `field_orders`
- `field_collection_updates`
- `rep_daily_reports`

### API surface target

- get today route plan
- mark visit start/end
- create field order
- record collection promise / follow-up
- submit DCR

### UI target

- mobile-first rep workspace
- owner/manager route dashboard
- route-wise outstanding and order coverage

### Definition of done

- a rep can follow a route, capture orders and follow-ups, and management can see execution quality

---

## 5.11 Delivery and dispatch operations

### Goal

Give warehouse and operations teams a first-class dispatch layer.

### Current shipped capabilities

- expected dispatch date on sales orders
- partial sales-order fulfillment
- warehouse stock transfers

### Missing

- delivery challan workflow
- dispatch assignment and loading
- proof of delivery trail
- delivery-status visibility
- invoice generation from delivered quantities

### Full feature list for this capability

- delivery challan
- dispatch queue
- pick/pack confirmation
- vehicle or transporter capture
- invoice against dispatch
- delivery status and closure
- short supply and damage notes
- reverse logistics / return pickup notes

### Data-model additions

- `dispatch_batches`
- `delivery_challans`
- `delivery_assignments`
- `proof_of_delivery_events`

### UI target

- dispatch board
- challan detail workspace
- pending dispatch by route / warehouse / customer

### Definition of done

- operations can move from order to dispatch to invoice without manual shadow tracking

---

## 5.12 Reporting and analytics

### Goal

Keep the current reporting work and deepen it for distributor decision-making.

### Current shipped capabilities

- business reports
- GST reports
- accounting reports
- outstanding reports
- distributor dashboard
- sales by salesperson
- collections by salesperson
- outstanding by customer and salesperson
- stock by warehouse
- fast/slow-moving product views

### Full feature list for this capability

- owner business dashboard
- distributor operations dashboard
- receivable aging
- route / beat performance
- scheme utilization
- margin leakage
- warehouse aging and near-expiry
- customer profitability
- sales vs collections by rep
- branch / territory dashboards when those models exist

### Missing or weak areas

- route/beat analytics
- scheme and margin analytics
- dispatch efficiency analytics
- reconciliation and exception dashboards

### Definition of done

- each new operational capability in this spec has a matching report surface and operator dashboard

---

## 5.13 POS and counter operations

### Goal

Harden the current POS to be usable in distributor counters and retail-like environments.

### Current shipped capabilities

- POS billing
- receipt route and printing
- barcode-first intent in docs

### Missing or weak areas

- stronger barcode workflow proof
- cashier shift controls
- cash reconciliation
- device-peripheral support strategy
- touch-optimized operator mode beyond baseline

### Definition of done

- billing counters can operate quickly with clean print flows and end-of-day controls

---

## 5.14 Customization, import, migration, and integrations

### Goal

Reduce switching friction from legacy desktop tools.

### Full feature list for this capability

- CSV import for customers, suppliers, products, opening stock
- invoice and purchase import templates
- opening balance import
- old-software migration helper
- custom print-template management
- custom field extension strategy
- outbound export feeds
- partner API / webhook integration layer

### Current state

- no strong end-user migration or customization toolkit is visible yet

### Definition of done

- a real business can migrate core masters and opening balances with guided tools
- common custom-print demands can be handled without code changes

---

## 5.15 Admin and SaaS operations

### Goal

Preserve and harden the current product advantage.

### Current shipped capabilities

- internal admin auth
- admin dashboard
- company lifecycle actions
- subscription operations
- usage and support views
- queue metrics
- internal admin management
- audit logs

### Full feature list for this capability

- tenant provisioning and lifecycle
- subscription oversight
- support and incident handling
- queue and webhook observability
- internal admin governance
- audit history
- storage and notification visibility
- launch and billing controls

### Follow-up enhancements

- impersonation
- provider-operation drilldowns
- deeper cohort and revenue analytics

### Definition of done

- internal operators can support, govern, and troubleshoot live customer accounts safely

---

## 6. Release-critical gap list

These are the most important gaps to close if the target is "similar to Marg Distribution if not less":

1. pricing, scheme, and discount engine
2. batch / expiry / near-expiry inventory
3. collections, bank reconciliation, cheque/PDC workflows
4. e-invoice and e-way bill operations
5. field-sales route / beat / assisted order capture
6. dispatch and delivery challan workflow
7. import and migration tooling
8. live environment validation and provider proof

---

## 7. Recommended execution order

### Wave 0: Production proof and release perimeter

- staging deployment validation
- full environment e2e
- provider validation
- public/legal finalization

### Wave 1: Distributor commercial core

- pricing engine
- special rates
- scheme engine
- credit-control foundations

### Wave 2: Inventory depth

- batch and expiry
- stock clearance
- discrepancy handling

### Wave 3: Collections and banking

- cheque/PDC
- bank reconciliation
- collection tasking

### Wave 4: Dispatch and compliance

- delivery challan
- dispatch board
- e-invoice
- e-way bill

### Wave 5: Field-sales motion

- route and beat model
- rep worklists
- mobile-first field order capture
- DCR and visit reporting

### Wave 6: Migration and extensibility

- import toolkits
- custom print/template system
- custom field strategy

---

## 8. Definition of "100% ready for distribution launch"

This product should only be considered fully ready for a Marg-style distributor motion when:

- all current critical business flows are proven in a live environment
- pricing, schemes, and credit rules are operationally reliable
- stock can be controlled by warehouse and batch where needed
- field reps can be assigned work and management can measure execution
- dispatch and challan workflows connect cleanly to invoice and collection flows
- GST operational integrations are auditable
- finance teams can reconcile banks and cheque-heavy receipts
- migration into the system is practical for real businesses
- support and internal admin operations are ready for production accounts

---

## 9. Next-step document plan

This master spec should drive the next level of detailed implementation docs:

1. `D7_PRICING_AND_SCHEME_ENGINE_SPEC.md`
2. `D8_BATCH_EXPIRY_AND_CLEARANCE_SPEC.md`
3. `D9_COLLECTIONS_BANKING_AND_CREDIT_CONTROL_SPEC.md`
4. `D10_DISPATCH_DELIVERY_AND_CHALLAN_SPEC.md`
5. `D11_EINVOICE_AND_EWAY_BILL_SPEC.md`
6. `D12_FIELD_SALES_AND_ROUTE_OPERATIONS_SPEC.md`
7. `D13_IMPORT_MIGRATION_AND_CUSTOMIZATION_SPEC.md`
8. `D14_LIVE_RELEASE_VALIDATION_SPEC.md`

Each of those documents should follow the repo's normal pattern:

- goal
- scope
- business rules
- schema impact
- API surface
- frontend routes and workflows
- reports
- permissions
- test plan
- acceptance criteria
