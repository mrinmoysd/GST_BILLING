# Phase H — Accounting Integration and Correctness

**Status**: Completed
**Completed on**: 2026-03-22

## Outcome

Phase H connected the accounting subsystem to the actual business transaction flows so journals are no longer a separate manual island.

## Delivered

- Default ledger policy and company-level default chart seeding
- Source-linked journals with auto/manual traceability fields
- Automatic posting for:
  - invoice issue
  - invoice cancellation
  - credit notes and sales returns
  - purchase receipt
  - purchase cancellation
  - purchase returns
  - invoice payments
  - purchase payments
- Period lock API and enforcement for closed accounting periods
- Product `cost_price` support and cost-based inventory/COGS postings
- Accounting UI improvements for journal traceability and period-lock control

## Verification

- `npm run prisma:generate` in `apps/api`
- `npx tsc -p tsconfig.json --noEmit --incremental false` in `apps/api`
- `npm run build` in `apps/api`
- `npx jest src/accounting/accounting.service.spec.ts --runInBand` in `apps/api`
- `npm run lint` in `apps/web`
- `npx next build --webpack` in `apps/web`

## Notes

- The Next.js `middleware` deprecation warning is still present in the web build, but it did not block Phase H.
