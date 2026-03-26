# V2 Distributor Execution Master Plan

Source:

- `docs/V2_DISTRIBUTOR_WHOLESALER_READINESS_PLAN.md`

## Goal

Turn the current GST Billing product into a stronger distributor / wholesaler-ready V2 without forking the product into a separate repository.

## D1

### Quotations / estimates

Scope:

- quotation entity and lifecycle
- quotation list and detail
- quotation to invoice conversion

Acceptance criteria:

- quotation workflow is usable end to end

## D2

### Sales orders

Scope:

- sales order entity and lifecycle
- quotation to sales order conversion
- sales order to invoice conversion
- partial fulfillment support

Acceptance criteria:

- order capture is separated from invoice issue

## D3

### Warehouses / godowns and transfers

Scope:

- warehouse master
- stock by location
- transfer workflow
- location-aware transaction context

Acceptance criteria:

- stock movement across locations is visible and correct

## D4

### Sales staff model

Scope:

- salesperson attribution
- customer assignment
- document and collection attribution
- rep-wise reporting baseline

Acceptance criteria:

- owner can track sales and dues by rep

## D5

### Distributor analytics

Scope:

- outstanding by customer and rep
- sales by rep
- stock by warehouse
- fast / slow movement
- owner dashboard enrichments

Acceptance criteria:

- owner dashboards reflect distributor operations, not only generic billing

## D6

### QA, packaging, and pilot proof

Scope:

- seeded distributor demo data
- manual QA and automation for V2 flows
- GTM copy and demo structure
- staging validation and pilot readiness

Acceptance criteria:

- V2 can be demoed and piloted as a distributor product

## Recommended order

1. D1 quotations
2. D2 sales orders
3. D3 warehouses / transfers
4. D4 sales staff
5. D5 analytics
6. D6 QA + pilot packaging

## Repo strategy

- stay in the current repo
- do not split into a separate repo at this stage

## Current status

- D1: Completed
- D2: Completed
- D3: Completed
- D4: Completed
- D5: Completed
- D6: Completed

Current D1 definition docs:

- `docs/D1_QUOTATIONS_IMPLEMENTATION_SPEC.md`
- `docs/D2_SALES_ORDERS_IMPLEMENTATION_SPEC.md`
- `docs/D3_WAREHOUSES_AND_TRANSFERS_IMPLEMENTATION_SPEC.md`
- `docs/D4_SALES_STAFF_MODEL_IMPLEMENTATION_SPEC.md`
- `docs/D5_DISTRIBUTOR_ANALYTICS_IMPLEMENTATION_SPEC.md`

D1 delivered:

- Prisma schema and SQL migration for `quotations`, `quotation_items`, and `invoices.quotation_id`
- tenant quotation API for list, detail, create, update, status transitions, and invoice conversion
- tenant quotation workspace under `/sales/quotations`
- quotation-to-invoice draft conversion with source traceability
- backend e2e coverage in `apps/api/test/quotations.e2e-spec.ts`

D2 delivered:

- Prisma schema and SQL migration for `sales_orders`, `sales_order_items`, `invoices.sales_order_id`, and `invoice_items.sales_order_item_id`
- tenant sales-order API for list, detail, create, update, confirm, cancel, and invoice conversion
- quotation-to-sales-order conversion
- tenant sales-order workspace under `/sales/orders`
- partial fulfillment tracking across multiple invoice drafts
- backend e2e coverage in `apps/api/test/sales-orders.e2e-spec.ts`

D3 delivered:

- Prisma schema and SQL migration for `warehouses`, `warehouse_stocks`, `stock_transfers`, and `stock_transfer_items`
- warehouse-aware extensions on `purchases`, `invoices`, and `stock_movements`
- tenant warehouse and transfer APIs under the inventory domain
- tenant inventory workspaces under `/inventory/warehouses` and `/inventory/transfers`
- warehouse selectors on purchase and invoice draft creation
- backend e2e coverage in `apps/api/test/warehouses-transfers.e2e-spec.ts`

D4 definition docs:

- `docs/D4_SALES_STAFF_MODEL_IMPLEMENTATION_SPEC.md`

D4 delivered:

- built-in `salesperson` role in tenant RBAC
- assignable salesperson list API under `/users/salespeople`
- customer-level primary salesperson assignment
- quotation, sales-order, invoice, and payment attribution
- distributor report endpoints for sales, collections, and outstanding by salesperson
- tenant customer pages updated with salesperson assignment
- tenant quotation, sales-order, and invoice create pages updated with salesperson selection
- distributor sales-team report under `/reports/distributor/sales-team`
- backend e2e coverage in `apps/api/test/sales-staff-model.e2e-spec.ts`

D5 definition docs:

- `docs/D5_DISTRIBUTOR_ANALYTICS_IMPLEMENTATION_SPEC.md`

D5 delivered:

- distributor analytics endpoints for customer outstanding, warehouse stock, product movement, and owner dashboard aggregation
- tenant dashboard enrichment with dues, collections, stock value, warehouse snapshot, and movement signals
- owner-facing distributor analytics workspace under `/reports/distributor/analytics`
- reports hub linking for both sales-team and distributor analytics views
- backend e2e coverage in `apps/api/test/distributor-analytics.e2e-spec.ts`

D6 definition docs:

- `docs/D6_QA_PACKAGING_AND_PILOT_PROOF.md`

D6 delivered:

- distributor demo seed under `apps/api/src/seed/distributor.seed.ts`
- package script `npm --workspace apps/api run seed:distributor`
- distributor V2 Playwright smoke in `apps/web/tests/distributor-v2.spec.ts`
- distributor QA/demo additions in `docs/SEEDING.md`, `docs/TESTING.md`, and `docs/E2E_MANUAL_TEST_PLAN.md`
- pilot/demo packaging baseline for controlled distributor walkthroughs
