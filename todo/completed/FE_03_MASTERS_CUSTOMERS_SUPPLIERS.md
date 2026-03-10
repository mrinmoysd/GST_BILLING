# FE-03 — Masters: Customers, Suppliers (Status)

Date: 2026-03-07

## Scope delivered

### Customers
- ✅ List page: search field, consistent loading/empty/error states.
- ✅ Create page: minimal form (name/email/phone).
- ✅ Detail page: basic profile view.
- ✅ Update/delete: **partially**
  - Update: not implemented yet in UI.
  - Delete: not implemented yet in UI.

### Suppliers
- ✅ List page: search field, consistent loading/empty/error states.
- ✅ Create page: minimal form (name/email/phone).
- ✅ Detail page: profile view + **inline edit** (update) + **delete**.

### Ledger / Purchases / Invoices tabs
- ⚠️ Ledger pages exist as placeholders:
  - `/(app)/c/[companyId]/masters/customers/[customerId]/ledger`
  - `/(app)/c/[companyId]/masters/suppliers/[supplierId]/ledger`
- Reason: ledger endpoints were not found during backend scan, so UI is intentionally stubbed.

## Key screens
- `apps/web/src/app/(app)/c/[companyId]/masters/customers/page.tsx`
- `apps/web/src/app/(app)/c/[companyId]/masters/customers/new/page.tsx`
- `apps/web/src/app/(app)/c/[companyId]/masters/customers/[customerId]/page.tsx`
- `apps/web/src/app/(app)/c/[companyId]/masters/suppliers/page.tsx`
- `apps/web/src/app/(app)/c/[companyId]/masters/suppliers/new/page.tsx`
- `apps/web/src/app/(app)/c/[companyId]/masters/suppliers/[supplierId]/page.tsx`

## Hooks
- `apps/web/src/lib/masters/hooks.ts`
  - Customers: `useCustomers`, `useCustomer`, `useCreateCustomer`, `useUpdateCustomer`, `useDeleteCustomer`
  - Suppliers: `useSuppliers`, `useSupplier`, `useCreateSupplier`, `useUpdateSupplier`, `useDeleteSupplier`

## Definition of Done checks
- ✅ `apps/web` lint
- ✅ `apps/web` build

## Notes / follow-ups
- Add customer update/delete UI on `customers/[customerId]` page to match supplier parity.
- Add pagination UI controls (API already supports `page`/`limit`).
- Replace ledger placeholders once backend ledger APIs exist.
