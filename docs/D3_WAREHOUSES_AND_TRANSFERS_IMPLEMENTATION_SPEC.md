# D3 Warehouses And Transfers Implementation Spec

**Phase**: D3  
**Status**: Completed on 2026-03-25

## Goal

Add distributor-ready warehouse and transfer control on top of the existing company-level stock model.

## Delivered

- warehouse master with default / active state
- per-warehouse stock balances via `warehouse_stocks`
- warehouse-aware purchase draft and receive flow
- warehouse-aware invoice draft and issue flow
- stock transfer workflow:
  - requested
  - dispatched
  - received
  - cancelled
- transfer movement logging without changing total company stock
- tenant inventory pages for warehouses and transfers
- warehouse filter support in stock movements

## Schema

Introduced:

- `warehouses`
- `warehouse_stocks`
- `stock_transfers`
- `stock_transfer_items`

Extended:

- `stock_movements.warehouse_id`
- `purchases.warehouse_id`
- `invoices.warehouse_id`

## Inventory rules

- company-level stock still lives on `products.stock`
- purchase receive and invoice issue update:
  - company stock
  - warehouse stock when a warehouse is present
- credit-note restock and purchase return reversal also respect warehouse context
- transfer dispatch decreases only source warehouse stock
- transfer receive increases only destination warehouse stock
- transfer flow does **not** change total company stock

## API surface

- `GET /api/companies/:cid/warehouses`
- `POST /api/companies/:cid/warehouses`
- `PATCH /api/companies/:cid/warehouses/:warehouseId`
- `GET /api/companies/:cid/warehouses/:warehouseId/stock`
- `GET /api/companies/:cid/stock-transfers`
- `GET /api/companies/:cid/stock-transfers/:transferId`
- `POST /api/companies/:cid/stock-transfers`
- `POST /api/companies/:cid/stock-transfers/:transferId/dispatch`
- `POST /api/companies/:cid/stock-transfers/:transferId/receive`
- `POST /api/companies/:cid/stock-transfers/:transferId/cancel`

Extended existing API:

- invoice draft create now accepts optional `warehouse_id`
- purchase draft create now accepts optional `warehouse_id`
- stock adjustment now accepts optional `warehouse_id`
- stock movements now accept optional `warehouse_id` filter

## Frontend surface

Added:

- `/c/:companyId/inventory/warehouses`
- `/c/:companyId/inventory/transfers`

Extended:

- `/c/:companyId/inventory`
- `/c/:companyId/inventory/movements`
- `/c/:companyId/inventory/adjustments`
- `/c/:companyId/sales/invoices/new`
- `/c/:companyId/purchases/new`

## Verification

Passed:

- `npm --workspace apps/api run prisma:generate`
- `npx tsc -p apps/api/tsconfig.json --noEmit --incremental false`
- `npm --workspace apps/api run build`
- `cd apps/web && npx tsc -p tsconfig.json --noEmit --incremental false`
- `npm --workspace apps/web run lint`
- `npm --workspace apps/api run test:e2e -- --runInBand test/warehouses-transfers.e2e-spec.ts`

## Notes

- local Prisma migration history is already drifted in this repo, so D3 SQL was applied with `prisma db execute` during verification instead of `prisma migrate deploy`
- the e2e run passed, though background BullMQ / Redis teardown still emits the existing `ECONNRESET` console noise after test completion
