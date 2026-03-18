# Phase E — Core Workflow UX Overhaul

**Date**: 2026-03-18

## Summary
- Goal: Close the remaining workflow-specific UX gaps on top of the completed Phase B foundation.
- Outcome: Delivered live dashboard composition, dedicated payments and inventory workflow surfaces, and stronger invoice workflow state visibility.

## Scope delivered
- [x] Wired dashboard KPIs from live report endpoints
- [x] Added recent activity composition from invoices, purchases, and payments
- [x] Added a dedicated payments workspace and navigation entry
- [x] Added dedicated inventory movements and adjustments pages
- [x] Upgraded the inventory hub to route into operational workflow pages
- [x] Added invoice tax-breakdown visibility in the draft builder
- [x] Added invoice PDF regeneration job-status tracking in invoice detail
- [x] Fixed stock-adjustment frontend payload mapping to match the API contract

## What changed
### Code
- Updated dashboard data composition and operational cards
- Added `/c/[companyId]/payments`
- Added `/c/[companyId]/inventory/movements`
- Added `/c/[companyId]/inventory/adjustments`
- Updated invoice builder and invoice detail workflow surfaces
- Updated frontend inventory and job hooks to support the new behavior

### Database / migrations
- None

### API contract
- No backend endpoint additions
- Frontend now consumes existing report, jobs, payments, and inventory endpoints more completely

### UI
- Dashboard is no longer placeholder-driven
- Payments now have a first-class operational surface
- Inventory has dedicated workflow pages beyond the low-stock overview
- Invoice workflow UX now exposes tax and async PDF state more clearly

## Quality gates
- Build: PASS (`npx next build --webpack`)
- Lint/Typecheck: PASS (`npm run lint`)
- Unit tests: NOT RUN
- E2E/Smoke: NOT RUN

## Risks / known gaps
- Dashboard metrics are still composed client-side from existing endpoints rather than from a dedicated dashboard API
- Payments and inventory surfaces are operationally complete for the current MVP, but later phases may deepen domain behavior and data richness
- The existing Next.js middleware deprecation warning remains unrelated to this phase

## Next phase
- Phase C — Onboarding, auth, and company setup
