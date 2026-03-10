# Phase 08 — Frontend (FE-00 Bootstrap)

**Date**: 2026-03-06

## Summary
- Goal: Bootstrap the frontend workspace (`apps/web`) and establish the initial route skeleton required to start Phase 08 execution.
- Outcome: A runnable Next.js app exists with baseline routes and frontend quality gates (lint + build) passing.

## Scope delivered
- [x] Next.js App Router frontend created at `apps/web/`
- [x] Tailwind + ESLint enabled (create-next-app template)
- [x] Baseline routes created:
  - [x] `/` (landing page)
  - [x] `/login`
  - [x] `/c/[companyId]/dashboard`
  - [x] `/admin/login`
- [x] Frontend quality gates verified: `lint` + `build`

## What changed

### Code
- Added `apps/web` Next.js application (TypeScript, Tailwind, ESLint).
- Added placeholder pages to match Phase 08 routing needs:
  - `apps/web/src/app/login/page.tsx`
  - `apps/web/src/app/c/[companyId]/dashboard/page.tsx`
  - `apps/web/src/app/admin/login/page.tsx`
- Updated home page to link to the placeholder routes:
  - `apps/web/src/app/page.tsx`

### Database / migrations
- None (frontend-only iteration).

### API contract
- None changed.
- Note: This iteration intentionally does **not** call the API yet. API client + auth wiring starts in FE-01.

### UI (if applicable)
- Placeholder UI only (static content) for login, company dashboard, and admin login.

## Quality gates
- Build: PASS (`apps/web` `next build`)
- Lint/Typecheck: PASS (`apps/web` `eslint`, Next build TypeScript pass)
- Unit tests: N/A (no tests added in FE-00)
- E2E/Smoke: N/A (planned later; FE-08/FE cross-cutting stream)

## Risks / known gaps
- Auth/session handling not implemented yet (planned FE-01).
- No shared component library (shadcn/ui components) added yet beyond Tailwind baseline.
- Workspace note: `create-next-app` emitted a Node engine warning from a transitive dependency requiring newer Node; current build still succeeds.

## Next phase
- FE-01: implement `apiClient`, auth session (login/refresh/logout), and route protection.
