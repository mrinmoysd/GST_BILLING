# D10 Dispatch, Delivery, and Challan Specification

**Date**: 2026-03-26  
**Purpose**: Define the implementation-ready scope for dispatch operations, delivery challans, pick/pack flow, and invoice generation tied to actual fulfillment.  
**Implementation status**: Implemented at code/build level; staging dispatch walkthroughs and live regression evidence are still pending

Source:

- [MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md)
- [MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)
- [D2_SALES_ORDERS_IMPLEMENTATION_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D2_SALES_ORDERS_IMPLEMENTATION_SPEC.md)
- [D3_WAREHOUSES_AND_TRANSFERS_IMPLEMENTATION_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D3_WAREHOUSES_AND_TRANSFERS_IMPLEMENTATION_SPEC.md)
- [V2_DISTRIBUTOR_USER_FLOW_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_USER_FLOW_SPEC.md)
- [V2_DISTRIBUTOR_USER_STORIES.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_USER_STORIES.md)
- [API_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/API_SPEC.md)

Current implementation anchors:

- quotations exist
- sales orders exist with partial fulfillment
- invoices exist and can be created from sales orders
- warehouses and transfers exist
- expected dispatch date exists on sales orders

---

## D10 goal

Add a true dispatch and delivery layer between order capture and invoicing so the product can:

- manage pending dispatch work explicitly
- create delivery challans
- pick and pack stock against warehouse availability
- track dispatched vs delivered vs short-supplied quantities
- generate invoices from delivered or dispatch-approved quantities

D10 should close the current operational gap where sales orders exist but dispatch execution is still implicit rather than first-class.

---

## Why D10 matters

Serious distributors usually do not move directly from:

- order
- to invoice

They operate through:

- dispatch planning
- warehouse picking
- delivery challan
- delivered / pending / short-supply visibility

Without D10, the product can record demand and issue invoices, but warehouse and operations teams still lack a real dispatch workspace.

---

## Scope

Included in D10:

- dispatch queue and dispatch board
- delivery challan document
- challan numbering
- sales-order line allocation into challans
- partial dispatch support
- pick/pack status progression
- transporter and vehicle details
- dispatch date and delivery date tracking
- short-supply and non-delivered quantity recording
- invoice generation from challan or delivered quantities
- challan print / PDF
- dispatch lifecycle audit trail

Included operating outputs:

- pending dispatch list
- challan register
- dispatch status board
- partially dispatched orders list
- delivered-not-invoiced list

Not included in D10:

- GPS delivery tracking
- live route optimization
- proof-of-delivery image uploads in first release
- reverse logistics planning engine
- automated transporter marketplace integration

Planned result after D10:

- the warehouse and operations side of the distributor workflow becomes explicit, traceable, and measurable

---

## Business outcomes

After D10, the product should let a business:

- move from sales order to dispatch in a controlled way
- prepare one or more challans for a single order
- dispatch partial quantities
- distinguish between ordered, dispatched, delivered, and invoiced quantities
- generate invoices from what actually moved or was delivered

---

## Design principles

1. Do not replace sales orders.
   Dispatch belongs between order and invoice, not instead of them.

2. Challan must be a first-class document.
   It should have its own identity, status, print layout, and traceability.

3. Fulfillment states must stay visible.
   The system should show ordered, picked, dispatched, delivered, and invoiced quantities separately where needed.

4. Warehouse context is mandatory.
   Dispatch without warehouse stock context is not meaningful in a distributor setup.

5. Invoiceing should preserve source traceability.
   Every invoice generated from a challan should retain line-level source references.

6. Partiality is normal.
   D10 must treat partial dispatch and staged invoicing as normal flows, not exceptions.

---

## Terms and concepts

### Dispatch queue

The operational list of orders ready or nearly ready for warehouse action.

### Delivery challan

A transport and movement document representing goods prepared or dispatched to a customer before or alongside invoicing.

### Pick

The warehouse action of reserving or gathering stock against a challan.

### Pack

The warehouse action of confirming dispatch-ready quantity and packaging completion.

