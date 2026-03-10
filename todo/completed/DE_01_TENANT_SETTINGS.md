# DE-01 — Tenant Settings (Completion Note)

**Date**: 2026-03-07

This iteration unblocked tenant Settings by adding the missing backend APIs and wiring full frontend pages under `/(app)/c/[companyId]/settings/*`.

## What shipped

### Backend (NestJS)

- Company settings
  - `GET /api/companies/:companyId`
  - `PATCH /api/companies/:companyId`
  - Guarded by `JwtAccessAuthGuard` + `CompanyScopeGuard`
  - DTO validation for core fields (GSTIN/PAN/state_code/business_type, etc.)

- Invoice series
  - `GET /api/companies/:companyId/invoice-series`
  - `POST /api/companies/:companyId/invoice-series`
  - `PATCH /api/companies/:companyId/invoice-series/:seriesId`
  - `DELETE /api/companies/:companyId/invoice-series/:seriesId`
  - Delete returns **409** when invoices exist for the series

- Users & roles (tenant)
  - `GET /api/companies/:companyId/users`
  - `POST /api/companies/:companyId/users` (invite)
  - `PATCH /api/companies/:companyId/users/:userId`
  - `GET /api/companies/:companyId/roles`
  - Protected by `CompanyAdminGuard` (owner/admin only)
  - Invite is **dev-mode**: creates user + returns temporary password in response

- Subscription (already existed for MVP)
  - `GET /api/companies/:companyId/subscription`
  - `POST /api/companies/:companyId/subscription/checkout`
  - Note: `/subscription/portal` remains optional/unimplemented

### Frontend (Next.js)

- Settings hub updated:
  - `/(app)/c/[companyId]/settings`

- New Settings pages:
  - `/(app)/c/[companyId]/settings/company`
  - `/(app)/c/[companyId]/settings/invoice-series`
  - `/(app)/c/[companyId]/settings/users`
  - `/(app)/c/[companyId]/settings/subscription`

- New hooks:
  - `apps/web/src/lib/settings/companyHooks.ts`
  - `apps/web/src/lib/settings/invoiceSeriesHooks.ts`
  - `apps/web/src/lib/settings/usersHooks.ts`
  - `apps/web/src/lib/settings/subscriptionHooks.ts`

## Notes / known gaps

- Subscription provider “portal/manage billing” endpoint is not implemented yet in backend.
- User invite flow is intentionally dev-mode (temporary password returned rather than email invite).
