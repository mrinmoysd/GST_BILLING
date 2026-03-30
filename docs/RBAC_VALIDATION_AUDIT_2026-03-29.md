# RBAC Validation Audit

**Date**: 2026-03-29  
**Basis**: Code-level investigation across Prisma schema, backend auth/guards/controllers, frontend session/permission helpers, navigation, and route surfaces  
**Purpose**: Validate whether role-based access control is actually aligned across the product and identify gaps between intended permissions and real enforcement

**Phase 1 update**: Backend tenant business APIs were hardened after this audit. The current residual gaps are now frontend route gating, admin fine-grained backend enforcement, and generic utility/file endpoints.

---

## Executive Summary

The solution has a **real RBAC model**, and tenant backend enforcement is now **materially stronger after Phase 1**. RBAC is still **not complete across the whole product**.

The current state is:

- the **schema and permission model are present**
- effective access is **computed correctly for users and sessions**
- the frontend is **permission-aware for navigation**
- the backend now enforces permissions across the main tenant business controllers
- a small set of utility/admin surfaces still need finer backend permission coverage
- admin APIs use a **broad admin guard**, but do not consistently enforce finer admin permission bundles

So the current product is **closer to role-secure on the tenant backend**, but still **not fully role-secure end to end**.

The biggest remaining gaps are now:

- **a user can still be hidden from a feature in the app shell but reach some pages directly because frontend route gating is not yet systematic**
- **generic utility endpoints and admin endpoints are not yet as finely permission-scoped as the tenant business APIs**

That means RBAC is no longer only a navigation model, but it is still not yet a completely uniform authorization model.

---

## Audit Scope

This audit covered:

- Prisma RBAC schema
- tenant role and permission definitions
- effective access composition in backend session/auth code
- backend guards and permission decorators
- tenant API controller coverage
- admin API controller coverage
- frontend session permission usage
- frontend workflow shell and settings navigation gating
- route-level gating patterns in the app

---

## Source Files Reviewed

### Schema and access model

- [schema.prisma](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/prisma/schema.prisma)
- [rbac.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/rbac/rbac.service.ts)
- [auth.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/auth.service.ts)

### Backend enforcement

- [permission.guard.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/common/auth/permission.guard.ts)
- [company-scope.guard.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/common/auth/company-scope.guard.ts)
- [require-permissions.decorator.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/common/auth/require-permissions.decorator.ts)
- representative tenant controllers and admin controllers under `apps/api/src`

### Frontend permission usage

- [session.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/auth/session.tsx)
- [types.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/auth/types.ts)
- [permissions.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/auth/permissions.ts)
- [company-shell-config.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/components/app/company-shell-config.tsx)
- [settings/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/page.tsx)
- [admin-nav.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/components/admin/admin-nav.tsx)

---

## What Is Working Well

### 1. The data model supports real RBAC

The schema includes the right core tables:

- `roles`
- `permissions`
- `role_permissions`
- `user_roles`

These are defined in [schema.prisma](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/prisma/schema.prisma).

This is a legitimate RBAC base, not a fake UI-only permissions layer.

### 2. Effective access is composed centrally

The backend computes user access from:

- the primary built-in role on `user.role`
- any assigned custom roles via `user_roles`

That composition is handled in [rbac.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/rbac/rbac.service.ts).

Session payloads then expose:

- `role`
- `assigned_roles`
- `permissions`

to the frontend.

That is the correct architectural direction.

### 3. Built-in role bundles exist

The tenant app has built-in permission bundles for:

- `owner`
- `admin`
- `staff`
- `salesperson`

These are defined in [rbac.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/rbac/rbac.service.ts).

### 4. Some critical settings/admin surfaces do use backend permission enforcement

The following controller families use `PermissionGuard` plus `@RequirePermissions(...)`:

- [companies.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/companies/companies.controller.ts)
- [billing.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.controller.ts)
- [notifications.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/notifications/notifications.controller.ts)
- [invoice-series.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/invoices/invoice-series.controller.ts)
- [companies-users.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/users/companies-users.controller.ts)
- [roles.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/users/roles.controller.ts)

This means parts of settings/governance are already genuinely protected.

---

## Core Architectural Finding

The RBAC system is currently split into two different realities:

### Reality A: navigation-aware UI

The frontend hides or shows workflows and links based on `session.user.permissions`.

This is implemented in:

- [company-shell-config.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/components/app/company-shell-config.tsx)
- [settings/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/page.tsx)
- [admin-nav.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/components/admin/admin-nav.tsx)

### Reality B: partial backend authorization

Many tenant APIs do **not** check permissions at all. They only verify:

- valid JWT
- company scope match

This is done by:

- [JwtAccessAuthGuard](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/guards/jwt-access-auth.guard.ts)
- [CompanyScopeGuard](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/common/auth/company-scope.guard.ts)

That means the app can hide a feature, but the API still allows it.