### Short supply

The quantity ordered but not actually dispatched or delivered.

### Delivered-not-invoiced

Goods already moved or delivered but not yet converted into a final invoice.

---

## D10 feature set

## 1. Dispatch queue

The system should support a queue showing:

- confirmed sales orders
- partially fulfilled orders
- expected dispatch date
- warehouse
- customer
- pending quantity
- priority / urgency

## 2. Delivery challan

The system should support:

- challan create
- challan edit while draft
- challan numbering
- challan print / PDF
- challan status transitions

## 3. Pick / pack workflow

The system should support:

- draft challan
- picked
- packed
- dispatched
- delivered
- cancelled

Recommended first release may collapse `picked` and `packed` into a simpler lifecycle if needed, but the data model should allow both.

## 4. Line-level dispatch quantities

The system should support:

- full dispatch
- partial dispatch
- short-supply recording
- remaining order quantity visibility

## 5. Transport and handoff metadata

The system should support:

- transporter name
- vehicle number
- dispatch notes
- delivery notes
- dispatch date
- delivery date

## 6. Invoice from challan

The system should support:

- convert one challan into one invoice draft
- combine challans later if policy allows
- preserve source traceability from challan to invoice

Recommended first release:

- one challan -> one invoice

## 7. Dispatch reporting

The system should support:

- pending dispatch
- partially dispatched orders
- dispatched-not-delivered
- delivered-not-invoiced
- challan register

---

## Phase breakdown inside D10

### D10.1 Dispatch foundations

Deliver:

- dispatch queue
- delivery challan entity
- challan numbering
- challan draft workflow

### D10.2 Warehouse execution

Deliver:

- pick / pack state progression
- line-level dispatch quantities
- warehouse allocation checks

### D10.3 Invoice generation from dispatch

Deliver:

- challan to invoice conversion
- source traceability
- delivered-not-invoiced visibility

### D10.4 Reporting and operator tooling

Deliver:

- challan register
- dispatch dashboard
- pending and partially dispatched worklists

---

## Business rules

## 1. Sales-order eligibility

Only sales orders in these statuses should be eligible for challan creation:

- `confirmed`
- `partially_fulfilled`

Draft or cancelled sales orders cannot move into dispatch.

## 2. Challan statuses

Suggested statuses:

- `draft`
- `picked`
- `packed`
- `dispatched`
- `delivered`
- `cancelled`

Recommended first release if simpler flow is needed:

- `draft`
- `dispatched`
- `delivered`
- `cancelled`

## 3. Editable states

Allowed:

- `draft`
- optionally `picked` if warehouse policy allows

Not allowed:

- `dispatched`
- `delivered`
- `cancelled`

## 4. Quantity rules

For each sales-order item:

- dispatched quantity cannot exceed remaining unfulfilled quantity
- sum of challan-linked quantities plus invoice-linked fulfilled quantity must not exceed ordered quantity

## 5. Fulfillment state rules

Sales order remains:

- `confirmed` if no quantity fulfilled
- `partially_fulfilled` if some quantity is fulfilled by invoice conversion
- `fulfilled` only when all quantity is invoiced or otherwise closed by policy

D10 must distinguish:

- dispatch quantity
- invoice quantity

Recommended first release rule:

- sales-order `quantity_fulfilled` continues to represent invoiced quantity
- dispatch quantity is tracked separately on challan-linked lines

## 6. Stock reservation and issue strategy

Two models are possible:

1. reserve stock at pick/pack and deduct at dispatch
2. deduct stock only when invoice is issued

Recommended first release:

- do not permanently deduct stock at challan draft
- optionally reserve stock at picked/packed stage later
- deduct stock when invoice is issued, preserving current accounting and stock behavior

Reason:

- it fits the current invoice-driven stock engine
- it reduces accounting risk in the first dispatch release

Operational note:

- challan should still validate available warehouse stock before dispatch

## 7. Delivered-not-invoiced rule

If challan is delivered but not yet invoiced:

- it should appear in a dedicated action list
- invoice conversion should remain available

