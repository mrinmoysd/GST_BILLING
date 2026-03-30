# SaaS Subscription, Pricing, And Entitlements Spec

Date: March 29, 2026

## 1. Purpose

This document defines the target SaaS monetization model for the GST Billing product, based on:

- the current implementation already present in this repository
- the desired super-admin-controlled SaaS model
- a Marg-style packaging structure with seats, bill or invoice caps, and upgrade controls

This is both:

- a current-state audit
- an implementation-grade product spec for the missing monetization layer

The goal is to make the product commercially controllable before launch, without rewriting the existing billing, GST, accounting, or tenant flows.

## 2. Pricing Baseline From Marg

### 2.1 Current official Marg pricing signal

As of March 29, 2026, Marg’s dedicated official price-list page shows this India pricing structure:

- `Marg ERP Nano` — `₹5550` + GST
- `Basic Edition` — `₹10300` + GST
- `Silver Edition` — `₹13900` + GST
- `Gold Edition` — `₹26000` + GST

Packaging on that official price-list page is broadly:

- `Nano`
  - `450 bills/month`
  - monthly billing amount cap `₹1,50,000`
  - extra bill overage through wallet
- `Basic`
  - `1 full user`
  - `₹3000 per extra user`
  - maximum `2 users`
  - `₹3000 per extra company`
  - maximum `2 companies`
- `Silver`
  - `1 full user`
  - `1 view-only user`
  - `₹3000 per extra user`
  - `₹3000 per extra company`
- `Gold`
  - `Unlimited users`
  - `Unlimited extra company`

### 2.2 Important pricing caveat

Marg’s official web properties are not perfectly consistent. On March 29, 2026:

- `marg-price-list.html` matches the screenshot you shared
- some other official Marg pages and older pricing pages show different values such as `₹9999`, `₹13500`, and `₹25200`

For this product spec, the closest and cleanest benchmark is the dedicated official price-list page, because it matches the packaging shape you want.

## 3. What The Current Product Already Has

The current codebase already includes a real billing and subscription foundation.

### 3.1 Data model already present

In [prisma/schema.prisma](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/prisma/schema.prisma):

- `SubscriptionPlan`
  - `code`
  - `name`
  - `priceInr`
  - `billingInterval`
  - `limits Json?`
  - `isActive`
- `Subscription`
  - `companyId`
  - `planId`
  - `plan`
  - `status`
  - `startedAt`
  - `expiresAt`
  - `metadata`
  - `provider`
  - `providerSubscriptionId`
- `UsageMeter`
  - generic time-windowed meter rows per company and key

This is a good base. It means the system is not starting from zero.

### 3.2 Billing provider foundation already present

In [apps/api/src/billing/billing.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.service.ts):

- Stripe checkout session creation exists
- Razorpay payment link creation exists
- webhook signature validation exists
- webhook ingestion exists
- subscription status synchronization exists

### 3.3 Tenant subscription surface already present

In [apps/web/src/app/(app)/c/[companyId]/settings/subscription/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/subscription/page.tsx):

- tenant can view current subscription record
- tenant can initiate provider checkout

### 3.4 Admin subscription surface already present

In:

