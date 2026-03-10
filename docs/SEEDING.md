# Seeding (Demo Data)

This repo uses Postgres + Prisma. There are two seed scripts:

- `seed:auth`: creates a demo company + owner user (login) + default invoice series.
- `seed:full`: creates master data + transactional data (invoices issued + payments recorded + purchases received) so the UI has realistic data.

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
