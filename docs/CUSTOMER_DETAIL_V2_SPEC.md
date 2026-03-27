# Customer Detail V2 Specification

**Date**: 2026-03-27  
**Purpose**: Close the remaining customer-detail experience gaps by combining master profile data, live credit posture, route coverage context, invoice summaries, and richer ledger jump-offs on the existing customer detail surfaces.  
**Implementation status**: Implemented at code/build level; focused browser and staging walkthrough still pending

Source:

- [D4_SALES_STAFF_MODEL_IMPLEMENTATION_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D4_SALES_STAFF_MODEL_IMPLEMENTATION_SPEC.md)
- [D9_COLLECTIONS_BANKING_AND_CREDIT_CONTROL_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D9_COLLECTIONS_BANKING_AND_CREDIT_CONTROL_SPEC.md)
- [D12_FIELD_SALES_AND_ROUTE_OPERATIONS_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D12_FIELD_SALES_AND_ROUTE_OPERATIONS_SPEC.md)
- [PHASE_B_PAGE_BACKLOG.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_B_PAGE_BACKLOG.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)

Implementation anchors:

- customer detail now exposes master profile, credit posture, collection ownership, route coverage, recent invoices, and recent payments from one workspace
- customer create and update flows continue to support GSTIN, state code, pricing tier, credit policy, and billing or shipping address JSON
- customer ledger now exposes richer invoice and payment references for operator jump-offs
- D9 collections and D12 coverage subsystems are summarized directly on the customer record

---

## Goal

Upgrade the customer detail screen from a master-record editor into an operator-ready customer workspace that helps users:

- understand who the customer is
- see current commercial and credit posture
- understand route and beat ownership
- jump into invoices, ledger, and collections from the same screen
- edit the most important master fields without leaving the detail page

---

## Why this matters

The current page is accurate but incomplete.

It lets users edit the customer, but it does not yet reflect the later distributor work delivered in D9 and D12.

That causes three real problems:

- finance users cannot judge customer risk from the customer record itself
- sales and route managers cannot confirm route coverage from the customer record itself
- operators must bounce between multiple screens just to answer simple questions like "what is open", "who owns recovery", and "what happened last"

Customer Detail V2 should fix that without introducing a separate customer dashboard product.

---

## Scope

Included:

- richer `GET /customers/:customerId` payload
- live receivable summary on customer detail
- open and overdue invoice summary cards
- recent invoice and recent payment preview lists
- collection summary and collections owner display
- active D12 coverage summary with territory, route, beat, visit rhythm, and last or next visit context
- fuller customer master display and edit coverage for GSTIN, state code, and billing or shipping address
- richer ledger row references and jump-offs to invoices and payments workspace

Not included:

- a separate customer analytics module
- route editing directly from the customer detail page
- creation of collection tasks directly from the customer detail page
- full payment-detail screen
- custom address schema migration

---

## Capability map

### 1. Customer identity and master data

The page should show:

- name
- email
- phone
- GSTIN
- state code
- pricing tier
- primary salesperson
- billing address
- shipping address

The page should allow inline editing of:

- name
- email
- phone
- GSTIN
- state code
- pricing tier
- primary salesperson
- billing address
- shipping address
- existing credit policy fields

### 2. Credit and collections posture

The page should show:

- credit limit
- credit days
- credit-control mode
- warning threshold
- block threshold
- credit hold state
- credit override window
- current exposure
- open invoices count
- overdue invoices count
- overdue amount
- last payment date and amount where available
- collections owner
- open collections task count
- overdue collections task count
- next collection action date where available

### 3. Route and field-sales context

The page should show the active D12 coverage snapshot:

- assigned salesperson
- territory
- route
- beat
- visit frequency
- preferred visit day
- priority
- coverage notes
- latest visit summary
- next planned visit summary

### 4. Commercial activity summary

The page should show:

- recent invoices
- recent payments
- quick counts or amounts for open and overdue invoices

### 5. Ledger jump-offs

The customer detail and ledger screens should let operators move into:

- customer ledger
- payments workspace
- collections workspace
- invoice detail pages

