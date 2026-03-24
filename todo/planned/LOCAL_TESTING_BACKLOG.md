# Local Testing Backlog

**Date**: 2026-03-23  
**Source**: [LOCAL_UNIT_AND_INTEGRATION_TESTING_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/LOCAL_UNIT_AND_INTEGRATION_TESTING_SPEC.md)

This backlog converts the local unit/integration testing spec into concrete implementation work.

---

## LT1 — Auth and Onboarding Coverage

Status:

- Completed

Goal:

- protect authentication bootstrap and password/session flows locally

Priority items:

- onboarding bootstrap integration test
- auth refresh/logout integration coverage
- forgot/reset password regression coverage

Progress:

- completed:
  - onboarding bootstrap integration test
  - auth refresh/logout integration coverage
  - forgot/reset password regression coverage

---

## LT2 — Masters and Inventory Coverage

Status:

- Completed

Goal:

- protect foundational operational data and stock rules

Priority items:

- category duplicate handling
- customer/supplier CRUD integration assertions
- inventory adjustStock unit coverage
- low-stock behavior coverage

Progress:

- completed:
  - category duplicate handling integration coverage
  - inventory adjustStock unit coverage
  - low-stock behavior unit coverage
  - deeper customer/supplier CRUD integration assertions

---

## LT3 — Sales and Purchases Flow Coverage

Status:

- Completed

Goal:

- strengthen the highest-value financial transaction flows

Priority items:

- invoice issue/payment/credit note/sales return coverage
- purchase receive/payment/return coverage
- file attachment assertions
- PDF job path assertions

Progress:

- completed:
  - invoice issue/payment baseline integration coverage
  - PDF regenerate/download baseline integration coverage
  - invoice share integration coverage
  - credit note and sales return integration coverage
  - purchase receive/cancel baseline integration coverage
  - purchase payment integration coverage
  - purchase return integration coverage
  - purchase bill attachment/download integration coverage

---

## LT4 — GST, Reports, and Accounting Coverage

Status:

- Completed

Goal:

- protect compliance and statement correctness

Priority items:

- GST engine edge cases
- report empty-state and high-volume contract coverage
- period-lock regression tests
- accounting source-posting edge cases

Progress:

- completed:
  - period-lock regression integration coverage
  - GST report edge-case integration coverage
  - accounting statement/report integration coverage

Follow-up defects:

- balance-sheet integrity follow-up for mixed-flow scenarios
- see [LOCAL_TESTING_DEFECT_LOG.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/LOCAL_TESTING_DEFECT_LOG.md)

Known defects:

- see [LOCAL_TESTING_DEFECT_LOG.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/LOCAL_TESTING_DEFECT_LOG.md)

---

## LT5 — Platform and Admin Coverage

Status:

- Completed

Goal:

- strengthen SaaS operations and governance confidence locally

Priority items:

- admin governance service unit tests
- internal admin audit path integration tests
- subscription/admin operations integration tests
- notification/file/platform integration coverage

Progress:

- completed:
  - admin governance service unit tests
  - internal admin audit path integration tests
  - subscription/admin operations integration tests
  - deeper notification/file/platform integration expansion beyond the existing baseline
  - notification failure/retry integration coverage
  - file token validation integration coverage
  - billing webhook signature validation integration coverage

Coverage note:

- notification/file/platform integration already has meaningful baseline coverage in [platform-integrations.e2e-spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/platform-integrations.e2e-spec.ts)

---

## Immediate implementation order

1. LT1 onboarding bootstrap coverage
2. LT2 inventory negative-stock and low-stock coverage
3. LT5 admin governance service coverage
4. LT4 period-lock regression expansion
5. LT3 broader document lifecycle integration coverage