## 8. Cancellation rules

Cancelled challan:

- must release any reserved quantity if reservations are introduced
- must not affect invoiced quantities

## 9. Multi-challan order rule

One sales order may create:

- zero
- one
- many challans

Each challan may cover:

- all remaining lines
- selected lines
- partial quantities

## 10. Invoice conversion rule

Recommended first release:

- challan to invoice conversion uses challan quantities as the default invoice quantities
- source order and challan references are stored on invoice and invoice items

## 11. Print and compliance note

Challan print must be available as a business document output.

Operational GST/compliance implications should remain aligned with later D11 work.

---

## Data model

This section defines recommended schema additions. It is a product-definition spec, not the final migration script.

## 1. `delivery_challans`

Purpose:

- represent dispatch and delivery document

Suggested fields:

- `id`
- `company_id`
- `customer_id`
- `sales_order_id` nullable
- `warehouse_id`
- `challan_number`
- `status`
- `challan_date`
- `dispatch_date` nullable
- `delivery_date` nullable
- `expected_delivery_date` nullable
- `transporter_name` nullable
- `vehicle_number` nullable
- `notes` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

Suggested statuses:

- `draft`
- `picked`
- `packed`
- `dispatched`
- `delivered`
- `cancelled`

Recommended indexes:

- unique `(company_id, challan_number)`
- `(company_id, status, challan_date)`
- `(company_id, customer_id, challan_date)`
- `(company_id, sales_order_id)`

## 2. `delivery_challan_items`

Purpose:

- line-level dispatched quantity

Suggested fields:

- `id`
- `company_id`
- `delivery_challan_id`
- `sales_order_item_id` nullable
- `product_id`
- `quantity_requested`
- `quantity_dispatched`
- `quantity_delivered` nullable
- `quantity_short_supplied` default 0
- `unit_price_snapshot`
- `tax_rate_snapshot` nullable
- `notes` nullable
- `created_at`

Recommended first release:

- `quantity_requested` and `quantity_dispatched` mandatory
- `quantity_delivered` may equal dispatched unless delivery confirmation is used

## 3. Invoice extensions

Suggested additions to `invoices`:

- `delivery_challan_id` nullable

## 4. Invoice item extensions

Suggested additions to `invoice_items`:

- `delivery_challan_item_id` nullable

## 5. `delivery_challan_events`

Purpose:

- lifecycle history and operator audit

Suggested fields:

- `id`
- `company_id`
- `delivery_challan_id`
- `event_type`
- `summary`
- `payload` jsonb nullable
- `created_by_user_id` nullable
- `created_at`

Suggested `event_type` values:

- `challan.created`
- `challan.updated`
- `challan.picked`
- `challan.packed`
- `challan.dispatched`
- `challan.delivered`
- `challan.cancelled`
- `challan.converted_to_invoice`

## 6. Optional future table: `dispatch_batches`

Purpose:

- assign challans into larger dispatch runs or vehicle loads later

This table is not required in the first D10 release.

---

## API contract

All endpoints are company-scoped.

## Dispatch queue

### List dispatch queue

- `GET /api/companies/:cid/dispatch/queue?page=&limit=&status=&warehouse_id=&salesperson_user_id=&from=&to=`

Purpose:

- aggregate sales orders and challans into an operations-facing queue

## Delivery challans

### List challans

- `GET /api/companies/:cid/delivery-challans?page=&limit=&q=&status=&warehouse_id=&customer_id=&from=&to=`

### Create challan

- `POST /api/companies/:cid/delivery-challans`

Body:

- `customer_id`
- `sales_order_id?`
- `warehouse_id`
- `challan_date`
- `expected_delivery_date?`
- `transporter_name?`
- `vehicle_number?`
- `notes?`
- `items`: array of:
  - `sales_order_item_id?`
  - `product_id`
  - `quantity_requested`
  - `quantity_dispatched`
  - `notes?`

### Get challan detail

- `GET /api/companies/:cid/delivery-challans/:challanId`

### Update challan

