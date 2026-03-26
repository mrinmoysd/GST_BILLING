# D9 Collections, Banking, and Credit Control Specification

**Date**: 2026-03-26  
**Purpose**: Define the implementation-ready scope for receivables control, supplier payment discipline, cheque/PDC workflows, bank reconciliation, and collection operations.  
**Implementation status**: Planned

Source:

- [MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md)
- [MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)
- [DOMAIN_MODEL.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/DOMAIN_MODEL.md)
- [ACCOUNTING_RULES.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/ACCOUNTING_RULES.md)
- [API_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/API_SPEC.md)

Current implementation anchors:

- payment recording already exists for invoices and purchases
- outstanding and distributor due reports already exist
- customer and supplier ledger views already exist
- cash book and bank book already exist

---

## D9 goal

Upgrade the current payment and ledger foundation into a distributor-grade collections and banking operations system that lets the product:

- manage customer credit exposure proactively
- record and track cheque / PDC / bank / cash / UPI receipts with proper lifecycle
- reconcile bank statements with recorded payments
- give collection teams a due-follow-up workflow
- surface overdue, unreconciled, and high-risk accounts clearly

D9 should move the product from "can record payments" to "can operate receivables and bank control at scale."

---

## Why D9 matters

For many distributors, billing is only half the problem.

The harder problems are:

- who is overdue
- who is over credit limit
- which cheque is pending or bounced
- which bank entries are unmatched
- which salesperson or collector needs to follow up

Without D9, the product can close basic invoices but still leaves finance and collection teams dependent on:

- spreadsheets
- WhatsApp follow-up
- manual bank matching
- paper cheque tracking

---

## Scope

Included in D9:

- customer credit policy and exposure tracking
- credit hold and override workflow baseline
- receivable aging and payable aging
- collection tasking and follow-up notes
- cheque and PDC lifecycle
- bank account master
- bank statement import
- bank reconciliation workspace
- bounced instrument workflow
- payment allocation and reference discipline
- payment method and instrument metadata
- operator reports for overdue, collection efficiency, and unreconciled items

Included operating outputs:

- credit-control dashboard
- collections taskboard
- cheque register
- PDC calendar view
- bank reconciliation workspace
- overdue and aging reports

Not included in D9:

- full treasury management
- automatic bank feed integrations from every provider
- Tally-style voucher-first banking UI
- loan and EMI management
- complex interest / dunning engine
- legal recovery workflow
- supplier claim settlement

Planned result after D9:

- finance and operations teams can manage dues and bank matching from inside the product instead of maintaining separate trackers

---

## Business outcomes

After D9, the product should let a business:

- stop billing customers who are beyond credit policy without explicit override
- assign overdue follow-up to salespeople or collection staff
- track cheque status from received to cleared or bounced
- import bank statements and match entries to payments
- quickly see which receipts are not yet reconciled
- view customer aging and top-risk dues in one place

---

## Design principles

1. Keep the current payment engine as the posting base.
   D9 should extend payment capture, not replace it.

2. Instrument lifecycle is separate from settlement posting.
   A cheque received today may clear later; the workflow must reflect that.

3. Reconciliation must be explainable.
   Operators need to see why a bank line matched a payment.

4. Credit control should be policy-driven.
   Warnings and blocks must depend on clear company rules, not ad hoc operator judgment.

5. Collections are workflow, not just reporting.
   The system must create and track follow-up work, not only show overdue numbers.

6. Historical accounting correctness must remain intact.
   Reconciliation and instrument status changes must not silently corrupt previously posted books.

---

## Terms and concepts

### Credit exposure

The customer's current open receivable position compared with allowed credit policy.

### Credit hold

A state where new sales issue is blocked or warned due to policy breach.

### Payment instrument

The real-world payment medium or commitment:

- cash
- bank transfer
- UPI
- card
- cheque
- PDC
- other bank instrument

### PDC

Post-dated cheque.

It is received before it is banked or cleared.

### Bank statement line

A line imported from a bank statement that may or may not match a product payment record.

### Reconciliation

The process of matching recorded payments to actual bank statement lines.

### Collection task

An assigned follow-up action for an overdue or high-risk receivable.

---

## D9 feature set

## 1. Credit policy and account exposure

The system should support:

