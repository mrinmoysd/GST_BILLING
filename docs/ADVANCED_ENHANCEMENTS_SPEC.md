# Advanced Enhancements Specification

**Date**: 2026-03-22  
**Purpose**: Explain why certain items are classified as future enhancements, map them against the current implementation, and define what would be required to add them.

---

## Why these are future enhancements

These items are marked as future enhancements because the current product already implements the core operational surface for:

- tenant onboarding and auth
- masters, inventory, invoices, purchases, payments
- GST, accounting, reports, POS
- platform integrations
- public website
- admin auth, shell, company lifecycle, subscription operations, support, queues, internal users, and audit logs

They are not “missing basics”. They are the next layer of maturity:

- operator convenience features
- advanced business analytics
- stronger governance workflows
- support tooling for higher scale or higher risk operations

In short:

- current state: usable product and usable admin platform
- enhancement state: enterprise-grade operator control plane

---

## Current implementation baseline

### Already implemented

#### Admin access and governance

- internal admin auth under `/api/admin/auth`
- admin login page and protected `/admin/*` routes
- internal admin roles via `users.role`
- internal admin user management
- internal admin audit logs via `internal_admin_audit_logs`

#### Admin operations

- admin dashboard
- company list, create, detail, suspend/reactivate
- subscription list, detail, plan/status operations
- usage summary
- support ticket triage with notes/assignee metadata
- queue metrics, failed exports/notifications/webhooks visibility

#### Platform domain already available for reuse

- onboarding service
- billing and subscription services
- webhook event storage
- notification outbox
- file storage abstraction
- report and accounting services
- user/company/session models

---

## Enhancement areas

## 1. Admin impersonation / support session takeover

### Why it is enhancement-grade

The admin can already inspect company state, support tickets, users, subscriptions, and activity. Impersonation is not required to operate the platform safely, but it becomes high-value for support efficiency.

### Current implementation

- admin can view company detail and support context
- no impersonation token or delegated session flow exists
- no audit model for impersonation start/stop exists

### What must be added

#### Backend

- impersonation token issuance endpoint
- delegated tenant session creation with explicit actor/subject linkage
- TTL-bound impersonation session model
- hard block on destructive actions unless explicitly allowed
- audit events:
  - impersonation started
  - impersonation ended
  - action executed while impersonating

#### Frontend

- “Impersonate tenant” action on admin company detail
- visible tenant banner during impersonation
- one-click exit impersonation flow
- audit visibility in admin audit explorer

#### Data model additions

- either a new `impersonation_sessions` table or explicit session metadata on `sessions`
- optional action-source metadata on tenant audit/admin audit entries

### Delivery recommendation

- add only after live validation is complete
- treat as high-risk governance work, not a UI-only enhancement

---

## 2. Approval workflows for sensitive admin actions

### Why it is enhancement-grade

Today the system is auditable. Approval workflows are a stronger governance control for larger teams or regulated operations.

### Current implementation

- privileged actions are logged
- no dual approval or maker-checker workflow exists
- no pending-action state exists for admin actions

### What must be added

#### Backend

- `admin_action_requests` table
- approval state machine:
  - requested
  - approved
  - rejected
  - expired
  - executed
- policies for actions requiring approval:
  - company suspension/reactivation
  - subscription override
  - internal admin deactivation
  - impersonation

#### Frontend

- approval inbox for eligible actions
- action request detail with diff preview
- approver assignment and comments

#### Governance rules

- actor cannot self-approve
- approval and execution must both be audited

---

## 3. Provider-side replay and remediation tooling

### Why it is enhancement-grade

The platform already surfaces webhook failures and billing/subscription state. Replay/remediation tooling is the next step once operator visibility is in place.

### Current implementation

- billing integrations exist
- webhook events are stored
- admin can inspect failures and subscription state
- no replay/reprocess control exists in admin

### What must be added

#### Backend

- safe replay endpoints for failed webhook events
- reconciliation service with idempotency guarantees
- provider-health status computation
- subscription sync history

#### Frontend

- webhook detail and replay actions
- billing incident queue
- retry/reconcile controls on subscription detail

#### Risks

- duplicate provider processing
- state divergence if replay is not idempotent

### Precondition

- add only after provider sandbox validation against real Stripe/Razorpay accounts

---

## 4. Advanced analytics: revenue, cohorts, churn, onboarding conversion

### Why it is enhancement-grade

The admin usage/dashboard views are already operationally useful. Cohorts and revenue analytics are leadership/finance optimization features, not blockers for product operation.

### Current implementation

- usage summary exists
- plan/provider mix exists
- active/past-due counts exist
- no cohort modeling
- no onboarding funnel analytics
- no churn/recovery trends

### What must be added

#### Backend

- analytics aggregation queries or materialized summary tables
- definitions for:
  - activated company
  - onboarded company
  - retained company
  - churned company
  - recovered company
- periodic snapshot jobs

#### Frontend

- admin revenue analytics workspace
- onboarding funnel charts
- cohort retention table
- MRR/ARR trend panels

#### Data gaps to address

- event timestamps for onboarding milestones
- subscription lifecycle events beyond current status snapshots
- optional feature-usage events for deeper adoption analytics

---

## 5. Rich support operations workspace

### Why it is enhancement-grade

The current support workflow is already usable. The next layer is customer-success and SLA tooling.

### Current implementation

- support ticket list
- status updates
- assignee and internal note metadata
- company linking by email

### What must be added

#### Backend

- explicit `support_ticket_comments` and `support_ticket_assignments`
- SLA timers
- escalation reason taxonomy
- attachment support

#### Frontend

- ticket detail workspace
- threaded notes/comments
- escalation markers
- ticket aging filters
- customer timeline on the ticket

---

## 6. Stronger internal admin model

### Why it is enhancement-grade

The current internal role setup is sufficient for product operation. A dedicated internal RBAC model becomes necessary only when the internal team grows or governance requirements tighten.

### Current implementation

- internal roles reuse `users.role`
- permission bundles are static
- admin UI visibility is permission-aware

### What must be added

#### Backend

- dedicated internal role and permission tables
- internal role assignment history
- scoped admin permissions by feature/action
- optional SSO/SAML for internal users

#### Frontend

- internal role builder/editor
- permission matrix UI
- admin access review screen

### Migration path

- convert current static role catalog into seed data for internal RBAC
- migrate existing internal users by matching current `users.role`

---

## Enhancement roadmap

## Priority 1

- live environment validation and seeded operator testing
- provider-side replay and remediation tooling
- advanced support detail workspace

## Priority 2

- impersonation with strong audit controls
- advanced revenue/cohort analytics

## Priority 3

- approval workflows
- dedicated internal RBAC model

---

## Definition of done for each enhancement

- backend contract added
- frontend workflow added
- auditability defined
- migration path documented if schema changes
- unit/integration coverage added
- environment-backed validation performed

---

## Conclusion

These items are future enhancements because the current codebase has already crossed the line from “missing feature” to “working platform”. The remaining work in this document is about:

- safer operator workflows
- deeper business intelligence
- higher-scale governance
- better remediation tooling

They should be planned as their own execution track after live validation, not treated as unfinished core scope.

