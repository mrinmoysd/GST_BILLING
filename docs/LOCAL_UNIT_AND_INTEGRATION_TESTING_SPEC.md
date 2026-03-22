# Local Unit and Integration Testing Specification

**Date**: 2026-03-23  
**Purpose**: Define how unit and integration testing should work locally for this solution.

This document is focused on **local developer testing**, not staging or full browser launch validation.

---

## Objective

Provide a clear local testing model for:

- fast unit feedback
- DB-backed integration confidence
- module-level regression coverage
- repeatable developer workflows

This spec should be treated as the baseline for all future test additions.

---

## Testing layers

## 1. Unit tests

Unit tests should:

- run fast
- avoid real infrastructure
- isolate a single service/module behavior
- use mocks or in-memory fixtures for dependencies

Primary tool:

- Jest

Current examples in repo:

- [gst.service.spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/gst/gst.service.spec.ts)
- [billing.service.spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.service.spec.ts)
- [accounting.service.spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/accounting/accounting.service.spec.ts)
- [reports.service.spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/reports/reports.service.spec.ts)

## 2. Integration tests

Integration tests should:

- run against a real Postgres and Redis setup when needed
- boot the Nest app or targeted module with real persistence
- verify multi-service and transaction behavior
- prove domain flows, not just isolated methods

Primary tool:

- Jest e2e config under [jest-e2e.json](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/jest-e2e.json)

Current examples in repo:

- [app.e2e-spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/app.e2e-spec.ts)
- [masters.e2e-spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/masters.e2e-spec.ts)
- [invoices.e2e-spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/invoices.e2e-spec.ts)
- [purchases.e2e-spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/purchases.e2e-spec.ts)
- [reports-exports.e2e-spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/reports-exports.e2e-spec.ts)
- [platform-integrations.e2e-spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/platform-integrations.e2e-spec.ts)

---

## Local environment requirements

## For unit tests

Required:

- Node.js
- npm install complete

Usually not required:

- Postgres
- Redis

## For integration tests

Required:

- Postgres
- Redis
- migrations applied
- correct environment variables

Convenient local setup from repo:

```bash
docker compose up -d postgres redis
```

Then:

```bash
npm --workspace apps/api run prisma:generate
npm --workspace apps/api run prisma:migrate:dev
```

---

## Local test commands

## Fast local developer baseline

```bash
npm --workspace apps/api run typecheck
npm --workspace apps/api run test
npm --workspace apps/web run lint
```

## Full API unit pass

```bash
npm --workspace apps/api run test
```

## Targeted unit tests

```bash
npx jest apps/api/src/gst/gst.service.spec.ts --runInBand
npx jest apps/api/src/accounting/accounting.service.spec.ts --runInBand
npx jest apps/api/src/reports/reports.service.spec.ts --runInBand
```

## Full API integration pass

```bash
npm --workspace apps/api run test:e2e
```

## Targeted integration tests

```bash
npx jest --config apps/api/test/jest-e2e.json apps/api/test/invoices.e2e-spec.ts --runInBand
npx jest --config apps/api/test/jest-e2e.json apps/api/test/purchases.e2e-spec.ts --runInBand
npx jest --config apps/api/test/jest-e2e.json apps/api/test/platform-integrations.e2e-spec.ts --runInBand
```

---

## What belongs in unit tests

Unit tests should cover:

- pure or near-pure business logic
- contract shaping
- aggregation logic
- failure branching
- permission mapping
- accounting/GST calculations

Good candidates:

- GST split logic
- report DTO shaping
- admin role permission mapping
- accounting journal composition
- billing webhook signature validation logic
- notification routing decision logic

Unit tests should not depend on:

- real DB rows
- Redis connectivity
- external HTTP calls

---

## What belongs in integration tests

Integration tests should cover:

- repository + service + controller path working together
- transaction boundaries
- DB writes and reads
- stock movement side effects
- journal creation side effects
- export job persistence
- file metadata persistence
- auth/session behavior

Good candidates:

- onboarding bootstrap
- invoice issue -> payment -> lifecycle
- purchase receive -> stock movement
- GST export job creation
- admin company create
- admin subscription operation
- internal admin user create/update
- audit log persistence after privileged actions

---

## Recommended local workflow by change type

## UI-only change

Run:

```bash
npm --workspace apps/web run lint
npx next build --webpack
```

If route behavior changed:

```bash
npx playwright test --list
```

## Service logic change

Run:

```bash
npm --workspace apps/api run typecheck
npx jest <target-spec> --runInBand
```

## Domain flow change touching DB

Run:

```bash
npm --workspace apps/api run typecheck
npx jest <target-unit-spec> --runInBand
npx jest --config apps/api/test/jest-e2e.json <target-e2e-spec> --runInBand
```

