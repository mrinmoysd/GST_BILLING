# FE-05 — Sales / Invoices (Status)

## Scope
- Sales invoices list
- Create invoice draft
- Invoice detail view + lifecycle actions
- Invoice PDF open + regenerate

## What’s implemented
- Pages (company-scoped):
  - `apps/web/src/app/(app)/c/[companyId]/sales/invoices/page.tsx` — list
  - `apps/web/src/app/(app)/c/[companyId]/sales/invoices/new/page.tsx` — create draft (minimal form)
  - `apps/web/src/app/(app)/c/[companyId]/sales/invoices/[invoiceId]/page.tsx` — detail + actions
- Data hooks:
  - `apps/web/src/lib/billing/hooks.ts` — invoice queries/mutations:
    - list/detail
    - create draft, patch draft
    - issue, cancel
    - PDF regenerate
  - `apps/web/src/lib/billing/types.ts` — invoice types
- File URL support:
  - `apps/web/src/lib/api/client.ts` — `resolveUrl()` used for invoice PDF links

## Backend alignment
- Uses tenant routes under `/api/companies/:companyId/invoices`.
- PDF endpoint opened via direct URL (new tab): `/invoices/:invoiceId/pdf`.

## Known gaps / follow-ups
- Invoice builder UX is still minimal (single line item; no multi-line editor, search, totals preview).
- Field-level validation is minimal (no RHF/Zod yet for this module).
- Idempotency key header support isn’t wired from UI.
- No payment capture UI (depends on backend endpoints).

## Quality gates
- `apps/web` lint: PASS
- `apps/web` build: PASS
