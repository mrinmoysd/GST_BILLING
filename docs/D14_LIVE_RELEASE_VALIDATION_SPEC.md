# D14 Live Release Validation Specification

**Date**: 2026-03-26  
**Purpose**: Define the implementation-ready release-validation system for proving the product is safe to deploy, pilot, and launch with evidence.  
**Implementation status**: Planned

Source:

- [MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md)
- [VALIDATION_REPORT.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/VALIDATION_REPORT.md)
- [RELEASE_READINESS_CHECKLIST.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/RELEASE_READINESS_CHECKLIST.md)
- [PRE_LAUNCH_EXECUTION_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/PRE_LAUNCH_EXECUTION_PLAN.md)
- [E2E_MANUAL_TEST_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/E2E_MANUAL_TEST_PLAN.md)
- [TESTING.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/TESTING.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)
- [API_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/API_SPEC.md)

Current implementation anchors:

- the codebase has broad functional coverage across tenant, admin, GST, accounting, POS, reports, files, billing, and notifications
- local build, typecheck, lint, and test evidence exists in the repo workstream
- the strongest remaining gap is still live environment proof
- Playwright and API e2e readiness depend on reachable Postgres, Redis, seeded data, and live app URLs
- release-readiness guidance already exists, but it is spread across multiple documents and still needs one implementation-grade validation spec

---

## D14 goal

Turn release validation into a repeatable and auditable operating process that proves:

- the deployed stack boots correctly
- critical tenant and admin workflows work in a live environment
- external integrations behave correctly
- async jobs and observability are trustworthy
- launch risk is understood and signed off explicitly

D14 should answer the question:

- "What exact evidence do we need before we let real customers use this?"

---

## Why D14 matters

The current product is no longer blocked by lack of features alone. It is blocked by lack of proof in real operating conditions.

Without D14:

- staging validation remains ad hoc
- provider integrations may look implemented but fail in real environments
- queue, storage, and webhook behavior may stay unproven
- launch decisions become subjective instead of evidence-based

For the current release train, D14 is the main gate between "substantially built" and "production-credible."

---

## Scope

Included in D14:

- environment readiness validation
- staging boot verification
- seeded-data validation
- tenant manual QA
- admin manual QA
- live Playwright execution
- API e2e execution against real backing services
- provider validation for billing, files, notifications, queues, and webhooks
- defect logging and retest rules
- release evidence packaging
- launch-mode signoff rules

Included operator outputs:

- release validation matrix
- defect register
- retest log
- evidence bundle
- go / no-go recommendation

Not included in D14:

- building missing product features
- redesigning existing modules
- replacing QA with theory or code inspection alone

Planned result after D14:

- the team can decide between closed beta, pilot, or broader launch with evidence rather than confidence alone

---

## Business outcomes

After D14, the team should be able to:

- deploy staging confidently
- validate the real product perimeter end to end
- catch production blockers before customers do
- show concrete release evidence to founders, operators, and future customers

---

## Design principles

1. Live proof beats code confidence.
   Passing builds are necessary but not sufficient.

2. One failing critical live flow can block launch.
   D14 is a release gate, not a documentation exercise.

3. Every claim needs evidence.
   Screenshots, job ids, logs, and successful run outputs matter.

4. Seeded data must reflect realistic operator use.
   Empty-state-only validation is not enough.

5. Validation should mirror the real launch perimeter.
   Files, queues, notifications, billing, and admin surfaces all count.

6. Signoff must be explicit.
   Launch mode should never be implied.

---

## Terms and concepts

### Validation run

A time-bounded execution of the D14 checklist against a specific deployed environment and build.

### Evidence bundle

A collection of artifacts proving what passed, what failed, and what was retested.

### Critical flow

A user or platform flow whose failure would block onboarding, billing, document generation, compliance, collections, or supportability.

### Launch blocker

A defect or unresolved operational gap serious enough to stop the chosen release mode.

### Release mode

The approved launch scope after D14:

- closed beta
- founder-led pilot
- broad public launch

---

## Release modes and approval thresholds

## 1. Closed beta

Allowed when:

- staging environment is stable
- all critical tenant flows pass
- admin and observability are functionally usable
- at least one billing/provider path is proven
- no open P0 defects
- no unacceptable P1 defects for the limited user group

## 2. Founder-led pilot

Allowed when:

