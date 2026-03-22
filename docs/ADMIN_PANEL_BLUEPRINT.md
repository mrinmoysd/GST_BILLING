# Admin Panel Blueprint

**Date**: 2026-03-22  
**Purpose**: Define the target super-admin / platform-operations panel for the GST Billing SaaS product.

This blueprint is based on the current codebase, not on generic SaaS admin assumptions. It combines what already exists with the missing controls required to run the business smoothly.

---

## Goal

Build a robust admin panel that allows the product team to:

- onboard and manage tenant companies
- operate subscriptions, billing, and provider incidents
- monitor platform health and queue pressure
- manage support and risky tenant situations
- inspect growth, usage, and revenue signals
- govern internal admin access and auditability

---

## Current platform primitives already in the codebase

### Already implemented in backend

- admin companies listing
- admin subscriptions listing
- admin usage summary
- admin support-ticket listing and status updates
- admin queue metrics
- billing integrations, webhooks, subscriptions, usage meters
- admin audit logs
- onboarding bootstrap flow for new tenant creation
- notifications, files, export jobs, background queues

### Already implemented in frontend

- admin dashboard
- admin companies list
- admin subscriptions list
- admin usage page
- admin queues page
- admin support tickets page

### Critical current gaps

- no real super-admin auth UX
- no dedicated admin shell/layout/navigation
- no company detail workspace
- no subscription detail/remediation workspace
- no tenant creation tooling from admin
- no billing/provider operations panel
- no admin analytics/revenue reporting layer
- queue metrics route guard inconsistency

---

## Target admin information architecture

## 1. Admin authentication and access control

### Required controls

- real `/admin/login`
- explicit super-admin session model
- internal admin roles:
  - platform_owner
  - finance_admin
  - support_admin
  - operations_admin
  - read_only_admin
- route guards aligned with admin roles
- admin session timeout / forced logout support
- admin audit trail for login and privileged actions

### Why this matters

The current admin area is operationally incomplete until there is a supported, secure way for internal operators to access it.

---

## 2. Admin shell and navigation

### Required sections

- Dashboard
- Companies
- Company detail
- Subscriptions
- Billing operations
- Usage and revenue
- Support
- Queues and jobs
- Notifications
- Webhooks
- Audit logs
- Admin users and access

### Required UX

- persistent admin sidebar
- quick search / jump bar
- global tenant search
- operator action rail for high-priority issues
- clear separation from tenant-facing app shell

---

## 3. Company lifecycle operations

### Required capabilities

- create a company from admin
- create owner/admin user for a company
- trigger or re-run onboarding assistance
- edit company profile
- inspect GSTIN verification status
- inspect billing/invoice settings
- inspect tenant health snapshot
- deactivate / suspend company
- restore or re-enable company
- view recent tenant activity

### Company detail workspace should include

- profile
- owner and user summary
- GST/compliance summary
- subscription summary
- recent invoices / purchases / payments counts
- support history
- audit history
- quick actions:
  - impersonate support session
  - suspend/reactivate
  - trigger plan change
  - resend onboarding/setup instructions

### Important note

Admin-side company creation should reuse the onboarding domain logic already present in `apps/api/src/onboarding`.

---

## 4. Billing and subscription operations

### Required capabilities

- inspect subscription details by company
- inspect provider state:
  - stripe / razorpay ids
  - checkout status
  - webhook sync health
- manually retry or reconcile billing state
- change plan
- cancel / reactivate subscription
- inspect usage-meter rollups by company
- inspect invoices / billing events if added later
- surface failed or stale provider sync situations

### Billing operations screen should include

- plan distribution
- MRR / ARR / trial / churn indicators
- past-due and failed subscription counts
- provider incident queue
- webhook failures and replay controls

### Current codebase foundation

- subscription and webhook domain logic already exists
- usage meters already exist
- admin subscriptions and usage list views already exist

What is missing is the operator tooling on top.

---

## 5. Platform analytics and business reporting

### Required admin metrics

