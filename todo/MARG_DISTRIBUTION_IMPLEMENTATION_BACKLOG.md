# Marg Distribution Implementation Backlog

**Date**: 2026-03-26  
**Purpose**: Convert D7-D14 into a practical implementation backlog with sequencing, dependencies, and release slices.

Current status update after the 2026-03-27 validation pass:

- D7 is implemented at code/build level
- D8 is implemented at code/build level
- D9 is implemented at code/build level
- D10 is implemented at code/build level
- D11 is implemented for the internal product flow, but live provider-backed integration is still pending
- D12 is implemented at code/build level
- D13 is implemented at code/build level
- D14 remains critical because live environment proof is still the main release gate

Source specs:

- [D7_PRICING_AND_SCHEME_ENGINE_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D7_PRICING_AND_SCHEME_ENGINE_SPEC.md)
- [D8_BATCH_EXPIRY_AND_CLEARANCE_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D8_BATCH_EXPIRY_AND_CLEARANCE_SPEC.md)
- [D9_COLLECTIONS_BANKING_AND_CREDIT_CONTROL_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D9_COLLECTIONS_BANKING_AND_CREDIT_CONTROL_SPEC.md)
- [D10_DISPATCH_DELIVERY_AND_CHALLAN_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D10_DISPATCH_DELIVERY_AND_CHALLAN_SPEC.md)
- [D11_EINVOICE_AND_EWAY_BILL_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D11_EINVOICE_AND_EWAY_BILL_SPEC.md)
- [D12_FIELD_SALES_AND_ROUTE_OPERATIONS_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D12_FIELD_SALES_AND_ROUTE_OPERATIONS_SPEC.md)
- [D13_IMPORT_MIGRATION_AND_CUSTOMIZATION_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D13_IMPORT_MIGRATION_AND_CUSTOMIZATION_SPEC.md)
- [D14_LIVE_RELEASE_VALIDATION_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D14_LIVE_RELEASE_VALIDATION_SPEC.md)

---

## Program rule

Do not stack every large track before proving the base product live.

Execution guardrail:

1. lock D14 Track 0 baseline early
2. build D7 and D8 first for biggest distributor gap closure
3. build D9 and D10 next for operational maturity
4. build D11, D12, and D13 in controlled slices
5. re-run D14 gates before every major release milestone

---

## Milestone 0 - Live baseline

Goal:

- prove current product is stable enough to extend safely

Epics:

### M0-E1 Staging boot and environment validation

Spec:

- [D14_LIVE_RELEASE_VALIDATION_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D14_LIVE_RELEASE_VALIDATION_SPEC.md)

Scope:

- deploy staging
- verify envs
- run migrations
- verify tenant and admin auth

Exit:

- no deployment blockers

### M0-E2 Live tenant and admin QA

Scope:

- execute manual QA
- execute Playwright against live env
- execute API e2e with real services

Exit:

- no open P0 or unacceptable P1 issues

### M0-E3 Provider validation

Scope:

- billing sandbox
- files
- notifications
- queues
- export jobs

Exit:

- at least one commercial path proven end to end

---

## Milestone 1 - Commercial controls

Goal:

- make pricing and margin behavior distributor-grade

Epics:

### M1-E1 Price lists and price resolution

Spec:

- [D7_PRICING_AND_SCHEME_ENGINE_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D7_PRICING_AND_SCHEME_ENGINE_SPEC.md)

Scope:

- price lists
- party pricing
- precedence rules
- preview APIs
- order and invoice carry-forward

Dependencies:

- current quote, order, and invoice flows stable

Exit:

- price resolution is deterministic in quote, order, and invoice flows

### M1-E2 Discount controls and override audit

Scope:

- discount ceilings
- manual override reason capture
- approval hooks later if needed

Exit:

- commercial override history is visible and controlled

### M1-E3 Scheme engine baseline

Scope:

- line and document schemes
- free quantity and slab logic
- scheme preview surface

Exit:

- key scheme scenarios work without manual spreadsheet support

---

## Milestone 2 - Inventory depth

Goal:

- support batch-aware distributor inventory

Epics:

### M2-E1 Batch master and stock model

Spec:

- [D8_BATCH_EXPIRY_AND_CLEARANCE_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D8_BATCH_EXPIRY_AND_CLEARANCE_SPEC.md)

Scope:

- product batch policy
- batch stock tables
- warehouse batch balances

Exit:

- inventory can track stock at batch level

### M2-E2 Batch-aware receive, issue, transfer, and return

Scope:

- purchase receive
- invoice issue
- transfer
- return
- adjustment

Exit:

- batch stock changes are reliable across all major stock flows

### M2-E3 Expiry and clearance workflows

Scope:

- near-expiry workspace
- expired stock visibility
- clearance campaign support

Exit:

- slow and expiring stock can be operationally managed

---

## Milestone 3 - Receivables, banking, and credit

Goal:

- eliminate spreadsheet dependence for dues and recovery

Epics:

### M3-E1 Credit policy and exposure controls

Spec:

- [D9_COLLECTIONS_BANKING_AND_CREDIT_CONTROL_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D9_COLLECTIONS_BANKING_AND_CREDIT_CONTROL_SPEC.md)

Scope:

- credit exposure
- hold and override
- aging views

Exit:

- risky sales can be controlled at document time

### M3-E2 Collection tasking and promise workflow

Scope:

- collection tasks
- promise-to-pay
- follow-up states

Exit:

- outstanding recovery work can be assigned and tracked

### M3-E3 Banking and reconciliation

Scope:

- bank account master
- statement imports
- reconciliation
- cheque and PDC lifecycle

Exit:

- collections and bank activity can be reconciled in-product

---

## Milestone 4 - Dispatch and compliance

Goal:

- make sales execution and GST operations first-class

Epics:

### M4-E1 Dispatch queue and delivery challan

Spec:

- [D10_DISPATCH_DELIVERY_AND_CHALLAN_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D10_DISPATCH_DELIVERY_AND_CHALLAN_SPEC.md)

Scope:

- dispatch queue
- challan lifecycle
- partial dispatch
- transporter details

Exit:

- warehouse teams can work between order and invoice without shadow tracking

### M4-E2 Delivered-to-invoice linkage

Scope:

- challan to invoice
- delivered-not-invoiced visibility

Exit:

- invoicing reflects actual movement more closely

### M4-E3 E-invoice and e-way bill

Spec:

- [D11_EINVOICE_AND_EWAY_BILL_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D11_EINVOICE_AND_EWAY_BILL_SPEC.md)

Scope:

- IRN generation and cancellation
- EWB generation and vehicle updates
- compliance panel and exceptions

Dependencies:

- stable invoice flow
- dispatch metadata if EWB needs it

Exit:

- invoice and transport compliance are operationally usable

---

## Milestone 5 - Field execution

Goal:

- support route-led rep operations

Epics:

### M5-E1 Coverage masters and assignments

Spec:

- [D12_FIELD_SALES_AND_ROUTE_OPERATIONS_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D12_FIELD_SALES_AND_ROUTE_OPERATIONS_SPEC.md)

Scope:

- territory
- route
- beat
- customer coverage assignment

Exit:

- field ownership is operationally structured

### M5-E2 Rep workspace and visit execution

Scope:

- today screen
- visit lifecycle
- notes and outcomes
- DCR draft

Exit:

- a rep can run the day from the app

### M5-E3 Field order and recovery linkage

Scope:

- order capture from visit
- quotation capture
- D9 follow-up linkage

Dependencies:

- D9 core recovery model

Exit:

- visit actions create real business outcomes and traceability

### M5-E4 Route and rep analytics

Scope:

- route coverage
- missed visits
- rep productivity
- DCR register