- everything required for closed beta is complete
- support workflow is ready for hands-on intervention
- queue, file, and notification behavior are proven
- data recovery and rollback notes exist

## 3. Broad public launch

Allowed only when:

- all validation tracks are complete
- no open P0 or P1 defects remain
- public/legal perimeter is approved
- operational monitoring, support readiness, and provider validation are all confirmed

---

## Validation phases inside D14

D14 should align to the existing N1-N5 launch framework and make each phase implementation-ready.

### D14.1 Staging deployment validation

Deliver:

- staging infrastructure verified
- environment variables verified
- migrations deployed
- API, web, and admin boot confirmed

### D14.2 Environment-backed end-to-end QA

Deliver:

- executed manual QA checklist
- live Playwright evidence
- API e2e evidence
- defect log and retest outcomes

### D14.3 Provider and platform validation

Deliver:

- billing sandbox proof
- file upload/download proof
- notification proof
- queue and export-job proof
- webhook proof

### D14.4 Launch perimeter validation

Deliver:

- public content review
- legal-content approval
- onboarding and support contact readiness

### D14.5 Signoff and release decision

Deliver:

- evidence consolidation
- blocker review
- launch-mode decision

---

## Validation entry criteria

Before starting D14, all of the following should be true:

- target build is frozen for the validation run
- all intended Prisma migrations are committed
- staging Postgres and Redis are reachable
- required environment variables are present
- seed strategy is prepared
- at least one internal admin credential set exists
- at least one tenant owner credential set exists
- release owner is identified

Recommended additional readiness:

- bug tracker or release checklist location is prepared
- evidence folder or tracking document is prepared
- rollback notes exist for the target deployment

---

## Environment model

Recommended environments for D14:

## 1. Local verification

Purpose:

- sanity-check commands and test setup before touching staging

Minimum expectation:

- API and web boot locally
- seed commands run

## 2. Staging

Purpose:

- main D14 validation target

Required characteristics:

- production-like infrastructure
- real Postgres and Redis
- real queue execution
- real file storage target or production-like equivalent
- sandbox billing and notification providers

## 3. Optional integration sandbox

Purpose:

- isolate provider or e2e testing if staging traffic must stay clean

Use when:

- provider workflows are disruptive
- API e2e needs more control

## 4. Production

Purpose:

- only final smoke after signoff

Production must not be the first place where critical flows are exercised.

---

## Required environment configuration

The validation run should explicitly verify the presence and effective behavior of at least the following.

## Core

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

## Billing

- `BILLING_STRIPE_SECRET_KEY`
- `BILLING_STRIPE_WEBHOOK_SECRET`
- `BILLING_RAZORPAY_KEY_ID`
- `BILLING_RAZORPAY_KEY_SECRET`
- `BILLING_RAZORPAY_WEBHOOK_SECRET`

## Files

- `FILE_SIGNING_SECRET`
- `FILE_STORAGE_DRIVER`
- `FILE_STORAGE_BUCKET` when using object storage
- `FILE_STORAGE_REGION`
- `FILE_STORAGE_ACCESS_KEY_ID`
- `FILE_STORAGE_SECRET_ACCESS_KEY`
- `FILE_STORAGE_ENDPOINT` when needed

## Notifications

- `NOTIFICATIONS_EMAIL_WEBHOOK_URL`
- `NOTIFICATIONS_SMS_WEBHOOK_URL`
- `NOTIFICATIONS_WHATSAPP_WEBHOOK_URL`

## Queue and cache

- Redis connectivity
- queue workers or processors active

Validation rule:

- environment variables are not considered "validated" merely because they are present
- each must be proven through a live behavior where applicable

---

## Seed and test-data strategy

Recommended seeded identities:

- one tenant owner
- one tenant staff or accountant user
- one salesperson user if D12 or distributor flows are in scope
- one internal admin

Recommended seeded demo data:

- customers
- suppliers
- products
- categories
- warehouses
- at least one distributor dataset
- open invoices and purchases
- notifications and export job examples where safe

Current repo anchors that should be used where appropriate:

- `npm --workspace apps/api run seed:auth`
- `npm --workspace apps/api run seed:distributor`
- `npm --workspace apps/api run seed:full`

Seed validation rules:

- seeded data should be documented for testers
- empty datasets should be treated as missing setup, not automatically as product defects
- seeded credentials and company ids should be recorded in the validation run packet

