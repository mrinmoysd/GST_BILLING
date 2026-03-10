# DE-07 — Reports UI polish (Completed)

Date: 2026-03-07

## What changed

- Added a small reusable metric component `StatCard`.
- Updated the following report pages to show key metrics as cards (and keep a JSON fallback when response shape is unknown):
  - `/(app)/c/[companyId]/reports/sales-summary`
  - `/(app)/c/[companyId]/reports/purchases-summary`
  - `/(app)/c/[companyId]/reports/profit-snapshot`

## Notes

- No chart library was added (DE-07/T-071 remains optional).

## Quality gates

- `apps/web` build: PASS