- customer credit limit
- credit days
- hold status
- warning threshold
- block threshold
- temporary override

## 2. Receivable and payable aging

The system should support:

- receivable aging buckets
- payable aging buckets
- customer overdue analysis
- supplier due analysis
- due by salesperson
- due by route later if D12 lands

## 3. Collections tasking

The system should support:

- follow-up task creation
- assignment to user or salesperson
- due date
- next action date
- promise-to-pay note
- call / visit outcome

## 4. Payment instruments

The system should support:

- payment method
- instrument type
- cheque / PDC details
- deposit date
- clearance date
- bounce date
- instrument status

## 5. Bank account master

The system should support:

- company bank accounts
- account nickname
- account number masked display
- bank ledger mapping
- active / inactive status

## 6. Bank statement import and matching

The system should support:

- statement upload
- parsed statement lines
- candidate payment matching
- manual match
- unmatched line review

## 7. Reconciliation controls

The system should support:

- mark matched
- undo match with audit
- partially matched behavior later if needed
- reconciliation summary

## 8. Bounced instrument handling

The system should support:

- bounce status
- bounce date
- remarks
- reopened collection action
- accounting-impact decision path

## 9. Collections and risk reporting

The system should support:

- top overdue customers
- aging buckets
- collector performance
- unreconciled bank entries
- pending PDC calendar

---

## Phase breakdown inside D9

### D9.1 Credit-control foundations

Deliver:

- customer credit settings
- aging reports
- credit dashboard
- credit hold checks on sales issue

### D9.2 Instrument-aware payments

Deliver:

- payment instrument model
- cheque / PDC register
- status transitions
- bounce handling

### D9.3 Collections workflow

Deliver:

- collection tasks
- promise-to-pay notes
- assignment and status tracking

### D9.4 Bank reconciliation

Deliver:

- bank accounts
- statement import
- reconciliation workspace
- unmatched and matched audit

---

## Business rules

## 1. Customer credit exposure

Suggested exposure formula:

- current open receivables
- plus draft or pending issue exposure only if company policy includes it later

First release should use:

- issued invoices with `balance_due > 0`

## 2. Credit threshold behavior

Each customer should support:

- `warning_credit_limit`
- `hard_credit_limit` or use one credit limit with company policy
- `credit_days`

Recommended first release:

- use customer credit limit plus optional company-level block mode

Behavior:

- if projected balance after issue exceeds limit:
  - `warn` mode: show visible warning and allow issue
  - `block` mode: prevent issue unless explicit override permission exists

## 3. Overdue behavior

If customer has open overdue invoices beyond allowed credit days:

- issue may warn or block depending on policy

Suggested projected risk checks:

- over credit limit
- has invoices overdue by more than `credit_days`
- account manually marked on hold

## 4. Account hold rule

If customer account is on hold:

- quotation and sales order may continue if policy allows
- invoice issue should block by default

Recommended first release:

- block invoice issue
- allow viewing and editing customer data

## 5. Payment posting vs instrument lifecycle

Two valid operational models exist:

1. post payment at receipt time
2. post payment at clearance time

Recommended first release:

- post payment when instrument is received
- track reconciliation and instrument status separately

Reason:

- it aligns with current simple payment model
- it is easier to integrate with the existing books

Required safeguard:

- bounced instrument must trigger a controlled reversal or finance action workflow

## 6. Cheque / PDC statuses

Suggested statuses:

- `received`
- `deposited`
- `cleared`
- `bounced`
- `cancelled`

Additional scheduling field:

- `due_on` for PDC

## 7. Deposit rules

A cheque or PDC:

- cannot be cleared before it is received
- cannot be bounced after cancellation
- should normally be deposited before clear/bounce

## 8. Bounce handling rules

On bounce:

- instrument status becomes `bounced`
- reconciliation match must be reversed if already matched
- collection task should reopen or be created
- finance team should capture bounce note

Accounting rule choice for first release:

- keep a simple operational reversal path
- do not automate every bounce journal until accounting policy is locked

Recommended first release:

- create explicit "reverse payment" action for bounced or invalid receipts
- record audit trail

## 9. Bank reconciliation rules

A bank statement line can be:

- unmatched
- suggested
- matched
- ignored

Matching signals can include:

