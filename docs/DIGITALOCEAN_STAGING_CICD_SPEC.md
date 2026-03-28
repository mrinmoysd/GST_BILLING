# DigitalOcean Staging CI/CD Specification

**Date**: 2026-03-28  
**Purpose**: Define the implementation-ready CI/CD and infrastructure specification for deploying this product to a staging environment on DigitalOcean, with a clean promotion path to production later.  
**Implementation status**: Planned

Primary repo anchors:

- [package.json](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/package.json)
- [apps/web/package.json](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/package.json)
- [apps/api/package.json](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/package.json)
- [docker-compose.yml](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docker-compose.yml)
- [apps/api/src/main.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/main.ts)
- [apps/api/src/auth/auth.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/auth.controller.ts)
- [apps/api/src/auth/admin-auth.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/admin-auth.controller.ts)
- [apps/api/src/jobs/jobs.module.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/jobs/jobs.module.ts)
- [apps/api/src/files/files.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/files/files.service.ts)
- [docs/D14_LIVE_RELEASE_VALIDATION_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D14_LIVE_RELEASE_VALIDATION_SPEC.md)
- [docs/PRE_LAUNCH_EXECUTION_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/PRE_LAUNCH_EXECUTION_PLAN.md)

DigitalOcean primary references used for this spec:

