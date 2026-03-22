# Admin Execution Master Plan

**Date**: 2026-03-22  
**Primary source**: [ADMIN_PANEL_BLUEPRINT.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/ADMIN_PANEL_BLUEPRINT.md)

This file breaks admin completion into smaller execution phases so the admin panel can be implemented iteratively with clear outcomes.

---

## Objective

Turn the current partial admin area into a robust SaaS operations panel that can:

- authenticate internal operators securely
- onboard and manage companies
- operate billing and subscription incidents
- monitor usage, queues, jobs, and platform health
- manage support workflows
- provide auditability and internal governance

---

## Admin phase sequence

## M1 — Super-admin auth foundation

Status:

- Completed on 2026-03-22

Goal:

- establish a real, secure entry point for internal operators

Scope:

- real `/admin/login`
- super-admin session model
- admin access bootstrap strategy
- internal admin role model
- admin route/session guard parity

Acceptance:

- internal operators can log in to admin without placeholder screens
- admin routes are protected by the correct auth model

---

## M2 — Admin shell and navigation

Status:

- Completed on 2026-03-22

Goal:

- create a coherent admin workspace instead of isolated pages

Scope:

- dedicated admin layout
- admin sidebar / header / navigation
- page hierarchy and breadcrumbs
- shared admin page patterns

Acceptance:

- all admin pages live under a unified shell
- admin feels like a distinct product area, not scattered routes

---

## M3 — Company lifecycle operations

Status:

- Completed on 2026-03-22

Goal:

- make company management a first-class admin workflow

Scope:

- admin-side company creation
- company detail workspace
- owner/user summary
- GST/compliance summary
- health snapshot
- suspend / reactivate / operational actions
- onboarding assistance / re-entry actions

Acceptance:

- companies are not managed from a list alone
- admin can create and operate tenant lifecycle workflows

---

## M4 — Billing and subscription operations

Status:

- Completed on 2026-03-22

Goal:

- give operators the controls needed to run the SaaS business side

Scope:

- subscription detail workspace
- billing/provider state visibility
- plan/status operations
- provider incident handling
- usage-by-company visibility
- webhook/billing reconciliation workflows

Acceptance:

- billing issues can be inspected and acted on from admin
- subscription management is not limited to list views

---

## M5 — Support, usage, and platform observability

Status:

- Completed on 2026-03-22

Goal:

- make admin useful for day-to-day operational control

Scope:

- richer admin dashboard KPIs
- usage and revenue analytics
- support ticket enrichment
- queue/job drilldown
- notification/file/webhook operations visibility
- queue metrics auth/guard cleanup

Acceptance:

- admin dashboard surfaces the business and platform signals needed to run the product
- support and platform operations are usable workflows, not debug panels

---

## M6 — Audit, governance, and internal admin management

Status:

- Completed on 2026-03-22

Goal:

- finish the internal-governance layer for the SaaS team

Scope:

- admin audit explorer
- admin user and role management
- privileged action tracking
- admin acceptance/e2e coverage

Acceptance:

- internal admin access is governed and auditable
- high-risk admin actions are traceable
- admin governance routes have smoke coverage in Playwright

---

## Recommended implementation order

1. M1 — Super-admin auth foundation
2. M2 — Admin shell and navigation
3. M3 — Company lifecycle operations
4. M4 — Billing and subscription operations
5. M5 — Support, usage, and platform observability
6. M6 — Audit, governance, and internal admin management

---

## Execution guidance

- M1 and M2 should be treated as blockers for the rest of admin UX work
- M3 and M4 are the highest business-value slices after auth/shell
- M5 and M6 should close the operating and governance loop
- each sub-phase should end with:
  - docs updated
  - API and frontend coverage for the delivered behaviors
  - clear completion notes

---

## Relationship to Phase M

Phase M remains the top-level product phase for admin completion.  
This admin master plan is the execution breakdown of that phase.

Use:

- [PHASE_M_ADMIN_COMPLETION_AND_SUPER_ADMIN_AUTH.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/planned/PHASE_M_ADMIN_COMPLETION_AND_SUPER_ADMIN_AUTH.md)
  - for the top-level phase objective
- [ADMIN_EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/ADMIN_EXECUTION_MASTER_PLAN.md)
  - for iterative implementation planning
