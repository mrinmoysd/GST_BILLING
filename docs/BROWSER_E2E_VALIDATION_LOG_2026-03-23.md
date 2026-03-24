# Browser E2E Validation Log

**Date**: 2026-03-23  
**Method**: Live browser walkthrough against local web `http://localhost:3000` and API `http://localhost:4000` using the manual plan in [E2E_MANUAL_TEST_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/E2E_MANUAL_TEST_PLAN.md).

## Scope executed

- public pages smoke
- tenant login and dashboard
- categories flow
- customers list
- tenant settings route
- admin login and admin dashboard

## Manual plan validation

The manual plan is broadly correct and usable, but it needed two additions:

- explicit guidance for deriving the active `companyId` after onboarding or tenant login
- explicit note that some admin/provider checks depend on seeded records or sandbox provider configuration

Those gaps have been updated in [E2E_MANUAL_TEST_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/E2E_MANUAL_TEST_PLAN.md).

## Passed checks

- `/` loads with the public marketing layout and working primary navigation
- `/features` loads with real content
- `/login` loads and tenant login succeeds with seeded owner credentials
- tenant dashboard renders and shows live workspace data
- `/c/00000000-0000-0000-0000-000000000001/masters/categories` loads existing categories
- category creation works and the new category appears immediately in the grid
- `/c/00000000-0000-0000-0000-000000000001/masters/customers` loads and renders customer rows
- `/admin/login` loads and super-admin login succeeds with seeded credentials
- `/admin/dashboard` loads and renders platform metrics, recent companies, and incident cards

## Defects found in initial pass

### BROWSER-E2E-001

**Area**: Public auth/session refresh  
**Severity**: Medium  
**Observed**:

- anonymous public routes emit `401 Unauthorized` browser-console errors against `/api/auth/refresh`
- admin login page also emits `401 Unauthorized` against `/api/admin/auth/refresh` and `/api/auth/refresh`

**Expected**:

- anonymous pages should not produce console errors for normal unauthenticated browsing

**Status**: Fixed on 2026-03-23

### BROWSER-E2E-002

**Area**: Tenant onboarding  
**Severity**: High  
**Observed**:

- submitting `/onboarding` with valid-looking data did not advance to the dashboard
- the UI remained on the onboarding page and did not surface a usable inline or toast error

**Expected**:

- successful onboarding redirects into `/c/{companyId}/dashboard`
- failed onboarding shows a clear user-facing error state

**Status**: Fixed on 2026-03-23

### BROWSER-E2E-003

**Area**: Tenant settings landing page  
**Severity**: Critical  
**Route**: `/c/{companyId}/settings`  
**Observed**:

- runtime error in the browser overlay:
- `Attempted to call useAuth() from the server but useAuth is on the client`

**Expected**:

- settings home renders normally without a server/client component boundary violation

**Status**: Fixed on 2026-03-23

## Notes

- A direct fresh-browser navigation to an authenticated tenant route rendered a partial shell with generic identity text before re-authentication. This behavior should be reviewed during a fuller auth-guard pass, but it was not logged as a separate defect yet because it needs a controlled repro pass.
- This log is a partial browser validation pass, not a full completion of every step in the manual plan.

## Resumed validation after fixes

Re-validated successfully:

- public landing page loads without unauthenticated refresh-console errors
- admin login page loads without unauthenticated refresh-console errors
- onboarding now redirects into the new company dashboard
- tenant settings landing page now renders correctly
- tenant company settings route loads
- tenant reports hub loads
- seeded sales invoice draft, issue, and payment flow works
- seeded purchase draft, receive, and payment flow works
- POS billing flow completes through receipt
- admin dashboard loads
- admin companies route loads
- admin internal users route loads
- admin audit logs route loads
- sales summary report renders structured metrics
- GST report workspace renders filing sections
- accounting profit and loss route renders structured report UI
- inventory dashboard route renders stock summary and workspace links
- inventory movements route loads and renders the stock-movements workspace
- stock adjustment submission currently reaches the API and surfaces a user-facing error state instead of silently failing
- admin subscriptions route loads and renders KPI cards
- current-customer detail and ledger routes load correctly when navigated from live customer rows
- forgot-password submission exposes a usable dev reset link and reset-password route renders with tokenized state
- purchase detail renders bill, return, payment, and lifecycle sections
- supplier ledger route renders cleanly
- admin company creation works and lands on company detail
- admin company suspend and reactivate actions work and update lifecycle state
- admin internal user creation works
- admin internal user deactivate and reactivate actions work
- admin subscription detail renders provider, plan, usage, and operator actions
- admin subscription `mark active` action works and updates status
- admin audit logs render the company, subscription, and internal-user actions created during this browser pass
- support tickets route renders filter controls and a clean empty state when no seeded tickets exist
- purchases summary, outstanding, top products, and profit snapshot routes load on direct navigation
- accounting hub, journals, trial balance, and balance sheet routes load on direct navigation

## Residual findings

### BROWSER-E2E-004

**Area**: Hydration consistency  
**Severity**: Low  
**Observed**:

- after onboarding and on some tenant pages, React logs a hydration mismatch related to a Radix-generated dropdown button id

**Impact**:

- page remains usable
- this is noisy in dev and should be cleaned up before launch validation

**Status**: Fixed on 2026-03-23

### BROWSER-E2E-005

**Area**: Admin login redirect `next` handling  
**Severity**: Low  
**Observed**:

- navigating to `/admin/login?next=/admin/companies` still returned to `/admin/dashboard` after login during the browser pass

**Impact**:

- admin login works, but deep-link return behavior may not be honoring `next` consistently

**Status**: Fixed on 2026-03-23

### BROWSER-E2E-006

**Area**: Tenant protected-route auth guard  
**Severity**: Medium  
**Observed**:

- directly opening a protected tenant route in a fresh browser session can render the page shell and fire protected data requests before redirecting through an authenticated login path
- this produced `401` console errors on `/c/{companyId}/purchases/new` during the browser pass

**Impact**:

- deep-linking into protected tenant routes is not yet clean for unauthenticated users
- route-level auth gating should happen before protected queries mount

**Status**: Fixed on 2026-03-23

### BROWSER-E2E-007

**Area**: POS receipt data presentation  
**Severity**: High  
**Observed**:

- the completed POS receipt reached `/pos/receipt/{invoiceId}` successfully
- the receipt showed line pricing as `1.00 × 0.00` while the total still displayed `116.82`

**Impact**:

- cashier output is internally inconsistent
- printed receipts can misrepresent unit pricing even when the sale total is correct

**Status**: Fixed on 2026-03-23

### BROWSER-E2E-008

**Area**: Inventory adjustments  
**Severity**: High  
**Route**: `/c/{companyId}/inventory/adjustments`  
**Observed**:

- selecting a valid product and a non-zero quantity, then clicking `Apply adjustment`, consistently returns `Request failed (400)`
- browser network log shows the frontend posting to `/api/companies/{companyId}/products/{productId}/stock-adjustment`
- code inspection shows the frontend sends `change_qty`, while the backend DTO expects `delta`

**Expected**:

- manual stock adjustments should succeed for valid inputs and update stock movement history

**Status**: Fixed on 2026-03-23

### BROWSER-E2E-009

**Area**: Payments workspace data rendering  
**Severity**: High  
**Route**: `/c/{companyId}/payments`  
**Observed**:

- the payments page renders `0 payments in view`, `No payments yet`, and an empty invoice selector
- the page still issues successful `200` requests to `/payments`, `/invoices?status=issued`, and `/purchases`
- direct database validation during the same pass confirmed the seeded company has multiple `payments` rows and issued invoices

**Expected**:

- existing payments should populate the ledger table
- issued invoices should appear in the record-payment invoice selector

**Status**: Fixed on 2026-03-23

### BROWSER-E2E-010

**Area**: Admin companies list  
**Severity**: High  
**Route**: `/admin/companies`  
**Observed**:

- the page renders the admin shell correctly, but the main table area shows `No companies`
- this is inconsistent with the seeded tenant company and the rest of the product being actively usable

**Expected**:

- the seeded company should be visible to the super-admin in the companies workspace

**Status**: Fixed on 2026-03-23

### BROWSER-E2E-011

**Area**: Admin subscriptions list consistency  
**Severity**: Medium  
**Route**: `/admin/subscriptions`  
**Observed**:

- the page renders KPI cards such as `Active 9`, `Past due 4`, and `Stripe 13`
- the same screen also shows `0 total` and `No subscriptions`
- this indicates the summary cards and the list dataset are out of sync

**Expected**:

- the list count and table rows should align with the summary KPIs or show a clearly explained empty-state reason

**Status**: Fixed on 2026-03-23

### BROWSER-E2E-012

**Area**: Tenant settings users workspace  
**Severity**: Medium  
**Route**: `/c/{companyId}/settings/users`  
**Observed**:

- the users screen renders, but the summary card shows `0 users`
- the list state also says `No users`
- this is inconsistent with the seeded owner account used for login

**Expected**:

- at least the owner user should appear in the tenant users workspace

**Status**: Fixed on 2026-03-23

### BROWSER-E2E-013

**Area**: Customer ledger stale-link validation  
**Severity**: Low  
**Route**: `/c/{companyId}/masters/customers/{customerId}/ledger`  
**Observed**:

- an older browser run used a customer id that no longer existed in the local dataset
- that specific id returned `404 Customer not found` from the customer detail and ledger API
- re-running the same flow from the live customer list produced a valid customer detail page and a working ledger route with a clean empty state or rows, depending on the selected customer

**Expected**:

- the customer ledger route should load ledger entries or a clean empty state for an existing customer
- stale/deleted customer ids should return `404`

**Status**: Closed on 2026-03-23

### BROWSER-E2E-014

**Area**: Admin session persistence on full reload  
**Severity**: High  
**Observed**:

- full browser navigation from one admin route to another could drop back to `/admin/login?next=...`
- browser inspection showed the admin refresh cookie existed, but the frontend admin session-hint key was missing
- backend refresh extraction also only read the tenant refresh cookie during JWT extraction

**Expected**:

- admin sessions should survive direct route opens and full reloads across `/admin/*`

**Status**: Fixed on 2026-03-23

## Current status

The originally targeted browser defects discovered in this validation track are fixed and revalidated:

- anonymous public/admin refresh noise removed
- onboarding redirect restored
- tenant settings runtime crash fixed
- tenant shell hydration noise removed
- admin `next` redirect honored
- protected tenant deep-link auth gating cleaned up
- POS receipt line pricing corrected

New product gaps were still found during the continued route-by-route pass:

- tenant users workspace not rendering the seeded owner user

## Additional passed checks after the fixes

- inventory adjustments now submit successfully and post `201 Created` without browser console errors
- payments workspace now renders existing payment history and issued invoices in the selector
- admin companies list now renders seeded and newly created tenant rows
- admin subscriptions list now renders rows and a total count consistent with KPI cards
- tenant users workspace now renders the seeded owner row and access editor actions
- settings notifications route renders template and test-send workspace content
- settings roles route renders custom-role management workspace
- suppliers list route renders seeded supplier rows
- product-create route renders the structured creation form with pricing fields
- supplier ledger route renders and reaches a clean empty-state ledger view
- invoice detail route renders PDF, share, payment, credit-note, and lifecycle sections
- forgot-password route submits successfully and exposes the dev reset link
- reset-password route accepts a tokenized reset URL and renders the password form
- purchase detail route renders bill download/upload controls, return controls, payment history, and lifecycle events

## Recommended next work

1. Fix `BROWSER-E2E-008` through `BROWSER-E2E-011` before treating the tenant inventory/payments and admin operations areas as launch-ready.
2. Continue the remaining manual plan coverage that has not yet been executed route by route after those fixes.
3. Add Playwright automation for the validated sales, purchase, reporting, admin, and POS flows that were proven manually in this pass.