---

## Validation execution tracks

## 1. Deployment and infrastructure validation

The run should verify:

- staging deployment completed cleanly
- migrations applied successfully
- API health and basic auth path work
- web app loads without blocking runtime errors
- admin app loads and auth works
- queue workers are connected
- storage path is writable or reachable

Evidence required:

- deployment identifier or commit SHA
- migration execution record
- app URLs
- boot screenshots or logs

Exit criteria:

- no boot-blocking runtime errors
- tenant and admin auth both work

## 2. Tenant critical-flow validation

The run should cover at least:

- onboarding
- tenant login and refresh
- forgot/reset password where supported in environment
- company settings
- invoice series
- roles and users
- customer, supplier, and product masters
- stock adjustment and movement visibility
- invoice draft -> issue -> PDF -> payment
- purchase draft -> receive -> attachment -> payment
- GST export creation and download
- accounting statement visibility
- POS billing and receipt print

Distributor extensions should cover if in release scope:

- quotations
- sales orders
- warehouse stock view
- stock transfers
- distributor reports

Evidence required:

- manual QA matrix with pass/fail per flow
- screenshots or short recordings for critical path completions
- created document ids
- downloaded PDF or export sample where relevant

Exit criteria:

- all critical tenant flows pass
- no P0 or unresolved P1 issues remain

## 3. Admin and support-flow validation

The run should cover at least:

- admin login
- dashboard
- companies list and company detail
- company create if supported in launch scope
- subscriptions list and detail
- usage dashboard
- support tickets
- queue metrics
- internal admin users
- audit logs

Evidence required:

- screenshots of major admin surfaces
- evidence that queue and failure views return shaped data
- audit-log evidence for at least one privileged action

Exit criteria:

- admin platform is usable for support and governance
- queue and audit visibility are trustworthy enough for operator use

## 4. Provider and platform validation

### Billing

The run should verify:

- Stripe sandbox checkout where supported
- Razorpay sandbox checkout where supported in go-to-market scope
- webhook signature validation
- webhook ingestion
- subscription state reconciliation

### Files

The run should verify:

- invoice PDF generation
- invoice PDF regeneration job
- purchase attachment upload
- purchase attachment download

### Notifications

The run should verify:

- notification template exists
- test enqueue works
- outbox processing works
- failure or success is visible to operators

### Jobs and queues

The run should verify:

- PDF queue activity
- export job execution
- failed-job visibility where possible

Evidence required:

- provider-side test references where available
- webhook payload sample and delivery evidence
- queued job ids and resulting statuses
- file URLs or download proof

Exit criteria:

- at least one supported billing provider is proven end to end
- storage, notifications, and queue-backed jobs are proven with the target config

## 5. Public and launch-perimeter validation

The run should verify:

- landing page and supporting public pages render
- no raw JSON or broken sections
- pricing copy is aligned to actual offer
- privacy and terms are approved or explicitly marked not ready
- contact and help paths are real

Evidence required:

- page screenshots
- approved legal and copy checklist

Exit criteria:

- public launch perimeter is either approved or correctly scoped out of the chosen release mode

## 6. Operational readiness validation

The run should verify:

- support owner is identified
- escalation path exists
- rollback notes exist
- backup or recovery assumptions are documented
- admin observability is sufficient for first-response debugging

Evidence required:

- operational checklist completion
- support contact mapping
- rollback note reference

Exit criteria:

- launch does not depend on unknown ownership during incidents

---

## Exact command baseline

These commands should be executed or adapted as part of the release-validation flow.

## Local and pre-staging checks

```bash
npm --workspace apps/api run prisma:generate
npm --workspace apps/api run typecheck
npm --workspace apps/api run build
npm --workspace apps/api run test
npm --workspace apps/api run test:e2e
npm --workspace apps/web run lint
npm --workspace apps/web run build
```

## Local seeded validation setup

```bash
npm --workspace apps/api run prisma:migrate:dev
npm --workspace apps/api run seed:auth
npm --workspace apps/api run seed:distributor
npm --workspace apps/api run start:dev
npm --workspace apps/web run dev
```

## Live browser validation

```bash
npm --workspace apps/web run test:e2e
```

Implementation note:

- D14 should capture not only whether commands passed, but also the environment and build they were run against

---

## Evidence model

Each D14 validation run should produce a release packet containing:

