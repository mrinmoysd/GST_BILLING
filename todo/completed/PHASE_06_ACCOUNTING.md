# PHASE 06 — Accounting module

## Scope delivered

- Ledgers
  - `GET /api/companies/:companyId/ledgers`
  - `POST /api/companies/:companyId/ledgers`
- Journals
  - `GET /api/companies/:companyId/journals?from=&to=&page=&limit=`
  - `POST /api/companies/:companyId/journals`
- Reports
  - `GET /api/companies/:companyId/reports/trial-balance?as_of=`
  - `GET /api/companies/:companyId/reports/profit-loss?from=&to=`
  - `GET /api/companies/:companyId/reports/balance-sheet?as_of=`
- Books
  - `GET /api/companies/:companyId/books/cash?from=&to=`
  - `GET /api/companies/:companyId/books/bank?from=&to=`

Notes:
- This phase focuses on the accounting data model + the endpoints required by `docs/API_OPENAPI.yaml`.
- Journal creation is implemented as a *generic double-entry* endpoint; automatic postings from sales/purchases can be layered on later.

## Data model

Added Prisma models:
- `Ledger` (unique per company by `account_code`)
- `Journal` (date + narration)
- `JournalLine` (double-entry line: debit ledger OR credit ledger + amount)

Relationships are tenant-scoped (`companyId`) and indexed.

## Invariants & tests

- Unit tests in `apps/api/src/accounting/accounting.service.spec.ts` cover:
  - Trial Balance aggregation
  - Invalid date validation
  - `createJournal` ledger ownership validation (tenant scoped)
  - Strict balancing invariant enforcement (sum(debits) == sum(credits))

## How to run (dev)

- Apply migrations:
  - `npm --workspace apps/api run prisma:migrate:dev`
- Start API:
  - `npm run api:dev`

## Quality gates

Executed locally:
- `npm --workspace apps/api run typecheck` ✅
- `npm --workspace apps/api run lint` ✅
- `npm --workspace apps/api run test` ✅
- `npm --workspace apps/api run test:e2e` ✅

## Follow-ups

- Automatic postings from business flows (sales/purchases/payments) into journals per `docs/ACCOUNTING_RULES.md`.
- Improve report correctness:
  - Current P&L / balance sheet are minimal heuristics based on ledger `type` and basic journal-line aggregation.
- Fix the recurring Jest warning about open handles (likely BullMQ/Redis worker connections) by adding a test shutdown hook.
