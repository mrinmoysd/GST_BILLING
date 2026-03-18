# Phase C — Onboarding, Auth, and Company Setup

**Status**: Completed
**Priority**: P1

## Goal

Enable self-serve tenant setup from first visit to a usable company dashboard.

## Scope

- Public company creation flow
- First user/company bootstrap
- Onboarding route group and wizard
- GSTIN verification flow
- Invoice settings setup during onboarding
- Logo upload or staged logo support
- Reset-password flow
- Logout route parity and session cleanup polish
- Deep-link-safe login redirect handling

## Deliverables

- Backend onboarding endpoints
- Frontend onboarding flow
- Complete auth/session setup UX

## Definition of done

- A new user can create a company and reach a configured dashboard without manual seed data

## Dependencies

- Phase A
- Phase B for shell and form quality

## Progress note

Completed in the current slice:
- public onboarding bootstrap backend endpoint
- frontend `/onboarding` flow and `/signup` redirect
- owner user + company + default invoice series bootstrap in one transaction
- immediate authenticated session after onboarding
- safer login redirect handling
- forgot/reset-password flow
- staged GSTIN verification flow
- real company logo upload from onboarding and settings

Follow-up polish can still happen later without reopening Phase C:
- fuller multi-step onboarding wizard presentation