- amount
- date proximity
- reference number
- instrument number
- payer name later if available

Recommended first release:

- support one bank statement line to one payment match

Later extension:

- many-to-one and one-to-many matching

## 10. Undo reconciliation

Undoing reconciliation should:

- unmatch the statement line
- preserve audit trail
- not delete either the bank line or payment record

## 11. Collection task rules

A collection task should support:

- open
- in_progress
- promised
- resolved
- cancelled

Promise-to-pay should capture:

- promised amount optional
- promised date
- note

## 12. Supplier payment control

D9 should extend the same instrument and reconciliation model to purchase payments where practical.

First release priority:

- customer collections and receivables first
- supplier/bank-side reconciliation second

---

## Data model

This section defines recommended schema additions. It is a product-definition spec, not the final migration script.

## 1. Customer extensions

Suggested additions to `customers`:

- `credit_limit` already exists in some legacy specs and should be normalized into current schema if not already present
- `credit_days` integer nullable
- `credit_hold` boolean default false
- `credit_hold_reason` nullable
- `collections_owner_user_id` nullable

## 2. `bank_accounts`

Purpose:

- company bank-account registry for payment and reconciliation

Suggested fields:

- `id`
- `company_id`
- `ledger_id`
- `nickname`
- `bank_name`
- `account_holder_name`
- `account_number_masked`
- `ifsc_code` nullable
- `upi_id` nullable
- `is_default`
- `is_active`
- `created_at`
- `updated_at`

## 3. Payment extensions

Suggested additions to `payments`:

- `bank_account_id` nullable
- `instrument_type` nullable
- `instrument_status` nullable
- `instrument_number` nullable
- `instrument_date` nullable
- `deposit_date` nullable
- `clearance_date` nullable
- `bounce_date` nullable
- `instrument_metadata` jsonb nullable
- `is_reconciled` boolean default false
- `reconciled_at` nullable

Suggested `instrument_type` values:

- `cash`
- `bank_transfer`
- `upi`
- `card`
- `cheque`
- `pdc`
- `other`

Suggested `instrument_status` values:

- `received`
- `deposited`
- `cleared`
- `bounced`
- `cancelled`

## 4. `bank_statement_imports`

Purpose:

- represent one imported statement file

Suggested fields:

- `id`
- `company_id`
- `bank_account_id`
- `source_type`
- `imported_by_user_id`
- `file_id` nullable
- `period_from` nullable
- `period_to` nullable
- `created_at`

Suggested `source_type` values:

- `csv`
- `excel`
- `manual`

## 5. `bank_statement_lines`

Purpose:

- parsed bank statement rows

Suggested fields:

- `id`
- `company_id`
- `bank_statement_import_id`
- `bank_account_id`
- `txn_date`
- `value_date` nullable
- `description`
- `reference` nullable
- `credit_amount` default 0
- `debit_amount` default 0
- `balance` nullable
- `match_status`
- `ignored` boolean default false
- `created_at`

Suggested `match_status` values:

- `unmatched`
- `suggested`
- `matched`
- `ignored`

## 6. `bank_reconciliation_matches`

Purpose:

- explicit reconciliation link between statement lines and payments

Suggested fields:

- `id`
- `company_id`
- `bank_statement_line_id`
- `payment_id`
- `match_type`
- `matched_by_user_id`
- `matched_at`
- `notes` nullable

Suggested `match_type` values:

- `manual`
- `suggested`

## 7. `collection_tasks`

Purpose:

- operational due-follow-up workflow

Suggested fields:

- `id`
- `company_id`
- `customer_id`
- `invoice_id` nullable
- `assigned_to_user_id` nullable
- `salesperson_user_id` nullable
- `status`
- `priority`
- `due_on`
- `next_follow_up_on` nullable
- `promised_amount` nullable
- `promised_date` nullable
- `last_outcome` nullable
- `notes` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

Suggested `status` values:

- `open`
- `in_progress`
- `promised`
- `resolved`
- `cancelled`

Suggested `priority` values:

- `low`
- `medium`
- `high`
- `critical`

## 8. `collection_task_events`

Purpose:

- timeline of collection actions

Suggested fields:

- `id`
- `company_id`
- `collection_task_id`
- `actor_user_id`
- `event_type`
- `summary`
- `metadata` jsonb nullable
- `created_at`

