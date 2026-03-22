# Phase H — Accounting Integration and Correctness

**Status**: Completed
**Priority**: P0

## Goal

Tie accounting directly to business transactions and enforce the product’s financial invariants.

## Scope

- Default chart of accounts policy
- Posting rules per transaction type
- Auto-posting for invoices, purchases, payments
- Reversals for cancellations and returns
- Period close and locking
- Rounding and precision enforcement
- Better accounting drilldowns and traceability

## Deliverables

- Posting engine
- Updated accounting service behavior
- Better accounting UX and traceability

## Definition of done

- Financial statements derive from business events with controlled manual adjustments, not from disconnected workflows

## Completion notes

- Added a posting engine with default chart-of-accounts seeding and source-linked system journals
- Wired invoice issue, invoice cancellation, credit notes, purchase receipt, purchase cancellation, purchase returns, and payment flows into accounting journal creation
- Added accounting period lock APIs and enforcement so manual and automatic postings are blocked for closed periods
- Added journal traceability fields and surfaced auto/manual mode plus source references in the accounting UI
- Added explicit `cost_price` support on products so inventory and COGS postings use a dedicated cost basis instead of selling price

## Dependencies

- Phase A
- Phase G for tax/accounting consistency
- Phase F for return/reversal behaviors
