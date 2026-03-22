# M6 — Audit, Governance, and Internal Admin Management

Status:

- Completed on 2026-03-22

Outcome:

- the admin panel now has a real governance layer: internal admin role support, internal admin user management, dedicated privileged-action audit storage, and matching admin UI routes

Delivered:

- internal admin role catalog and permission bundles in [admin-roles.constants.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-roles.constants.ts)
- governance service for internal admin users and audit logs in [admin-governance.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-governance.service.ts)
- admin governance APIs in:
  - [admin-internal-users.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-internal-users.controller.ts)
  - [admin-audit.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-audit.controller.ts)
- admin auth expanded from super-admin-only to internal admin role support in:
  - [auth.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/auth.service.ts)
  - [jwt-refresh.strategy.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/strategies/jwt-refresh.strategy.ts)
  - [super-admin.guard.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/super-admin.guard.ts)
- privileged admin action logging added to company, subscription, and support workflows in:
  - [admin-companies.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-companies.controller.ts)
  - [admin-subscriptions.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-subscriptions.controller.ts)
  - [admin-support-tickets.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-support-tickets.controller.ts)
- dedicated audit table/model in:
  - [schema.prisma](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/prisma/schema.prisma)
  - [migration.sql](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/prisma/migrations/20260322221500_phase_m6_internal_admin_governance/migration.sql)
- admin governance UI in:
  - [page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/internal-users/page.tsx)
  - [page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/audit-logs/page.tsx)
  - [admin-nav.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/components/admin/admin-nav.tsx)
  - [hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/admin/hooks.ts)
- admin smoke coverage in [admin.spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/tests/admin.spec.ts)

Verification:

- `npm --workspace apps/api run prisma:generate`
- `npm --workspace apps/api run typecheck`
- `npm --workspace apps/api run build`
- `npm --workspace apps/web run lint`
- `npx next build --webpack` in `apps/web`

Notes:

- M6 completes the implementation scope of the admin track
- remaining work after M6 is validation depth and live-environment execution, not missing admin feature foundations