- [App Spec Reference](https://docs.digitalocean.com/products/app-platform/reference/app-spec/)
- [Deploy from Container Images](https://docs.digitalocean.com/products/app-platform/how-to/deploy-from-container-images/)
- [Deploy Using GitHub Actions](https://docs.digitalocean.com/products/app-platform/how-to/deploy-from-github-actions/)
- [Manage Databases in App Platform](https://docs.digitalocean.com/products/app-platform/how-to/manage-databases/)
- [Manage Workers in App Platform](https://docs.digitalocean.com/products/app-platform/how-to/manage-workers/)
- [Manage Cron Jobs and Deployment Jobs in App Platform](https://docs.digitalocean.com/products/app-platform/how-to/manage-jobs/)
- [Container Registry Quickstart](https://docs.digitalocean.com/products/container-registry/getting-started/quickstart/)
- [How to Create a VPC](https://docs.digitalocean.com/products/networking/vpc/how-to/create/)
- [Spaces S3 Compatibility](https://docs.digitalocean.com/products/spaces/reference/s3-compatibility/)
- [Managed Databases](https://docs.digitalocean.com/products/databases/)
- [Valkey Reference](https://docs.digitalocean.com/products/databases/valkey/reference/)

---

## 1. Executive decision

For this codebase, the recommended first staging platform on DigitalOcean is:

- **DigitalOcean App Platform** for web and API runtime
- **DigitalOcean Container Registry (DOCR)** for built images
- **Managed PostgreSQL** for Prisma data
- **Managed Valkey** for BullMQ / Redis-compatible queueing
- **Spaces** for S3-compatible file storage
- **GitHub Actions** for CI/CD orchestration
- **Terraform** for infrastructure provisioning and drift control

This is the best fit for the current repo because:

- the app is a monorepo with only two real runtimes today: `apps/web` and `apps/api`
- local infrastructure is already simple: Postgres + Redis only
- there is no Kubernetes, Helm, or existing container platform layer in the repo
- launch risk is currently about **safe staging proof**, not cluster engineering
- App Platform supports YAML app specs, deployment jobs, workers, container images, and managed database integration

## Explicit non-decision

Do **not** start with DOKS / Kubernetes for staging.

That would add:

- cluster operations
- ingress management
- secret/config management complexity
- more rollout failure modes

without solving a current business problem.

---

## 2. Current repo reality

The deployment spec must fit what the repository actually is today.

### 2.1 Current application shape

- frontend: Next.js 16 app in `apps/web`
- backend: NestJS app in `apps/api`
- database: Prisma + PostgreSQL
- queueing: BullMQ using Redis-compatible connectivity
- file storage:
  - `local`
  - `s3`
  - `minio`
- local dev infra currently defined only in [docker-compose.yml](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docker-compose.yml)

### 2.2 Current deployment gaps

- no `.github/workflows`
- no app-platform spec files
- no Dockerfiles
- no Terraform
- no image registry workflow
- no environment separation model
- no migration deployment job
- no smoke-test deployment gates

### 2.3 Current code constraints that affect staging

From current code:

- API CORS is still `origin: true` in [main.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/main.ts)
- auth refresh cookies are still `secure: false` in [auth.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/auth.controller.ts) and [admin-auth.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/admin-auth.controller.ts)
- jobs are currently embedded in the API process through [jobs.module.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/jobs/jobs.module.ts)
- file storage already supports S3-compatible endpoints through [files.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/files/files.service.ts)

This means the staging plan should:

- prefer **same-origin ingress** for web + API
- make cookie and CORS settings env-driven
- keep jobs in the API service initially
- use Spaces as the first object-storage target

---

## 3. Staging architecture

## 3.1 Environment model

Create two environments in the long-term model:

- `staging`
- `production`

This spec implements `staging` first, but every artifact should be named so production can be added without redesign.

### Naming convention

- DO Project:
  - `gst-billing-platform`
- App Platform app:
  - `gst-billing-staging`
- Container Registry:
  - `gstbilling`
- Spaces bucket:
  - `gst-billing-staging-files`
- Postgres cluster:
  - `gst-billing-staging-pg`
- Valkey cluster:
  - `gst-billing-staging-cache`

## 3.2 Region

Use **one region only** for staging, and keep all resources there.

Recommended default:

- `blr1` if available for your account and required services

Fallback:

- nearest region where App Platform, Managed PostgreSQL, Managed Valkey, and Spaces are all available together

The final region decision should be made once, then reused across:

- App Platform
- DOCR
- Managed DB
- Valkey
- Spaces

## 3.3 Domain model

Use a **single primary staging hostname**:

- `staging.yourdomain.com`

Do **not** use a separate API subdomain for the first staging rollout.

### Why single-origin is preferred

This app uses refresh-token cookies with API path scoping. Same-origin ingress is simpler and safer because:

- fewer CORS edge cases
- fewer cookie-domain issues
- easier browser auth validation
- cleaner staging parity with production

### Ingress model

Within one App Platform app:

- `/api` -> API service
- `/swagger` -> API service
- `/health` -> API service
- `/` -> web service

Then set:

- `NEXT_PUBLIC_API_BASE_URL=https://staging.yourdomain.com/api`

---

## 4. Runtime topology

## 4.1 App Platform components

Create one App Platform app with these components:

### `web`

- type: `service`
- public
- source: DOCR image
- port: `3000`
- run command: `npm --workspace apps/web run start`

### `api`

- type: `service`
- public only through ingress path rules
- source: DOCR image
- port: `4000`
- run command: `npm --workspace apps/api run start:prod`
- health check path: `/health`

### `migrate`

- type: `job`
- kind: `PRE_DEPLOY`
- source: same API image
- run command: `npm --workspace apps/api run prisma:migrate:deploy`

### `seed-staging` optional

- type: `job`
- kind: manual only, not automatic
- source: same API image
- run command options:
  - `npm --workspace apps/api run seed:auth`
  - `npm --workspace apps/api run seed:full`
  - `npm --workspace apps/api run seed:distributor`

This should **not** run on every deployment.

## 4.2 Worker decision

Do **not** create a separate App Platform worker in v1 staging.

Reason:

- current BullMQ processor is embedded in the API process
- there is no dedicated worker entrypoint in the repo yet
- staging objective is proof, not early queue topology optimization

Future upgrade path:

- create `apps/api/src/worker.ts`
- run that as a separate App Platform worker using the same image
- keep API HTTP capacity independent from queue throughput

---

## 5. Managed services

## 5.1 PostgreSQL

Provision one **Managed PostgreSQL** cluster for staging.

Requirements:

- private / trusted-source restricted connectivity
- automated backups enabled
- staging-specific db + user
- connection string exported to App Platform as `DATABASE_URL`

Recommended database objects:

- database: `gst_billing`
- user: `gst_billing_app`

## 5.2 Valkey

Provision one **Managed Valkey** cluster for staging.

Reason:

- DigitalOcean Managed Caching has been discontinued in favor of Valkey
- Valkey is Redis-compatible and fits BullMQ

App envs:

- `REDIS_HOST`
- `REDIS_PORT`

If authentication is enabled later, add:

- `REDIS_PASSWORD`

Note:

The current code reads only `REDIS_HOST` and `REDIS_PORT`, so auth/TLS support may need a follow-up hardening task if the cluster configuration requires it.

## 5.3 Spaces

Provision one **Spaces** bucket for staging file storage.

Use:

- `FILE_STORAGE_DRIVER=s3`
- `FILE_STORAGE_BUCKET=gst-billing-staging-files`
- `FILE_STORAGE_REGION=<spaces-region>`
- `FILE_STORAGE_ENDPOINT=https://<spaces-region>.digitaloceanspaces.com`
- `FILE_STORAGE_ACCESS_KEY_ID`
- `FILE_STORAGE_SECRET_ACCESS_KEY`

Use Spaces for:

- invoice PDFs
- purchase attachments
- export artifacts
- future signed download/upload validation

## 5.4 Project and tagging

Create one DigitalOcean Project and attach:

- App Platform app
- PostgreSQL cluster
- Valkey cluster
- Spaces bucket
- Container Registry

Use consistent tags:

- `app:gst-billing`
- `env:staging`
- `managed-by:terraform`

---

## 6. Infrastructure as code

Terraform is the source of truth for infrastructure.

## 6.1 Terraform scope

Terraform should provision:

- project
- registry
- app
- postgres cluster
- valkey cluster
- spaces bucket
- app domains if managed in Terraform
- alerts where supported

Terraform should **not** own:

- dynamic image tags or digests
- per-deployment runtime rollout state
- one-off seed runs

## 6.2 Recommended repo structure

Add:

```text
infra/
  terraform/
    modules/
      project/
      app/
      postgres/
      valkey/
      spaces/
      registry/
    envs/
      staging/
        main.tf
        variables.tf
        outputs.tf
        backend.hcl.example
```

## 6.3 State storage

Use a remote Terraform backend.

Recommended:

- Terraform Cloud, or
- S3-compatible remote backend already trusted by your team

Do not keep Terraform state local in CI.

## 6.4 Terraform outputs required

Expose at minimum:

- `app_id`
- `default_ingress`
- `postgres_uri`
- `postgres_host`
- `postgres_port`
- `postgres_db_name`
- `postgres_user`
- `valkey_host`
- `valkey_port`
- `spaces_bucket`
- `spaces_region`
- `container_registry_name`

---

## 7. App spec strategy

Use App Platform **app spec files** in repo.

## 7.1 Files to add

```text
.do/
  app-staging.template.yaml
  app-production.template.yaml
```

The committed files should be templates, not fully rendered secrets.

## 7.2 Rendering model

Render the template in CI with:

- image digests
- environment names
- domain names
- app ids where needed

Recommended helper:

```text
scripts/
  render-app-spec.sh
```

## 7.3 App spec requirements

The spec must include:

- app name
- region
- ingress rules
- alerts
- app-level envs
- `web` service image and port
- `api` service image and port
- `migrate` pre-deploy job
- optional domains

## 7.4 Deployment image rule

Always deploy **immutable image digests**, not mutable tags.

DigitalOcean explicitly recommends digest-based deployment for consistency and cache safety.

---

## 8. Containerization requirements

The current repo does not yet have deployable Dockerfiles. That is a required prerequisite.

## 8.1 Files to add

```text
apps/web/Dockerfile
apps/api/Dockerfile
.dockerignore
```

## 8.2 Web image requirements

The web Dockerfile should:

- install workspace deps
- build `apps/web`
- run `next start`
- expose `3000`

Recommended code change:

- set `output: "standalone"` in [next.config.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/next.config.ts) for smaller runtime images

## 8.3 API image requirements

The API Dockerfile should:

- install workspace deps
- run Prisma generate
- build `apps/api`
- include compiled Nest output plus Prisma client
- run `node dist/main` or workspace equivalent
- expose `4000`

## 8.4 Container validation

CI must verify:

- `docker build` for web
- `docker build` for api
- optional smoke run with `docker run` and health probe

---

## 9. Required codebase hardening before first deployment

These are deployment prerequisites, not optional polish.

## 9.1 Cookie security

Make auth cookie settings env-driven.

Add envs:

- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`
- `COOKIE_DOMAIN` optional

Apply to:

- tenant auth refresh cookie
- admin auth refresh cookie
- onboarding auth cookie flow if applicable

Staging target:

- `COOKIE_SECURE=true`
- `COOKIE_SAME_SITE=lax`

## 9.2 CORS policy

Replace `origin: true` with env-driven origins.

Add env:

- `CORS_ALLOWED_ORIGINS=https://staging.yourdomain.com`

If using same-origin path routing only, the policy can stay narrowly defined to the staging host.

## 9.3 Runtime environment identity

Add env:

- `APP_ENV=staging`
- `NODE_ENV=production`

## 9.4 Health and smoke endpoints

Keep and use:

- `/health` on API

Optional improvement:

- add `/api/readyz` if deeper dependency checks are needed later

## 9.5 Redis auth/TLS hardening

If managed Valkey requires password or TLS in your chosen config, extend the queue bootstrap to support:

- `REDIS_PASSWORD`
- `REDIS_TLS=true`

This is a deployment-readiness review item because current code only reads host/port.

---

## 10. Environment variable contract

## 10.1 App-level shared envs

- `APP_ENV`
- `NODE_ENV`
- `NEXT_PUBLIC_API_BASE_URL`

## 10.2 API runtime envs

Required:

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
- `FILE_STORAGE_ENDPOINT`
- `FILE_STORAGE_ACCESS_KEY_ID`
- `FILE_STORAGE_SECRET_ACCESS_KEY`
- `COOKIE_SECURE`
- `COOKIE_SAME_SITE`
- `CORS_ALLOWED_ORIGINS`

Conditional:

- `BILLING_STRIPE_SECRET_KEY`
- `BILLING_STRIPE_WEBHOOK_SECRET`
- `BILLING_RAZORPAY_KEY_ID`
- `BILLING_RAZORPAY_KEY_SECRET`
- `BILLING_RAZORPAY_WEBHOOK_SECRET`
- `NOTIFICATIONS_EMAIL_WEBHOOK_URL`
- `NOTIFICATIONS_SMS_WEBHOOK_URL`
- `NOTIFICATIONS_WHATSAPP_WEBHOOK_URL`
- `REDIS_PASSWORD`
- `REDIS_TLS`
- staging seed envs like:
  - `SEED_ADMIN_EMAIL`
  - `SEED_ADMIN_PASSWORD`
  - `SEED_COMPANY_NAME`

## 10.3 Web runtime envs

- `PORT=3000`
- `NEXT_PUBLIC_API_BASE_URL=https://staging.yourdomain.com/api`

## 10.4 GitHub Actions secrets

Repository or environment secrets required:

- `DIGITALOCEAN_ACCESS_TOKEN`
- `TF_VAR_digitalocean_token`
- `TF_VAR_spaces_access_key_id`
- `TF_VAR_spaces_secret_access_key`
- `STAGING_APP_ID`
- `STAGING_DOMAIN`
- `DOCR_REGISTRY`
- optional:
  - `SLACK_WEBHOOK_URL`
  - `PLAYWRIGHT_STAGING_USERNAME`
  - `PLAYWRIGHT_STAGING_PASSWORD`

Use GitHub **environment-scoped secrets** for staging and production separately.

---

## 11. CI pipeline

Create:

```text
.github/workflows/ci.yml
```

## 11.1 Trigger

- pull requests to `main`
- pushes to `main`

## 11.2 CI job order

1. checkout
2. setup Node and npm cache
3. install root dependencies
4. `npm --workspace apps/api run prisma:generate`
5. `npm --workspace apps/api run typecheck`
6. `npm --workspace apps/api run build`
7. `npm --workspace apps/web run lint`
8. `npm --workspace apps/web run build`
9. `npm --workspace apps/api run test`
10. optional:
    - `npm --workspace apps/web run test:e2e` on preview or dedicated integration infra
11. docker build verification for web and api

## 11.3 CI failure policy

Any failure blocks deployment.

Deployment workflows must require CI success.

---

## 12. Infrastructure pipeline

Create:

```text
.github/workflows/infra-plan.yml
.github/workflows/infra-apply-staging.yml
.github/workflows/infra-apply-production.yml
```

## 12.1 Plan workflow

Trigger:

- pull request when `infra/**`, `.do/**`, `Dockerfile*`, or workflow files change

Steps:

1. terraform fmt check
2. terraform init
3. terraform validate
4. terraform plan
5. upload plan artifact
6. comment plan summary on PR

## 12.2 Apply staging workflow

Trigger:

- merge to `main` when infra files changed
- manual dispatch

Steps:

1. checkout
2. terraform init
3. terraform apply for staging
4. capture outputs
5. store outputs as workflow artifacts

## 12.3 Apply production workflow

Trigger:

- manual only
- GitHub environment approval required

---

## 13. Application deployment pipeline

Create:

```text
.github/workflows/deploy-staging.yml
.github/workflows/deploy-production.yml
```

## 13.1 Staging deployment trigger

Trigger:

- push to `main`
- manual dispatch

## 13.2 Staging deployment stages

### Stage A. Build images

Build:

- `web`
- `api`

Tag each image with:

- full commit SHA
- optional short SHA

Push to:

- `registry.digitalocean.com/<registry>/gst-billing-web:<sha>`
- `registry.digitalocean.com/<registry>/gst-billing-api:<sha>`

Capture:

- pushed digest for each image

### Stage B. Render app spec

Render `.do/app-staging.template.yaml` into:

- `dist/app-staging.yaml`

Inject:

- `web` digest
- `api` digest
- staging domain
- environment values

### Stage C. Deploy

Use either:

- `digitalocean/app_action/deploy@v2`, or
- `doctl apps update <app-id> --spec dist/app-staging.yaml`

Recommended default:

- `doctl apps update` for explicit control over rendered spec

### Stage D. Wait for deployment

Poll App Platform deployment state until:

- success, or
- timeout / failure

### Stage E. Smoke tests

Run:

- `GET /health`
- web home load
- login page load
- one protected-route redirect check
- optional staged Playwright smoke pack

### Stage F. Publish evidence

Upload:

- final rendered spec
- image digests
- deployment id
- smoke test output

## 13.3 Production deployment trigger

Trigger:

- release tag, or
- manual dispatch with target git SHA

Protection:

- GitHub environment approval
- production secrets only available after approval

Flow is same as staging, but:

- uses production app spec
- uses production domain
- uses production app id

---

## 14. Migration strategy

## 14.1 Rule

All schema migrations must run **before** new app code begins serving traffic.

## 14.2 Mechanism

Use an App Platform **PRE_DEPLOY job** named `migrate`.

Command:

```bash
npm --workspace apps/api run prisma:migrate:deploy
```

## 14.3 Failure rule

If the migration job fails:

- deployment fails
- rollout stops
- no manual bypass in normal staging flow

## 14.4 Seed strategy

Seeding is separate from migration.

Use a manual one-off job after first environment creation or after deliberate reset.

Recommended seed order:

1. `seed:auth`
2. `seed:full`
3. `seed:distributor` only if needed for distributor-focused QA

---

## 15. Rollback strategy

## 15.1 Application rollback

Rollback application code by redeploying the last known-good image digests through the app spec.

Do not rely on mutable tags.

## 15.2 Database rollback

Prisma migrations are forward-first.

Therefore:

- do not auto-rollback database schema in CI/CD
- take managed Postgres backups/snapshots seriously
- require manual review before any destructive schema recovery

## 15.3 Asset rollback

Spaces objects are not part of code rollback.

If a deployment needs rollback:

- keep existing files
- only roll back runtime image and config

## 15.4 Operational rollback runbook

Create a documented rollback procedure with:

1. identify failed deployment id
2. identify previous good web/api digests
3. re-render app spec with previous digests
4. redeploy app spec
5. verify `/health`
6. verify login
7. verify invoice PDF generation

---

## 16. Observability and alerts

## 16.1 Minimum staging observability

Track:

- App Platform deployment status
- API runtime logs
- web runtime logs
- database health
- Valkey health
- Spaces upload/download success through app behavior

## 16.2 App alerts

Configure at app level:

- deployment failed
- domain failed

Optionally add component alerts if App Platform alerting supports the chosen rules for your services.

## 16.3 Deployment evidence

Each deployment should record:

- git SHA
- image digests
- app deployment id
- migration job result
- smoke test result
- operator/approver if manual

---

## 17. Preview environments

Preview apps for pull requests are useful, but **not required for first staging rollout**.

Decision:

- defer PR preview apps until main staging is stable

Reason:

- previews add cost and app sprawl
- the current priority is one strong staging environment for D14 validation

Future enhancement:

- use App Platform PR preview workflow or temporary review apps only for UI-heavy work

---

## 18. Implementation backlog

## 18.1 Foundation

1. add Dockerfiles for web and api
2. add `.dockerignore`
3. update Next config for standalone output
4. make cookie settings env-driven
5. make CORS origins env-driven
6. review Redis auth/TLS needs

## 18.2 Infrastructure

1. add Terraform structure
2. provision DO project
3. provision DOCR
4. provision Managed PostgreSQL
5. provision Managed Valkey
6. provision Spaces bucket + access keys
7. create staging app shell in App Platform

## 18.3 App deployment config

1. add `.do/app-staging.template.yaml`
2. add `.do/app-production.template.yaml`
3. add spec render script
4. add pre-deploy migration job
5. add manual seed job

## 18.4 CI/CD

1. add `ci.yml`
2. add `infra-plan.yml`
3. add `infra-apply-staging.yml`
4. add `deploy-staging.yml`
5. add `deploy-production.yml`
6. add smoke test script

## 18.5 Staging proof

1. first infra apply
2. first deployment
3. first migration job execution
4. first seed run
5. D14 validation evidence collection

---

## 19. Definition of done

This spec is considered implemented when all of the following are true:

1. A fresh commit to `main` can automatically:
   - pass CI
   - build images
   - push images to DOCR
   - deploy staging via App Platform app spec
   - run Prisma migrations before app traffic cutover
   - run smoke checks

2. Staging has working:
   - web
   - API
   - PostgreSQL
   - Valkey
   - Spaces-backed file storage

3. Secrets are not hardcoded in repo or workflow YAML.

4. Rollback to a prior image digest is documented and tested once.

5. D14 can use the staging environment as its actual validation target.

---

## 20. Final recommendation

For this repo, the most practical deployment strategy is:

- **Terraform provisions the DigitalOcean infrastructure**
- **GitHub Actions runs CI**
- **GitHub Actions builds and pushes immutable images to DOCR**
- **GitHub Actions updates a DigitalOcean App Platform app spec with image digests**
- **App Platform runs a PRE_DEPLOY Prisma migration job**
- **staging smoke tests run immediately after deployment**

This gives the team:

- low operational complexity
- safe, repeatable staging deployment
- clean evidence for D14
- a direct future path to production

without prematurely taking on Kubernetes-level platform work.
