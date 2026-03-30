# Incomplete Implementation Execution Sheet

**Date**: 2026-03-29  
**Basis**: Code-level investigation across current web and API implementation  
**Purpose**: Convert the latest “this looks incomplete” findings into a concrete decision sheet with execution order

---

## Purpose

This document separates the reported items into three practical buckets:

1. fix now
2. fix after staging baseline
3. leave as designed

The goal is to avoid mixing real bugs, fragile UX, and intentional MVP boundaries into one vague backlog.

No code changes are represented by this document alone.

---

## Executive Summary

The reported issues do **not** all mean the product is half-implemented.

The current truth is:

- one item looks like a real runtime bug: subscription page failure
- one item looks like a real state-refresh bug: notifications template visibility after create
- one item is a real but smaller UX/data-state mismatch: warehouse snapshot empty-state wording
- one item is a real feature area that is implemented but still first-release quality: field-sales route and coverage setup
- one item is an intentional scope boundary: POS MVP lock

So the correct response is **not** “rebuild these modules.” It is a targeted repair and hardening pass.

---

## Decision Matrix

| ID | Item | Current reality | Decision | Status after this pass |
|---|---|---|---|---|
| IE-001 | Settings > Subscription page crash | Real page, real backend, runtime failure still needs reproduction | Fix now | Implemented at code/build level with safer hook normalization and page access |
| IE-002 | Settings > Notifications template created but not visible | Backend create/list exists, UI refresh path looks fragile | Fix now | Implemented at code/build level with immediate cache update plus refetch |
| IE-003 | Dashboard > Warehouse Snapshot placeholder | Real analytics widget, but empty-state message is misleading and probably masking company-data state | Fix now | Implemented at code/build level with more truthful warehouse-state messaging |
| IE-004 | Field sales > Routes and Coverage setup | APIs are connected and validated, but UX/admin controls are still thin | Fix after staging baseline | Hardened at code/build level without broad redesign; deeper admin tooling still later |
| IE-005 | Sales > POS MVP scope lock messaging | Intentional product boundary, not missing implementation | Leave as designed | No code change required |

---

## Fix Now

### IE-001 Subscription Page Failure

**Severity**: High  
**Area**: Settings / Billing  
**Route**: `/c/{companyId}/settings/subscription`

**What we know**

- Frontend page exists in [subscription/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/subscription/page.tsx)
- Hooks exist in [subscriptionHooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/settings/subscriptionHooks.ts)
- Backend endpoints exist in [billing.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.controller.ts)
- Billing service exists in [billing.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.service.ts)

**What this means**

This is not a missing feature. It is a bug in runtime behavior, page assumptions, or environment/config interaction.

**Most likely causes**

- a page-level runtime exception that escapes inline error handling
- stale client bundle or route-state issue
- plan/provider configuration mismatch surfacing badly
- permission-path inconsistency between the settings landing page and the actual billing GET/POST routes

**Why it is urgent**

- it drops the user into the global error boundary
- it creates low trust in the staging-readiness claim
- billing/setup pages should fail gracefully, not catastrophically

**Execution scope**

1. reproduce live in browser and capture the exact thrown error
2. confirm whether failure happens on initial GET, during render, or only during checkout click
3. add defensive rendering and safe fallbacks in the page if needed
4. align permission expectations between settings navigation and billing endpoints
5. confirm page shows controlled inline error instead of global crash

**Definition of done**

- page opens without hitting global error boundary
- no blank/crash state for missing subscription
- failed checkout shows local actionable error
- successful checkout either redirects or shows local pending state

---

### IE-002 Notification Template Not Appearing After Create

**Severity**: High  
**Area**: Settings / Notifications  
**Route**: `/c/{companyId}/settings/notifications`

**What we know**

- Frontend page exists in [notifications/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/notifications/page.tsx)
- Hooks exist in [notificationsHooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/settings/notificationsHooks.ts)
- Backend create/list/update routes exist in [notifications.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/notifications/notifications.controller.ts)
- Backend persistence logic exists in [notifications.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/notifications/notifications.service.ts)

**What this means**

This is probably not a backend-missing issue. It is more likely:

- query invalidation timing
- stale list state
- response not being reflected immediately enough for the operator to trust the action

**Why it is urgent**

- operator sees “Template created” and then sees no row
- it looks like a failed save even if the save succeeded
- settings/master-data trust is damaged quickly by this kind of UX bug

**Execution scope**

1. reproduce create flow live and inspect network + cache refresh
2. confirm whether record is persisted in DB/API immediately
3. if persistence is correct, update page behavior:
   - either optimistic append
   - or direct list refetch confirmation
4. ensure created template appears without manual page reload
5. validate update/test-template flow against the refreshed row list

**Definition of done**

