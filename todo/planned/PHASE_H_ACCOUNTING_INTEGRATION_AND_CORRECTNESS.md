# Phase H — Accounting Integration and Correctness

**Status**: Planned
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

## Dependencies

- Phase A
- Phase G for tax/accounting consistency
- Phase F for return/reversal behaviors

