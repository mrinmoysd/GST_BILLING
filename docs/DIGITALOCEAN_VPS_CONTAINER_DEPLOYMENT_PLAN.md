# Vyapar Genie DigitalOcean VPS Container Deployment Plan

**Date**: March 31, 2026  
**Purpose**: Define the end-to-end deployment plan for running **Vyapar Genie** on a single DigitalOcean VPS using containers, GitHub Actions, and the `staging` branch as the staging deployment branch.  
**Status**: V1-V3 implemented; V4 partially executed on April 11, 2026; V5-V6 pending. Deployment preflight was revalidated on April 11, 2026, including a production-safe Prisma migration path for the staging container flow.  
**Decision**: This document supersedes the older App Platform-first direction in [DIGITALOCEAN_STAGING_CICD_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/DIGITALOCEAN_STAGING_CICD_SPEC.md) for the VPS rollout path.

Primary repo anchors:

- [package.json](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/package.json)
- [docker-compose.yml](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docker-compose.yml)
- [apps/api/package.json](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/package.json)
- [apps/web/package.json](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/package.json)
- [apps/api/src/main.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/main.ts)
- [apps/api/src/app.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/app.controller.ts)
- [apps/api/src/common/config/env.validation.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/common/config/env.validation.ts)
- [apps/web/src/lib/config.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/config.ts)
- [apps/api/src/auth/auth.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/auth.controller.ts)
- [apps/api/src/auth/admin-auth.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/admin-auth.controller.ts)
- [apps/api/src/jobs/jobs.module.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/jobs/jobs.module.ts)
- [apps/api/src/files/files.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/files/files.service.ts)
- [apps/api/src/seed/comprehensive.seed.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/seed/comprehensive.seed.ts)
- [scripts/reset_and_seed_local.sh](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/scripts/reset_and_seed_local.sh)

Primary external references:

