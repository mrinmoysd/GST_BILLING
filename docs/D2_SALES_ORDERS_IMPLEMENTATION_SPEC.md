# D2 Sales Orders Implementation Specification

**Date**: 2026-03-25  
**Purpose**: Record the implementation-ready and implemented scope for distributor V2 Phase D2.  
**Implementation status**: Completed on 2026-03-25

Source:

- [V2_DISTRIBUTOR_EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/V2_DISTRIBUTOR_EXECUTION_MASTER_PLAN.md)
- [V2_DISTRIBUTOR_USER_STORIES.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_USER_STORIES.md)
- [V2_DISTRIBUTOR_SCHEMA_CHANGE_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_SCHEMA_CHANGE_SPEC.md)
- [V2_DISTRIBUTOR_USER_FLOW_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_USER_FLOW_SPEC.md)

## D2 goal

Introduce a real sales-order workflow between quotation and invoice so users can:

- capture order demand before invoice issue
- confirm commercial intent before billing
- partially fulfill order quantities
- convert quotation to sales order
- convert one sales order into one or more invoice drafts

## Implemented scope

- `sales_orders` and `sales_order_items` storage
- sales order numbering with `SO-{n}`
- direct sales order create, list, detail, update, confirm, cancel
- quotation to sales order conversion
- sales order to invoice conversion
- partial fulfillment tracking through `quantity_fulfilled`
- invoice traceability through `invoices.sales_order_id`
- invoice-item traceability through `invoice_items.sales_order_item_id`
- fulfillment reversal on invoice cancellation
- backend e2e coverage for the core D2 workflow

## Business rules

Canonical sales-order statuses:

- `draft`
- `confirmed`
- `partially_fulfilled`
- `fulfilled`
- `cancelled`

Rules:

- only `draft` sales orders are editable
- only `confirmed` and `partially_fulfilled` orders can be converted to invoice
- conversion can be partial by item quantity
- a fully fulfilled order moves to `fulfilled`
- cancelling an issued invoice created from a sales order restores fulfilled quantity to the source order

## API surface

- `GET /api/companies/:cid/sales-orders`
- `POST /api/companies/:cid/sales-orders`
- `GET /api/companies/:cid/sales-orders/:salesOrderId`
- `PATCH /api/companies/:cid/sales-orders/:salesOrderId`
- `POST /api/companies/:cid/sales-orders/:salesOrderId/confirm`
- `POST /api/companies/:cid/sales-orders/:salesOrderId/cancel`
- `POST /api/companies/:cid/sales-orders/:salesOrderId/convert-to-invoice`
- `POST /api/companies/:cid/quotations/:quotationId/convert-to-sales-order`

## Frontend routes

- `/c/[companyId]/sales/orders`
- `/c/[companyId]/sales/orders/new`
- `/c/[companyId]/sales/orders/[salesOrderId]`

## Verification

Validated in:

- [sales-orders.e2e-spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/sales-orders.e2e-spec.ts)

Verified scenarios:

- direct sales-order capture
- order confirmation
- partial order fulfillment into invoice draft
- full fulfillment over multiple invoice conversions
- quotation to sales-order conversion
