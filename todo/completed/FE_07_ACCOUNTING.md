# FE-07 — Accounting (Status)

## Scope
- Ledgers list + create
- Journals list + create
- Reports: Trial balance, Profit & Loss, Balance sheet

## What’s implemented
- Accounting hub:
  - `apps/web/src/app/(app)/c/[companyId]/accounting/page.tsx` — links to ledgers/journals/reports
- Ledgers:
  - `apps/web/src/app/(app)/c/[companyId]/accounting/ledgers/page.tsx` — list + create
- Journals:
  - `apps/web/src/app/(app)/c/[companyId]/accounting/journals/page.tsx` — list (simple) + create
  - Client-side check: debit total must equal credit total
- Reports:
  - `apps/web/src/app/(app)/c/[companyId]/accounting/reports/trial-balance/page.tsx` — basic table (uses `as_of`)
  - `apps/web/src/app/(app)/c/[companyId]/accounting/reports/profit-loss/page.tsx` — raw JSON render (date-range)
  - `apps/web/src/app/(app)/c/[companyId]/accounting/reports/balance-sheet/page.tsx` — raw JSON render (uses `as_of`)
- Data hooks:
  - `apps/web/src/lib/billing/hooks.ts` — `useLedgers`, `useCreateLedger`, `useJournals`, `useCreateJournal`, `useTrialBalance`, `useProfitLoss`, `useBalanceSheet`

## Backend alignment
- Uses tenant routes under `/api/companies/:companyId/ledgers`, `/journals`, `/reports/*`.
- Trial balance + balance sheet currently wired to `as_of` query param as implemented in hooks.

## Known gaps / follow-ups
- Profit & loss and balance sheet are rendered as JSON (needs a nicer UI once response shape is finalized).
- Journals list is minimal (only id/date columns; no drill-down page yet).
- No Cash/Bank book UI yet (hooks exist but no pages).

## Quality gates
- `apps/web` lint: PASS
- `apps/web` build: PASS
