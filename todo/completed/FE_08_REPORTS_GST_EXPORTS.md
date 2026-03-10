# FE-08 — Reports + GST export jobs (Status)

## Scope
- Reports hub
- Business report endpoints UI
- GST export job UI (GSTR1): create → poll status → download

## What’s implemented
- Reports hub (company-scoped):
  - `apps/web/src/app/(app)/c/[companyId]/reports/page.tsx`

- Report pages:
  - `.../reports/sales-summary/page.tsx`
  - `.../reports/purchases-summary/page.tsx`
  - `.../reports/outstanding/page.tsx`
  - `.../reports/top-products/page.tsx`
  - `.../reports/profit-snapshot/page.tsx`

- GST export:
  - `.../reports/gst/gstr1/page.tsx` — create export job and poll status; download on success

- Data hooks:
  - `apps/web/src/lib/reports/hooks.ts`
    - `useSalesSummary`, `usePurchasesSummary`, `useOutstandingInvoices`, `useTopProducts`, `useProfitSnapshot`
    - `useCreateGstr1Export`, `useExportJob`, `exportDownloadUrl`

## Backend alignment
- Reports controller: `/api/companies/:companyId/reports/*` (summary/outstanding/top-products/profit snapshot)
- Exports controller: `/api/companies/:companyId/exports/gstr1` (create) and `/exports/:jobId` + `/download`

## Known gaps / follow-ups
- Several report screens render JSON for now (until response shapes are finalized for table/chart UI).
- No charting yet.

## Quality gates
- `apps/web` lint: PASS
- `apps/web` build: PASS
