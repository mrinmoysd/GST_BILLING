# Phase C — Onboarding, Auth, and Company Setup

**Date**: 2026-03-18

## Summary
- Goal: Enable self-serve tenant setup from first visit to a usable company dashboard.
- Outcome: Delivered the onboarding bootstrap flow, password reset flow, staged GSTIN verification, and real company logo upload.

## Scope delivered
- [x] Added public onboarding bootstrap backend endpoint
- [x] Added frontend `/onboarding` flow and `/signup` redirect
- [x] Created company, owner user, default invoice series, and authenticated session in one flow
- [x] Added deep-link-safe login redirect handling
- [x] Added forgot-password and reset-password flows
- [x] Added staged GSTIN verification from company settings
- [x] Added company logo upload from onboarding and settings

## What changed
### Code
- Added onboarding API module, DTOs, controller, and service
- Added onboarding, signup, forgot-password, and reset-password frontend routes
- Extended auth service/controller for password reset
- Extended companies API with GSTIN verification and logo upload/download endpoints
- Updated company settings and onboarding UI to support staged verification and logo upload

### Database / migrations
- None

### API contract
- Added `/api/onboarding/bootstrap`
- Added `/api/auth/forgot-password`
- Added `/api/auth/reset-password`
- Added `/api/companies/:companyId/verify-gstin`
- Added `/api/companies/:companyId/logo`
- Added `GET /api/companies/:companyId/logo`

### UI
- New users can now reach an authenticated workspace without manual seeding
- Password reset is available from the login flow
- Company settings support direct logo upload instead of URL-only setup

## Quality gates
- Build: PASS (`npx next build --webpack`, `npm run build`)
- Lint/Typecheck: PASS (`npm run lint`, `npm run typecheck`)
- Unit tests: NOT RUN
- E2E/Smoke: NOT RUN

## Risks / known gaps
- GSTIN verification is staged and does not call a real external verification provider yet
- Password reset currently returns development-oriented reset details rather than sending email
- Onboarding is operationally complete, but a later phase may still turn it into a richer multi-step wizard

## Next phase
- Phase D — RBAC and settings completeness
