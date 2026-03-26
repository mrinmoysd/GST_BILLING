# Seeding (Demo Data)

This repo uses Postgres + Prisma. There are three seed scripts:

- `seed:auth`: creates a demo company + owner user (login) + default invoice series.
- `seed:full`: creates master data + transactional data (invoices issued + payments recorded + purchases received) so the UI has realistic data.
- `seed:distributor`: creates a distributor-style demo workspace with salespeople, warehouses, transfers, quotations, sales orders, invoices, and collections.

## Prerequisites

- `DATABASE_URL` is set in `.env`
- API is running at `http://localhost:4000` (default)

## Seed Auth (company + owner)

```bash
npm --workspace apps/api run seed:auth
```

Defaults:

- Company ID: `00000000-0000-0000-0000-000000000001`
- User ID: `00000000-0000-0000-0000-000000000002`
- Email: `owner@example.com`
- Password: `password123`

Override via env:

- `SEED_COMPANY_ID`
- `SEED_USER_ID`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_COMPANY_NAME`

## Full Seed (Option B)

This uses Prisma for master data and API calls for:

- stock adjustments (stock movements)
- purchases receive (inventory)
- invoice issue + payment record (journals/ledgers)

Run:

```bash
npm --workspace apps/api run seed:full
```

Optional env:

- `SEED_API_BASE_URL` (default `http://localhost:4000/api`)
- `SEED_PREFIX` (default `DEMO`)
- `SEED_CUSTOMERS` (default `5`)
- `SEED_SUPPLIERS` (default `3`)
- `SEED_PRODUCTS` (default `8`)
- `SEED_INVOICES` (default `6`)
- `SEED_PURCHASES` (default `4`)

## Notes

- `seed:full` expects the owner user from `seed:auth` to exist (so API login works).
- Seeding is designed to be re-runnable. It may create additional invoices/purchases each run; tune counts/prefix as needed.

## Distributor Seed (V2 demo)

This builds on `seed:auth` and creates a stronger distributor / wholesaler demo setup.

Run:

```bash
npm --workspace apps/api run seed:distributor
```

What it adds:

- billing, warehouse, and salesperson users
- warehouse master:
  - `MAIN`
  - `BR01`
- distributor-style products, customers, and suppliers
- purchase receive into warehouse stock
- stock transfer dispatch / receive
- quotation to sales order to invoice flow
- partial payment for collections and outstanding views

Default seeded distributor users:

- owner from `seed:auth`
- `billing.distro@example.com`
- `warehouse.distro@example.com`
- `north.rep.distro@example.com`
- `south.rep.distro@example.com`

Default password for additional distributor users:

- `password123`

Optional env:

- `SEED_DISTRIBUTOR_USER_PASSWORD`
- `SEED_PREFIX`
- `SEED_COMPANY_NAME`

Notes:

- `seed:distributor` expects the owner user from `seed:auth` to exist.
- the API must be running because the seed drives business flows through real endpoints.
