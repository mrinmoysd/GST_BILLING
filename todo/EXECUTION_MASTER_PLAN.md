# Execution Master Plan

**Date**: 2026-03-18
**Source of truth**: [docs/GAP_ANALYSIS_AND_EXECUTION_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/GAP_ANALYSIS_AND_EXECUTION_PLAN.md)

This file converts the gap analysis into an execution-ready phase backlog.

---

## Objectives

- Turn the current MVP into a production-grade GST Billing application
- Close domain, compliance, UX, platform, and testing gaps in a controlled sequence
- Preserve momentum by structuring work into independently shippable phases

---

## Phase sequence

## Phase A — Planning and truth alignment

Status:

- Completed on 2026-03-18

Goal:

- Realign docs, routes, and planning artifacts with actual implementation before major expansion work.

Phase doc:

- [PHASE_A_TRUTH_ALIGNMENT.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_A_TRUTH_ALIGNMENT.md)

## Phase B — Design system and shell modernization

Status:

- Completed on 2026-03-18

Goal:

- Build the modern visual and interaction foundation for the application.

Phase doc:

- [PHASE_B_DESIGN_SYSTEM_UI_MODERNIZATION.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_B_DESIGN_SYSTEM_UI_MODERNIZATION.md)

## Phase C — Onboarding, auth, and company setup

Status:

- Completed on 2026-03-18

Goal:

- Enable self-serve tenant setup and complete authentication foundation.

Phase doc:

- [PHASE_C_ONBOARDING_AUTH_COMPANY_SETUP.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_C_ONBOARDING_AUTH_COMPANY_SETUP.md)

## Phase D — RBAC and settings completeness

Goal:

- Upgrade tenant administration from MVP role strings to production-grade access control.

Phase doc:

- [PHASE_D_RBAC_AND_SETTINGS_COMPLETENESS.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_D_RBAC_AND_SETTINGS_COMPLETENESS.md)

## Phase E — Core workflow UX overhaul

Status:

- Completed on 2026-03-18

Goal:

- Redesign dashboard, invoices, purchases, inventory, and payments into product-grade flows.

Phase doc:

- [PHASE_E_CORE_WORKFLOW_UX_OVERHAUL.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_E_CORE_WORKFLOW_UX_OVERHAUL.md)

## Phase F — Sales and purchase lifecycle completion

Goal:

- Complete returns, credit notes, send/share, and business-document lifecycle gaps.

Phase doc:

- [PHASE_F_SALES_PURCHASE_LIFECYCLE_COMPLETION.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_F_SALES_PURCHASE_LIFECYCLE_COMPLETION.md)

## Phase G — GST engine and compliance exports

Goal:

- Move from MVP GST export behavior to compliance-grade GST computation and reporting.

Phase doc:

- [PHASE_G_GST_ENGINE_AND_COMPLIANCE_EXPORTS.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_G_GST_ENGINE_AND_COMPLIANCE_EXPORTS.md)

## Phase H — Accounting integration and correctness

Goal:

- Tie accounting automatically to business transactions and enforce financial rules.

Phase doc:

- [PHASE_H_ACCOUNTING_INTEGRATION_AND_CORRECTNESS.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_H_ACCOUNTING_INTEGRATION_AND_CORRECTNESS.md)

## Phase I — Platform integrations

Goal:

- Harden billing, notifications, webhooks, files, and observability for production.

Phase doc:

- [PHASE_I_PLATFORM_INTEGRATIONS.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_I_PLATFORM_INTEGRATIONS.md)

## Phase J — POS and print

Goal:

- Deliver the retail billing mode and receipt/thermal print capabilities.

Phase doc:

- [PHASE_J_POS_AND_PRINT.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_J_POS_AND_PRINT.md)

## Phase K — Quality and release hardening

Goal:

- Close test, observability, performance, and release-readiness gaps.

Phase doc:

- [PHASE_K_QUALITY_AND_RELEASE_HARDENING.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_K_QUALITY_AND_RELEASE_HARDENING.md)

---

## Recommended execution order

1. Phase A
2. Phase B
3. Phase E
4. Phase C
5. Phase D
6. Phase F
7. Phase G
8. Phase H
9. Phase I
10. Phase J
11. Phase K

Notes:

- Phase B should begin early because it unblocks nearly every frontend improvement.
- Phase G and Phase H are the biggest business-critical gaps.
- Phase J should wait until GST, inventory, and print assumptions are stable.

---

## Working rules

- Each phase should end with:
  - updated docs
  - test coverage added for new behavior
  - a completion report in `todo/completed/`
- Avoid reopening old phase docs for scope changes unless needed for historical correctness.
- Use the new A→K phase docs for future planning and execution.

---

## Immediate next phase

Start with:

- [PHASE_D_RBAC_AND_SETTINGS_COMPLETENESS.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_D_RBAC_AND_SETTINGS_COMPLETENESS.md)

Then move into:

- [PHASE_F_SALES_PURCHASE_LIFECYCLE_COMPLETION.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_F_SALES_PURCHASE_LIFECYCLE_COMPLETION.md)
