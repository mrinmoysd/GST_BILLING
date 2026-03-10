# GST Billing Software (specs + code)

This repo is being built in phases (see `todo/ITERATION_PLAN.md`).

## What exists today
- Specs and contracts live under `docs/`
- Phase 00 scaffolding adds a runnable NestJS API under `apps/api/`

## Local development (Phase 00)

### Prereqs
- Node.js v20+
- Docker (optional but recommended for Postgres)

### Environment
Copy env vars (example):

```bash
cp .env.example .env
```

### Start Postgres (optional)

```bash
docker compose up -d
```

### Async jobs (Phase 03.2)  Redis + PDF worker

Async invoice PDF generation uses BullMQ + Redis.

Start dependencies:

```bash
docker compose up -d postgres redis
```

Run the API (the BullMQ worker runs inside the same NestJS process):

```bash
npm run api:dev
```

PDF flow:
- `POST /api/companies/:companyId/invoices/:invoiceId/pdf/regenerate` enqueues a job.
- `GET /api/companies/:companyId/jobs/:jobId` polls job status.
- `GET /api/companies/:companyId/invoices/:invoiceId/pdf` downloads the file once generated.

### Install deps

```bash
npm install
```

### Run API

```bash
npm run api:dev
```

### Swagger UI
- Open: http://localhost:<PORT>/swagger

### Health
- GET http://localhost:<PORT>/health

### Auth (Phase 01)
- POST http://localhost:<PORT>/api/auth/login
- POST http://localhost:<PORT>/api/auth/refresh
- GET  http://localhost:<PORT>/api/auth/me
- POST http://localhost:<PORT>/api/auth/logout

### Prisma
Validate schema (requires DATABASE_URL env var set):

```bash
npm --workspace apps/api run prisma:generate
npm --workspace apps/api run prisma:migrate:dev
```

## Docs
- OpenAPI contract: `docs/API_OPENAPI.yaml`
- DB schema reference (spec stage): `docs/DB_SCHEMA.sql`
- Canonical Prisma schema (Phase 00+): `prisma/schema.prisma`