Suggested `event_type` values:

- `created`
- `assigned`
- `call_logged`
- `promise_recorded`
- `payment_linked`
- `status_changed`

## 9. `credit_override_requests`

Purpose:

- track policy bypass events

Suggested fields:

- `id`
- `company_id`
- `customer_id`
- `document_type`
- `document_id`
- `requested_by_user_id`
- `approved_by_user_id` nullable
- `status`
- `reason`
- `projected_exposure`
- `credit_limit_snapshot`
- `created_at`
- `updated_at`

Suggested `status` values:

- `requested`
- `approved`
- `rejected`
- `cancelled`

---

## API contract

All endpoints are company-scoped.

## Credit control

### Credit dashboard

- `GET /api/companies/:cid/credit-control/dashboard?as_of=`

Response should include:

- total receivable exposure
- overdue exposure
- accounts on hold
- over-limit accounts
- pending collection tasks
- pending PDC amount
- unreconciled bank receipts

### Customer credit settings

- `PATCH /api/companies/:cid/customers/:customerId`

Extended body:

- `credit_limit?`
- `credit_days?`
- `credit_hold?`
- `credit_hold_reason?`
- `collections_owner_user_id?`

### Credit check preview

- `POST /api/companies/:cid/credit-control/check`

Purpose:

- allow quotation/order/invoice screens to preview policy impact before final issue

Body:

- `customer_id`
- `document_type`
- `projected_amount`
- `document_id?`

## Collection tasks

### List collection tasks

- `GET /api/companies/:cid/collections/tasks?page=&limit=&status=&priority=&assigned_to=&customer_id=&from=&to=`

### Create collection task

- `POST /api/companies/:cid/collections/tasks`

### Update collection task

- `PATCH /api/companies/:cid/collections/tasks/:taskId`

### Add task event / note

- `POST /api/companies/:cid/collections/tasks/:taskId/events`

Body:

- `event_type`
- `summary`
- `metadata?`

### Collections worklist by salesperson

- `GET /api/companies/:cid/collections/worklist?salesperson_user_id=&as_of=`

## Payment instruments

### Record payment

- `POST /api/companies/:cid/payments`

Extended body:

- existing fields:
  - `invoice_id?`
  - `purchase_id?`
  - `amount`
  - `method`
  - `reference?`
  - `payment_date?`
- new fields:
  - `bank_account_id?`
  - `instrument_type?`
  - `instrument_number?`
  - `instrument_date?`
  - `deposit_date?`
  - `notes?`

### Update payment instrument status

- `PATCH /api/companies/:cid/payments/:paymentId/instrument`

Body:

- `instrument_status`
- `deposit_date?`
- `clearance_date?`
- `bounce_date?`
- `notes?`

### Reverse payment

- `POST /api/companies/:cid/payments/:paymentId/reverse`

Purpose:

- controlled reversal for bounced or invalid receipts

## Bank accounts

### List bank accounts

- `GET /api/companies/:cid/bank-accounts`

### Create bank account

- `POST /api/companies/:cid/bank-accounts`

### Update bank account

- `PATCH /api/companies/:cid/bank-accounts/:bankAccountId`

## Bank statement import

### Create statement import

- `POST /api/companies/:cid/bank-reconciliation/imports`

Body or multipart:

- `bank_account_id`
- uploaded file or parsed lines depending on importer strategy

### List imports

- `GET /api/companies/:cid/bank-reconciliation/imports?page=&limit=&bank_account_id=`

### List statement lines

- `GET /api/companies/:cid/bank-reconciliation/lines?page=&limit=&bank_account_id=&status=&from=&to=`

## Reconciliation

### Suggest matches

- `POST /api/companies/:cid/bank-reconciliation/lines/:lineId/suggest`

### Match statement line to payment

- `POST /api/companies/:cid/bank-reconciliation/matches`

Body:

- `bank_statement_line_id`
- `payment_id`
- `notes?`

### Undo match

- `POST /api/companies/:cid/bank-reconciliation/matches/:matchId/undo`

### Ignore statement line

- `POST /api/companies/:cid/bank-reconciliation/lines/:lineId/ignore`

## Reports

### Receivable aging

