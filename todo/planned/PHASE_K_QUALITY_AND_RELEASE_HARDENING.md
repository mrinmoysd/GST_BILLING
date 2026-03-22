# Phase K — Quality and Release Hardening

**Status**: Completed
**Priority**: P0 before major release

## Goal

Raise confidence and operational readiness before large-scale release.

## Scope

- Expand API e2e coverage
- Expand frontend Playwright coverage
- Add GST golden fixtures
- Add accounting and posting regression coverage
- Review performance on reports and lists
- Review observability and support diagnostics
- Review release and migration readiness

## Deliverables

- Stronger automated test suite
- Release-readiness checklist
- Operational confidence improvements

## Definition of done

- Critical product and compliance flows are protected by automated tests and production-readiness checks

## Dependencies

- All major business phases

## Completion Notes

- Added GST and billing unit-level regression coverage for tax-split logic and webhook-signature processing.
- Added platform-integration e2e coverage covering notifications, files, and admin audit history.
- Added POS Playwright coverage for the new retail workflow and receipt surface.
- Added release-readiness and testing documentation for build, migration, env, and operational checks.
- Replaced deprecated Next.js `middleware` usage with `proxy`.
- Added validation for the newer billing, file-storage, and notification environment variables.
