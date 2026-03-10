# DE-06 — Accounting UX (Completed)

Date: 2026-03-07

## What shipped

- Cash / Bank books pages:
  - `/(app)/c/[companyId]/accounting/books/cash`
  - `/(app)/c/[companyId]/accounting/books/bank`
- Profit & Loss improved UI (cards instead of raw JSON).
- Balance Sheet improved UI (cards instead of raw JSON).
- Journal drill-down:
  - Backend: `GET /api/companies/:companyId/journals/:id`
  - Frontend: `/(app)/c/[companyId]/accounting/journals/[journalId]`

## Quality gates

- `apps/api` build + typecheck: PASS
- `apps/web` build: PASS