- `GET /api/companies/:cid/reports/receivable-aging?as_of=&bucket=30,60,90,120`

### Payable aging

- `GET /api/companies/:cid/reports/payable-aging?as_of=&bucket=30,60,90,120`

### Collection efficiency

- `GET /api/companies/:cid/reports/collections/efficiency?from=&to=&salesperson_user_id=`

### Pending instruments

- `GET /api/companies/:cid/reports/collections/pending-instruments?as_of=&status=`

### Unreconciled bank entries

- `GET /api/companies/:cid/reports/bank/unreconciled?bank_account_id=&from=&to=`

---

## Preview and report response shapes

### Credit check response

Suggested shape:

```json
{
  "data": {
    "customer_id": "uuid",
    "credit_limit": 100000,
    "current_exposure": 82000,
    "projected_exposure": 112000,
    "over_limit": true,
    "overdue_invoices_count": 3,
    "oldest_overdue_days": 47,
    "account_on_hold": false,
    "mode": "block",
    "warnings": [],
    "blocks": [
      {
        "code": "CREDIT_LIMIT_EXCEEDED",
        "message": "Projected exposure exceeds the allowed credit limit."
      }
    ]
  }
}
```

### Receivable aging row

Suggested row fields:

- `customer_id`
- `customer_name`
- `salesperson_name?`
- `not_due`
- `bucket_0_30`
- `bucket_31_60`
- `bucket_61_90`
- `bucket_90_plus`
- `total_outstanding`

---

## Frontend routes and screens

Recommended route additions:

- `/c/[companyId]/collections`
- `/c/[companyId]/collections/tasks`
- `/c/[companyId]/collections/tasks/[taskId]`
- `/c/[companyId]/credit-control`
- `/c/[companyId]/banking/accounts`
- `/c/[companyId]/banking/reconciliation`
- `/c/[companyId]/banking/imports`
- `/c/[companyId]/reports/receivable-aging`
- `/c/[companyId]/reports/payable-aging`
- `/c/[companyId]/reports/collections`

Current-route extensions:

- `/c/[companyId]/payments`
- `/c/[companyId]/sales/invoices/[invoiceId]`
- `/c/[companyId]/masters/customers/[customerId]`
- `/c/[companyId]/masters/customers/[customerId]/ledger`
- `/c/[companyId]/masters/suppliers/[supplierId]/ledger`
- `/c/[companyId]/accounting/books/bank`

## Screen requirements

### 1. Credit-control dashboard

Show:

- total outstanding
- overdue exposure
- accounts on hold
- over-limit customers
- top overdue customers
- pending collection tasks
- pending PDC totals

Primary actions:

- open customer
- create task
- mark hold
- request override

### 2. Collections taskboard

Show:

- assigned user
- customer
- invoice or account context
- due amount
- promised amount/date
- next follow-up date
- last outcome

Views:

- my tasks
- by priority
- by salesperson
- overdue follow-up

### 3. Payments workspace enhancement

Current payments screen should be extended to support:

- payment instrument fields
- bank-account selection
- cheque/PDC status badges
- reconciliation status badge

### 4. Cheque / PDC register

Show:

- customer or supplier
- amount
- instrument number
- instrument date
- due date
- bank account
- status
- linked invoice or purchase

### 5. Bank reconciliation workspace

Split view:

- imported statement lines on one side
- candidate payments on the other

Actions:

- match
- undo
- ignore
- filter by date/amount/reference

### 6. Customer credit profile

Customer detail should show:

- credit limit
- credit days
- current exposure
- overdue count
- hold flag
- collections owner

### 7. Aging reports

Should support:

- bucket selection
- salesperson filter
- export-ready table layout

---

## UX behavior in transactions

## Invoice issue

Before issuing an invoice:

1. run credit check preview
2. surface warnings or blocks
3. if blocked and operator has no override permission, issue action fails
4. if override is allowed, require reason and log it

## Payment recording

When payment method implies an instrument:

- require instrument-specific fields
- allow status transitions later

Examples:

- cash: no cheque fields
- bank transfer: bank account optional but recommended
- cheque/PDC: instrument number and instrument date required

## Bank reconciliation

When a statement line is matched:

- payment should show reconciled badge
- line should move to matched state
- audit record should capture actor and timestamp

