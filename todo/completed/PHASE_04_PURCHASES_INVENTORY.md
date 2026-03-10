# Phase 04 — Purchases + inventory movements

Date: 2026-03-05

## Scope (from `todo/ITERATION_PLAN.md`)

- Purchases lifecycle + bill upload
- Stock movements queries + low-stock report

## What shipped

### Purchases lifecycle (new)

Database models (Prisma):
- `Purchase` (draft → received → cancelled)
- `PurchaseItem`

API (NestJS):
- `POST /api/companies/:companyId/purchases` create **draft** purchase
- `GET /api/companies/:companyId/purchases` list (pagination/search/status/date filters)
- `GET /api/companies/:companyId/purchases/:purchaseId` detail
- `PATCH /api/companies/:companyId/purchases/:purchaseId` patch draft
- `POST /api/companies/:companyId/purchases/:purchaseId/receive` mark received and **increase stock**
- `POST /api/companies/:companyId/purchases/:purchaseId/cancel` cancel; if received, **reverse stock**

Stock linkage:
- receive uses `InventoryService.adjustStock()` with `sourceType='purchase'` + `sourceId=purchaseId`
- cancel uses `sourceType='purchase_return'` + `sourceId=purchaseId`

### Bill upload (MVP, synchronous local storage)

- `POST /api/companies/:companyId/purchases/:purchaseId/bill`
  - accepts `multipart/form-data` file field named `file`
  - stores to `storage/purchases/purchase_<purchaseId>.<ext>`
  - persists `Purchase.billUrl` + `Purchase.billOriginalName`
- `GET /api/companies/:companyId/purchases/:purchaseId/bill` downloads the stored file

> Note: Like invoice PDFs, this is local-storage MVP. Async job runner / object storage (S3/MinIO) can be added later.

### Inventory movements queries + low-stock report

Already present from earlier phases:
- stock ledger writes are transactional (product stock + `stock_movements` in one transaction)
- stock movements listing + low-stock endpoints already implemented in `apps/api/src/inventory/`

## Tests

- Added `apps/api/test/purchases.e2e-spec.ts`
  - draft purchase → receive (stock increase + movement source=`purchase`) → cancel (stock reversal + movement source=`purchase_return`)
  - asserts **ledger consistency**: latest movement `balanceQty` equals current `Product.stock`

## Migrations

- Migration created and applied:
  - `prisma/migrations/20260305094651_phase_04_purchases`

## Quality gates

All run and passing:
- Typecheck: PASS
- Unit tests: PASS
- Build: PASS
- E2E: PASS (`app`, `masters`, `invoices`, `purchases`)

## Files added/changed

- `prisma/schema.prisma`
  - added: `Purchase`, `PurchaseItem` + relations
- `apps/api/src/purchases/`
  - `purchases.module.ts`
  - `purchases.controller.ts`
  - `purchases.service.ts`
  - `dto/create-purchase.dto.ts`
  - `dto/patch-purchase.dto.ts`
- `apps/api/src/app.module.ts`
  - imports `PurchasesModule`
- `apps/api/test/purchases.e2e-spec.ts`

## Notes / follow-ups

- Bill upload storage currently searches by scanning `storage/purchases`. Next improvement is to store the exact server-side filename/path in DB for O(1) lookup.
- Consider adding idempotency to purchase create/receive/cancel similar to invoices/payments once we define expected client behavior.
- Consider using multer diskStorage + file type/size validation for production hardening.
