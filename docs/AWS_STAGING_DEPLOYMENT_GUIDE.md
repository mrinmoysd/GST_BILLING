# AWS Staging Deployment Guide

**Date**: 2026-03-22  
**Purpose**: Define the recommended AWS staging setup for this solution and provide the concrete N1 rollout path.

This guide is based on the current repository shape:

- NestJS API in `apps/api`
- Next.js web app in `apps/web`
- PostgreSQL via Prisma
- Redis/BullMQ for async jobs
- optional S3-compatible file storage
- refresh-cookie based auth

---

## Recommended AWS architecture

For staging, the most pragmatic AWS setup is:

- **Route 53** for DNS
- **ACM** for TLS certificates
- **ECR** for container images
- **ECS Fargate** for running both API and web
- **Application Load Balancer** for HTTPS ingress
- **RDS PostgreSQL** for database
- **ElastiCache Redis** for BullMQ
- **S3** for staging file storage
- **CloudWatch Logs** for container/application logs
- **Secrets Manager** for secrets

This is the right fit for current repo complexity. It avoids early Kubernetes overhead and matches the app’s current container-friendly runtime model.

---

## Recommended staging topology

## DNS

Use two hostnames:

- `staging.yourdomain.com` for web
- `api-staging.yourdomain.com` for API

Why:

- the web app already expects a configurable API base URL via `NEXT_PUBLIC_API_BASE_URL`
- separate API origin is easy to reason about operationally
- TLS and ALB routing stay simple

---

## Network layout

## VPC

Create one VPC for staging with:

- 2 public subnets
- 2 private app subnets
- 2 private data subnets

Recommended placement:

- ALB in public subnets
- ECS services in private app subnets
- RDS and ElastiCache in private data subnets

## Security groups

- `alb-sg`
  - inbound `80`, `443` from internet
  - outbound to ECS services
- `ecs-web-sg`
  - inbound from `alb-sg`
  - outbound to API, RDS, Redis, internet/NAT as needed
- `ecs-api-sg`
  - inbound from `alb-sg`
  - outbound to RDS, Redis, S3, provider endpoints
- `rds-sg`
  - inbound `5432` from `ecs-api-sg`
- `redis-sg`
  - inbound `6379` from `ecs-api-sg`

Keep RDS and Redis private only.

---

## Compute layout

## ECS cluster

Use one ECS cluster for staging.

Create two services:

- `gst-billing-web-staging`
- `gst-billing-api-staging`

## Container strategy

Build and push two images to ECR:

- `gst-billing-web`
- `gst-billing-api`

Recommended deployment model:

- web service target group on port `3000`
- api service target group on port `4000`
- ALB host-based routing:
  - `staging.yourdomain.com` -> web target group
  - `api-staging.yourdomain.com` -> api target group

---

## Data services

## RDS PostgreSQL

Recommended staging baseline:

- engine: PostgreSQL 16 if compatible with your tooling baseline
- instance: small burstable class for staging
- single-AZ is acceptable for staging
- automated backups enabled
- private access only

## ElastiCache Redis

Recommended staging baseline:

- single-node Redis/Valkey-compatible staging setup
- private access only

Redis is required because the repo uses BullMQ in `apps/api/src/jobs/jobs.module.ts`.

---

## Storage

Use S3 for staging files.

Recommended bucket:

- `gst-billing-staging-files`

Use:

- `FILE_STORAGE_DRIVER=s3`
- bucket-specific IAM access for the API task role

This will let you validate:

- invoice PDF output
- purchase attachment upload/download
- general file URL/signing behavior

---

## Secrets and configuration

Use **AWS Secrets Manager** for secrets and inject them into ECS task definitions.

## API env vars required

From current codebase:

- `PORT=4000`
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL_SECONDS`
- `JWT_REFRESH_TTL_SECONDS`
- `REDIS_HOST`
- `REDIS_PORT`
- `FILE_SIGNING_SECRET`
- `FILE_STORAGE_DRIVER`
- `FILE_STORAGE_BUCKET`
- `FILE_STORAGE_REGION`
- `FILE_STORAGE_ACCESS_KEY_ID` if not using task role-only approach
- `FILE_STORAGE_SECRET_ACCESS_KEY` if not using task role-only approach
- billing envs as applicable:
  - `BILLING_STRIPE_SECRET_KEY`
  - `BILLING_STRIPE_WEBHOOK_SECRET`
  - `BILLING_RAZORPAY_KEY_ID`
  - `BILLING_RAZORPAY_KEY_SECRET`
  - `BILLING_RAZORPAY_WEBHOOK_SECRET`
- notification envs as applicable:
  - `NOTIFICATIONS_EMAIL_WEBHOOK_URL`
  - `NOTIFICATIONS_SMS_WEBHOOK_URL`
  - `NOTIFICATIONS_WHATSAPP_WEBHOOK_URL`

## Web env vars required

- `PORT=3000`
- `NEXT_PUBLIC_API_BASE_URL=https://api-staging.yourdomain.com/api`

