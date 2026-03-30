# RBAC Phase 2 to Phase 5 Completion Plan

Date: 2026-03-29  
Status: Implemented at code/build level

## Objective

Finish the RBAC program after Phase 1 by closing the remaining high-value gaps:

- direct page access in the tenant app
- permission-mapping drift between UI and backend
- coarse admin backend authorization
- over-broad built-in role access
- lack of repeatable RBAC surface validation

## Validation Done Before Implementation

Before making changes, the remaining gaps were re-checked in the current codebase:

- tenant app layouts authenticated users, but did not enforce page-level permissions on direct URLs
- admin layout authenticated users, but also did not enforce page-level permissions on direct URLs
- shell visibility and quick-create permissions were still using some view-level permissions where the target page needed manage-level access
- field-sales navigation was still keyed off `sales.view` and `settings.view` instead of `field_sales.*`
- settings read endpoints still used generic `settings.view` even when the pages themselves were operationally manage-only
- admin APIs were still protected only by `SuperAdminGuard`, not by fine-grained admin permission bundles
- the built-in salesperson role still had direct `masters.manage`, `sales.manage`, and `payments.manage`, which was broader than the field-sales-first model now implemented

## Phase 2: App Route-Level Permission Gating

Status: Completed

Implemented:

- shared tenant route-access rules in [company-route-access.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/auth/company-route-access.ts)
- shared admin route-access rules in [route-access.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/admin/route-access.ts)
- direct page access gating in [layout.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/layout.tsx)
- direct page access gating in [admin/layout.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/layout.tsx)
- shared denied-state UI in [access-denied-state.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/components/ui/access-denied-state.tsx)

Result:

- direct URLs now stop at the layout level instead of relying only on hidden navigation

## Phase 3: Permission-Mapping Alignment

Status: Completed

Implemented:

- shared permission-match helper in [permissions.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/auth/permissions.ts)
- workflow-shell alignment in [company-shell-config.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/components/app/company-shell-config.tsx)
- quick-create actions now use manage-level permissions
- field-sales workflow now uses `field_sales.*` permissions
- settings field-sales entry now uses `field_sales.manage_masters` in [settings/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/page.tsx)
- admin navigation is now permission-aligned for every item in [admin-nav.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/components/admin/admin-nav.tsx)
- settings read endpoints were tightened to page-intent-specific permissions in:
  - [companies.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/companies/companies.controller.ts)
  - [billing.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.controller.ts)
  - [invoice-series.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/invoices/invoice-series.controller.ts)
  - [notifications.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/notifications/notifications.controller.ts)

Result:

- the app shell, direct page access, and settings backend reads are now much closer to the same permission contract

## Phase 4: Built-In Role Bundle Review

Status: Completed in safe launch scope

Implemented:

- tightened the built-in salesperson role in [rbac.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/rbac/rbac.service.ts)

Changes made:

- removed `masters.manage`
- removed `sales.manage`
- removed `payments.manage`
- kept view-level access plus field-sales-specific permissions

Intentional non-changes:

- `owner` and `admin` remain broad in this pass
- `staff` remains broad in this pass

Reason:

- changing owner/admin/staff semantics without product policy signoff would create more regression risk than security value right before staging

## Phase 5: Repeatable RBAC Validation

Status: Completed in lightweight form

Implemented:

- RBAC surface validator script in [validate-rbac-surface.mjs](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/scripts/validate-rbac-surface.mjs)

Current checks:

- tenant controllers missing `PermissionGuard`
- admin controllers missing `AdminPermissionGuard`
- company page routes missing route-access coverage
- admin page routes missing route-access coverage

## Residual Items

These are still intentionally left after the current pass:

- [files.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/files/files.controller.ts) still needs a proper resource-ownership permission contract
- owner/admin/staff role redesign is still a product-policy decision, not just a code task
- true role-by-role browser smoke tests are still recommended in staging

## Validation Run

Validated in this pass with:

- `npm --workspace apps/api run typecheck`
- `npm --workspace apps/api run build`
- `npm --workspace apps/web run lint`
- `npm --workspace apps/web run build`
- `node scripts/validate-rbac-surface.mjs`

## Plain-English Result

The RBAC program is now much closer to production shape:

- tenant backend business APIs are permission-enforced
- direct tenant/admin page access is permission-gated
- admin backend controllers are no longer only coarse-guarded
- the shell and quick-create permissions are aligned with actual page intent
- the salesperson role is no longer over-broad for the current product model

The main remaining work is no longer “RBAC is missing.” It is now “finish the last utility endpoint contract and run staged role smoke tests.”