This is the main RBAC gap in the current solution.

---

## Backend Audit Findings

## Tenant API Enforcement Status

### Properly permission-enforced tenant controller families

These controllers use `PermissionGuard` and route-level required permissions:

- company settings
- billing/subscription
- invoice series
- users
- roles
- notifications
- accounting
- categories
- customers
- exports
- field sales
- finance ops
- GST
- inventory
- invoice compliance
- invoices
- jobs
- migration ops
- payments
- pricing
- products
- purchases
- quotations
- reports
- delivery challans
- sales orders
- suppliers

This part is now in strong shape for tenant backend enforcement.

### Tenant controller families still missing or incomplete for tenant permission enforcement

These controllers still use only `JwtAccessAuthGuard` + `CompanyScopeGuard`:

- [files.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/files/files.controller.ts)

### Practical implication

The broad tenant-backend gap has been closed for core business APIs. The remaining tenant backend gap is concentrated in generic file utility routes, which need a more explicit ownership/access contract before they can be permission-scoped safely.

---

## Admin API Enforcement Status

Admin routes use [SuperAdminGuard](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/super-admin.guard.ts).

That guard allows access when:

- `scope === 'admin'`
- and the user has `admin.access`
- or the user has any recognized internal admin role

### What is good

- admin scope is separated from tenant scope
- internal admin roles have declared permission bundles in [admin-roles.constants.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-roles.constants.ts)

### What is missing

The admin backend does **not** appear to enforce fine-grained admin permissions per controller. In practice, most admin endpoints are protected only by the broad `SuperAdminGuard`.

### Practical implication

The admin UI hides links like:

- Internal Users
- Audit Logs

based on permission in [admin-nav.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/components/admin/admin-nav.tsx),

but the backend allows any internal admin role that passes `SuperAdminGuard`.

So the admin side has the same pattern:

- **navigation-level permission awareness**
- **coarse backend authorization**

---

## Frontend Audit Findings

## 1. Frontend permission checks are mostly navigation checks

The frontend permission helpers are minimal and correct:

- [permissions.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/auth/permissions.ts)

But they are used mainly for:

- shell visibility
- workflow visibility
- settings cards
- admin nav visibility

They are **not** widely used to protect page rendering itself.

### Result

A user can often:

- type a route directly
- load the page
- and then rely on whatever the backend allows

If the backend is not permission-guarded, the route effectively becomes accessible.

---

## 2. There is no generic route-level permission gate for tenant pages

The search across `apps/web/src/app/(app)/c/[companyId]` shows very little direct permission enforcement in page components.

The notable exception is the settings overview page, which filters cards using `hasPermission(...)`.

Most detail, list, and create pages do **not** block rendering when the user lacks access.

### Result

The frontend is currently acting more like:

- “show/hide menu items”

than:

- “enforce page access”

---

## 3. Permission mapping is inconsistent across the app shell

### Example: field sales workflow

In [company-shell-config.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/components/app/company-shell-config.tsx):

- `Today` uses `sales.view`
- `DCR` uses `sales.view`
- `Assignments` uses `settings.view`

But the RBAC model defines dedicated field sales permissions:

- `field_sales.manage_masters`
- `field_sales.view_team_worklists`
- `field_sales.log_visits`
- `field_sales.submit_dcr`
- `field_sales.review_dcr`
- `field_sales.view_reports`

Those permissions exist in [rbac.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/rbac/rbac.service.ts), but the shell does not actually use them.

### What this means

Field-sales permissions are defined in the RBAC model but are not consistently used in the app surface.

---

## 4. Quick create uses view permissions instead of manage permissions

In [company-shell-config.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/components/app/company-shell-config.tsx), quick-create items use:

- `sales.view` for new invoice / order / quotation
- `purchases.view` for new purchase
- `masters.view` for new customer / new product

These are create actions, so they should normally require:

- `sales.manage`
- `purchases.manage`
- `masters.manage`

### What this means

The app shell currently overexposes create flows to users who may only have view-level intent.

---

## 5. Settings shell links are broader than settings detail permissions

In [company-shell-config.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/components/app/company-shell-config.tsx), the Settings workflow shows several links with only `settings.view`.

But the settings landing page in [settings/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/page.tsx) is much stricter and uses specific manage permissions like:

- `settings.company.manage`
- `settings.roles.manage`
- `settings.users.manage`
- `settings.subscription.manage`
- `settings.notifications.manage`

### What this means

The settings app has two different permission models:

- shell-level broad visibility
- settings-page card-level specific visibility

This inconsistency will confuse users and make QA harder.

---

## 6. Specific mismatch: field sales settings card

In [settings/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/page.tsx), the field sales settings card uses:

- `masters.manage`

But the field sales shell link uses:

- `settings.view`

And the backend field-sales controller currently uses:

- no `PermissionGuard`

### What this means

