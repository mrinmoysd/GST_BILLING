# Phase D — RBAC and Settings Completeness

**Date**: 2026-03-22

## Summary
- Goal: Replace the MVP role model with production-grade permissions and complete tenant administration workflows.
- Outcome: Activated the dormant RBAC schema, exposed real roles and user-access APIs, enforced permissions on tenant settings endpoints, and shipped the missing roles/settings UI.

## Scope delivered
- [x] Added a company permission inventory and built-in role permission mapping
- [x] Added role create/update/delete/list APIs on top of the existing RBAC tables
- [x] Added user invite/update flows with primary role plus custom role assignments
- [x] Added permission-aware auth/session payloads for login, onboarding, and `/auth/me`
- [x] Added permission enforcement for company, invoice-series, notifications, billing, users, and roles settings APIs
- [x] Added a dedicated roles settings page and upgraded the users settings page to a real access editor
- [x] Added permission-aware frontend settings/navigation behavior
- [x] Added lightweight admin activity logging for role and user administration changes

## What changed
### Code
- Added `RbacService`, `RbacModule`, permission decorator, and permission guard
- Extended users and roles controllers to use the RBAC service instead of MVP string-role handling
- Extended auth and onboarding session payloads with assigned roles and effective permissions
- Added frontend permission helpers, permission-aware shell/settings filtering, and a new roles route

### Database / migrations
- No new schema migration required
- Phase D activates the already-present RBAC tables introduced earlier in the repo

### API contract
- Expanded `/api/companies/:companyId/roles` into full CRUD
- Added `/api/companies/:companyId/roles/permissions`
- Expanded `/api/companies/:companyId/users` responses to include assigned roles and permissions
- Expanded user invite/update payloads to support `primary_role` and `role_ids`
- `/api/auth/login`, `/api/auth/me`, and onboarding session payloads now include `assigned_roles` and `permissions`

### UI
- Added `/c/[companyId]/settings/roles`
- Replaced prompt-based user access changes with a real editor
- Settings and company navigation now hide unauthorized sections based on effective permissions

## Quality gates
- Build: PASS (`npx next build --webpack`, `npm run build`)
- Lint/Typecheck: PASS (`npm run lint`, `npm run typecheck`)
- Unit tests: NOT RUN
- E2E/Smoke: NOT RUN

## Risks / known gaps
- Admin activity logging is currently stored as lightweight JSON on company settings rather than in a dedicated audit table
- Built-in permissions are code-defined; later phases may still need a stricter permission migration strategy and test coverage
- Domain workflows outside tenant settings are not fully permission-segmented yet; this phase focuses on tenant administration and settings completeness

## Next phase
- Phase F — Sales and purchase lifecycle completion