- build identifier or commit SHA
- environment URLs
- environment configuration checklist
- seed data reference
- executed command list and outcomes
- manual QA matrix
- Playwright results
- API e2e results
- defect register
- retest log
- provider validation notes
- screenshots and downloaded artifact references
- final signoff note

Recommended evidence structure:

- one run folder or document set per validation cycle
- one summary file with links to detailed artifacts

Suggested naming:

- `D14_RUN_YYYYMMDD`
- `D14_N1_STAGING`
- `D14_N2_QA`
- `D14_N3_PROVIDERS`
- `D14_N4_PERIMETER`
- `D14_N5_SIGNOFF`

---

## Defect severity and gating rules

## P0

Examples:

- app does not boot
- tenant or admin login broken
- invoice issue corrupts data
- payment recording breaks balances
- migration or queue outage blocks all operations

Gate:

- launch blocked for all release modes

## P1

Examples:

- critical workflow fails for normal users
- provider integration broken for chosen launch scope
- PDF or export cannot be generated reliably
- queue failure visibility missing during required operations

Gate:

- broad public launch blocked
- pilot usually blocked unless explicitly accepted with mitigation

## P2

Examples:

- non-critical UX regression
- recoverable formatting issue
- admin convenience feature issue with workaround

Gate:

- can ship to limited release with explicit acknowledgement

## P3

Examples:

- cosmetic issue
- low-risk copy issue
- polish backlog

Gate:

- does not block launch

---

## Retest rules

After a defect is fixed:

- rerun the failed scenario
- rerun nearby regression scenarios
- attach new evidence
- mark prior evidence as superseded, not deleted

Critical retest rule:

- any fix in auth, invoicing, payments, stock, billing, files, queues, or notifications requires adjacent regression validation before signoff

---

## Signoff model

Recommended signoff roles:

- release owner
- product owner or founder
- engineering owner
- QA owner or acting QA lead

Minimum signoff inputs:

- validation summary
- open defect list
- known-risk list
- launch-mode recommendation

Required final decision:

- `go_closed_beta`
- `go_founder_pilot`
- `go_public_launch`
- `no_go`

Signoff note must include:

- date
- environment
- build identifier
- chosen mode
- accepted risks if any

---

## Recommended artifacts to create alongside D14

To operationalize this spec, create or maintain:

- `todo/release/D14_RUN_YYYYMMDD.md`
- `todo/release/D14_DEFECT_REGISTER.md`
- `todo/release/D14_RETEST_LOG.md`
- `todo/release/D14_PROVIDER_VALIDATION.md`
- `todo/release/D14_SIGNOFF.md`

These can be lightweight markdown documents, but they should exist and be updated during the run.

---

## Risks and failure modes

## 1. Treating staging as optional

Risk:

- release confidence is based on code inspection rather than live behavior

Mitigation:

- do not approve pilot or public launch without a completed staging run

## 2. Running validation against unrealistic data

Risk:

- happy-path empty-state screens look fine while real operator flows fail

Mitigation:

- use seeded or migrated data that resembles real use

## 3. Provider integrations only "looking configured"

Risk:

- secrets are present but checkout, upload, or webhook flows still fail

Mitigation:

- require end-to-end proof, not just env review

## 4. Weak evidence discipline

Risk:

- the team forgets what was actually validated

Mitigation:

- every run gets a dated evidence bundle and signoff note

## 5. Launch-mode confusion

Risk:

- a pilot-standard validation gets treated like public-launch proof

Mitigation:

- explicitly choose and record release mode after D14

---

## Acceptance criteria

D14 is complete when:

- a staging environment is deployed and validated
- manual QA is executed against live services
- Playwright is executed against a live API-backed environment
- provider and platform integrations are proven with the target configuration
- defects are logged, retested, and severity-tagged
- evidence artifacts are collected
- a formal go / no-go decision is recorded

---

## Recommended implementation order inside D14

1. environment and deployment validation
2. seed verification
3. tenant critical-flow QA
4. admin and observability QA
5. provider and platform validation
6. public and legal perimeter review
7. defect triage and retest
8. final signoff

---

## Definition of done

Live release validation is considered production-credible when:

- the product has been exercised successfully in a production-like environment
- critical user and operator flows are backed by evidence
- at least one intended commercial path is proven end to end
- launch mode is chosen explicitly based on open risk and completed validation, not assumption
