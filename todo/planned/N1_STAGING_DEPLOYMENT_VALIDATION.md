# N1 — Staging Deployment Validation

Status:

- Planned

Goal:

- deploy the application in a production-like environment and prove the stack boots correctly

Scope:

- AWS staging infra
- env and secret configuration
- migrations
- auth smoke
- queue/connectivity smoke
- cookie/CORS staging hardening

Implementation reference:

- [AWS_STAGING_DEPLOYMENT_GUIDE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/AWS_STAGING_DEPLOYMENT_GUIDE.md)

Acceptance:

- web and API are reachable
- tenant and admin auth work
- migrations apply cleanly
- refresh-cookie behavior works correctly over HTTPS staging domains
