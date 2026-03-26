# V2 Distributor Schema Change Specification

**Date**: 2026-03-24  
**Purpose**: Define the likely schema additions and model extensions required for distributor / wholesaler readiness V2.

This is a product-definition spec, not a final migration script.

Source:

- [DOMAIN_MODEL.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/DOMAIN_MODEL.md)
- [V2_DISTRIBUTOR_WHOLESALER_READINESS_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_WHOLESALER_READINESS_PLAN.md)

---

## Design principles

- extend the current multi-tenant company model
- reuse existing customer, product, invoice, payment, stock, and accounting domains
- avoid duplicating the invoice model when pre-invoice workflow needs its own lifecycle
- keep warehouse and salesperson concerns company-scoped

---

## New entities

## 1. Quotation

Purpose:

- pre-invoice commercial document

Suggested fields:

- `id`
- `company_id`
- `customer_id`
- `salesperson_user_id` nullable
- `quote_number`
- `status`
- `quote_date`
- `valid_until`
- `sub_total`
- `tax_total`
- `discount_total`
- `grand_total`
- `notes`
- `source_type` nullable
- `source_id` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

Suggested statuses:

- `draft`
- `sent`
- `approved`
- `expired`
- `converted`
- `canceled`

## 2. QuotationItem

Purpose:

- line items for quotation

Suggested fields:

- `id`
- `quotation_id`
- `product_id`
- `description`
- `hsn_code`
- `quantity`
- `unit_price`
- `discount_amount`
- `tax_rate`
- `taxable_value`
- `cgst_amount`
- `sgst_amount`
- `igst_amount`
- `line_total`

## 3. SalesOrder

Purpose:

- order capture before billing

Suggested fields:

- `id`
- `company_id`
- `customer_id`
- `quotation_id` nullable
- `salesperson_user_id` nullable
- `warehouse_id` nullable
- `order_number`
- `status`
- `order_date`
- `expected_dispatch_date` nullable
- `sub_total`
- `tax_total`
- `grand_total`
- `notes`
- `created_by_user_id`
- `created_at`
- `updated_at`

Suggested statuses:

- `draft`
- `confirmed`
- `partially_fulfilled`
- `fulfilled`
- `canceled`

## 4. SalesOrderItem

Purpose:

- ordered items and fulfillment tracking

Suggested fields:

- `id`
- `sales_order_id`
- `product_id`
- `description`
- `quantity_ordered`
- `quantity_fulfilled`
- `unit_price`
- `tax_rate`
- `taxable_value`
- `line_total`

## 5. Warehouse

Purpose:

- company-scoped godown / warehouse master

Suggested fields:

- `id`
- `company_id`
- `name`
- `code`
- `location_label` nullable
- `is_default`
- `is_active`
- `created_at`
- `updated_at`

## 6. StockTransfer

Purpose:

- movement between warehouses

Suggested fields:

- `id`
- `company_id`
- `from_warehouse_id`
- `to_warehouse_id`
- `status`
- `transfer_number`
- `transfer_date`
- `notes`
- `requested_by_user_id`
- `received_by_user_id` nullable
- `created_at`
- `updated_at`

Suggested statuses:

- `draft`
- `requested`
- `in_transit`
- `received`
- `canceled`

## 7. StockTransferItem

Purpose:

- items moved across locations

Suggested fields:

- `id`
- `stock_transfer_id`
- `product_id`
- `quantity`

## 8. CustomerSalespersonAssignment

Purpose:

- map customers to salespeople

Suggested fields:

- `id`
- `company_id`
- `customer_id`
- `user_id`
- `is_primary`
- `created_at`

---

## Existing entities to extend

## Product

Likely additions:

- optional default warehouse context if needed later
- no mandatory structural change for V2.1 / V2.2

## StockMovement

Likely additions:

- `warehouse_id`
- `movement_type` expansion for transfers
- `source_type` / `source_id` support for stock transfer traceability if not already sufficient

## Invoice

Likely additions:

- `sales_order_id` nullable
- `warehouse_id` nullable
- `salesperson_user_id` nullable

## Purchase

Likely additions:

- `warehouse_id` nullable

## Payment

Likely additions:

- optional attribution fields if payment needs salesperson traceability

## Customer

Implemented in D4:

- `salesperson_user_id` nullable
- current D4 uses direct customer-to-user primary assignment instead of a separate mapping table

---

## Reporting and query implications

New reporting slices will need query support for:

- quotation conversion rate
- order fulfillment rate
- outstanding by salesperson
- sales by salesperson
- stock by warehouse
- transfer history
- warehouse movement velocity

---

## Accounting implications

No separate accounting model should be created for quotations or sales orders.

Recommended treatment:

- quotation: no accounting posting
- sales order: no accounting posting
- invoice issue: accounting posting remains the trigger
- stock transfer: no revenue posting, inventory movement only

---

## Migration strategy recommendation

Recommended rollout:

1. add quotation tables
2. add sales order tables
3. add warehouse tables
4. extend stock movement and invoice / purchase references
5. add assignment mapping tables

This minimizes disruption and keeps each migration set bounded.