## Bounce handling

When an instrument is marked bounced:

- show high-severity badge
- prompt operator to create or reopen a collection task
- offer payment reversal action

---

## Reporting requirements

## 1. Receivable aging

Show:

- customer
- salesperson
- bucketed dues
- total outstanding
- oldest overdue days

## 2. Payable aging

Show:

- supplier
- bucketed dues
- total payable

## 3. Collections performance

Show:

- assigned user or salesperson
- tasks completed
- amount collected
- promised vs realized
- overdue reduction

## 4. Pending instruments

Show:

- cheque/PDC status
- due dates
- amounts at risk

## 5. Unreconciled bank entries

Show:

- statement lines not matched
- payments not matched
- age of unreconciled items

---

## Permissions

Suggested new permissions:

- `credit_control.view`
- `credit_control.manage`
- `credit_control.override`
- `collections.tasks.view`
- `collections.tasks.manage`
- `payments.instrument.manage`
- `payments.reverse`
- `bank_accounts.view`
- `bank_accounts.manage`
- `bank_reconciliation.view`
- `bank_reconciliation.manage`
- `collections.reports.view`

Suggested role usage:

- owner/admin: full access
- accountant/finance: payments, bank accounts, reconciliation, aging
- billing operator: payment recording, limited instrument updates
- salesperson / collections user: assigned tasks, worklists, due visibility

---

## Validation and test plan

## Unit tests

Need unit coverage for:

- aging bucket calculation
- credit limit evaluation
- overdue-day calculation
- instrument status transition validation
- reconciliation candidate scoring

## Integration tests

Need integration or e2e coverage for:

- invoice blocked by credit hold
- warning-only credit policy
- cheque payment creation and lifecycle update
- bounced instrument reopening collection workflow
- bank statement import and match
- undo reconciliation
- customer aging accuracy after partial payments

## Browser tests

Need Playwright coverage for:

- payment recording with cheque/PDC fields
- credit dashboard loading
- collection task create/update
- bank reconciliation match flow
- aging report filters

## Seed scenarios

Recommended seed cases:

1. customer over limit with open invoices
2. customer overdue beyond credit days
3. one cheque received and pending
4. one bounced instrument
5. one imported bank line matching a recorded payment

---

## Migration and rollout strategy

## Initial rollout

First release should:

- keep simple cash/UPI/bank payment recording working exactly as today
- add instrument details only where provided

## Existing payments

Old payment rows can safely default to:

- `instrument_type = method`
- `instrument_status = cleared` for cash/UPI/card/bank if that is the pragmatic migration rule

This should be documented clearly in the migration notes.

## Existing customers

Default values:

- `credit_days = null`
- `credit_hold = false`

## Existing books

D9 must not break:

- current payment journals
- current cash book
- current bank book

Reconciliation is an operational layer on top, not a replacement for accounting records.

---

## Risks and implementation notes

1. Reconciliation can become complex quickly.
   First release should keep one bank line to one payment matching only.

2. Bounce accounting can be contentious.
   Start with operational reversal workflow rather than hidden automatic journal rewrites.

3. Credit blocking can frustrate teams if too strict.
   Support warn vs block modes and clear operator messaging.

4. Collections tooling can sprawl.
   Focus first on follow-up discipline and visibility, not CRM-style activity overload.

5. Supplier-payment parity may lag customer collections in the first pass.
   That is acceptable if receivables are prioritized explicitly.

---

## Acceptance criteria

D9 is complete when:

- customer credit exposure and overdue policy are visible and enforceable
- payment instruments support cheque/PDC lifecycle
- bank accounts and statement imports work
- payment-to-bank reconciliation is usable and auditable
- collection tasks exist and can be assigned and tracked
- aging and unreconciled reports support finance operations
- current payment and accounting flows remain intact

---

## Suggested implementation order

1. customer credit fields and credit-check service
2. aging reports and credit dashboard
3. payment instrument model
4. collection tasks
5. bank accounts and statement import
6. reconciliation engine and workspace
7. bounce and reversal workflow

---

## Out-of-scope follow-up after D9

Once D9 is stable, later phases can extend into:

- auto-reminders by channel
- customer payment portals
- automated bank feeds
- multi-line reconciliation
- finance approvals for large write-offs

