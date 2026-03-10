# Phase 01 — Auth + tenant + RBAC foundation

## Summary
This phase establishes the baseline security foundation for the API:
- Prisma migrations for auth sessions + RBAC tables
- JWT access + refresh token flow (refresh token stored as hashed session)
- `/api/auth/login`, `/api/auth/refresh`, `/api/auth/me`, `/api/auth/logout` endpoints

Tenant scoping is now enforced across tenant routes via `CompanyScopeGuard` (path `:companyId` must match JWT `companyId`).

RBAC tables exist and can be used for authorization, but fine-grained per-permission enforcement is still minimal (most non-admin routes rely on authenticated + correct tenant scope).

## What changed

### Database
- Added Prisma migrations:
  - `20260305080315_init` (bootstrap: companies/users)
  - `20260305080442_auth_rbac` (sessions + roles/permissions + assignments)

### API
- Added global `ConfigModule` with env validation via Zod.
- Added `PrismaModule` + `PrismaService`.
- Added `AuthModule` implementing:
  - `POST /api/auth/login` (email/password -> access+refresh)
  - `POST /api/auth/refresh` (refresh token -> new access token)
  - `GET /api/auth/me` (access token)
  - `POST /api/auth/logout` (refresh token -> revoke sessions)

### Tenant scoping (current state)
- `apps/api/src/common/auth/company-scope.guard.ts` enforces tenant isolation using `req.params.companyId` vs `req.user.companyId`.
- Tenant-scoped controllers (e.g. Customers/Suppliers/Products/Invoices/Purchases/Reports/Exports/Accounting/Notifications/Files/Billing) apply:
  - `JwtAccessAuthGuard`
  - `CompanyScopeGuard`

### Dev tooling
- Prisma CLI scripts now load the root `.env` via `dotenv-cli`.
- Added seed script: `npm --workspace apps/api run seed:auth`

## Env vars
Required in root `.env`:
- `DATABASE_URL`

Recommended (defaults exist for dev):
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL_SECONDS`
- `JWT_REFRESH_TTL_SECONDS`

## Quick smoke test
1) Run migrations (already applied in this session):
- `npm --workspace apps/api run prisma:migrate:dev -- --name init`
- `npm --workspace apps/api run prisma:migrate:dev -- --name auth_rbac`

2) Seed a demo owner:
- `npm --workspace apps/api run seed:auth`

3) Start API:
- `npm run api:dev`

4) Test endpoints:
- `POST /api/auth/login` with `{ "email": "owner@example.com", "password": "password123" }`
- Use `access_token` as Bearer token for `GET /api/auth/me`
- `POST /api/auth/refresh` with `{ "refresh_token": "..." }`

## Quality gates
- Typecheck: PASS (`npx tsc -p apps/api/tsconfig.json --noEmit`)
- Unit tests: PASS (`npm --workspace apps/api run test`)
- Build: PASS (`npm --workspace apps/api run build`)

## Known gaps / next steps
- Fine-grained permission checks (roles/permissions) are not consistently enforced per-route.
- Company/user creation flows are still spec-only.
