# V2 Distributor User Stories

**Date**: 2026-03-24  
**Purpose**: Define the core user stories for distributor / wholesaler readiness V2.

Source:

- [V2_DISTRIBUTOR_WHOLESALER_READINESS_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_WHOLESALER_READINESS_PLAN.md)

---

## Personas

### Owner

Runs the business, reviews dues, stock, and salesperson performance.

### Branch admin / operations manager

Handles quotations, orders, dispatch, warehouse movement, and billing supervision.

### Salesperson

Owns customer relationships, captures orders, follows up on payments, and needs visibility into assigned accounts.

### Accounts / billing operator

Converts orders to invoices, records payments, and keeps GST-compliant documents moving.

### Warehouse operator

Handles stock receipt, stock transfer, and stock accuracy by location.

---

## Epic 1: Quotations / estimates

### Story V2-US-001

As a billing operator, I want to create a quotation for a customer so that I can capture pricing before invoicing.

Acceptance notes:

- quotation has customer, items, quantities, tax, validity, and notes
- quotation can be saved as draft

### Story V2-US-002

As a salesperson, I want to send a quotation and later track whether it was accepted or expired so that I can follow up correctly.

Acceptance notes:

- quotation status must be visible
- activity and conversion history must be visible

### Story V2-US-003

As an operator, I want to convert a quotation into an invoice or sales order so that pricing and line items do not need to be re-entered.

---

## Epic 2: Sales orders

### Story V2-US-004

As a salesperson, I want to create a sales order without immediately issuing an invoice so that order capture can happen before dispatch.

### Story V2-US-005

As an operations manager, I want to see order status as draft, confirmed, partially fulfilled, fulfilled, or canceled so that dispatch work is visible.

### Story V2-US-006

As a billing operator, I want to convert a sales order into one or more invoices so that partial dispatch and staged billing are possible.

### Story V2-US-007

As an owner, I want to know which sales orders are pending or partially fulfilled so that revenue leakage is visible.

---

## Epic 3: Warehouses / godowns

### Story V2-US-008

As an operations manager, I want to maintain multiple warehouses or godowns so that stock is visible by location.

### Story V2-US-009

As a warehouse operator, I want to transfer stock from one warehouse to another so that inventory movement is controlled and traceable.

### Story V2-US-010

As a billing operator, I want invoices and purchases to be associated with a warehouse so that stock deduction and reporting stay accurate.

### Story V2-US-011

As an owner, I want warehouse-level stock visibility so that I know where stock is sitting or running out.

---

## Epic 4: Salesperson model

### Story V2-US-012

As an admin, I want to assign customers to specific salespeople so that account ownership is clear.

### Story V2-US-013

As a salesperson, I want to see only my assigned customers and my own quotations/orders where appropriate so that the workspace is simpler.

### Story V2-US-014

As an owner, I want every quotation, order, invoice, and payment to be attributable to a salesperson so that performance is measurable.

### Story V2-US-015

As a salesperson, I want to capture a new order quickly for an assigned customer so that field-led or call-led order capture is possible.

---

## Epic 5: Collections and outstanding control

### Story V2-US-016

As an owner, I want outstanding amounts to be visible by customer and salesperson so that collection risk is obvious.

### Story V2-US-017

As a salesperson, I want to see overdue invoices for my customers so that I can follow up faster.

### Story V2-US-018

As an accounts operator, I want recorded payments to roll up into customer outstanding views automatically so that due reports stay trusted.

---

## Epic 6: Distributor analytics

### Story V2-US-019

As an owner, I want sales by salesperson so that I can compare performance.

### Story V2-US-020

As an owner, I want collections by salesperson so that I can compare selling versus recovery effectiveness.

### Story V2-US-021

As an owner, I want stock by warehouse and product movement so that working capital issues are easier to spot.

### Story V2-US-022

As an owner, I want fast-moving and slow-moving product visibility so that replenishment and sales focus improve.

---

## Epic 7: Access and governance

### Story V2-US-023

As an owner, I want permissions for admin, billing, salesperson, and warehouse staff so that operational responsibilities stay separated.

### Story V2-US-024

As an owner, I want audit visibility on quotation conversion, order fulfillment, stock transfer, and payment activity so that mistakes are traceable.

---

## Recommended delivery slice

Implement stories in this order:

1. V2-US-001 to V2-US-007
2. V2-US-008 to V2-US-011
3. V2-US-012 to V2-US-018
4. V2-US-019 to V2-US-024

Reason:

- quotation and order flows create the commercial backbone first
- warehouse logic is next because it affects stock correctness
- sales attribution and analytics should come after source workflows exist
