# FE-04 — Products & Inventory views (Status)

Date: 2026-03-07

## Scope delivered

### Products
- ✅ List page: search, consistent loading/empty/error states.
- ✅ Create page: minimal form (name, sku, hsn, price, taxRate).
- ✅ Detail page:
  - ✅ Profile edit (update)
  - ✅ Delete
  - ✅ Link to stock movements view

### Inventory
- ✅ Low stock view: `/(app)/c/[companyId]/inventory` wired to `/inventory/low-stock` API.
- ✅ Stock movements listing:
  - Product scoped stock movements: `/(app)/c/[companyId]/masters/products/[productId]/stock-movements`

### Stock adjustment
- ✅ Implemented on product detail page via `POST /products/:productId/stock-adjustment`.

### Categories
- ⚠️ Not implemented.
- Reason: categories endpoints were not found in backend scan.

## Key screens
- `apps/web/src/app/(app)/c/[companyId]/masters/products/page.tsx`
- `apps/web/src/app/(app)/c/[companyId]/masters/products/new/page.tsx`
- `apps/web/src/app/(app)/c/[companyId]/masters/products/[productId]/page.tsx`
- `apps/web/src/app/(app)/c/[companyId]/masters/products/[productId]/stock-movements/page.tsx`
- `apps/web/src/app/(app)/c/[companyId]/inventory/page.tsx`

## Hooks
- `apps/web/src/lib/masters/hooks.ts`
  - Products: `useProducts`, `useProduct`, `useCreateProduct`, `useUpdateProduct`, `useDeleteProduct`
  - Inventory: `useStockMovements`, `useLowStock`, `useStockAdjustment`

## Definition of Done checks
- ✅ `apps/web` lint
- ✅ `apps/web` build

## Notes / follow-ups
- Add global stock movements page with filters (type/source/date) if/when backend supports.
- Add pagination UI controls.
- Implement categories once backend endpoints exist.
