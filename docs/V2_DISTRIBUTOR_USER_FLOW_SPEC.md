# V2 Distributor User Flow Specification

**Date**: 2026-03-24  
**Purpose**: Define the end-to-end user flows for distributor / wholesaler readiness V2.

Source:

- [V2_DISTRIBUTOR_WHOLESALER_READINESS_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_WHOLESALER_READINESS_PLAN.md)
- [V2_DISTRIBUTOR_USER_STORIES.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_USER_STORIES.md)

---

## Flow 1: Quotation to invoice

Primary actor:

- billing operator or salesperson

Steps:

1. select customer
2. create quotation with items, quantities, pricing, validity, and notes
3. save quotation as draft
4. send or mark quotation as issued
5. customer approves quotation
6. operator converts quotation to invoice directly, or to sales order first

Expected system behavior:

- quotation numbering is unique within company
- item pricing and GST data carry forward into conversion
- conversion history is visible on both source and target document

---

## Flow 2: Quotation to sales order to invoice

Primary actor:

- salesperson, operations manager, billing operator

Steps:

1. create or select quotation
2. convert quotation into sales order
3. review order quantities and dispatch readiness
4. convert all or part of the order into invoice
5. repeat for partial fulfillment if needed

Expected system behavior:

- order stays open until fully fulfilled
- fulfilled quantity updates after invoice conversion
- pending quantity remains visible

---

## Flow 3: Direct sales order capture

Primary actor:

- salesperson or operations manager

Steps:

1. choose assigned customer
2. create sales order directly
3. save as draft or confirm
4. operations team reviews for dispatch
5. billing team converts to invoice

Expected system behavior:

- order can exist before invoice
- customer, salesperson, and warehouse context stay attached

---

## Flow 4: Warehouse-based stock receipt

Primary actor:

- purchase operator / warehouse operator

Steps:

1. create purchase
2. assign receiving warehouse
3. receive purchase
4. stock increases only in the selected warehouse

Expected system behavior:

- inventory by warehouse updates correctly
- global stock summary can still be derived from location stock

---

## Flow 5: Warehouse stock transfer

Primary actor:

- warehouse operator

Steps:

1. create transfer request from warehouse A to warehouse B
2. add products and quantities
3. mark transfer as in transit
4. receiving side marks transfer as received

Expected system behavior:

- stock decreases at source when transfer is dispatched or received based on chosen accounting model
- stock increases at destination only when received
- transfer history stays traceable

---

## Flow 6: Salesperson account ownership

Primary actor:

- owner or admin

Steps:

1. create or choose salesperson user
2. assign customer accounts
3. salesperson logs in
4. salesperson sees assigned customers and attributed commercial documents

Expected system behavior:

- owner/admin can still see all data
- salesperson views can be filtered by assignment

Current implementation note:

- D4 delivers customer assignment, document attribution, and owner reporting
- strict salesperson-only data visibility is still a later enhancement

---

## Flow 7: Salesperson follow-up and collections visibility

Primary actor:

- salesperson

Steps:

1. open outstanding view for assigned customers
2. review overdue invoices
3. coordinate payment with customer
4. accounts operator records payment
5. outstanding dashboard updates automatically

Expected system behavior:

- outstanding can be filtered by salesperson
- payment reduces due position for the right customer and invoice

---

## Flow 8: Owner review dashboard

Primary actor:

- owner

Steps:

1. open dashboard
2. review:
   - sales by salesperson
   - outstanding by salesperson
   - stock by warehouse
   - fast and slow moving products
3. drill into reports or operational lists

Expected system behavior:

- dashboard acts as the distributor operating summary, not only a generic billing dashboard
- owner can move from dashboard summary to dedicated distributor analytics views for customers, warehouses, and product movement

---

## Flow 9: Permission-aware distributor operations

Primary actor:

- owner/admin

Steps:

1. assign role permissions to billing, salesperson, warehouse, and admin staff
2. billing can create quotations and invoices
3. warehouse can manage transfers and receipt operations
4. salesperson can capture orders and see assigned accounts

Expected system behavior:

- access is constrained by role
- sensitive actions remain auditable

---

## Recommended MVP flow set for V2

The minimum credible distributor V2 should fully support:

1. quotation to invoice
2. direct sales order capture
3. order to invoice conversion
4. warehouse receipt
5. stock transfer
6. salesperson attribution
7. outstanding by salesperson
8. owner distributor dashboard

If these are complete, the product becomes materially more credible for distribution / wholesale workflows.

Current status:

- Flow 1 implemented
- Flow 2 implemented
- Flow 4 implemented
- Flow 5 implemented
- Flow 6 implemented at attribution level
- Flow 7 implemented at reporting / ownership level
