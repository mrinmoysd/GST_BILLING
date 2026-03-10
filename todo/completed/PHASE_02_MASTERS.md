# Phase 02 — Masters (customers, suppliers, products)

## Summary
This phase begins the “masters” domain layer by introducing canonical database models for customers, suppliers, and products.

At the end of this phase:
- Prisma schema includes Customer/Supplier/Product models
- Migration applied to local Postgres
- Masters REST endpoints are implemented with tenant scoping (`companyId` in path must match JWT `companyId`)
- Basic e2e coverage added for tenant isolation across masters
- Inventory primitives added (stock movement ledger + queries + low-stock report + negative stock policy)
- Soft-delete added for masters
- Runtime DTO validation enabled via `class-validator`

## What changed

### Database (Prisma)
- Updated `prisma/schema.prisma`:
  - Added `Customer`, `Supplier`, `Product` models
  - Added back-relations on `Company` (`customers`, `suppliers`, `products`)
  - Removed unsupported native `@db.Numeric(...)` attributes (Prisma v5 Postgres connector limitation)
  - Added inventory primitives:
    - `StockMovement` ledger model (`stock_movements`)
    - `Company.allowNegativeStock` policy flag
    - `Product.reorderLevel` (optional per-product low-stock threshold)
  - Added soft-delete timestamps (`deletedAt`) for `Customer`, `Supplier`, `Product`

### Migrations
- Applied migration:
  - `20260305082442_masters_customers_suppliers_products_v2`
  - `20260305084349_inventory_stock_ledger_soft_delete` (stock ledger + masters soft-delete + stock policy)

### API (NestJS)
All endpoints are protected by:
- `JwtAccessAuthGuard`
- `CompanyScopeGuard`

Runtime request validation:
- Enabled global `ValidationPipe` in `apps/api/src/main.ts`
- Core DTOs now use `class-validator`

#### Customers
Base: `api/companies/:companyId/customers`
- `GET /` (page/limit/q)
- `POST /`
- `GET /:customerId`
- `PATCH /:customerId`
- `DELETE /:customerId` (soft-delete)

#### Suppliers
Base: `api/companies/:companyId/suppliers`
- `GET /` (page/limit/q)
- `POST /`
- `GET /:supplierId`
- `PATCH /:supplierId`
- `DELETE /:supplierId` (soft-delete)

#### Products
Base: `api/companies/:companyId/products`
- `GET /` (page/limit/q)
- `POST /`
- `GET /:productId`
- `PATCH /:productId`
- `DELETE /:productId` (soft-delete)
- `POST /:productId/stock-adjustment`
  - Creates a `stock_movements` row and updates `products.stock`
  - Enforces `Company.allowNegativeStock`

#### Inventory
Base: `api/companies/:companyId`
- `GET /stock-movements?product_id=&from=&to=&page=&limit=`
- `GET /inventory/low-stock?threshold=&page=&limit=`

Notes:
- Stock adjustment now writes to `stock_movements` and enforces `Company.allowNegativeStock`.

## Validation
- Typecheck: PASS (`npm --workspace apps/api run typecheck`)
- Unit tests: PASS (`npm --workspace apps/api run test`)
- Build: PASS (`npm --workspace apps/api run build`)

Additional:
- E2E tests: run with `npm --workspace apps/api run test:e2e`

## Remaining items
Carry forward (next phases):
- Phase 03 (Sales): link stock movements to invoices (source_type/source_id) and reverse movements on cancel/credit note
- Phase 04 (Purchases + inventory): link stock movements to purchases/purchase returns; add movement consistency tests
- Add masters “ledger endpoints” for customers/suppliers (`/customers/:id/ledger`, `/suppliers/:id/ledger`) when accounting journal tables/services are introduced
- Optional: include `low_stock_only` filter in Products list endpoint to match `docs/API_SPEC.md`

## Notes
- Swagger is available at `/swagger` and includes Masters + Inventory routes.
- `docs/API_SPEC.md` remains the target inventory; we’re now closer on masters + inventory primitives.
