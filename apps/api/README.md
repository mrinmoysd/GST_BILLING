# API (NestJS)

Backend API for the GST Billing Software.

## Prereqs
- Node.js v20+
- Docker (recommended for Postgres + Redis)

## Local dev

### Start dependencies

From repo root:

```bash
docker compose up -d postgres redis
```

> You said Redis is already running on port `6379`  that's fine. You can skip starting the compose `redis` service.

### Install deps

From repo root:

```bash
npm install
```

### Run the API

From repo root:

```bash
npm run api:dev
```

## Async jobs (BullMQ)

The API runs BullMQ workers **inside the same NestJS process**.

Invoice PDF regeneration is async:
- `POST /api/companies/:companyId/invoices/:invoiceId/pdf/regenerate` enqueues a job.
- `GET /api/companies/:companyId/jobs/:jobId` polls job status.
- `GET /api/companies/:companyId/invoices/:invoiceId/pdf` downloads the generated file.

## Tests

From repo root:

```bash
npm --workspace apps/api run test:e2e
```
