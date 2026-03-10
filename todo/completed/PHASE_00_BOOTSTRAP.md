# Phase 00 — Project bootstrap (NestJS + Prisma)

**Date**: 2026-03-05

## Summary
- Goal: Make the repo runnable and set up the canonical code scaffolding for the API and schema migrations.
- Outcome: A NestJS API scaffold exists in `apps/api`, Swagger UI is enabled, and a canonical Prisma schema file exists at `prisma/schema.prisma` (Option A path).

## Scope delivered
- [x] Root Node workspace initialized (`package.json`, `tsconfig.json`)
- [x] NestJS API scaffold created: `apps/api/`
- [x] Swagger UI enabled at `/swagger`
- [x] Health endpoint added at `/health`
- [x] Canonical Prisma schema file created at `prisma/schema.prisma` (initial subset)
- [x] Local Postgres compose file added (`docker-compose.yml`)
- [x] Env example provided (`.env.example`)

## What changed
### Code
- Root workspace scripts added:
  - `npm run api:dev`, `npm run api:build`, `npm run api:test`
- API changes:
  - `apps/api/src/main.ts`: Swagger setup
  - `apps/api/src/app.controller.ts`: `/health`

### Database / migrations
- `prisma/schema.prisma` added as the canonical schema source.
- Prisma tooling installed in `apps/api` (Prisma v5, compatible with Node 20.15).

Current state (post later phases):
- Multiple Prisma migrations now exist under `prisma/migrations/` and are the canonical evolution path.

### API contract
- Swagger UI is generated from Nest decorators (runtime docs).
- The canonical contract for implementation remains `docs/API_OPENAPI.yaml`.

## Quality gates
- Build: PASS (`apps/api` builds with Nest)
- Lint/Typecheck: PASS (`npm --workspace apps/api run typecheck`)
- Unit tests: PASS (default Nest test)
- Prisma schema validate: PASS (with `DATABASE_URL` set)

## Risks / known gaps
- (Historical note) At the end of Phase 00, migrations were minimal.
- Current repo state includes migrations for Phases 0107.
- Prisma v7 requires Node 20.19+, so Phase 00 pins Prisma to v5 until Node is upgraded.
- Root eslint/prettier config is minimal; tighten in Phase 01/00.1 as needed.

## Next phase
- Phase 01: Auth + tenant scoping + RBAC foundation.
  - Expand `prisma/schema.prisma` toward parity with `docs/DB_SCHEMA.sql` (start with companies/users/roles/permissions).
  - Implement auth endpoints per `docs/API_OPENAPI.yaml`.
