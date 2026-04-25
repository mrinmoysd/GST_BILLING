# Vyapar Genie V4 Bootstrap Runbook

**Date**: March 31, 2026  
**Purpose**: Provide the operator-ready runbook for Phase V4 of the DigitalOcean VPS deployment plan: actual DigitalOcean bootstrap, DNS setup, Droplet preparation, self-hosted runner installation, and GitHub staging secret configuration.  
**Status**: Partially executed on April 11, 2026. Revalidated after staging deploy/seed scripts were switched to a production-safe Prisma migrate command that works inside the runtime container.

Primary references:

- [DIGITALOCEAN_VPS_CONTAINER_DEPLOYMENT_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/DIGITALOCEAN_VPS_CONTAINER_DEPLOYMENT_PLAN.md)
- [bootstrap-droplet.sh](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/scripts/bootstrap-droplet.sh)
- [install-github-runner.sh](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/scripts/install-github-runner.sh)
- [staging.env.example](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/deployment/docker/staging.env.example)
- [deploy-staging.yml](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/.github/workflows/deploy-staging.yml)
- [seed-staging.yml](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/.github/workflows/seed-staging.yml)

External references used:

- [Droplet Quickstart](https://docs.digitalocean.com/products/droplets/getting-started/quickstart/)
- [Container Registry Quickstart](https://docs.digitalocean.com/products/container-registry/getting-started/quickstart/)
- [Firewalls Quickstart](https://docs.digitalocean.com/products/networking/firewalls/getting-started/quickstart/)
- [Monitoring Quickstart](https://docs.digitalocean.com/products/monitoring/getting-started/quickstart/)
- [Adding self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners/adding-self-hosted-runners)
- [Configuring the self-hosted runner application as a service](https://docs.github.com/en/actions/how-tos/hosting-your-own-runners/managing-self-hosted-runners/configuring-the-self-hosted-runner-application-as-a-service)

---

## 1. Outcome of V4

When V4 is complete:

- a DigitalOcean project exists
- a DOCR registry exists
- a staging Droplet exists
- a DigitalOcean Cloud Firewall is attached
- GoDaddy DNS points `staging.yourdomain.com` to the Droplet
- Docker is installed on the Droplet
- the GitHub self-hosted runner is installed as a service
- GitHub `staging` environment secrets are populated
- the repo is ready for the first workflow-driven deployment

Current execution state as of April 11, 2026:

- completed:
  - Droplet bootstrap
  - deploy user creation
  - Docker / Compose install
  - UFW enablement
  - self-hosted runner installation
  - GoDaddy staging A-record validation
  - GitHub `staging` environment population for non-DO secrets
- pending:
  - `DO_API_TOKEN` secret
  - confirmed DOCR registry creation / login path
  - first workflow-driven image build
  - first workflow-driven staging deploy

---

## 2. Resource checklist

Create these resources in DigitalOcean:

- project: `vyapar-genie-platform`
- registry: `vyapar-app`
- staging Droplet:
  - Ubuntu 24.04 LTS
  - recommended size: `4 vCPU / 8 GB RAM / 160 GB SSD`
  - hostname: `vyapar-genie-staging`
  - backups enabled
  - monitoring enabled
- firewall:
  - attach to the staging Droplet
  - inbound `22`, `80`, `443`
  - outbound all traffic allowed

Optional but recommended:

- enable IPv6 during Droplet creation
- attach a tag like `vyapar-genie-staging`

---

## 3. GoDaddy DNS setup

In GoDaddy DNS for your root domain:

- create an `A` record
- host: `staging`
- value: the public IPv4 of the staging Droplet
- TTL: default or `600`

Verify from your local machine:

```bash
dig +short staging.yourdomain.com
```

Proceed only once it resolves to the correct Droplet IP.

---

## 4. Initial SSH access

SSH to the Droplet:

```bash
ssh root@your_droplet_ip
```

Recommended immediately:

1. create a non-root deploy user
2. copy your SSH key to that user
3. disable password login
4. disable root SSH login if your access model allows it

Example:

```bash
adduser deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

Then reconnect as:

```bash
ssh deploy@your_droplet_ip
```

---

## 5. Server bootstrap

From the repo, copy the bootstrap script to the Droplet or paste it there.

Recommended:

```bash
scp deployment/scripts/bootstrap-droplet.sh deploy@your_droplet_ip:/tmp/bootstrap-droplet.sh
ssh deploy@your_droplet_ip 'chmod +x /tmp/bootstrap-droplet.sh && /tmp/bootstrap-droplet.sh'
```

This script does:

- package update
- Docker install
- Docker Compose plugin install
- `ufw` setup
- `fail2ban` setup
- creates:
  - `/opt/vyapar-genie`
  - `/opt/vyapar-genie/deployment/docker`
  - `/opt/vyapar-genie/data`
  - `/opt/vyapar-genie/backups`
  - `/opt/vyapar-genie/caddy`
  - `/opt/vyapar-genie/runner`

Important:

- log out and log back in after bootstrap so Docker group membership applies

Verify:

```bash
docker --version
docker compose version
```

---

## 6. GitHub self-hosted runner

Go to the repository in GitHub:

1. `Settings`
2. `Actions`
3. `Runners`
4. `New self-hosted runner`
5. choose `Linux`
6. choose `x64`

GitHub will give you a repository URL and a time-limited runner token.

Run the install script on the Droplet:

```bash
scp deployment/scripts/install-github-runner.sh deploy@your_droplet_ip:/tmp/install-github-runner.sh
ssh deploy@your_droplet_ip
chmod +x /tmp/install-github-runner.sh
REPO_URL="https://github.com/<owner>/<repo>" \
RUNNER_TOKEN="<token from GitHub>" \
RUNNER_NAME="vyapar-genie-staging" \
RUNNER_LABELS="gst-billing-staging" \
/tmp/install-github-runner.sh
```

The workflow files already expect these labels:

- `self-hosted`
- `linux`
- `x64`
- `gst-billing-staging`

Verify in GitHub that the runner appears as:

- online
- idle

Important:

- use a clean repository URL when configuring the runner, for example:
  - `https://github.com/<owner>/<repo>`
- do not copy a personal access token embedded in a git remote URL into the runner setup

---

## 7. GitHub environment setup

Create a GitHub environment named:

- `staging`

Add these secrets to that environment.

## 7.1 Required DigitalOcean / registry secrets

- `DO_API_TOKEN`
- `DOCR_REGISTRY_NAME`

Current staging setup note:

- `DOCR_REGISTRY_NAME=vyapar-app`
- the staging workflows assume a single DOCR repository named `vyapar-genie`
- API and web images are distinguished by tags like `<sha>-api`, `<sha>-web`, `staging-api-latest`, and `staging-web-latest`

## 7.2 Required domain and app URL secrets

- `STAGING_DOMAIN`
  - example: `staging.yourdomain.com`
- `STAGING_WEB_BASE_URL`
  - example: `https://staging.yourdomain.com`
- `STAGING_PUBLIC_API_BASE_URL`
  - example: `https://staging.yourdomain.com/api`
- `STAGING_COOKIE_DOMAIN`
  - usually leave blank for host-only cookie scope

## 7.3 Required database / Redis secrets

- `STAGING_POSTGRES_DB`
- `STAGING_POSTGRES_USER`
- `STAGING_POSTGRES_PASSWORD`
- `STAGING_DATABASE_URL`

## 7.4 Required auth / signing secrets

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `FILE_SIGNING_SECRET`

## 7.5 Optional file storage secrets

If staging remains local storage, these can stay blank:

- `FILE_STORAGE_BUCKET`
- `FILE_STORAGE_REGION`
- `FILE_STORAGE_ENDPOINT`
- `FILE_STORAGE_ACCESS_KEY_ID`
- `FILE_STORAGE_SECRET_ACCESS_KEY`

## 7.6 Optional billing secrets

- `BILLING_STRIPE_SECRET_KEY`
- `BILLING_STRIPE_WEBHOOK_SECRET`
- `BILLING_RAZORPAY_KEY_ID`
- `BILLING_RAZORPAY_KEY_SECRET`
- `BILLING_RAZORPAY_WEBHOOK_SECRET`

## 7.7 Optional notification secrets

- `NOTIFICATIONS_EMAIL_WEBHOOK_URL`
- `NOTIFICATIONS_SMS_WEBHOOK_URL`
- `NOTIFICATIONS_WHATSAPP_WEBHOOK_URL`

---

## 8. First repository-to-Droplet sync

The deploy workflow copies `deployment/docker` from the checked-out repo into:

- `/opt/vyapar-genie/deployment/docker`

So you do not need to clone the repo permanently on the Droplet for normal deploys.

What must exist before first deploy:

- `/opt/vyapar-genie`
- `/opt/vyapar-genie/.env.staging`
- working Docker install
- online GitHub runner
- DOCR login ability from workflow

---

## 9. First dry-run sequence

Once secrets and the runner are ready:

1. manually run `CI`
2. manually run `Build and Push Staging`
3. manually run `Deploy Staging`

Expected result:

- images push to DOCR
- deploy job runs on the Droplet
- compose stack comes up
- Prisma migrations apply
- API health check passes

---

## 10. Post-deploy checks

After first deploy:

1. open `http://staging.yourdomain.com`
2. confirm Caddy redirects to HTTPS
3. confirm certificate issuance succeeded
4. open:
   - `https://staging.yourdomain.com`
   - `https://staging.yourdomain.com/login`
   - `https://staging.yourdomain.com/health`
   - `https://staging.yourdomain.com/swagger`

If `/health` is not proxied as expected by your final Caddy behavior, use:

- `https://staging.yourdomain.com/api/health`

---

## 11. First staging seed

After deployment succeeds, manually run:

- `Seed Staging`

Recommended first run:

- `mode=seed_only`

Only use:

- `mode=reset_then_seed`

when you intentionally want to destroy current staging data and rebuild from scratch.

For `reset_then_seed`, the workflow requires:

- `confirm_reset=RESET_STAGING_DB`

---

## 12. Post-seed checks

After seeding:

1. log in as:
   - `superadmin@example.com` / `password123`
   - `owner@example.com` / `password123`
2. verify:
   - dashboard
   - invoices
   - purchases
   - field sales
   - pricing
   - subscription page
   - admin subscriptions

---

## 13. Operational notes

- The staging workflows assume the Droplet runner has Docker access.
- The deploy workflow logs into DOCR each run.
- The seed workflow re-renders the env file before running.
- Local file storage is still the recommended first staging choice.

---

## 14. Definition of done for V4

V4 is complete when:

- DigitalOcean resources exist
- DNS resolves correctly
- runner is online
- GitHub environment secrets are configured
- deploy workflow can reach the Droplet
- first deployment can proceed without manual SSH deployment steps