- [DigitalOcean Container Registry Reference](https://docs.digitalocean.com/products/container-registry/reference/)
- [Adding self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/adding-self-hosted-runners)
- [Configuring the self-hosted runner as a service](https://docs.github.com/en/actions/how-tos/hosting-your-own-runners/managing-self-hosted-runners/configuring-the-self-hosted-runner-application-as-a-service)
- [Using secrets in GitHub Actions](https://docs.github.com/en/actions/how-tos/administering-github-actions/sharing-workflows-secrets-and-runners-with-your-organization)
- [Using self-hosted runners in a workflow](https://docs.github.com/en/actions/hosting-your-own-runners/managing-self-hosted-runners/using-self-hosted-runners-in-a-workflow)

---

## 1. Executive decision

For this repo, the safest and most maintainable first deployment on DigitalOcean is:

- **one Ubuntu Droplet**
- **Docker Engine + Docker Compose**
- **Caddy** as the reverse proxy and TLS terminator
- **one container each for**:
  - `web`
  - `api`
  - `postgres`
  - `redis`
  - `caddy`
- **DigitalOcean Container Registry (DOCR)** for image storage
- **GitHub Actions** for CI and image publishing
- **a self-hosted GitHub Actions runner on the Droplet** for the final deploy step

This is the recommended path because:

- the repo currently has **no Dockerfiles**
- there are **no GitHub workflows**
- the runtime is still only two app processes plus Postgres and Redis
- queueing is embedded in the API process
- the current objective is **staging-quality deployment on `staging`**, not cluster orchestration

---

## 2. Current repo reality

## 2.1 What already exists

- monorepo with `apps/api` and `apps/web`
- local infra only in [docker-compose.yml](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docker-compose.yml)
- API health endpoint at `/health` in [app.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/app.controller.ts)
- compiled seed scripts are already emitted into `apps/api/dist`
- a comprehensive current-schema seed exists in [comprehensive.seed.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/seed/comprehensive.seed.ts)

## 2.2 What does not exist yet

- no confirmed live DOCR repository configured yet
- no `DO_API_TOKEN` wired into GitHub staging secrets yet
- no first real staging image build/push executed yet
- no first real staging deployment executed yet

## 2.2.1 What now exists in staging execution reality

- staging Droplet exists at `104.236.85.110`
- GoDaddy DNS already points `staging.vyapargenie.in` to the Droplet
- Droplet bootstrap has been executed
- `/opt/vyapar-genie` directory layout now exists on the server
- Docker Engine and Docker Compose plugin are installed
- UFW is active for `22`, `80`, and `443`
- self-hosted GitHub runner `vyapar-genie-staging` is installed and online with label `gst-billing-staging`
- GitHub `staging` environment exists and now has the non-DigitalOcean secrets populated

## 2.3 Deployment-affecting code constraints

These are important because the VPS plan must fit the current implementation rather than assume an idealized one:

- API defaults to port `4000` in [main.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/main.ts)
- web defaults to `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api` in [config.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/config.ts)
- API now supports env-driven CORS origins through [main.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/main.ts) and [http-runtime.config.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/common/config/http-runtime.config.ts)
- refresh-token cookie behavior is now env-driven in auth and onboarding controllers through [http-runtime.config.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/common/config/http-runtime.config.ts)
- Redis is configured by `REDIS_HOST` / `REDIS_PORT` in [jobs.module.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/jobs/jobs.module.ts)
- file storage supports `local`, `s3`, and `minio` in [files.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/files/files.service.ts)

## 2.4 Deployment implication

The first VPS deployment should be **same-origin**:

- `https://staging.yourdomain.com/` -> `web`
- `https://staging.yourdomain.com/api/*` -> `api`
- `https://staging.yourdomain.com/swagger` -> `api`
- `https://staging.yourdomain.com/health` -> `api`

This is simpler and safer than using separate web/api subdomains because the app already relies on auth cookies and browser-based session refresh.

---

## 3. Target staging architecture

## 3.1 Environment model

Branch and environment policy:

- `staging` -> deploy to **staging**
- `main` -> reserved for later **production**

Initial naming recommendation:

- product name: `Vyapar Genie`
- DO project: `vyapar-genie-platform`
- Droplet hostname: `vyapar-genie-staging`
- Registry: `vyapar-app`
- staging domain: `staging.yourdomain.com`
- production app domain: `app.yourdomain.com`
- app directory on server: `/opt/vyapar-genie`

## 3.2 Domain and subdomain strategy

Use your GoDaddy-purchased root domain and split environments by subdomain:

- staging: `staging.yourdomain.com`
- production app: `app.yourdomain.com`

Optional future marketing split:

- marketing/public site: `yourdomain.com`
- product app: `app.yourdomain.com`

This is the cleanest model because:

- staging and production stay isolated
- SSL certificates are easy to manage with Caddy
- auth cookies stay same-origin per environment
- future marketing-site changes do not risk breaking the app host

## 3.3 GoDaddy DNS setup

In GoDaddy DNS management, create these records:

### For staging

- type: `A`
- host/name: `staging`
- value: the public IPv4 of the staging Droplet
- TTL: default or `600`

### For production later

- type: `A`
- host/name: `app`
- value: the public IPv4 of the production Droplet
- TTL: default or `600`

If you later decide to put the marketing site on the root domain, leave that as a separate decision and do not mix it into the first app deployment.

## 3.4 TLS expectation

With these DNS records in place, Caddy can automatically obtain and renew certificates for:

- `staging.yourdomain.com`
- `app.yourdomain.com`

No manual certificate management should be needed if:

- DNS is pointed correctly
- ports `80` and `443` are open
- the Caddy container is publicly reachable

## 3.5 Cutover checklist for subdomains

Before first staging deploy:

1. Create the `staging` A record in GoDaddy.
2. Wait for DNS to resolve publicly.
3. Verify the Droplet is reachable on ports `80` and `443`.
4. Start Caddy with the final `staging.yourdomain.com` host configured.
5. Verify HTTPS issuance succeeds.

Before production deploy later:

1. Create the `app` A record in GoDaddy.
2. Point it at the production Droplet.
3. Repeat the same Caddy/TLS verification flow.

## 3.6 Recommended Droplet size

For this repo on one VPS:

- **minimum acceptable staging**:
  - `2 vCPU / 4 GB RAM / 80 GB SSD`
- **recommended staging**:
  - `4 vCPU / 8 GB RAM / 160 GB SSD`

Why:

- Next.js build and runtime both need memory
- API + queues + Prisma + Redis + Postgres on one box can pressure RAM quickly
- staging should still support seeded data and browser validation comfortably

## 3.7 Network and security model

Use:

- one public IPv4
- domain A record to Droplet IP
- DigitalOcean Cloud Firewall
- Ubuntu UFW
- SSH key login only
- disable password SSH
- automatic security updates
- fail2ban

Recommended open ports:

- `22/tcp` for SSH
- `80/tcp` for HTTP
- `443/tcp` for HTTPS

All app containers stay on the internal Docker network. Only Caddy exposes public ports.

---

## 4. Container topology

Use one Docker Compose stack with:

### `caddy`

Responsibilities:

- TLS
- HTTP to HTTPS redirect
- reverse proxy
- request size limits
- public ingress

### `web`

Responsibilities:

- serve the Next.js app
- run on internal port `3000`

### `api`

Responsibilities:

- serve NestJS on internal port `4000`
- run BullMQ processors embedded in the API process
- run Prisma-generated code
- access local or object file storage

### `postgres`

Responsibilities:

- primary application database
- persistent named volume

### `redis`

Responsibilities:

- BullMQ backing store
- auth/session-adjacent async workloads if added later

---

## 5. Deployment strategy

## 5.1 Recommended CI/CD pattern

Use **two runner types**:

### GitHub-hosted runner

Used for:

- install
- lint
- build
- test
- Docker build
- push images to DOCR

### Self-hosted runner on the Droplet

Used for:

- final `docker compose pull`
- `docker compose up -d`
- migration execution
- optional seed jobs

This is preferred over GitHub-hosted SSH deployment because:

- no broad SSH ingress from random GitHub runner IPs
- no need to keep fragile SSH deploy actions as the main mechanism
- the Droplet can pull images locally and deploy with less secret sprawl
- deployments remain close to the target runtime environment

## 5.2 Workflow set

Create these workflows:

### `ci.yml`

Trigger:

- `pull_request` to `staging`
- `push` to `staging`

Responsibilities:

- `npm ci`
- API `prisma:generate`
- API typecheck
- API build
- web lint
- web build

### `build-and-push-staging.yml`

Trigger:

- `push` to `staging`
- `workflow_dispatch`

Responsibilities:

- build API image
- build web image
- tag with:
  - commit SHA plus service suffix, for example `<sha>-api` and `<sha>-web`
  - service latest tags, `staging-api-latest` and `staging-web-latest`
- push to DOCR

For the current `vyapar-app` registry tier, both images must live inside a single DOCR repository and be separated by tags rather than separate repository names.

### `deploy-staging.yml`

Trigger:

- `workflow_run` after successful `build-and-push-staging`
- `workflow_dispatch`

Runner:

- self-hosted Linux runner on the staging Droplet

Responsibilities:

- pull latest images by tag
- run Prisma migrations
- restart stack with zero manual shell work
- run health checks

### `seed-staging.yml`

Trigger:

- `workflow_dispatch` only

Responsibilities:

- optional database reset
- run:
  - `seed:auth:prod`
  - `seed:distributor:prod`
  - `seed:full:prod`
  - `seed:comprehensive:prod`

This must be **manual only**, never on every deploy.

### `backup-staging-db.yml` optional

Trigger:

- scheduled weekly or daily

Responsibilities:

- `pg_dump`
- upload to Droplet backup path or object storage

---

## 6. Required implementation work before first deploy

These are the tasks that should be completed in the repo before the first real VPS release.

## 6.1 Containerization

Create:

- root `.dockerignore`
- API Dockerfile
- web Dockerfile
- production compose file
- Caddyfile

Recommended file set:

- `deployment/docker/api.Dockerfile`
- `deployment/docker/web.Dockerfile`
- `deployment/docker/docker-compose.staging.yml`
- `deployment/docker/Caddyfile`
- `.dockerignore`

## 6.2 Web image strategy

Recommended:

- set Next.js output to `standalone`
- use a multi-stage image
- bake `NEXT_PUBLIC_API_BASE_URL` at build time for staging

Reason:

- smaller image
- simpler runtime command
- less dependency sprawl in the final container

## 6.3 API image strategy

Recommended:

- multi-stage build
- run `prisma generate`
- run `nest build`
- final image serves `apps/api/dist/main`

Also add production-safe package scripts:

- `seed:auth:prod`
- `seed:distributor:prod`
- `seed:full:prod`
- `seed:comprehensive:prod`

These should execute compiled JS in `dist`, not `ts-node`.

## 6.4 Runtime hardening required for deployment

Before staging signoff, make these env-driven:

- API CORS allowed origins
- cookie `secure`
- cookie `sameSite`
- optional `trust proxy`
- public API base URL

V1 has already completed the backend runtime hardening for:

- API CORS origin
- cookie `secure`
- cookie `sameSite`
- optional `trust proxy`
- compiled production seed commands

The remaining item in this group is the final container/runtime wiring of those values during deployment.

Recommended new API envs:

- `APP_BASE_URL`
- `WEB_BASE_URL`
- `API_CORS_ORIGIN`
- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=lax`
- `TRUST_PROXY=true`

---

## 7. Environment and secret model

## 7.1 GitHub environment

Create a GitHub environment:

- `staging`

Store environment secrets there, not only as repo-wide secrets.

## 7.2 GitHub secrets required

### Registry and DigitalOcean

- `DO_API_TOKEN`
- `DOCR_REGISTRY_NAME`

### Build-time web config

- `STAGING_DOMAIN`
- `NEXT_PUBLIC_API_BASE_URL`

### Optional deploy-time variables

- `DEPLOY_IMAGE_TAG_STRATEGY`

## 7.3 Droplet-side env file

On the server, store:

- `/opt/gst-billing/.env.staging`

This should contain application runtime secrets, for example:

- `DATABASE_URL`
- `PORT=4000`
- `REDIS_HOST=redis`
- `REDIS_PORT=6379`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL_SECONDS`
- `JWT_REFRESH_TTL_SECONDS`
- `FILE_SIGNING_SECRET`
- `FILE_STORAGE_DRIVER=local` for first staging
- `FILE_STORAGE_ROOT=/var/lib/gst-billing/storage`
- `BILLING_STRIPE_SECRET_KEY` if using Stripe
- `BILLING_STRIPE_WEBHOOK_SECRET`
- `BILLING_RAZORPAY_KEY_ID` if using Razorpay
- `BILLING_RAZORPAY_KEY_SECRET`
- `BILLING_RAZORPAY_WEBHOOK_SECRET`
- notification webhook URLs if needed

### Recommended staging-specific web env

- `NEXT_PUBLIC_API_BASE_URL=https://staging.yourdomain.com/api`

### Postgres env for compose

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

---

## 8. DigitalOcean account setup

## 8.1 Project

Create a DO project:

- `vyapar-genie-platform`

## 8.2 Registry

Create a Container Registry:

- `gstbilling`

## 8.3 Droplet

Create one Ubuntu Droplet with:

- Ubuntu 24.04 LTS
- recommended staging size from section 3.2
- SSH key only
- monitoring enabled
- backups enabled
- project assigned correctly

## 8.4 Firewall

Create a Cloud Firewall and attach the Droplet:

- allow inbound `22`, `80`, `443`
- deny everything else inbound

## 8.5 Domain

Point:

- `staging.yourdomain.com`

to the Droplet IP before enabling Caddy TLS.

For production later, point:

- `app.yourdomain.com`

to the production Droplet IP before enabling production TLS.

---

## 9. VPS bootstrap runbook

After creating the Droplet, run this bootstrap sequence manually once.

## 9.1 Base packages

Install:

- Docker Engine
- Docker Compose plugin
- git
- curl
- unzip
- jq
- ufw
- fail2ban

## 9.2 Server directories

Create:

- `/opt/vyapar-genie`
- `/opt/vyapar-genie/deployment`
- `/opt/vyapar-genie/data`
- `/opt/vyapar-genie/backups`
- `/opt/vyapar-genie/caddy`

## 9.3 GitHub self-hosted runner

Add a repository-scoped self-hosted runner on the Droplet using GitHub’s current instructions, then install it as a service.

Recommended labels:

- `self-hosted`
- `linux`
- `x64`
- `gst-billing-staging`

This lets the deploy workflow target the Droplet directly with:

- `runs-on: [self-hosted, linux, x64, gst-billing-staging]`

## 9.4 Registry access on Droplet

Configure the Droplet to pull from DOCR.

Recommended:

- create a read-only registry credential
- login once with Docker on the server
- persist Docker auth in the deploy user context used by the runner

## 9.5 Environment file

Create:

- `/opt/vyapar-genie/.env.staging`

This file must not be committed to git.

---

## 10. Proposed container image contract

Tag both images with:

- full commit SHA plus service suffix
- service latest tags for staging

Recommended image names:

- `registry.digitalocean.com/<registry>/vyapar-genie:<sha>-api`
- `registry.digitalocean.com/<registry>/vyapar-genie:<sha>-web`
- `registry.digitalocean.com/<registry>/vyapar-genie:staging-api-latest`
- `registry.digitalocean.com/<registry>/vyapar-genie:staging-web-latest`

This single-repository tagging model is required when the DOCR plan allows only one repository.

The compose file should accept:

- `API_IMAGE`
- `WEB_IMAGE`

so deploys become a controlled image-tag swap rather than a mutable server build.

---

## 11. Compose design

The staging compose file should:

- define one internal app network
- mount Postgres volume
- mount Redis volume if desired
- mount local file storage volume for API
- mount Caddy data and config volumes
- use health checks on API and web
- use `restart: unless-stopped`

Recommended volumes:

- `postgres_data`
- `redis_data`
- `api_storage`
- `caddy_data`
- `caddy_config`

Recommended service dependencies:

- `api` depends on `postgres` and `redis`
- `web` depends on `api`
- `caddy` depends on `web` and `api`

---

## 12. Seeding strategy

## 12.1 First staging boot

After the first deploy:

1. run migrations
2. run compiled seed scripts
3. verify login and feature coverage

Recommended seed order:

1. `node apps/api/dist/auth/auth.seed.js`
2. `node apps/api/dist/seed/distributor.seed.js`
3. `node apps/api/dist/seed/full.seed.js`
4. `node apps/api/dist/seed/comprehensive.seed.js`

## 12.2 Reset-and-reseed policy

Create a manual-only workflow with two modes:

- `seed_only`
- `reset_then_seed`

`reset_then_seed` must require explicit operator confirmation because it destroys data.

## 12.3 Staging data policy

Staging should keep **comprehensive seeded data** so you can test:

- billing
- subscription enforcement
- field sales
- pricing
- batches
- challans
- compliance
- admin

This aligns with the current local seeding strategy already verified in the repo.

---

## 13. Deployment flow

## 13.1 Normal `staging` deployment

1. code is merged to `staging`
2. GitHub Actions runs CI
3. images build on GitHub-hosted runner
4. images push to DOCR
5. deploy workflow runs on Droplet self-hosted runner
6. Droplet pulls image tags
7. migrations execute
8. compose stack restarts
9. health checks pass

## 13.2 Manual staging reseed

1. operator runs `seed-staging` workflow
2. workflow optionally resets DB
3. workflow runs compiled seeds inside API container
4. operator validates seeded credentials and core screens

## 13.3 Rollback

Rollback is image-tag based:

1. select previous known-good image tags
2. update deploy variables
3. rerun `deploy-staging`
4. do not auto-rollback DB schema unless a backward-compatible migration policy exists

---

## 14. Validation gates

## 14.1 Pre-deploy validation

Every `staging` deploy must pass:

- API typecheck
- API build
- web lint
- web build

Recommended additional gate later:

- focused Playwright smoke tests against a preview or local CI run

## 14.2 Post-deploy validation

After deployment, verify:

- `https://staging.yourdomain.com/`
- `https://staging.yourdomain.com/login`
- `https://staging.yourdomain.com/api/health` or proxied `/health`
- admin login
- tenant login
- dashboard
- invoice create
- purchases
- field sales today
- subscription page
- admin subscriptions page

## 14.3 Post-seed validation

Verify:

- seeded users can log in
- seeded company data loads
- pricing, field sales, notifications, and SaaS pages render
- seeded admin pages show subscription plans and entitlements

---

## 15. Observability and operations

## 15.1 Logging

First release can rely on:

- `docker compose logs`
- container restart status
- DigitalOcean Droplet monitoring

Later upgrade path:

- Loki / Promtail
- external error aggregation
- uptime checks

## 15.2 Backup policy

At minimum:

- enable DigitalOcean Droplet backups
- keep a database export cadence

Recommended first release:

- weekly Droplet backups
- daily `pg_dump` for staging

## 15.3 Disk and memory operations

Monitor:

- Docker image buildup
- Postgres volume growth
- Next.js logs
- queue pressure in API process

Add a cleanup step in deploy:

- `docker image prune -f`

Do not prune volumes automatically.

---

## 16. Known implementation gaps before “ship to VPS”

These are the main code-level items still worth addressing as part of the deployment workstream:

1. Provision the actual DigitalOcean resources, secrets, and self-hosted runner outside the repo.
2. Decide whether staging file storage stays local or moves to Spaces immediately.

Recommended first staging choice:

- keep `FILE_STORAGE_DRIVER=local`
- move to Spaces later for production

Reason:

- lowest moving-parts count for first VPS proof
- easiest rollback
- simplest troubleshooting

---

## 17. Execution phases

## Phase V1 — Deployment hardening in code

**Implementation status**: Implemented on March 31, 2026

Scope:

- env-driven cookies
- env-driven CORS
- any required web base URL adjustments
- production seed command support

Done when:

- app can run safely behind HTTPS reverse proxy

Implemented in:

- [apps/api/src/common/config/http-runtime.config.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/common/config/http-runtime.config.ts)
- [apps/api/src/common/config/env.validation.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/common/config/env.validation.ts)
- [apps/api/src/main.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/main.ts)
- [apps/api/src/auth/auth.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/auth.controller.ts)
- [apps/api/src/auth/admin-auth.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/admin-auth.controller.ts)
- [apps/api/src/onboarding/onboarding.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/onboarding/onboarding.controller.ts)
- [apps/api/package.json](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/package.json)
- [.env.example](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/.env.example)

Validated with:

- `npm --workspace apps/api run typecheck`
- `npm --workspace apps/api run build`

## Phase V2 — Containerization

**Implementation status**: Implemented on March 31, 2026

Scope:

- Dockerfiles
- `.dockerignore`
- compose file
- Caddy config

Done when:

- app runs fully in local production-like containers

Implemented in:

- [apps/web/next.config.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/next.config.ts)
- [.dockerignore](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/.dockerignore)
- [deployment/docker/api.Dockerfile](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/docker/api.Dockerfile)
- [deployment/docker/web.Dockerfile](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/docker/web.Dockerfile)
- [deployment/docker/Caddyfile](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/docker/Caddyfile)
- [deployment/docker/docker-compose.staging.yml](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/docker/docker-compose.staging.yml)
- [deployment/docker/staging.env.example](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/docker/staging.env.example)

Validated with:

- `npm --workspace apps/web run build`
- `docker compose -f deployment/docker/docker-compose.staging.yml --env-file deployment/docker/staging.env.example config`

Validation note:

- Next.js standalone output is confirmed locally and resolves to `apps/web/server.js` inside the standalone bundle.
- Full Docker image runtime validation was attempted, but the local Docker daemon timed out in this environment during `docker info` and image build checks. The repo-level containerization files are in place and structurally validated, but final image build verification should be rerun once the local Docker engine is responsive.

## Phase V3 — GitHub Actions

**Implementation status**: Implemented on March 31, 2026

Scope:

- CI workflow
- build/push workflow
- deploy workflow
- seed workflow

Done when:

- `staging` can push images and trigger a deploy path

Implemented in:

- [.github/workflows/ci.yml](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/.github/workflows/ci.yml)
- [.github/workflows/build-and-push-staging.yml](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/.github/workflows/build-and-push-staging.yml)
- [.github/workflows/deploy-staging.yml](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/.github/workflows/deploy-staging.yml)
- [.github/workflows/seed-staging.yml](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/.github/workflows/seed-staging.yml)
- [deployment/scripts/render-staging-env.sh](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/scripts/render-staging-env.sh)
- [deployment/scripts/deploy-staging.sh](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/scripts/deploy-staging.sh)
- [deployment/scripts/seed-staging.sh](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/scripts/seed-staging.sh)

Validated with:

- `bash -n deployment/scripts/render-staging-env.sh deployment/scripts/deploy-staging.sh deployment/scripts/seed-staging.sh`
- `ruby -e 'require "yaml"; Dir[".github/workflows/*.yml"].each { |f| YAML.load_file(f); puts "OK #{f}" }'`

## Phase V4 — DigitalOcean bootstrap

**Implementation status**: Runbook and bootstrap scripts prepared on March 31, 2026; DigitalOcean account-side execution still pending

Scope:

- DO project
- registry
- Droplet
- firewall
- domain
- self-hosted runner

Done when:

- Droplet is ready to receive workflow-based deploys

Prepared in:

- [docs/DIGITALOCEAN_V4_BOOTSTRAP_RUNBOOK.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/DIGITALOCEAN_V4_BOOTSTRAP_RUNBOOK.md)
- [docs/GITHUB_STAGING_SECRETS_CHECKLIST.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/GITHUB_STAGING_SECRETS_CHECKLIST.md)
- [deployment/scripts/bootstrap-droplet.sh](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/scripts/bootstrap-droplet.sh)
- [deployment/scripts/install-github-runner.sh](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/scripts/install-github-runner.sh)

Validated with:

- `bash -n deployment/scripts/bootstrap-droplet.sh deployment/scripts/install-github-runner.sh`

## Phase V5 — First staging deploy

Scope:

- pull images
- run migrations
- start services
- verify TLS and health

Done when:

- staging is publicly reachable and healthy

## Phase V6 — Seed and validate

Scope:

- run comprehensive seeds
- validate core workflows
- confirm admin and tenant access

Done when:

- staging is useful for full end-to-end QA

---

## 18. Recommendation

Proceed with this order:

1. adopt this VPS plan as the new deployment baseline
2. implement `V1` first
3. then implement `V2` and `V3`
4. only after that bootstrap the Droplet and wire GitHub Actions
5. run first deploy
6. run manual comprehensive seed
7. execute D14 staging validation

This is the lowest-regression path because it preserves the current app workflow, uses the already-verified seed data strategy, and adds deployment infrastructure in layers instead of mixing platform work and business logic changes together.
