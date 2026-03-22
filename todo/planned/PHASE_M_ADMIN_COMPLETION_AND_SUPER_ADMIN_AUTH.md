# Phase M — Admin Completion and Super-Admin Auth

Status:

- Completed on 2026-03-22

Goal:

- Turn the partially implemented admin area into a fully usable platform-operations workspace with real super-admin entry, routing, and completion of the major admin screens.

Source:

- [VALIDATION_REPORT.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/VALIDATION_REPORT.md)
- [ADMIN_PANEL_BLUEPRINT.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/ADMIN_PANEL_BLUEPRINT.md)
- [ADMIN_EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/ADMIN_EXECUTION_MASTER_PLAN.md)

## Scope

- Super-admin auth:
  - real `/admin/login`
  - documented bootstrap path for admin users
  - route/session guard parity
- Admin shell:
  - layout
  - navigation
  - page consistency
- Admin backend cleanup:
  - fix queue metrics guard mismatch
  - confirm super-admin-only access across admin routes
- Admin page completion:
  - admin dashboard with business and operations KPIs
  - company onboarding / company creation from admin
  - company detail workspace
  - company detail/actions
  - subscription detail/actions
  - billing/provider incident management
  - richer usage analytics
  - queue health workspace
  - support-ticket polish
  - audit explorer
  - internal admin user/access management

## Acceptance

- admin routes are actually usable end to end
- admin auth is not a placeholder
- admin APIs and guards are consistent
- admin pages go beyond list-only debug/ops views
- admin panel is capable of running tenant onboarding, billing oversight, support operations, and platform observability

## Progress note

Completed:

- M1 — super-admin auth foundation
  - real `/admin/login`
  - dedicated admin auth endpoints under `/api/admin/auth`
  - separate admin refresh cookie/session path
  - admin route protection on the web app
  - queue metrics guard mismatch fixed
- M2 — admin shell and navigation
  - dedicated admin layout for all `/admin/*` routes
  - admin sidebar with grouped navigation
  - admin header with breadcrumbs and operator actions
  - mobile admin navigation sheet
  - clear visual separation from tenant workspace shell
- M3 — company lifecycle operations
  - admin-side company creation
  - company detail workspace
  - owner and user summary
  - GST and subscription snapshot
  - tenant health snapshot
  - suspend / reactivate company controls
- M4 — billing and subscription operations
  - enriched subscription list with company/provider context
  - subscription detail workspace
  - plan/status admin operations
  - company usage rollups on subscription detail
  - recent webhook/provider health visibility
- M5 — support, usage, and platform observability
  - live admin dashboard KPIs
  - richer usage analytics and top-company view
  - support ticket enrichment with company context and operator metadata
  - queue/job drilldown with recent failures
  - notification, webhook, and file-storage visibility

Remaining:

- no implementation slices remain inside Phase M
- remaining work after Phase M is environment-backed admin e2e execution and staging validation, not missing admin product scope
