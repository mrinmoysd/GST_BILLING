# Frontend Deferred Items Spec

**Updated**: 2026-03-18
**Status**: Legacy planning reference, partially superseded

This file originally tracked deferred items across FE-01 through FE-11.

It is no longer a reliable source of truth on its own because multiple items previously marked as blocked or deferred have since been implemented. Use the following documents instead:

- [docs/CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)
- [docs/GAP_ANALYSIS_AND_EXECUTION_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/GAP_ANALYSIS_AND_EXECUTION_PLAN.md)
- [todo/EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/EXECUTION_MASTER_PLAN.md)

---

## What is no longer blocked

The following areas were previously tracked here as missing or blocked, but now exist in code:

- Customer ledger UI and backend endpoint
- Supplier ledger UI and backend endpoint
- Categories API and UI
- Company settings UI and backend endpoint
- Invoice series UI and backend endpoint
- Users UI and backend endpoint
- Subscription UI and tenant subscription endpoints
- Purchase payments UI through the generic payments flow
- Admin support tickets module and UI
- Cash book page
- Bank book page
- Journal drill-down page
- Invoice idempotency header wiring
- Invoice payments UI

---

## Remaining frontend gaps that still matter

These items remain valid at a high level, but they are now governed by the newer execution plan.

### High-priority UX gaps

- Dashboard is still placeholder-grade
- Invoice builder still lacks full product-grade UX
- Purchase entry still lacks full product-grade UX
- Reports pages need richer cards/tables/charts
- Accounting report presentation needs better structured layouts
- Admin companies/subscriptions/usage still need UI polish

### Missing route groups / features

- Onboarding routes
- Reset-password route
- Logout route parity
- Roles page
- Unified payments page
- Dedicated inventory stock/movements/adjustment routes
- GST hub and additional GST report pages
- POS routes and print flow

### Cross-cutting frontend gaps

- Better route/auth protection ergonomics
- Stronger responsive behavior
- More complete e2e coverage
- Full modern design-system rollout

---

## Current recommendation

Do not extend this file with new planning detail.

For all future work:
- use `todo/EXECUTION_MASTER_PLAN.md` for phase sequencing
- use `todo/planned/PHASE_B_DESIGN_SYSTEM_UI_MODERNIZATION.md` and later A→K phase docs for active planning

This file remains in the repo as a historical reference for the earlier FE/DE planning model.