- `PATCH /api/companies/:cid/delivery-challans/:challanId`

Allowed for editable states only.

## Challan actions

### Mark picked

- `POST /api/companies/:cid/delivery-challans/:challanId/pick`

### Mark packed

- `POST /api/companies/:cid/delivery-challans/:challanId/pack`

### Mark dispatched

- `POST /api/companies/:cid/delivery-challans/:challanId/dispatch`

Body optional:

- `dispatch_date?`
- `transporter_name?`
- `vehicle_number?`

### Mark delivered

- `POST /api/companies/:cid/delivery-challans/:challanId/deliver`

Body optional:

- `delivery_date?`
- `delivery_notes?`
- `items?` with delivered or short-supplied quantity if delivery confirmation differs

### Cancel challan

- `POST /api/companies/:cid/delivery-challans/:challanId/cancel`

## Convert challan to invoice

### Convert

- `POST /api/companies/:cid/delivery-challans/:challanId/convert-to-invoice`

Body:

- `invoice_date?`
- `due_date?`
- `notes?`

Response:

- created invoice draft

## Challan PDF / print

- `GET /api/companies/:cid/delivery-challans/:challanId/pdf`
- `POST /api/companies/:cid/delivery-challans/:challanId/pdf/regenerate`

## Reports

### Pending dispatch

- `GET /api/companies/:cid/reports/dispatch/pending?warehouse_id=&as_of=`

### Partially dispatched orders

- `GET /api/companies/:cid/reports/dispatch/partial-orders?warehouse_id=&as_of=`

### Delivered not invoiced

- `GET /api/companies/:cid/reports/dispatch/delivered-not-invoiced?warehouse_id=&as_of=`

### Challan register

- `GET /api/companies/:cid/reports/dispatch/challan-register?from=&to=&warehouse_id=&status=`

---

## Response shape suggestions

### Dispatch queue row

Suggested row fields:

- `sales_order_id`
- `order_number`
- `customer_id`
- `customer_name`
- `warehouse_id`
- `warehouse_name`
- `expected_dispatch_date`
- `pending_lines`
- `pending_quantity`
- `already_dispatched_quantity`
- `already_invoiced_quantity`
- `status`

### Challan detail

Suggested detail should include:

- challan header
- customer
- warehouse
- source sales order
- line items with requested/dispatched/delivered/short-supplied
- linked invoices
- lifecycle events

---

## Frontend routes and screens

Recommended route additions:

- `/c/[companyId]/dispatch`
- `/c/[companyId]/dispatch/queue`
- `/c/[companyId]/dispatch/challans`
- `/c/[companyId]/dispatch/challans/new`
- `/c/[companyId]/dispatch/challans/[challanId]`
- `/c/[companyId]/reports/dispatch/pending`
- `/c/[companyId]/reports/dispatch/delivered-not-invoiced`

Current-route extensions:

- `/c/[companyId]/sales/orders/[salesOrderId]`
- `/c/[companyId]/inventory/warehouses`
- `/c/[companyId]/sales/invoices/new`

## Screen requirements

### 1. Dispatch queue

Show:

- order number
- customer
- warehouse
- expected dispatch date
- pending quantity
- dispatch readiness
- quick create challan action

### 2. Challan create screen

Needs:

- choose sales order or direct customer context
- choose warehouse
- select quantities per line
- dispatch notes
- transporter and vehicle details

### 3. Challan detail screen

Needs:

- lifecycle actions
- line-level dispatched / delivered state
- print/PDF
- convert to invoice
- linked source order and generated invoices

### 4. Delivered-not-invoiced report

Show:

- challan
- customer
- delivery date
- pending invoice action

### 5. Order detail enhancement

Sales-order detail should show:

- created challans
- dispatched quantity
- delivered quantity
- still pending quantity

---

## UX behavior in operations

## Sales order to dispatch

From sales-order detail or dispatch queue:

1. operator selects remaining quantities
2. creates challan
3. challan becomes the operational document for warehouse action

## Warehouse execution

At challan detail:

1. mark picked
2. mark packed
3. mark dispatched
4. later mark delivered if needed