- company count
- active subscriptions
- trial vs active vs canceled vs past-due
- new companies by period
- onboarding conversion
- usage by plan
- feature adoption:
  - invoices
  - purchases
  - GST exports
  - POS usage
- support ticket load
- queue failure trends

### Recommended admin report groups

- Growth:
  - signups
  - company activation
  - onboarding completion
- Revenue:
  - active subscriptions
  - provider mix
  - plan mix
  - churn/past-due
- Product usage:
  - invoices issued
  - payments recorded
  - GST exports
  - POS sessions
- Operations:
  - queue failures
  - webhook failures
  - notification failures
  - support ticket aging

---

## 6. Support and customer success workspace

### Required capabilities

- support ticket triage
- assign owner or operator
- ticket notes / internal comments
- SLA/aging views
- tenant snapshot alongside ticket
- quick jump from ticket to company detail
- escalation markers:
  - billing issue
  - compliance risk
  - product bug
  - onboarding blocked

### Current state

- support ticket listing and status changes exist

### Missing

- assignment
- notes
- cross-linking to company detail
- operator workflow

---

## 7. Queues, jobs, and platform operations

### Required capabilities

- PDF queue visibility
- export job status visibility
- notification outbox visibility
- failed job drilldown
- retry / replay workflows where safe
- webhook failure visibility
- file-storage failure visibility

### Must-have operator views

- active failures
- oldest stuck jobs
- queue counts over time
- recent provider/webhook exceptions

### Current issue to fix first

- `/api/admin/queues/metrics` auth/guard mismatch must be corrected

---

## 8. Notifications, files, and webhooks admin

### Notifications

- template list
- delivery stats
- retry queue
- failure reasons
- recent sends by company

### Files

- storage usage by company
- recent generated files
- failed uploads/downloads
- orphaned or stale file references

### Webhooks

- webhook event list
- provider filter
- event status
- retry / replay support where appropriate
- failed signature validation visibility

---

## 9. Audit, compliance, and internal governance

### Required controls

- admin audit log explorer
- filter by actor, company, action, date
- privileged action review
- security-sensitive actions:
  - company suspension
  - plan changes
  - impersonation
  - manual subscription sync
  - role changes

### Important principle

Anything the admin panel can change must have a traceable audit record.

---

## 10. Internal admin user management

### Required capabilities

- create admin user
- assign admin role
- deactivate admin user
- reset admin access
- audit internal role changes

### Recommended internal roles

- Platform owner
- Billing operations
- Support operations
- Finance ops
- Read-only auditor

---

## 11. Recommended admin dashboard widgets

- total companies
- active subscriptions
- onboarding started vs completed
- companies created in last 7 / 30 days
- failed webhooks
- failed notification deliveries
- queue backlog
- open support tickets
- high-risk tenants:
  - no subscription
  - repeated webhook failures
  - repeated queue failures
  - GST/report export failures

---

## 12. Recommended execution order for Phase M

### M1. Access foundation

- real admin login
- super-admin session flow
- admin layout and navigation
- queue guard fix

### M2. Company operations

- company detail workspace
- admin-side company creation
- company suspension/reactivation
- quick tenant health summary

### M3. Billing operations

- subscription detail workspace
- provider/webhook incident panel
- plan/status operations
- usage and revenue analytics

### M4. Support and observability

- support ticket enrichment
- queue/job drilldowns
- notification/file/webhook admin views

### M5. Governance

- admin audit explorer
- internal admin user management
- admin acceptance/e2e coverage

---

## 13. Non-negotiable acceptance criteria

- admin auth is real and usable
- all admin routes are protected correctly
- company and subscription management are not list-only
- billing and provider incidents are visible and operable
- support, queues, and auditability are first-class admin workflows
- the admin panel can genuinely run the SaaS, not just inspect it

---

## Recommendation

Phase M should be treated as a serious product/admin initiative, not as leftover UI polish. The most robust version of the admin panel for this codebase is one that combines:

- super-admin access foundation
- company lifecycle controls
- billing/provider operations
- analytics and usage visibility
- support and platform observability
- auditability and internal governance

That is the admin surface that will actually let the business operate the SaaS smoothly.