## Cross-cutting release-sensitive change

Run:

```bash
npm --workspace apps/api run typecheck
npm --workspace apps/api run build
npm --workspace apps/api run test
npm --workspace apps/api run test:e2e
npm --workspace apps/web run lint
npx next build --webpack
```

---

## Module-by-module coverage expectations

## Auth and onboarding

### Unit

- login credential validation paths
- refresh token rejection logic
- reset-password token validation

### Integration

- onboarding bootstrap creates:
  - company
  - owner user
  - invoice series
  - authenticated session
- login/refresh/logout path

## Masters

### Unit

- duplicate handling and DTO normalization

### Integration

- create/list/update/delete for:
  - categories
  - customers
  - suppliers
  - products

## Inventory

### Unit

- low-stock computation
- stock adjustment validation

### Integration

- stock movements created from:
  - purchase receive
  - purchase return
  - invoice issue
  - sales return
  - manual adjustment

## Sales

### Unit

- invoice totals
- GST persistence shaping
- lifecycle event composition

### Integration

- create draft
- issue invoice
- payment record
- credit note
- sales return
- PDF regenerate job creation
- accounting side effects

## Purchases

### Unit

- total/tax shaping
- payable calculations

### Integration

- create draft
- receive purchase
- payment
- bill attachment metadata
- purchase return
- accounting + stock side effects

## GST and reports

### Unit

- GST summary shaping
- report DTO shaping

### Integration

- report endpoints return normalized contracts
- export jobs are created and persisted correctly

## Accounting

### Unit

- journal generation rules
- trial balance/P&L/balance sheet shaping

### Integration

- business actions create expected journals
- period lock behavior

## Platform integrations

### Unit

- billing signature and provider mapping logic
- notification dispatch decision logic
- admin permission mapping

### Integration

- webhook event persistence
- subscription changes
- file metadata persistence
- export jobs and queue metrics
- admin audit persistence

## Admin

### Unit

- internal admin role bundles
- audit log mapping/formatting

### Integration

- admin auth
- admin company lifecycle actions
- subscription operations
- internal admin user create/update
- audit logs returned after actions

---

## Fixture and data strategy

## Unit tests

Use:

- literal fixtures
- factory helpers
- mocked Prisma or mocked services

Keep fixtures:

- explicit
- small
- deterministic

## Integration tests

Use:

- dedicated test tenant/company
- isolated test data per spec
- deterministic IDs where practical
- cleanup between tests

Preferred strategies:

- transactional rollback if test structure supports it
- otherwise truncate/reset known tables between suites

---

## Local test data principles

- do not rely on developer personal data
- do not rely on stale local DB state
- do not rely on manually created rows
- test setup should create the minimum data it needs

Recommended seed layers:

- auth/bootstrap seed for quick local manual testing
- test-specific factories for automated tests

---

## Redis and queue testing locally

Because the API uses BullMQ:

- Redis must be reachable for queue-backed integration behavior
- queue tests should verify:
  - job enqueue
  - job status persistence
  - queue metrics visibility

Do not require PDF binary content validation in every integration test. Instead:

- verify job creation and status path in most tests
- validate actual generated files only in focused integration or manual QA passes

---

## Local failure triage rules

If a unit test fails:

- fix logic or fixture assumptions first

If an integration test fails:

- verify Postgres and Redis are up
- verify migrations are current
- verify env vars point to the intended local test DB
- verify no stale local data is breaking uniqueness assumptions

If test output is flaky:

- remove time-sensitive assumptions
- avoid order dependence unless ordering is the explicit behavior under test

---

## Required local gates before merge

## Small change

- targeted unit test
- typecheck
- lint/build as relevant

## Medium backend change

- targeted unit tests
- targeted integration test if DB behavior changed
- API build/typecheck

## High-risk change

- full API unit pass
- targeted or full integration pass
- web build/lint if contracts changed

High-risk examples:

- auth/session logic
- invoice/purchase/accounting flows
- GST/report contracts
- billing/webhook logic
- admin governance logic
- schema changes

---

## Existing gaps in local testing

Current repo already has meaningful coverage, but local testing is still incomplete in these areas:

- broader admin integration coverage
- onboarding integration coverage
- stronger direct inventory integration coverage
- more explicit notification/file integration assertions
- deeper period-lock regression coverage

These should be added incrementally rather than waiting for a single large test phase.

---

## Definition of done for future test additions

A new test addition should be considered complete only if:

- the test has a clear owner module
- it is deterministic locally
- it can be run with a targeted command
- it fits the correct layer:
  - unit
  - integration
- it protects a real regression risk

---

## References

- [TESTING.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/TESTING.md)
- [E2E_MANUAL_TEST_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/E2E_MANUAL_TEST_PLAN.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)