If simplified lifecycle is used:

1. create challan
2. mark dispatched
3. mark delivered

## Challan to invoice

When the business wants to bill:

1. open challan
2. convert to invoice
3. invoice draft inherits challan quantities and source references
4. invoice issue continues to use the existing stock/accounting pipeline unless D10 later introduces stock reservation logic

---

## Reporting requirements

## 1. Pending dispatch

Show:

- orders waiting for dispatch
- warehouse
- customer
- expected dispatch date
- pending quantity

## 2. Challan register

Show:

- challan number
- customer
- warehouse
- challan date
- dispatch date
- delivery date
- status
- linked invoice number if present

## 3. Delivered-not-invoiced

Show:

- challan
- delivered quantity
- invoice status
- days since delivery

## 4. Partial dispatch analysis

Show:

- sales orders with remaining open quantities after one or more challans

---

## Permissions

Suggested new permissions:

- `dispatch.queue.view`
- `dispatch.challan.view`
- `dispatch.challan.create`
- `dispatch.challan.edit`
- `dispatch.challan.dispatch`
- `dispatch.challan.deliver`
- `dispatch.challan.cancel`
- `dispatch.challan.convert_to_invoice`
- `dispatch.reports.view`

Suggested role usage:

- owner/admin: full access
- operations manager: queue, challans, delivery actions
- warehouse operator: pick/pack/dispatch
- billing operator: convert challan to invoice
- salesperson: view-only where needed

---

## Validation and test plan

## Unit tests

Need unit coverage for:

- challan status transitions
- quantity validation against sales-order remaining quantity
- invoice conversion quantity mapping

## Integration tests

Need integration or e2e coverage for:

- create challan from confirmed sales order
- partial dispatch over multiple challans
- convert challan to invoice
- prevent over-dispatch beyond remaining quantity
- delivered-not-invoiced reporting

## Browser tests

Need Playwright coverage for:

- dispatch queue load
- challan create flow
- challan lifecycle actions
- challan to invoice conversion

## Seed scenarios

Recommended seed cases:

1. one confirmed sales order with partial dispatch
2. one order split across two challans
3. one delivered challan not yet invoiced
4. one challan converted to invoice

---

## Migration and rollout strategy

## Initial rollout

D10 can be introduced without changing existing orders or invoices.

## Existing sales orders

Historical sales orders without challans remain valid.

## Existing invoice conversion

Current order-to-invoice conversion should remain available until challan-based workflows are fully adopted.

Recommended first rollout:

- keep direct sales-order-to-invoice conversion
- add challan flow as a stronger operational path

## Stock and accounting safety

Because current stock deduction and accounting happen on invoice issue:

- D10 first release should preserve that behavior
- avoid introducing dispatch-side accounting entries until the model is intentionally expanded

---

## Risks and implementation notes

1. Dispatch can easily overlap with inventory reservations.
   First release should avoid deep reservation complexity unless clearly needed.

2. Challan and invoice quantities can drift if source references are weak.
   Preserve line-level traceability strictly.

3. Delivery confirmation may not always be captured in real life.
   Support a practical default where dispatch implies delivered if needed for smaller operators.

4. Too many statuses can slow rollout.
   If needed, ship a reduced lifecycle first while keeping schema extensible.

---

## Acceptance criteria

D10 is complete when:

- sales orders can move into challans
- challans can represent partial dispatch cleanly
- challan lifecycle is visible and auditable
- challans can be converted into invoice drafts
- dispatch and delivered-not-invoiced reports exist
- current order and invoice flows continue to work

---

## Suggested implementation order

1. delivery challan schema and numbering
2. challan CRUD and lifecycle
3. sales-order detail integration
4. challan to invoice conversion
5. dispatch queue and reports
6. print/PDF polish

---

## Out-of-scope follow-up after D10

Once D10 is stable, later phases can extend into:

- proof of delivery capture
- vehicle load planning
- route-linked dispatch optimization
- stock reservation engine
- reverse logistics and return pickup workflows