Ledger rows should no longer rely on raw invoice UUID labels for payment descriptions.

---

## API changes

## GET `/api/companies/:companyId/customers/:customerId`

Return the existing customer record plus a `summary` object.

### `summary.credit`

- `current_exposure`
- `open_invoices_count`
- `overdue_invoices_count`
- `overdue_amount`
- `last_payment`
  - `id`
  - `payment_date`
  - `amount`
  - `method`
  - `instrument_status`
  - `invoice_id`
  - `invoice_number`

### `summary.collections`

- `owner`
  - prefer latest open task assignee
  - fallback to open-task salesperson
  - fallback to customer primary salesperson
- `open_tasks_count`
- `overdue_tasks_count`
- `next_action_date`
- `latest_open_task`
  - `id`
  - `status`
  - `priority`
  - `channel`
  - `due_date`
  - `next_action_date`
  - `promise_to_pay_date`
  - `promise_to_pay_amount`
  - `notes`

### `summary.coverage`

- `active_assignment`
  - `id`
  - `salesperson`
  - `territory`
  - `route`
  - `beat`
  - `visit_frequency`
  - `preferred_visit_day`
  - `priority`
  - `notes`
- `latest_visit`
  - `id`
  - `visit_date`
  - `status`
  - `primary_outcome`
  - `productive_flag`
  - `next_follow_up_date`
- `next_planned_visit`
  - `id`
  - `visit_date`
  - `status`
  - `route`
  - `beat`
  - `priority`

### `summary.activity`

- `recent_invoices`
  - `id`
  - `invoice_number`
  - `status`
  - `issue_date`
  - `due_date`
  - `total`
  - `balance_due`
- `recent_payments`
  - `id`
  - `payment_date`
  - `amount`
  - `method`
  - `instrument_status`
  - `invoice_id`
  - `invoice_number`

---

## Ledger payload enhancements

## GET `/api/companies/:companyId/customers/:customerId/ledger`

Each row should additionally expose enough structured references for UI linking:

- `invoice_id`
- `invoice_number`
- `payment_id`
- `payment_method`
- `payment_reference`

Rules:

- invoice rows should expose `invoice_id` and `invoice_number`
- payment rows should expose their linked `invoice_id` and `invoice_number` when present
- payment row descriptions should use invoice number when available, not invoice UUID

---

## UI layout

Recommended page sections:

1. identity card
2. credit and collections summary
3. route and coverage summary
4. recent invoices and recent payments
5. edit form

Recommended quick actions:

- back to customers
- open ledger
- open collections workspace
- open payments workspace

Recommended ledger behavior:

- invoice rows link to invoice detail
- payment rows link to payments workspace and display linked invoice number when available

---

## Implementation notes

1. Keep this read-model driven.
   Do not add a separate customer dashboard table.

2. Reuse D9 and D12 data directly.
   The customer detail page should summarize existing data, not duplicate workflows.

3. Keep address editing simple.
   Use a stable object shape in the web app for line1, line2, city, state, postal code, and country, while still tolerating legacy JSON payloads.

4. Do not block the page on perfect optional data.
   Missing coverage or collections data should render as "not set" rather than fail the screen.

---

## Acceptance criteria

- customer detail shows GSTIN, state code, billing address, and shipping address
- customer detail shows current exposure, overdue count, overdue amount, and collections owner
- customer detail shows active territory, route, beat, and visit rhythm when coverage exists
- customer detail shows recent invoices and recent payments with working invoice links
- customer detail edit form can update GSTIN, state code, and addresses
- customer ledger uses invoice numbers instead of invoice UUIDs in payment descriptions where available
- customer ledger provides usable links to invoice detail or payments workspace
- `apps/api` typecheck and build pass
- `apps/web` lint and build pass

---

## Definition of done

Customer detail is considered complete for this phase when:

- the placeholder note about later invoice summaries and richer jump-offs is removed
- the page exposes the D9 and D12 context already promised elsewhere in the product
- the ledger references are operator-usable
- the implementation is validated at code and build level