Exit:

- managers can measure field execution quality

---

## Milestone 6 - Migration and rollout acceleration

Goal:

- make onboarding and rollout commercially practical

Epics:

### M6-E1 Import engine and migration projects

Spec:

- [D13_IMPORT_MIGRATION_AND_CUSTOMIZATION_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D13_IMPORT_MIGRATION_AND_CUSTOMIZATION_SPEC.md)

Scope:

- migration project workspace
- import jobs
- dry-run
- mapping profiles

Exit:

- onboarding can start with structured migration instead of manual re-entry

### M6-E2 Core master and opening imports

Scope:

- customers
- suppliers
- products
- ledgers
- warehouses
- opening stock
- opening balances

Exit:

- core go-live data can be migrated safely

### M6-E3 Open document migration

Scope:

- open invoices
- open purchase bills
- limited active documents

Exit:

- current operational obligations can move into the new system

### M6-E4 Print templates and custom fields

Scope:

- template versions
- preview and publish
- controlled custom fields

Exit:

- common customization asks no longer require code changes

### M6-E5 Webhooks and partner hooks

Scope:

- outbound webhooks
- delivery log
- API key basics

Exit:

- core external system handoffs are possible

---

## Cross-cutting work

These items should run alongside every milestone.

### X1 Regression coverage

Scope:

- unit tests
- API integration tests
- Playwright updates

Rule:

- each milestone adds tests for its own critical flows before release

### X2 Reporting parity

Scope:

- every operational feature gets matching reporting and dashboard surfaces

Rule:

- no major workflow is considered complete without operator visibility

### X3 Permissions and auditability

Scope:

- permission additions
- audit logs
- admin observability

Rule:

- sensitive actions must be supportable and traceable

### X4 Seed data and demo readiness

Scope:

- extend seed data for new features
- keep demo and QA environments representative

Rule:

- do not build features that cannot be validated with realistic seeded scenarios

---

## Suggested release slices

Recommended shipping slices:

### Slice A

- M0 live baseline
- M1-E1
- M1-E2

Outcome:

- safer pricing control without giant operational churn

### Slice B

- M1-E3
- M2-E1
- M2-E2

Outcome:

- commercial schemes plus batch-aware inventory foundation

### Slice C

- M2-E3
- M3-E1
- M3-E2

Outcome:

- expiry handling plus real recovery workflow

### Slice D

- M3-E3
- M4-E1
- M4-E2

Outcome:

- banking and dispatch maturity

### Slice E

- M4-E3
- M5-E1
- M5-E2

Outcome:

- compliance operations plus field-sales foundation

### Slice F

- M5-E3
- M5-E4
- M6-E1
- M6-E2

Outcome:

- route execution plus migration acceleration

### Slice G

- M6-E3
- M6-E4
- M6-E5
- full D14 rerun

Outcome:

- onboarding and customization become production-credible

---

## Dependency warnings

Do not start deep work on these without prerequisites:

- D11 before stable invoice issue and provider strategy
- D12 before D4 attribution and base sales flows are stable
- D13 customer migrations before D14 baseline and opening-balance rules are clear

Do in parallel where safe:

- D7 and D8 after the first D14 baseline starts
- D9 planning while D8 is under build
- D13 print-template design while D10 or D11 backend work is in progress

---

## Immediate next backlog recommendation

If the team starts execution now, the next concrete sprint order should be:

1. M0-E1 staging boot
2. M0-E2 live QA baseline
3. M1-E1 price lists
4. M1-E2 discount controls
5. M2-E1 batch master and stock model

This sequence gives:

- release confidence
- strong distributor value
- manageable technical risk

---

## Definition of success

This backlog is successful when:

- every major spec now maps to buildable epics
- the team knows what can be parallelized and what must wait
- launch-readiness work is no longer separated from feature work
- the product moves toward Marg-style distribution parity without losing release discipline