This feature currently has **three different access stories** across model, UI, and API.

That is a real alignment gap.

---

## Role Bundle Findings

## 1. `owner` and `admin` are currently identical

In [rbac.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/rbac/rbac.service.ts), both built-in roles receive `ALL_PERMISSION_CODES`.

### Implication

The product currently does not distinguish “business owner” from “company administrator.”

That may be acceptable for now, but it is not a deeply differentiated role model.

## 2. `salesperson` is broader than expected

The built-in `salesperson` role currently includes:

- `masters.manage`
- `sales.manage`
- `payments.manage`
- `reports.view`

### Implication

For many businesses, a field salesperson would not be expected to:

- edit master data broadly
- perform full billing changes
- access broad reporting

This may be intentional, but it is a likely over-permissioning risk.

## 3. `staff` includes managerial field-sales permissions

The built-in `staff` bundle includes:

- `field_sales.review_dcr`
- `field_sales.manage_masters`

### Implication

This bundle looks operationally broad and may blur back-office staff with managerial users.

---

## Gap Summary

## High Severity Gaps

### G1. Tenant business APIs are not consistently permission-protected

This is the most serious RBAC gap.

If a tenant user is authenticated and scoped to the company, many create/update/report actions are likely still available even if the UI hides them.

### G2. Admin APIs are broadly protected, not permission-specific

Any internal admin role that passes `SuperAdminGuard` may reach admin endpoints beyond what the nav suggests.

### G3. Frontend route access is not widely enforced

Most pages do not block direct access based on permissions.

---

## Medium Severity Gaps

### G4. Permission mapping is inconsistent in the shell

- view vs manage is mixed up
- field-sales specific permissions are not really used
- settings shell and settings hub disagree

### G5. Built-in role bundles likely need tightening

Especially:

- `salesperson`
- `staff`

---

## Low Severity Gaps

### G6. Role semantics are not yet fully differentiated

`owner` and `admin` are effectively the same today.

---

## Production Readiness Verdict

**RBAC is not fully production-safe yet, but it is materially closer after Phase 1 backend hardening.**

More precisely:

- the **RBAC model** is production-capable
- the **tenant backend enforcement** is now much stronger
- the **overall RBAC enforcement** is not yet production-complete

The app currently behaves like a system with:

- strong company scoping
- strong tenant-backend permission enforcement
- UI-level permission awareness

That is still not enough for a fully role-sensitive production ERP/distribution product because frontend and admin gaps remain.

---

## Recommended Remediation Order

## Phase 1: Close backend authorization gaps first

Status: Completed for tenant business controllers except generic file utilities. Detailed mapping and rollout notes are in [RBAC_PHASE1_BACKEND_HARDENING_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/RBAC_PHASE1_BACKEND_HARDENING_PLAN.md).

Add `PermissionGuard` and `@RequirePermissions(...)` to all tenant business controllers, especially:

- invoices
- payments
- sales orders
- quotations
- products
- customers
- suppliers
- inventory
- accounting
- reports
- field sales
- pricing
- migration ops
- finance ops

This was the single highest-value fix and is now in place for the main tenant business surface.

## Phase 2: Add route-level permission guards in the app

Status: Completed. Tenant and admin layouts now apply route-level permission gating before rendering direct URLs.

Create a shared page-access wrapper so direct URLs cannot bypass navigation hiding.

## Phase 3: Align permission mapping in the shell

Status: Completed. Shell workflows, quick-create, field-sales navigation, settings links, and admin nav were aligned to route/backend intent.

Examples:

- use `sales.manage` for invoice/order/quotation creation
- use `purchases.manage` for purchase create
- use `masters.manage` for create master actions
- use `field_sales.*` permissions for field-sales screens
- align settings shell links with their actual required permissions

## Phase 4: Revisit built-in role bundles

Status: Completed in safe launch scope. The salesperson bundle was tightened; broader owner/admin/staff redesign was intentionally deferred until business policy is clarified.

Recommended review targets:

- separate `owner` and `admin`
- tighten `salesperson`
- clarify whether `staff` should have managerial field-sales permissions

## Phase 5: Add automated RBAC validation

Status: Completed in lightweight form via [validate-rbac-surface.mjs](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/scripts/validate-rbac-surface.mjs).

Introduce:

- backend permission tests per controller family
- frontend route-access smoke tests by role
- a permission matrix doc tied to actual routes/endpoints

---

## Plain-English Verdict

Does the solution have RBAC?

**Yes.**

Is the RBAC model thought through?

**Mostly yes.**

Is RBAC actually enforced across the entire solution today?

**No.**

The current system is strongest at:

- computing permissions
- showing permission-aware navigation

It is weakest at:

- enforcing those permissions consistently in APIs
- blocking direct page access in the app
- aligning UI permission names with actual feature intent

So the main next step is not to redesign the role model first. It is to **finish enforcement**.