- [apps/api/src/admin/super/admin-subscriptions.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-subscriptions.controller.ts)
- [apps/api/src/admin/super/platform-admin.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/platform-admin.service.ts)
- [apps/web/src/app/admin/subscriptions/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/subscriptions/page.tsx)
- [apps/web/src/app/admin/subscriptions/[subscriptionId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/subscriptions/[subscriptionId]/page.tsx)

the platform already supports:

- subscription list
- subscription detail
- plan/status change
- webhook health visibility
- basic usage meter visibility

## 4. What Is Missing Today

The product has billing records, but it does not yet behave like a true SaaS entitlement engine.

### 4.1 No structured monetization model

The current `SubscriptionPlan.limits` field is only a free-form JSON bucket.

The product does **not** yet have a typed, first-class plan model for:

- full seats
- view-only seats
- invoice or bill limit
- monthly billing value limit
- company limit
- extra user pricing
- extra company pricing
- invoice overage pricing
- wallet behavior
- soft vs hard enforcement
- grace rules
- feature flags by plan

### 4.2 No real usage enforcement

The product does **not** currently enforce plan limits at runtime for:

- active user seats
- invoice or bill creation
- extra company creation
- view-only vs full-access seat assignment
- monthly invoice quota exhaustion

### 4.3 Usage metering is immature

The current implementation writes only one obvious billing-related usage key:

- `active_subscription_count`

There is no production-grade metering yet for:

- invoices issued in current billing cycle
- challans or estimates if they count against plan
- active full seats
- active view-only seats
- active companies under one account
- monthly billed value
- wallet debits for overage

### 4.4 Admin does not yet control entitlements in depth

Super admin can currently:

- inspect subscriptions
- change plan
- change status
- reconcile

Super admin cannot yet:

- define a plan with seat caps and overage rules in a structured way
- override seat count or invoice quota for one tenant
- force block or warn behavior
- grant temporary quota increase
- manage wallet balance
- see plan utilization against hard limits
- see MRR derived from actual plans

### 4.5 Tenant subscription UI is too primitive

The tenant subscription page is not yet ready for commercial launch because it still works like a developer/operator utility:

- raw plan code input
- manual success/cancel URLs
- no real pricing cards
- no usage vs limit summary
- no upgrade recommendation
- no overage explanation
- no billing policy transparency

## 5. Target Monetization Model

The target model should be controlled by super admin and enforced by backend rules.

### 5.1 Packaging model

Recommended first-release packaging for this product:

1. `Nano`
   - entry plan
   - invoice or bill capped
   - strict monthly usage allowance
   - good for micro businesses
2. `Basic`
   - 1 full user
   - low company cap
   - optional extra seat and company add-ons
3. `Silver`
   - 1 full user + 1 view-only user
   - broader company allowance
   - optional extra seats and company add-ons
4. `Gold`
   - higher or unlimited seats
   - higher or unlimited companies
   - larger invoice allowance
   - priority commercial package

### 5.2 What should be monetized

Recommended monetization dimensions:

- `base plan price`
- `full-access seats`
- `view-only seats`
- `invoice or bill quota per billing cycle`
- `company count`
- `invoice overage price`
- optional `wallet-based overage`

### 5.3 Recommended enforcement style

Use a mixed model:

- `hard block` for seats beyond allowed maximum
- `warn + upsell` near invoice quota
- `soft block or wallet charge` after quota depending on plan
- `hard block` for company cap if plan disallows extra companies

This is safer than trying to auto-bill every overage from day one.

## 5.4 Trial policy

The product should support a promotional trial period as part of the core SaaS model.

Approved policy:

- every public plan supports trial
- default trial is `30 days`
- super admin can change trial days at plan level
- super admin can also override trial per tenant or subscription
- no payment method is required upfront
- trial users get full product access during trial
- invoice limits do not apply during trial
- seat limits do not apply during trial
- there is no grace period after trial expiry
- after trial expiry, if the tenant has not subscribed:
  - subscription should move to a blocked state
  - write access should be blocked
  - tenant should be guided to either:
    - upgrade and subscribe
    - cancel and stop using the product

This means trial is a true promotional full-access window, not a throttled limited mode.

## 6. Proposed Plan Schema

The current `limits Json?` field can remain, but it should no longer be unstructured.

### 6.1 Minimum typed entitlement contract

Each plan should define:

- `plan_code`
- `display_name`
- `billing_interval`
- `base_price_inr`
- `currency`
- `included_full_seats`
- `included_view_only_seats`
- `max_full_seats`
- `max_view_only_seats`
- `extra_full_seat_price_inr`
- `extra_view_only_seat_price_inr`
- `included_companies`
- `max_companies`
- `extra_company_price_inr`
- `included_invoice_quota_per_month`
- `invoice_quota_mode`
  - `hard_block`
  - `wallet_overage`
  - `warn_only`
- `invoice_overage_price_inr`
- `included_monthly_billing_value_inr`
- `feature_flags`
- `grace_period_days`
- `trial_days`
- `is_public`
- `display_order`

### 6.3 Trial-related fields

At the subscription or entitlement layer, the system should also track:

- `trial_started_at`
- `trial_ends_at`
- `trial_source`
  - `plan_default`
  - `admin_override`
- `trial_override_days`
- `trial_status`
  - `not_applicable`
  - `trialing`
  - `trial_expired`
  - `converted`

### 6.2 Recommended storage approach

Safest path:

- keep `SubscriptionPlan`
- keep `limits Json?`
- define a strict JSON schema for `limits`
- add selected first-class columns only where they must be indexed or filtered often

This avoids large schema churn while still giving a real entitlement contract.

Recommended first-class columns to add now:

- `displayOrder`
- `isPublic`
- `trialDays`
- `allowAddOns`

Recommended to store in structured `limits` JSON:

- seats
- invoice quota
- company quota
- overage rules
- feature flags

## 7. Proposed Runtime Subscription Snapshot

Do not rely on reading raw plan JSON during every important action.

Add a runtime snapshot concept:

- `effective_plan_code`
- `effective_entitlements`
- `effective_overrides`
- `current_billing_period_start`
- `current_billing_period_end`
- `trial_started_at`
- `trial_ends_at`
- `trial_status`

This can live either:

- in `Subscription.metadata`
- or in a new `CompanyEntitlement` table

Recommended approach:

- create a new `CompanyEntitlement` table

Reason:

- easier runtime lookup
- cleaner override model
- cleaner audit trail
- less overload on `subscriptions.metadata`

## 8. Usage Metering Specification

### 8.1 Meter keys required

Add at least these keys:

- `issued_invoice_count`
- `draft_invoice_count`
- `challan_count`
- `estimate_count`
- `invoice_billed_value_inr`
- `active_full_seat_count`
- `active_view_only_seat_count`
- `active_company_count`
- `wallet_balance_inr`
- `invoice_overage_count`
- `invoice_overage_amount_inr`

Trial does not require separate usage suppression logic if enforcement rules explicitly bypass invoice and seat caps while `trial_status = trialing`.

### 8.2 What event should increment meters

- invoice issued
  - increment `issued_invoice_count`
  - increment `invoice_billed_value_inr`
- new active user with non-view role
  - update `active_full_seat_count`
- new active user with view-only role
  - update `active_view_only_seat_count`
- company linked under a parent subscription package
  - update `active_company_count`
- extra invoice above quota
  - increment overage meters
- wallet top-up or deduction
  - update `wallet_balance_inr`

### 8.3 Meter timing

Use monthly windows aligned with subscription cycle if possible.

If provider-cycle alignment is not ready in first release:

- use calendar-month usage windows first
- then evolve to provider billing-cycle windows later

## 9. Runtime Enforcement Rules

### 9.1 User seat enforcement

Enforce on:

- user creation
- user activation
- role upgrade

Rules:

- if `trial_status = trialing`, skip seat enforcement
- full-access user cannot be activated if full-seat entitlement is exhausted
- view-only user cannot be activated if view-only entitlement is exhausted
- if add-ons are allowed and within max cap, user may be activated after billing override or admin-approved expansion

### 9.2 Invoice or bill quota enforcement

Enforce on:

- invoice issue
- optionally challan or estimate issue if included in commercial rules

Rules:

- if `trial_status = trialing`, skip invoice quota enforcement
- if quota not exhausted: allow
- if quota exhausted and mode is `wallet_overage`: allow and record overage debit
- if quota exhausted and mode is `hard_block`: stop action with clear message
- if quota near exhaustion: warn in UI before failure

### 9.4 Trial expiry enforcement

Enforce on:

- all write-capable product actions after trial expiry

Rules:

- if `trial_status = trialing`, allow normal use
- if `trial_status = trial_expired` and tenant has not converted to a paid or active subscribed state:
  - block write operations
  - show a clear upgrade or cancel prompt
- no grace period applies
- do not degrade into a limited mode

Recommended first-release block policy:

- allow authenticated access to billing/account page and plan-selection surfaces
- block operational writes such as:
  - invoice creation or issue
  - purchase creation
  - payment recording
  - customer, supplier, or product writes
  - user activation

### 9.3 Company cap enforcement

If you want Marg-like extra-company licensing, enforce on:

- company creation under same subscription group
- company activation

If this product remains strictly one-subscription-per-company, then company-cap logic can be deferred and omitted from first release.

## 10. Recommended Commercial Policy For This Product

The Marg-style model is useful, but it should be adapted to SaaS realities.

### 10.1 Recommended first commercial version

Use:

- `Nano`
  - invoice cap
  - small seat count
  - hard monthly invoice limit or wallet overage
- `Basic`
  - 1 full user
  - optional add-on seat
  - optional invoice uplift
- `Silver`
  - 1 full + 1 view-only
  - higher invoice cap
  - company add-on option if desired
- `Gold`
  - multi-seat
  - high or unlimited invoice allowance
  - company expansion

### 10.2 Strong recommendation

For first launch, keep invoicing monetization simpler than Marg:

- meter `issued invoices`
- do not separately monetize challans and estimates unless needed
- add monthly invoice quota + overage
- add seat caps
- add optional company caps only if you really want one subscription controlling multiple companies

This is safer and easier to explain to customers.

## 11. Super Admin Control Requirements

Super admin must be able to do all of the following.

### 11.1 Plan catalog control

- create plan
- edit plan
- archive plan
- reorder public plan cards
- toggle public visibility
- configure limits and overage rules

### 11.2 Tenant subscription control

- assign plan manually
- change plan
- pause
- resume
- cancel
- extend expiry
- put tenant into grace
- mark past due
- reconcile provider mismatch

Trial-specific control:

- set plan default trial days
- extend or shorten trial for a tenant
- end trial immediately
- convert trial to active subscribed plan

### 11.3 Entitlement override control

- grant extra full seats
- grant extra view-only seats
- grant temporary invoice uplift
- grant manual company uplift
- change enforcement mode
- set or adjust wallet balance

### 11.4 Monitoring control

- current plan mix
- seats used vs allowed
- invoices used vs quota
- overage counts
- wallet balances
- active grace-period tenants
- active trial tenants
- expired trial tenants
- MRR by plan
- forecasted overage revenue

## 12. Tenant UX Requirements

### 12.1 Public pricing page

Public pricing must show:

- clear plan cards
- price
- GST note
- included seats
- invoice quota
- company allowance
- extra seat rules
- extra invoice rules
- best-fit badge

### 12.2 Tenant subscription page

The current page must be replaced with:

- current plan card
- current billing status
- trial status
- trial days remaining
- renewal date
- invoices used this period
- seat usage
- wallet balance if applicable
- upgrade options
- overage rules explained in plain English
- provider checkout CTA

Remove:

- raw plan code input
- manual success/cancel URL input from tenant UI

### 12.3 Friendly enforcement messages

Examples:

- `Your current plan allows 1 full-access user. Upgrade or add a seat to activate another user.`
- `You have used 448 of 450 monthly invoices. Upgrade now or continue with wallet overage if enabled.`
- `This action is blocked because your invoice quota is exhausted for the current billing cycle.`
- `Your 30-day trial has ended. Upgrade to continue using operational features or cancel your subscription.`

## 13. API Gaps To Implement

### 13.1 Tenant APIs needed

- `GET /api/companies/:companyId/subscription`
  - expand to include current entitlements and usage
- `GET /api/companies/:companyId/subscription/plans`
  - public or tenant-visible plans
- `POST /api/companies/:companyId/subscription/checkout`
  - accept `plan_code` and provider only
- `GET /api/companies/:companyId/subscription/usage`
- `GET /api/companies/:companyId/subscription/limits`
- `GET /api/companies/:companyId/subscription/invoices-usage`

Expanded subscription summary must include:

- `trial_status`
- `trial_started_at`
- `trial_ends_at`
- `days_remaining`
- `is_blocked_by_trial_expiry`

### 13.2 Admin APIs needed

- `GET /api/admin/subscriptions/plans`
  - include structured limits
- `POST /api/admin/subscriptions/plans`
- `PATCH /api/admin/subscriptions/plans/:planId`
- `POST /api/admin/subscriptions/:subscriptionId/overrides`
- `POST /api/admin/subscriptions/:subscriptionId/wallet-adjustments`
- `POST /api/admin/subscriptions/:subscriptionId/recompute-entitlements`
- `GET /api/admin/usage`
  - expand with real monetization metrics

Additional trial actions:

- `POST /api/admin/subscriptions/:subscriptionId/extend-trial`
- `POST /api/admin/subscriptions/:subscriptionId/end-trial`
- `PATCH /api/admin/subscriptions/plans/:planId/trial-policy`

## 14. Codebase Gap Map

### 14.1 Already reusable

- provider checkout creation
- provider webhook validation
- subscription rows
- admin subscription list/detail
- generic usage meter table

### 14.2 Must be expanded

- [apps/api/src/billing/billing.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.service.ts)
  - entitlement sync on webhook
  - usage metering
  - period logic
- [apps/api/src/admin/super/platform-admin.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/platform-admin.service.ts)
  - real plan detail
  - real MRR
  - real entitlement dashboards
- [apps/web/src/app/(app)/c/[companyId]/settings/subscription/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/subscription/page.tsx)
  - replace utility UI with commercial UI
- [apps/web/src/app/admin/subscriptions/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/subscriptions/page.tsx)
  - add utilization columns
- [apps/web/src/app/admin/subscriptions/[subscriptionId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/subscriptions/[subscriptionId]/page.tsx)
  - add entitlement and override workspace

### 14.3 Missing entirely

- entitlement middleware or service
- seat enforcement
- invoice quota enforcement
- wallet/overage accounting
- plan CRUD from admin
- company-entitlement snapshot

## 15. Recommended Implementation Phases

### Phase S1 — Structured plans and entitlement snapshot

- define typed `limits` schema
- add `CompanyEntitlement`
- expand admin plan listing
- expose tenant-readable subscription summary
- add plan-level and subscription-level trial fields

### Phase S2 — Metering

- add invoice usage meters
- add seat usage meters
- add usage recompute job
- expose admin and tenant usage summaries

### Phase S3 — Enforcement

- block or warn on seat exhaustion
- block or charge on invoice cap exhaustion
- block writes after trial expiry
- add clear UX messages

### Phase S4 — Admin commercialization

- plan CRUD
- override tools
- wallet adjustments
- real MRR and plan analytics

### Phase S5 — Tenant commercial UX

- public pricing cards
- tenant subscription usage page
- upgrade prompts
- overage communication

## 16. Launch Readiness Decision

### Current truth

The product is **not yet commercially complete as a SaaS entitlement system**, even though checkout, webhooks, admin billing operations, and subscription records are already implemented.

### Plain-English conclusion

You already have:

- billing provider plumbing
- subscription records
- admin subscription operations
- a starter usage-meter concept

You do **not** yet have:

- seat control
- invoice or bill cap control
- company-cap control
- enforced plan entitlements
- overage handling
- super-admin commercial command over monetization
- trial-period control with expiry-based blocking

That means the product is close to launch from a business-application perspective, but still incomplete from a SaaS monetization-control perspective.

## 17. Recommended Decision

The safest monetization direction for this product is:

- use a Marg-inspired packaging structure
- simplify the first release to `seats + invoices + optional company count`
- implement entitlement snapshot and enforcement before public launch
- avoid shipping a pricing page that promises seat and bill controls before backend enforcement exists

## 18. Sources

- Marg official price list page, accessed March 29, 2026:
  - [https://margcompusoft.com/marg-price-list.html](https://margcompusoft.com/marg-price-list.html)
- Marg alternate official pricing page showing conflicting values, accessed March 29, 2026:
  - [https://margcompusoft.com/marg-price-list.aspx](https://margcompusoft.com/marg-price-list.aspx)
- Marg comparison chart:
  - [https://download.margcompusoft.com/pdf/comparison-chart-margERP9.pdf](https://download.margcompusoft.com/pdf/comparison-chart-margERP9.pdf)
- Current local implementation references:
  - [prisma/schema.prisma](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/prisma/schema.prisma)
  - [apps/api/src/billing/billing.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.service.ts)
  - [apps/api/src/billing/billing.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.controller.ts)
  - [apps/api/src/admin/super/platform-admin.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/platform-admin.service.ts)
  - [apps/api/src/admin/super/admin-subscriptions.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-subscriptions.controller.ts)
  - [apps/web/src/app/(app)/c/[companyId]/settings/subscription/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/subscription/page.tsx)
  - [apps/web/src/app/admin/subscriptions/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/subscriptions/page.tsx)
  - [apps/web/src/app/admin/subscriptions/[subscriptionId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/subscriptions/[subscriptionId]/page.tsx)
  - [docs/GAP_ANALYSIS_AND_EXECUTION_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/GAP_ANALYSIS_AND_EXECUTION_PLAN.md)
  - [docs/LLD.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/LLD.md)