- after create, the template is visible immediately in the list
- no manual refresh required
- no duplicate rows
- template selector in “Test notification” also updates correctly

---

### IE-003 Warehouse Snapshot Empty-State And Data Signal

**Severity**: Medium  
**Area**: Dashboard  
**Route**: `/c/{companyId}/dashboard`

**What we know**

- Widget rendering is in [dashboard/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/dashboard/page.tsx)
- Data comes from [useDistributorDashboard](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/reports/hooks.ts)
- Backend aggregation is in [reports.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/reports/reports.service.ts)

**What this means**

The feature is real. The empty-state message is what is wrong or incomplete.

The backend returns warehouse rows based on active warehouses, not only on positive stock.

So the current copy:

`Warehouse analytics will appear once active locations hold stock.`

is misleading. In practice, the page is more likely missing active warehouse records for the current company, or the current company is not using seeded warehouse data.

**Why it matters**

- it makes users think “stock is missing”
- the real issue may be “warehouse masters are missing”
- it sends the operator in the wrong direction

**Execution scope**

1. validate current company data against active warehouses
2. decide whether the dashboard should:
   - show zero-stock warehouse rows
   - or show a more accurate empty state like “Create or activate warehouse locations to see this panel”
3. align copy with actual backend logic
4. verify seeded demo company path renders rows as expected

**Definition of done**

- empty state correctly describes the real missing condition
- seeded/distributor company shows warehouse rows
- non-distributor company gives a truthful next-step message

---

## Fix After Staging Baseline

### IE-004 Field Sales Routes And Coverage Hardening

**Severity**: Medium  
**Area**: Settings / Field Sales  
**Route**: `/c/{companyId}/settings/sales/assignments`

**What we know**

- The setup page is in [assignments/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/sales/assignments/page.tsx)
- Frontend mutations and queries are in [field-sales/hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/field-sales/hooks.ts)
- Backend endpoints are in [field-sales.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/field-sales/field-sales.controller.ts)
- Backend validation and persistence are in [field-sales.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/field-sales/field-sales.service.ts)

**What is implemented today**

- create territory
- create route
- create beat
- list current coverage
- assign coverage
- assign salesperson route/beat
- inspect active assignments

**Why this is not “fix now”**

This is not obviously broken at architecture level. It is working as a first-release setup console.

The gaps are mainly:

- no edit/deactivate/delete management on the same page
- dependent selects can leave stale choices selected
- customer lookup is capped by paged master-data fetch
- two assignment blocks overlap conceptually
- the page is more admin/setup focused than operationally polished

**Execution scope**

1. confirm staging flow for:
   - territory create
   - route create
   - beat create
   - customer coverage assign
   - salesperson assignment create
2. harden dependent-select behavior
3. improve large-company customer selection
4. add edit/deactivate workflows in a later pass
5. simplify duplicated assignment UX

**Definition of done**

- all current create flows pass in staging
- no stale territory/route/beat combinations can be submitted accidentally
- customer selection works beyond tiny datasets
- page clearly communicates current assignments and active coverage

---

## Leave As Designed

### IE-005 POS MVP Scope Lock

**Severity**: None  
**Area**: POS  
**Route**: `/c/{companyId}/pos`

**What we know**

- The page in [pos/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/pos/page.tsx) is intentionally describing the current POS boundary.

**Current intended boundary**

- browser print only
- no offline POS
- no direct ESC/POS agent
- standard invoice engine underneath
- no cashier shift open/close or reconciliation yet

**Decision**

Do not treat this as a bug.

Only revisit if product strategy changes and you want to:

- expand POS depth
- reduce “scope-lock” tone in the copy
- reposition POS as a stronger front-office feature

---

## Recommended Execution Order

1. IE-001 Subscription page runtime failure
2. IE-002 Notification template create/list visibility
3. IE-003 Warehouse Snapshot truthfulness and seeded-data check
4. IE-004 Field sales setup hardening after staging baseline
5. IE-005 Leave POS as designed

---

## Suggested Immediate Next Sprint

### Sprint A: Trust And Stability

- reproduce and fix subscription page crash
- reproduce and fix notifications list refresh issue
- correct warehouse snapshot empty-state logic/copy

### Sprint B: Setup Hardening

- validate field-sales setup flows end to end in staging
- improve dependent select behavior
- improve customer lookup strategy for coverage assignment

---

## Plain-English Verdict

The solution is closer to production-ready than these findings first suggest.

The real picture is:

- the billing setup page needs a bug fix
- the notifications page needs a visibility/refresh fix
- the warehouse card needs more truthful empty-state behavior
- the field-sales setup page is working, but still needs product hardening
- the POS page is intentionally limited and should not be treated as broken

That means the right move is a focused stabilization pass, not a broad rebuild.
