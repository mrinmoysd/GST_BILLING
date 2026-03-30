# SaaS Subscription And Entitlements Implementation Plan

Date: March 30, 2026

Current status:

- `P1` implemented at code/build level
- `P2` implemented at code/build level
- `P3` implemented at code/build level
- `P4` implemented at code/build level
- `P5` implemented at code/build level
- `P6` implemented at code/build level

Related spec:
- [SAAS_SUBSCRIPTION_AND_ENTITLEMENTS_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/SAAS_SUBSCRIPTION_AND_ENTITLEMENTS_SPEC.md)

## 1. Objective

Implement the SaaS monetization model defined in the spec without breaking the current product workflows that are already stable or close to launch-ready.

This plan is intentionally rollout-first, not rewrite-first.

The core rule is:

- preserve the current subscription checkout and webhook foundation
- layer structured plans, entitlement snapshots, metering, and enforcement on top
- do not block tenant billing workflows until the new entitlement signals are proven

Trial policy approved for this rollout:

- every plan supports trial
- default trial is `30 days`
- admin can modify trial duration
- no payment method is required upfront
- trial has full access
- invoice and seat limits do not apply during trial
- no grace period
- after trial expiry without paid conversion, the tenant is blocked from operational writes until they subscribe or cancel

## 2. Current Implementation Baseline To Preserve

These flows already exist and must continue to work through every monetization phase.

### 2.1 Tenant commercial workflow already present

- tenant can open subscription settings
- tenant can view current subscription row
- tenant can initiate provider checkout

References:

- [apps/web/src/app/(app)/c/[companyId]/settings/subscription/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/subscription/page.tsx)
- [apps/web/src/lib/settings/subscriptionHooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/settings/subscriptionHooks.ts)
- [apps/api/src/billing/billing.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.controller.ts)
- [apps/api/src/billing/billing.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.service.ts)

### 2.2 Admin subscription workflow already present

- admin can list subscriptions
- admin can inspect subscription detail
- admin can change plan and status
- admin can review usage meters and webhook health

References:

- [apps/api/src/admin/super/admin-subscriptions.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-subscriptions.controller.ts)
- [apps/api/src/admin/super/platform-admin.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/platform-admin.service.ts)
- [apps/web/src/app/admin/subscriptions/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/subscriptions/page.tsx)
- [apps/web/src/app/admin/subscriptions/[subscriptionId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/subscriptions/[subscriptionId]/page.tsx)

### 2.3 Provider integration workflow already present

- Stripe checkout creation exists
- Razorpay checkout creation exists
- webhook signature validation exists
- subscription row status sync exists

This means monetization work must not replace provider wiring unless there is a clear bug.

### 2.4 Product workflows that must remain untouched functionally

- onboarding and company bootstrap
- invoice create and invoice issue
- purchase create and receive
- customer, supplier, and product masters
- user and RBAC management
- admin company operations

The monetization system can gate some of these later, but it must not destabilize them while foundational entitlement work is still being built.

## 3. What We Validated Before Planning

The following is confirmed in the current codebase.

### 3.1 What is already good enough to build on

- `SubscriptionPlan`, `Subscription`, and `UsageMeter` models already exist
- checkout provider integration is working structurally
- webhook processing already updates local subscriptions
- admin subscription surfaces already exist
- tenant subscription surface already exists

### 3.2 What is still too weak to rely on as-is

- `SubscriptionPlan.limits` is currently free-form and untyped
- only a minimal usage meter is being written now
- `estimated_mrr_inr` in admin usage is effectively a stub
- tenant subscription UI is still operator-oriented, not commercial
- there is no entitlement snapshot table or service
- there is no runtime usage enforcement yet
- there is no trial lifecycle and expiry-blocking model yet

### 3.3 Immediate design consequence

We should not jump straight to hard quota enforcement.

Instead:

1. model plans correctly
2. compute effective entitlements correctly
3. meter usage correctly
4. expose usage correctly
5. only then enforce

## 4. Rollout Principles

### 4.1 Protect current workflows

Do not break:

- current tenant checkout
- current provider webhook activation
- current admin subscription update flows
- invoice issue path
- user activation path

### 4.2 Prefer additive changes

Use:

- new tables
- new service layer
- new endpoints
- expanded response payloads

Avoid:

- mutating existing billing behavior in-place before new behavior is validated

### 4.3 Enforce only after visibility is proven

The product should first show:

- current plan
- usage against plan
- warning state

before it starts blocking actions.

The only exception is trial-expiry blocking, which is still introduced only after the entitlement snapshot and trial lifecycle are correctly modeled.

### 4.4 Keep monetization logic server-owned

The admin UI and tenant UI may display entitlements, but the source of truth must be backend logic, not frontend calculations.

## 5. Delivery Phases

## Phase P1 — Entitlement Data Model And Snapshot

### Goal

Introduce a safe entitlement layer without changing current checkout behavior.

### Scope

- define strict plan limits contract
- add company-level effective entitlement snapshot
- keep current subscriptions and providers intact

### Changes

1. Extend `SubscriptionPlan`
- keep `limits Json?`
- define a strict limits schema
- add fields such as:
  - `isPublic`
  - `displayOrder`
  - `trialDays`
  - `allowAddOns`

2. Add `CompanyEntitlement`
- `companyId`
- `subscriptionId`
- `planCode`
- `effectiveLimits`
- `overrides`
- `billingPeriodStart`
- `billingPeriodEnd`
- `status`
- `trialStartedAt`
- `trialEndsAt`
- `trialStatus`
- `updatedAt`

3. Add entitlement service
- resolve active subscription
- merge plan limits + overrides
- persist company entitlement snapshot
- resolve trial window and trial status

4. Expand admin plan output
- include structured limits

### Validation before implementation

- confirm all current `subscription_plans` rows can be represented by the new limits schema
- confirm current checkout still only needs `plan_code` + `provider`

### Validation after implementation

- current checkout still creates pending subscription
- webhook still updates subscription row
- entitlement snapshot is created or refreshed without failing current flows
- admin subscriptions list/detail still loads
- trial fields can be resolved for all active plans and subscriptions

### Definition of done

- no existing subscription flow is broken
- every active subscription can resolve an effective entitlement snapshot

Implementation note:

- in the current P1 implementation, the trial window starts when the tenant initiates the subscription checkout flow and the local subscription row is created
- this keeps the rollout additive and compatible with today’s flow, but if the product later needs a different trial-start trigger, that can be adjusted in a focused follow-up without changing the entitlement model

## Phase P2 — Usage Metering Foundation

### Goal

Start measuring what will later be enforced.

### Scope

- invoice quota meters
- seat meters
- optional company-count meter
- admin usage expansion

### Changes

1. Meter keys
- `issued_invoice_count`
- `invoice_billed_value_inr`
- `active_full_seat_count`
- `active_view_only_seat_count`
- `active_company_count`

2. Meter write points
- invoice issue
- user create or activate
- user role update
- optional company create or activate

3. Recompute utility
- add idempotent recalculation job or service for a company and period

4. Expand admin usage
- real plan-based MRR
- usage by entitlement dimension

5. Trial-aware usage behavior
- usage continues to be metered during trial
- enforcement logic remains bypassed while `trial_status = trialing`

### Validation before implementation

- identify every invoice issue path and confirm the single canonical place to meter
- identify every user activation path and confirm a single canonical place to meter

### Validation after implementation

- invoice issue increments usage meter exactly once
- cancel or reverse rules do not corrupt usage totals
- user create or activation updates seat meter accurately
- admin usage page still loads and now shows meaningful values

### Definition of done

- usage data is trustworthy enough to display to tenants and admin

Implementation note:

- current-period usage is now recomputed and exposed from backend lifecycle events for:
  - issued invoices
  - billed invoice value
  - active full seats
  - active company count
- the current product still does not have a dedicated view-only user role model, so `active_view_only_seat_count` is intentionally `0` for now
- this is acceptable for P2 because metering foundation is in place, while true view-only seat classification can be added in a later focused pass if the product introduces a proper view-only role

## Phase P3 — Admin Commercial Control Plane

### Goal

Give super admin real control over plans and overrides before tenant enforcement begins.

### Scope

- plan CRUD
- subscription override tools
- wallet or overage control model
- admin utilization visibility

### Changes

1. Admin plan management APIs
- create plan
- edit plan
- archive plan
- reorder display

2. Admin override APIs
- extra full seats
- extra view-only seats
- invoice uplift
- company uplift
- enforcement mode override
- trial extension or reduction
- end trial now

3. Admin UI
- plan list and edit
- entitlement snapshot view
- override history
- current utilization view
- trial policy editor
- trial status and expiry controls

### Validation before implementation

- map admin permission requirements for plan CRUD and override actions
- ensure audit logging is defined for all commercial changes

### Validation after implementation

- admin can create and edit a plan safely
- admin can override a tenant without breaking provider-linked subscription rows
- admin audit logs record commercial actions
- admin can extend or end trial without corrupting subscription status

### Definition of done

- super admin can control monetization policy without database edits

Implementation note:

- admin plan catalog CRUD is now available through the admin subscription APIs and UI
- tenant-specific entitlement overrides are now stored on the entitlement snapshot and merged into effective limits server-side
- admin can now extend a trial, end a trial immediately, and edit structured plan limits without touching subscription provider wiring
- the current admin plan editor intentionally uses structured JSON for limits in this first release so the control plane is operational before the final polished commercial editor is designed
- P3 does not enforce quotas yet; it establishes the commercial control plane that later phases will consume

## Phase P4 — Tenant Commercial UX

### Goal

Replace the current developer-style subscription page with a real commercial subscription experience.

### Scope

- pricing cards
- entitlement summary
- usage summary
- upgrade prompts

### Changes

1. Tenant subscription page
- current plan card
- trial status
- days remaining
- renewal date
- usage vs quota
- seats used vs allowed
- provider
- upgrade CTA

2. Public pricing page
- `Nano`, `Basic`, `Silver`, `Gold`
- GST note
- included limits
- extra seat rules
- invoice overage rules

3. Remove low-level UX
- raw plan code text input
- manual success/cancel URL entry from tenant surface

4. Trial-specific UX
- clear `Trial active` state
- clear `Trial ends on` date
- clear `Trial expired` blocked state
- `Upgrade now` and `Cancel subscription` actions

### Validation before implementation

- confirm new plan catalog endpoint shape
- confirm current tenant permissions remain `settings.subscription.manage`

### Validation after implementation

- tenant can still initiate checkout normally
- tenant sees correct plan and usage summary
- public pricing and tenant pricing are consistent
- tenant trial status matches backend entitlement snapshot

### Definition of done

- product has a launch-ready commercial UX without losing the provider checkout flow

Implementation note:

- the tenant subscription screen is now a commercial workspace instead of a developer-style billing form
- tenant users now see live plan comparison, trial posture, entitlement summary, and metered usage from the backend snapshot
- manual `plan_code`, `success_url`, and `cancel_url` entry has been removed from the tenant surface
- checkout now uses the selected live plan plus provider choice and returns back to the subscription workspace automatically
- a public plan catalog endpoint now powers both the tenant subscription workspace and the public pricing page, so plan names, limits, and trial terms stay aligned
- tenant cancellation is intentionally limited to unpaid flows such as trial or pending checkout; paid provider-backed cancellation is not silently faked from the tenant surface

## Phase P5 — Warning Layer

### Goal

Introduce safe, non-breaking usage awareness before hard enforcement.

### Scope

- warning badges
- warning banners
- near-limit notifications

### Changes

- usage threshold evaluation service
- warning states at 70%, 90%, and 100%
- invoice composer warnings
- user activation warnings
- tenant subscription warning summaries
- trial ending soon warnings, for example:
  - 7 days left
  - 3 days left
  - 1 day left

### Validation before implementation

- confirm thresholds by plan type
- confirm warning copy with commercial model

### Validation after implementation

- user sees warnings but no new false blocks
- invoice issue continues normally below hard enforcement

### Definition of done

- tenants and admins can see approaching quota pressure clearly

Implementation note:

- the backend now evaluates warning states from effective entitlement limits, current-period usage, and trial posture without enforcing any hard blocks yet
- warning thresholds are now active at `70%`, `90%`, and `100%` for invoices, billed value, seats, and company allowance where those limits exist
- trial-ending warnings are now emitted for the final 7, 3, and 1 day windows, and expired trials surface a critical warning state
- tenant subscription, invoice composer, user management, and admin subscription detail now render non-blocking warning summaries from the shared backend signal
- permission-safe warning endpoints were added for invoice and seat workflows so operational screens do not need subscription-admin access just to show quota pressure

## Phase P6 — Hard Enforcement

### Goal

Turn usage policy into actual backend control.

### Scope

- seat cap enforcement
- invoice quota enforcement
- wallet or hard-block policy

### Changes

1. Seat enforcement
- block user activation beyond plan
- block role upgrade beyond plan

2. Invoice enforcement
- enforce on invoice issue
- allow only according to plan mode:
  - `hard_block`
  - `wallet_overage`
  - `warn_only`

3. Company cap enforcement
- only if multi-company subscription packaging is actually adopted

4. Trial expiry enforcement
- if tenant is trialing, allow full write access
- if trial is expired and not converted:
  - block operational write actions
  - allow access to subscription, billing, and upgrade surfaces
  - no grace period
  - no limited degraded mode

### Validation before implementation

- confirm invoice issue is the single billing-count event
- confirm edge cases:
  - draft invoice
  - cancelled invoice
  - credit note
  - reverse entries
- confirm the list of blocked writes after trial expiry
- confirm read-only surfaces that must remain available

### Validation after implementation

- blocked actions return clean user-friendly errors
- allowed actions still behave exactly like before
- no duplicate metering
- no false positives on old data
- expired trial tenant can still reach upgrade flow
- expired trial tenant cannot continue operational writes

### Definition of done

- entitlements are enforced on the backend, not just displayed

### Implementation status

Implemented at code/build level.

What is now live:

- tenant company-scoped write APIs are blocked after trial expiry from the shared company-scope guard, while subscription management writes remain available for upgrade or cancellation
- seat-cap enforcement now blocks active user invites and inactive-to-active user reactivation once the effective full-seat allowance is exhausted
- invoice-cap enforcement now runs at the canonical invoice-issue point and blocks issuance when `hard_block` plans exceed monthly invoice count or monthly billed-value limits
- `warn_only` and `wallet_overage` invoice plans still allow issue, so the product can support non-blocking commercial models without rewriting the billing workflow
- tenant subscription summaries now expose `accessControl.operationalWriteBlocked`, and the tenant subscription page renders an explicit blocked-state workspace instead of relying only on downstream action failures

Validation completed:

- `npm --workspace apps/api run typecheck`
- `npm --workspace apps/api run test -- billing-enforcement.service.spec.ts billing.service.spec.ts`
- `npm --workspace apps/api run build`
- `npm --workspace apps/web run lint`
- `npm --workspace apps/web run build`

## 6. Workflow Preservation Matrix

| Workflow | Current state | Risk from monetization work | Protection rule |
|---|---|---|---|
| Tenant checkout | Working foundation exists | Broken checkout params or provider session creation | Do not change provider integration contract in P1-P2 |
| Webhook sync | Working foundation exists | Broken activation sync | Add entitlement sync after status update, not instead of it |
| Admin subscription update | Working | Override logic could conflict with plan change | Keep existing update path; add override layer separately |
| Invoice create | Stable business flow | Quota enforcement could block too early | No hard enforcement before P6 |
| Invoice issue | Stable business flow | Duplicate metering or wrong quota count | Meter only at canonical issue point |
| User create or activate | Stable | Seat enforcement could break admin/user ops | Warnings first, enforcement later |
| Onboarding | Stable | Subscription page redesign could break first-run flow | Keep checkout path valid while UX evolves |
| Trial expiry | Not yet implemented | Could wrongly lock paying users or active trials | Block only from entitlement snapshot, never from UI guesswork |

## 7. Testing And Validation Plan

## 7.1 Baseline tests to run before starting

Run and preserve behavior for:

- billing service tests
- webhook processing tests
- admin subscription page load
- tenant subscription page load
- invoice create and issue
- user create and activation

Recommended baseline commands:

- `npm --workspace apps/api run typecheck`
- `npm --workspace apps/api run build`
- `npm --workspace apps/web run lint`
- `npm --workspace apps/web run build`

Then run focused workflow tests:

- tenant checkout create
- webhook reconciliation
- admin change plan
- invoice issue
- user activation
- trial start on new subscription
- trial expiry state transition

## 7.2 New tests to add by phase

### For P1

- plan limits schema validation
- entitlement snapshot creation
- plan override merge logic
- trial snapshot resolution

### For P2

- invoice meter increment
- seat meter recomputation
- MRR calculation

### For P3

- admin plan CRUD authorization
- override application
- audit logging
- trial extension and forced trial end

### For P4

- tenant subscription summary rendering
- pricing card consistency
- checkout CTA correctness
- trial countdown rendering
- expired trial blocked-state rendering

### For P5

- threshold warnings
- no false warnings
- trial-ending-soon warnings

### For P6

- seat hard-block
- invoice hard-block
- wallet overage behavior
- no regression in invoice accounting flow
- trial-expired write block
- upgrade path remains available

## 7.3 Staging validation checklist

Before launch, validate:

1. plan create and edit in admin
2. manual tenant plan assignment
3. provider checkout for chosen plan
4. webhook activation updates subscription and entitlement snapshot
5. invoice usage increments after issue
6. user activation updates seat usage
7. tenant sees correct usage and limit summary
8. warnings appear near limit
9. enforcement blocks only when configured to block
10. admin can override tenant and unblock correctly
11. new tenant trial starts with correct 30-day window
12. admin can change trial duration
13. expired trial is blocked from writes but can still upgrade

## 8. Recommended Build Order

Build order should be:

1. `P1` entitlement data model and snapshot
2. `P2` usage metering
3. `P3` admin control plane
4. `P4` tenant and public commercial UX
5. `P5` warnings
6. `P6` hard enforcement

Do not reverse this order.

If enforcement is added before metering and visibility are trusted, the risk of breaking live workflows becomes high.

## 9. Implementation Ownership By Area

### Backend

- subscription plan schema and validation
- company entitlement service
- metering service
- enforcement service
- admin commercial APIs

### Frontend tenant

- pricing cards
- subscription summary
- quota visualization
- upgrade prompts

### Frontend admin

- plan CRUD UI
- override UI
- monetization analytics UI

### QA and staging

- regression suite for current checkout and billing flows
- staging script for invoice and seat usage
- plan-enforcement smoke test

## 10. Exit Criteria

This monetization rollout is complete only when:

- plan structure is typed and admin-controlled
- every active company has an effective entitlement snapshot
- invoice and seat usage are metered reliably
- tenant can see usage and plan clearly
- admin can override limits safely
- trial lifecycle is fully controlled and visible
- expired trial blocking works correctly
- backend enforcement works without breaking invoice, user, or checkout workflows
- staging validation proves the whole loop end to end

## 11. Immediate Next Step

Start with `P1`.

The first implementation deliverable should be:

- a typed limits schema
- a `CompanyEntitlement` model
- an entitlement resolution service
- expanded admin plan detail
- trial fields and trial-status resolution
- zero change to hard enforcement behavior

That is the safest way to move this product from “subscription records exist” to “SaaS monetization is real.”
