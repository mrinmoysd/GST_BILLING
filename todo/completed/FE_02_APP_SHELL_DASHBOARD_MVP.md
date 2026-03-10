# FE-02 — App shell + dashboard MVP

**Date**: 2026-03-07

## Summary
- Goal: Deliver the first usable **company-scoped app shell** with a dashboard page that’s not a placeholder dead-end.
- Outcome: `/c/[companyId]/*` routes now render inside a consistent shell (sidebar + topbar), and the dashboard provides MVP cards + quick actions.

## Scope delivered
- [x] `AppShell` layout for company routes (sidebar navigation + header)
- [x] Company context shown from session (company name) + route/company mismatch redirect
- [x] Topbar account menu with logout
- [x] Dashboard MVP page inside the shell
- [x] Placeholder pages for shell navigation targets (prevents 404s)
- [x] Build/typecheck verified for `apps/web`

## What changed

### Frontend routes
- Added route group layout: `apps/web/src/app/(app)/c/[companyId]/layout.tsx`
  - Sidebar nav + topbar.
  - Displays company name from session when available.
  - Includes basic Account menu with Logout.
- Dashboard moved to shell:
  - `apps/web/src/app/(app)/c/[companyId]/dashboard/page.tsx`
- Added FE-02 placeholders (to be implemented in later iterations):
  - `apps/web/src/app/(app)/c/[companyId]/masters/customers/page.tsx`
  - `apps/web/src/app/(app)/c/[companyId]/masters/suppliers/page.tsx`
  - `apps/web/src/app/(app)/c/[companyId]/masters/products/page.tsx`
  - `apps/web/src/app/(app)/c/[companyId]/sales/invoices/page.tsx`
  - `apps/web/src/app/(app)/c/[companyId]/sales/invoices/new/page.tsx`
  - `apps/web/src/app/(app)/c/[companyId]/purchases/page.tsx`
  - `apps/web/src/app/(app)/c/[companyId]/inventory/page.tsx`
  - `apps/web/src/app/(app)/c/[companyId]/accounting/page.tsx`
  - `apps/web/src/app/(app)/c/[companyId]/reports/page.tsx`
  - `apps/web/src/app/(app)/c/[companyId]/settings/page.tsx`

### Cleanup
- Removed legacy FE-00 route tree under `apps/web/src/app/c/*` to avoid Next.js parallel route conflicts.

## Acceptance checks
- [x] User lands on dashboard after login (no 404, consistent layout)
- [x] Sidebar links render and resolve to real pages (placeholders where needed)

## Quality gates
- Build: PASS (`apps/web` next build)
- Lint/Typecheck: PASS (via Next build TypeScript)
- Unit tests: N/A (no test framework added yet for FE)

## Notes / known gaps
- Dashboard stats are currently display placeholders ("—") until a dedicated dashboard API contract is defined (or we compose existing report endpoints).
- Next.js shows a warning about `middleware` convention being deprecated in favor of `proxy`. Auth protection still works for dev; migration can be done later as a targeted cleanup.
- The app shell currently performs a small client-side safety redirect if the URL `companyId` doesn’t match the session’s company (to avoid cross-company confusion during dev).

## Next iteration
- FE-03: Customers + Suppliers CRUD + list/detail screens + hooks.
