GST Billing SaaS - Complete Technical Specification
===============================================

This document bundle contains the full technical specification for a VedBill-like GST billing, inventory and accounting SaaS platform for India. Files included in this folder:

- `SPECIFICATION.md` (this file) — entry & high level mapping to other docs
- `DB_SCHEMA.sql` — complete Postgres CREATE TABLE DDL for core tables
- `prisma_schema.prisma` — Prisma ORM schema equivalent
- `API_SPEC.md` — REST API surface, endpoints, request/response shapes and errors
- `LLD.md` — low-level design, service boundaries, flows and sequence steps
- `INFRA.md` — deployment architecture, infra components, backups, scaling
- `SECURITY.md` — auth, RBAC, encryption, compliance and audit
- `TESTING.md` — testing matrix, CI gates, sample tests to implement
- `ROADMAP.md` — MVP, phases, estimates and milestones

Use these documents as the single source of truth for implementation, migrations and onboarding developers.

Quick navigation
- Start with `LLD.md` for modules and flow examples (invoice create, payment, PDF). 
- Use `DB_SCHEMA.sql` and `prisma_schema.prisma` for migrations and ORM.
- Implement APIs described in `API_SPEC.md` and validate with tests from `TESTING.md`.

Requirements coverage
- The documents cover: multi-tenant model, companies onboarding, customers, suppliers, products, inventory, invoices, purchases, payments, stock movements, basic accounting, GSTR reports, POS features, barcode support, subscriptions, admin panel, infra, security and testing.

Change process
- Edit these docs in the repo and open PRs for review. Keep `DB_SCHEMA.sql` and `prisma_schema.prisma` in sync.

Next: see individual files in this folder for full details.

## Spec validation: current status (2026-03-05)

These specs have been actively expanded beyond the initial draft. The following are now present and considered *implementation-ready* at the contract level:

- ✅ Core DB DDL: `DB_SCHEMA.sql` includes multi-tenant tables plus extended modules (RBAC, notifications, files, metering/webhooks, adjustments, support tickets).
- ✅ Human API inventory: `API_SPEC.md` includes CRUD + lifecycle endpoints across modules.
- ✅ OpenAPI contract baseline: `API_OPENAPI.yaml` has been expanded to match the endpoint inventory.
- ✅ UI route map: `UI_UX_ROUTE_MAP.md`.
- ✅ LLD flows and invariants: `LLD.md`.

### Remaining true blockers for “100% build-ready”

Legend: 🔒 must close before Phase 00 bootstrap, ⚠️ can be closed during early phases.

1) 🔒 **Single source of truth drift**
- This file and `VALIDATION_REPORT.md` must reflect the latest state and list only remaining gaps.

2) 🔒 **DB ↔ Prisma parity decision**
- `prisma_schema.prisma` is intentionally partial today. Decide one:
	- (A) Make Prisma fully match `DB_SCHEMA.sql` (recommended once code scaffolding starts), OR
	- (B) Declare Prisma schema as illustrative only and make SQL migrations canonical.

3) 🔒 **GST portal export contracts**
- Need strict, versioned JSON schema mappings for GSTR1/GSTR3B/HSN/ITC (portal-ready) and OpenAPI `oneOf` report payloads.

4) 🔒 **Accounting rulebook**
- Need COA defaults, posting rules by transaction type, period close/locking policy, and a locked rounding/precision policy.

5) 🔒 **POS / printing / offline**
- Need a locked MVP decision + printing formats + barcode scan behavior + offline queue/conflict resolution.

### Canonical addenda (to be added)

- `GST_PORTAL_MAPPINGS.md`
- `ACCOUNTING_RULES.md`
- `POS_PRINTING.md`
