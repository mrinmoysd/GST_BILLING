# Pre-Launch Execution Plan

**Date**: 2026-03-22  
**Source**: [MARKET_READINESS_ASSESSMENT.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/MARKET_READINESS_ASSESSMENT.md)

This document converts the current market-readiness assessment into an execution plan for getting the product from “broadly implemented” to “launchable with evidence”.

---

## Objective

Prove that the current solution is safe to onboard real customers by validating:

- deployment correctness
- environment configuration
- full end-to-end workflows
- billing/provider integrations
- operational readiness
- legal/public launch perimeter

---

## Current position

### Already true

- tenant product is broadly implemented
- admin platform is broadly implemented
- reports, GST, accounting, POS, and platform modules are implemented
- builds and typechecks pass

### Not yet proven

- live staging behavior
- environment-backed e2e completion
- provider-integrated billing/webhook behavior
- production storage/notification behavior
- full launch readiness evidence

---

## Phase N1 — Staging Deployment Validation

### Goal

Get the full stack deployed in a production-like environment and verify the platform boots cleanly.

### Scope

- provision staging infrastructure
- configure:
  - Postgres
  - Redis
  - API env vars
  - web env vars
  - billing sandbox credentials
  - file storage target
  - notification endpoints
- run migrations on staging
- verify:
  - web loads
  - API loads
  - admin login works
  - tenant login works

### Deliverables

- staging environment URL(s)
- env checklist completion
- migration execution record
- staging bootstrap notes

### Exit criteria

- staging app boots with no blocking runtime errors
- both tenant and admin auth work
- queues/connectivity are healthy

---

## Phase N2 — Environment-Backed End-to-End QA

### Goal

Execute the full feature-level QA checklist against a live environment.

### Scope

- run the full checklist in [E2E_MANUAL_TEST_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/E2E_MANUAL_TEST_PLAN.md)
- run Playwright suites against staging
- run API e2e against staging-backed infra or a parallel integration environment
- collect:
  - passed flows
  - failed flows
  - bug list
  - retest evidence

### Critical flows

- onboarding
- login / reset password
- company setup
- masters
- inventory
- invoice create -> issue -> payment -> PDF
- purchase create -> receive -> payment
- GST reports / export
- accounting statements
- POS sale / receipt
- admin company / subscription / support / governance flows

### Deliverables

- executed QA matrix
- defect log
- retest log
- Playwright run evidence
- API e2e run evidence

### Exit criteria

- all critical flows pass
- no P0/P1 defects remain open
- no raw JSON/debug regressions in user-facing routes

---

## Phase N3 — Provider and Platform Integration Validation

### Goal

Prove that real external integration paths behave correctly in a deployed environment.

### Scope

#### Billing

- Stripe sandbox checkout
- Razorpay sandbox checkout if supported in go-to-market scope
- webhook signature validation
- webhook ingestion
- subscription state reconciliation

#### Files

- invoice PDF generation and download
- purchase attachment upload/download
- storage driver validation for intended production target

#### Notifications

- outbox enqueue
- delivery callback / webhook behavior if applicable
- failed delivery visibility in admin

#### Queues and exports

- PDF queue processing
- export job execution
- failed-job visibility and recovery behavior

### Deliverables

- provider validation report
- sample webhook execution evidence
- file-storage validation notes
- notification validation notes

### Exit criteria

- at least one supported billing provider is fully validated end to end
- storage and notification paths are proven with the actual target configuration
- admin observability reflects those flows correctly

---

## Phase N4 — Launch Perimeter Completion

### Goal

Close the non-code launch blockers around public presentation, legal content, and release signoff.

### Scope

- finalize:
  - pricing copy
  - legal copy
  - privacy policy
  - terms
  - help/contact content
- validate:
  - customer onboarding communication
  - support routing/contact points
  - launch-ready public messaging

### Deliverables

- approved public copy set
- approved legal text
- launch landing-page review signoff

### Exit criteria

- public site is not carrying placeholder/starter legal or commercial content
- launch communications reflect actual supported product behavior

---

## Phase N5 — Launch Readiness Signoff

### Goal

Create a single decision gate for go/no-go.

### Scope

- consolidate evidence from N1-N4
- review open defects
- review operational readiness
- review support/admin readiness
- decide launch scope:
  - closed beta
  - pilot
  - public launch

### Signoff inputs

- [RELEASE_READINESS_CHECKLIST.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/RELEASE_READINESS_CHECKLIST.md)
- [VALIDATION_REPORT.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/VALIDATION_REPORT.md)
- [E2E_MANUAL_TEST_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/E2E_MANUAL_TEST_PLAN.md)

### Exit criteria

- all launch blockers are resolved or explicitly accepted
- launch mode is explicitly chosen
- release owner signs off

---

## Recommended sequence

1. N1 — staging deployment validation
2. N2 — environment-backed end-to-end QA
3. N3 — provider and platform integration validation
4. N4 — launch perimeter completion
5. N5 — launch readiness signoff

---

## Suggested launch modes after execution

## Closed beta

Allowed if:

- N1, N2, and N3 are complete
- N4 is functionally complete even if copy polish is still minor
- support is hands-on

## Founder-led pilot

Allowed if:

- critical flows pass
- one billing/provider path is proven
- operational monitoring is in place

## Broad public launch

Allowed only if:

- all phases complete
- no major open production blockers remain
- public/legal perimeter is approved

---

## Tracking recommendation

Create one execution folder or phase set for:

- `N1_STAGING_DEPLOYMENT_VALIDATION`
- `N2_ENVIRONMENT_E2E_QA`
- `N3_PROVIDER_PLATFORM_VALIDATION`
- `N4_LAUNCH_PERIMETER_COMPLETION`
- `N5_LAUNCH_SIGNOFF`

Each should end with:

- completion note
- bug summary
- evidence links
- explicit go/no-go outcome

