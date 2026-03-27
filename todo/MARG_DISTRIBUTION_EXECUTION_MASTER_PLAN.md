# Marg Distribution Execution Master Plan

**Date**: 2026-03-27  
**Purpose**: Convert the Marg distribution parity master spec into a build sequence that can be executed feature by feature.

Source:

- [MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md)

---

## Objective

Ship the product to a state where it is:

- stronger than it is today for distributors and wholesalers
- commercially credible against Marg-style distribution software for the selected target segment
- production ready with live validation evidence

---

## Guiding principle

Do not start with mobile or edge workflows first.

The fastest path to real parity is:

1. prove the existing product in live conditions
2. close the biggest office-desk distributor gaps
3. add field and dispatch layers
4. add migration and customization levers

---

## Execution tracks

## Track 0 — Live readiness and production proof

Status:

- Planned

Scope:

- staging deployment validation
- seeded environment setup
- full manual QA
- full Playwright run against live stack
- provider validation
- launch signoff package

Exit:

- no P0/P1 issues
- core flows proven end to end

---

## Track 1 — Pricing and commercial controls

Status:

- Implemented at code/build level; live validation still pending

Scope:

- price lists
- party special rates
- discount ceilings
- commercial override audit
- scheme engine baseline

Exit:

- customer-specific commercial logic works in quote/order/invoice flows

---

## Track 2 — Inventory depth

Status:

- Implemented at code/build level; live validation still pending

Scope:

- batch tracking
- expiry tracking
- near-expiry reports
- stock-clearance workflows
- inventory discrepancy reasons

Exit:

- batch-aware stock can be received, sold, transferred, and reported

---

## Track 3 — Collections, banking, and credit control

Status:

- Implemented at code/build level; live validation still pending

Scope:

- credit control workspace
- cheque/PDC lifecycle
- bank reconciliation
- collection follow-up tasks
- credit override workflow

Exit:

- dues and receipts can be managed operationally without external spreadsheets

---

## Track 4 — Dispatch and compliance operations

Status:

- Partially implemented: D10 is implemented at code/build level and D11 is implemented internally, but live provider-backed compliance integration is still pending

Scope:

- delivery challan
- dispatch board
- delivery status tracking
- e-invoice
- e-way bill

Exit:

- order-to-dispatch-to-invoice flow is complete and GST operational documents are first-class

---

## Track 5 — Field-sales operations

Status:

- Implemented at code/build level; browser/staging validation still pending

Scope:

- route / beat / territory model
- rep worklists
- field order capture
- visit logging
- DCR

Exit:

- rep-led distribution businesses can operate with measurable field execution

---

## Track 6 — Migration, customization, and rollout acceleration

Status:

- Implemented at code/build level; live workflow validation still pending

Scope:

- import templates and jobs
- opening balance import
- custom print templates
- controlled custom fields

Exit:

- switching from older tools into this product is practical

---

## Suggested implementation-document order

1. `docs/D14_LIVE_RELEASE_VALIDATION_SPEC.md`
2. `docs/D7_PRICING_AND_SCHEME_ENGINE_SPEC.md`
3. `docs/D8_BATCH_EXPIRY_AND_CLEARANCE_SPEC.md`
4. `docs/D9_COLLECTIONS_BANKING_AND_CREDIT_CONTROL_SPEC.md`
5. `docs/D10_DISPATCH_DELIVERY_AND_CHALLAN_SPEC.md`
6. `docs/D11_EINVOICE_AND_EWAY_BILL_SPEC.md`
7. `docs/D12_FIELD_SALES_AND_ROUTE_OPERATIONS_SPEC.md`
8. `docs/D13_IMPORT_MIGRATION_AND_CUSTOMIZATION_SPEC.md`

---

## Build strategy

For each track:

1. lock business rules
2. define schema changes
3. define API surface
4. build web workflows
5. add reporting and dashboards
6. add permissions
7. add unit, integration, and browser coverage
8. validate with seeded demo scenarios

---

## Definition of success

This plan is successful when:

- the team can pick any capability family and find the required scope quickly
- implementation work can be decomposed into clear feature slices
- every delivered slice has matching business rules, UI, API, and test expectations
- the product is measurably closer to distributor-grade market readiness after each track
