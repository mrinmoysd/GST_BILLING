# RBAC Phase 1 Backend Hardening Plan

Date: 2026-03-29
Status: In progress
Owner: Codex

## Goal

Phase 1 hardens tenant business APIs so route access is enforced by permissions on the backend, not only by company scope and frontend navigation visibility.

This phase is intentionally surgical:

- keep the current RBAC schema and permission catalog
- add `PermissionGuard` to tenant business controllers
- apply class-level read permissions where safe
- add method-level write or specialty overrides only where needed
- avoid changing service logic or data contracts

## Scope

Phase 1 covers tenant business controllers that currently expose material application capability without backend permission checks.

Included:

- accounting
- categories
- customers
- exports
- field sales
- finance operations
- GST
- inventory
- invoices
- invoice compliance
- jobs
- migration operations
- payments
- pricing
- products
- purchases
- quotations
- reports
- sales orders
- delivery challans
- suppliers

Deferred from this phase:

- `files.controller.ts`

Reason:

- the file utility endpoints are generic and do not map cleanly to one permission family without a broader file-ownership contract
- forcing a single permission now would create more regression risk than security value

## Permission Contract

### Accounting

- Read endpoints: `accounting.view`
- Mutations: `accounting.manage`

### Masters

- Categories read: `masters.view`
- Categories create/update/delete: `masters.manage`
- Customers read/detail/ledger: `masters.view`
- Customers create/update/delete: `masters.manage`
- Suppliers read/detail/ledger: `masters.view`
- Suppliers create/update/delete: `masters.manage`
- Products read/detail: `masters.view`
- Products create/update/delete: `masters.manage`
- Product stock adjustment: `inventory.manage`

### Inventory

- Read endpoints: `inventory.view`
- Warehouse create/update: `inventory.manage`
- Stock adjustments: `inventory.manage`
- Transfers create/dispatch/receive/cancel: `inventory.manage`

### Sales

- Quotations read: `sales.view`
- Quotations create/update/transition/convert: `sales.manage`
- Sales orders read: `sales.view`
- Sales orders create/update/transition/convert: `sales.manage`
- Delivery challans and dispatch queue read: `sales.view`
- Delivery challan create/update/transition/convert: `sales.manage`
- Invoices read/detail/pdf: `sales.view`
- Invoice create/update/issue/cancel/share/credit note/pdf regenerate: `sales.manage`
- Invoice compliance read and exception list: `sales.view`
- Invoice compliance generate/cancel/sync/update vehicle: `sales.manage`
- Invoice-pdf job lookup: `sales.view`

### Purchases

- Read/detail/bill download: `purchases.view`
- Draft create/update, receive, cancel, return, bill upload: `purchases.manage`

### Payments and collections

- Payments read: `payments.view`
- Payment record/update: `payments.manage`
- Finance ops read: `payments.view`
- Bank accounts, collection tasks, statement import, reconciliation match/unmatch: `payments.manage`

### Reports and GST

- Reports read: `reports.view`
- GST reports and export flows: `reports.view`
- Legacy exports controller: `reports.view`

### Pricing

- Pricing setup lists, create endpoints, and commercial audit: `settings.pricing.manage`
- Pricing preview used during sales document composition: `sales.view`

This keeps the transaction composer working for sales users without granting them pricing-admin setup access.

### Migration, customization, and integrations

- Migration projects, templates, import profiles, import jobs, opening data flows: `settings.migrations.manage`
- Print templates list/create/version/publish/default/preview: `settings.print_templates.manage`
- Custom fields definitions and values: `settings.custom_fields.manage`
- Webhook endpoints, events, testing, deliveries, retries: `integrations.webhooks.manage`
- Integration API keys list/create/revoke: `integrations.api_keys.manage`

### Field sales

- Territories/routes/beats/coverage/assignments: `field_sales.manage_masters`
- Visit-plan generation, visit-plan listing, team DCR lookup: `field_sales.view_team_worklists`
- Rep self-service worklist, customer list, summary, visits, visit outcomes, check-in/out, missed visits: `field_sales.log_visits`
- Visit-created sales documents: `field_sales.create_documents`
- Collection updates and promises from visits: `field_sales.record_followups`
- DCR submit: `field_sales.submit_dcr`
- DCR approve/reopen: `field_sales.review_dcr`

## Rollout Rules

1. Add `PermissionGuard` at controller level.
2. Prefer class-level read permissions.
3. Override only write or specialty endpoints.
4. Do not weaken validation or company scoping.
5. Do not introduce new permissions in Phase 1.

## Validation

Required after implementation:

- `npm --workspace apps/api run typecheck`
- `npm --workspace apps/api run build`

Recommended follow-up:

- targeted tenant smoke tests for sales, purchases, payments, reports, and field-sales roles

## Expected Outcome

After Phase 1:

- tenant APIs are no longer protected only by JWT plus company scope
- role bundles and custom-role assignments materially control backend access
- frontend visibility mismatches still matter for UX, but direct API access is no longer broadly open

## Residual Work After Phase 1

- Phase 2 should harden utility/file endpoints and admin-controller route-level permission checks
- frontend route gating and page-level permission mismatch cleanup should follow after backend enforcement is in place
