# Local Testing Defect Log

**Date**: 2026-03-23  
**Source**: local unit and integration backlog execution

This log captures real bugs and implementation gaps found while expanding local test coverage. Items are split into resolved fixes vs open follow-up defects.

---

## Resolved During Testing

### AUTH-001 — Refresh controller only accepted cookie after guard already accepted body token

Status:

- Resolved

Found in:

- [auth.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/auth.controller.ts)
- [admin-auth.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/admin-auth.controller.ts)

Problem:

- `JwtRefreshAuthGuard` allowed `refresh_token` from request body or cookie.
- the controllers then re-read only the cookie and returned `401` when body-based refresh was used.

Fix:

- both controllers now accept refresh token from cookie or body consistently.

---

## Open Defects / Gaps

### RBAC-001 — Tenant role casing is inconsistent for permission-guarded endpoints

Status:

- Resolved

Found in:

- [rbac.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/rbac/rbac.service.ts)

Problem:

- built-in RBAC roles are defined in lowercase (`owner`, `admin`, `staff`)
- many seeded and test users are created with uppercase legacy roles like `ADMIN`
- permission-guarded endpoints can reject uppercase-role users even when they are logically admins

Evidence:

- notification template creation in the deeper platform integration pass returned `403` for a tenant user with role `ADMIN`
- the same flow worked when the user role was created as lowercase `admin`

Recommended fix:

1. normalize tenant roles on login/session access
2. migrate or normalize existing stored legacy role values
3. add regression coverage for legacy uppercase role compatibility

Resolution:

- built-in tenant roles are now normalized case-insensitively during effective-access/session-access resolution
- uppercase legacy roles like `ADMIN` now inherit the correct built-in permission set
- verified through [platform-failure-paths.e2e-spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/platform-failure-paths.e2e-spec.ts)

---

### BILLING-001 — Stripe webhook processing does not guard invalid local subscription IDs

Status:

- Resolved

Found in:

- [billing.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.service.ts)

Problem:

- Stripe webhook processing reads `metadata.subscription_id`
- it assumes the value is a valid local UUID and calls `prisma.subscription.update`
- invalid values raise Prisma UUID parsing errors and produce a failed webhook processing path

Evidence:

- local failure-path validation reproduced a `PrismaClientKnownRequestError` when `subscription_id` contained a non-UUID string

Recommended fix:

1. validate `subscription_id` format before calling Prisma
2. if invalid, mark webhook event as failed with a controlled domain error
3. add regression coverage for invalid provider metadata

Resolution:

- Stripe and Razorpay webhook handlers now validate local subscription references before Prisma updates
- invalid local references fail with a controlled domain error instead of a Prisma UUID parsing error
- verified through [billing.service.spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.service.spec.ts)

---

### ACCOUNTING-001 — Balance sheet summary can retain a non-zero difference after mixed GST/commercial flows

Status:

- Resolved

Found in:

- [accounting.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/accounting/accounting.service.ts)

Problem:

- during deeper compliance/accounting e2e coverage, the balance sheet endpoint returned a non-zero summary difference (`40`) after:
  - purchase receive
  - purchase payment
  - interstate invoice issue
  - invoice payment
  - sales return / credit note

Evidence:

- reproduced in [compliance-accounting.e2e-spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/compliance-accounting.e2e-spec.ts)

Impact:

- accounting report integrity is not yet strong enough to assert a perfectly balanced balance sheet under all tested business flows

Recommended fix:

1. trace generated journal lines for the reproduced scenario
2. compare trial-balance totals and balance-sheet section mapping
3. verify whether retained earnings / current-period profit treatment is incomplete
4. add a dedicated regression once the gap is corrected

Resolution:

- balance sheet assembly now rolls current-period earnings into equity as `Current Earnings`
- strict mixed-flow regression coverage was restored and is passing in [compliance-accounting.e2e-spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/compliance-accounting.e2e-spec.ts)
- supporting unit coverage was updated in [accounting.service.spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/accounting/accounting.service.spec.ts)

---

### API-001 — Product API contract is inconsistent between camelCase DTOs and existing snake_case request usage

Status:

- Resolved

Found in:

- [create-product.dto.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/products/dto/create-product.dto.ts)
- [products.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/products/products.service.ts)

Problem:

- product DTO expects `gstRate` and `costPrice`
- several existing tests and older request patterns use `tax_rate` and `cost_price`
- those snake_case fields are not part of the DTO contract

Impact:

- callers can silently send the wrong keys and not get the intended tax/cost behavior

Recommended fix:

1. choose one canonical API contract
2. either support legacy snake_case aliases explicitly or reject them clearly
3. update docs/frontend/tests to the same contract

Resolution:

- product service now accepts legacy `tax_rate` and `cost_price` aliases alongside canonical camelCase fields
- regression coverage added in [masters-crud.e2e-spec.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/test/masters-crud.e2e-spec.ts)
