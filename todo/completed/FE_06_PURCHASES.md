# FE-06 — Purchases (Status)

## Scope
- Purchases list
- Create purchase draft
- Purchase detail + receive/cancel
- Bill upload/download

## What’s implemented
- Pages (company-scoped):
  - `apps/web/src/app/(app)/c/[companyId]/purchases/page.tsx` — list + simple search
  - `apps/web/src/app/(app)/c/[companyId]/purchases/new/page.tsx` — create draft (minimal form)
  - `apps/web/src/app/(app)/c/[companyId]/purchases/[purchaseId]/page.tsx` — detail + actions + bill upload
- Data hooks:
  - `apps/web/src/lib/billing/hooks.ts` — purchase queries/mutations:
    - list/detail
    - create draft, patch draft
    - receive, cancel
    - `purchaseBillUrl()`
    - `useUploadPurchaseBill()` (multipart upload)
- Multipart support:
  - `apps/web/src/lib/api/client.ts` — `postForm()` added for `FormData` uploads

## Backend alignment
- Uses tenant routes under `/api/companies/:companyId/purchases`.
- Bill upload: `POST /purchases/:purchaseId/bill` (multipart file field `file`).
- Bill download: `GET /purchases/:purchaseId/bill`.

## Known gaps / follow-ups
- Purchase builder is minimal (single item line; no multi-line editor/totals).
- No explicit bill upload progress bar.
- Detail view currently doesn’t render items breakdown (depends on response shape).

## Quality gates
- `apps/web` lint: PASS
- `apps/web` build: PASS