---

## Current code issues to address during N1

These are not AWS issues. They are current codebase staging-readiness issues.

## 1. Cookie security is still dev-mode

Current controllers set refresh cookies with:

- `secure: false`

Affected files:

- [auth.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/auth.controller.ts)
- [admin-auth.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/admin-auth.controller.ts)
- [onboarding.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/onboarding/onboarding.controller.ts)

For HTTPS staging, this should become env-driven, for example:

- `COOKIE_SECURE=true` in staging

## 2. CORS is too permissive

Current API bootstrap uses:

- `origin: true`

Affected file:

- [main.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/main.ts)

For staging, this should be locked to:

- `https://staging.yourdomain.com`

and optionally any explicit admin/public origins you actually use.

## 3. Proxy/middleware is intentionally not auth-aware

Current web `proxy.ts` explains why route guarding is client-side.

This is fine for staging, but QA should explicitly validate:

- refresh-token behavior
- hard refresh on protected routes
- login/logout redirect behavior

---

## Recommended AWS implementation order

## Step 1. DNS and certificates

1. Create or use a hosted zone in Route 53.
2. Request ACM certificate for:
   - `staging.yourdomain.com`
   - `api-staging.yourdomain.com`
3. Validate cert via Route 53 DNS.

## Step 2. Networking

1. Create VPC and subnets.
2. Create route tables.
3. Create NAT gateway if private ECS tasks need outbound internet access.
4. Create security groups.

## Step 3. Data services

1. Create RDS PostgreSQL.
2. Create ElastiCache Redis.
3. Create S3 staging bucket.

## Step 4. Container registry

1. Create ECR repo for API.
2. Create ECR repo for web.
3. Build and push images.

## Step 5. ECS services

1. Create ECS cluster.
2. Create task definitions:
   - web task
   - api task
3. Wire env vars and secrets.
4. Create ECS services in private subnets.

## Step 6. ALB

1. Create ALB in public subnets.
2. Add HTTPS listener with ACM cert.
3. Create host-based listener rules for web and API.
4. Attach target groups.

## Step 7. Database migration and seed

1. Run Prisma generate.
2. Run Prisma migrate deploy against staging DB.
3. Run auth seed for tenant owner and internal admin.

## Step 8. Smoke validation

1. Open web.
2. Open API Swagger.
3. Log in as tenant.
4. Log in as admin.

---

## Recommended staging task sizing

Start conservative:

## Web

- 0.5 vCPU
- 1 GB RAM

## API

- 0.5 to 1 vCPU
- 1 to 2 GB RAM

Increase only if:

- Next.js build/runtime memory requires it
- PDF generation or report jobs become heavy

---

## Recommended CI/CD shape

For staging:

1. push to main or staging branch
2. build API and web images
3. push images to ECR
4. update ECS service/task definitions
5. run migrations before or during rollout

Minimum safe sequencing:

1. deploy API
2. run migrations
3. deploy web
4. run smoke tests

---

## N1 acceptance checklist on AWS

N1 should not be marked complete until all of the below are true:

- `staging.yourdomain.com` loads
- `api-staging.yourdomain.com/swagger` loads
- database connectivity is healthy
- Redis connectivity is healthy
- migrations applied cleanly
- tenant login works
- admin login works
- protected route refresh behavior works after hard reload
- invoice PDF queue can at least enqueue/process in staging
- logs are visible in CloudWatch

---

## Recommended follow-up after N1

Immediately after N1:

- execute N2 using [E2E_MANUAL_TEST_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/E2E_MANUAL_TEST_PLAN.md)
- execute N3 on billing, webhooks, files, notifications, and exports

---

## Official AWS references used

- ECS service deployment: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/create-service-console-v2.html
- ECS + Secrets Manager env injection: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/secrets-envvar-secrets-manager.html
- RDS private database guidance: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/create-multi-az-db-cluster.html
- Route 53 to load balancer routing: https://docs.aws.amazon.com/AmazonRoute53/latest/DeveloperGuide/routing-to-elb-load-balancer.html
- ACM public certificate request: https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request-public.html

