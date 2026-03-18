# FE-09 — Settings (Status)

## Phase A note

This completion doc is historically accurate for its original scope, but the deferred section is now outdated.

Later implementation added:
- company settings UI
- invoice series UI
- users UI
- subscription UI

For current truth, see:
- `docs/CURRENT_IMPLEMENTATION_STATE.md`
- `docs/GAP_ANALYSIS_AND_EXECUTION_PLAN.md`

## Scope (from plan)
- Company settings
- Invoice settings (series)
- Users + roles
- Notification templates CRUD + test send
- Subscription status + checkout

## What’s implemented
### Notifications settings (MVP)
- Settings hub updated:
  - `apps/web/src/app/(app)/c/[companyId]/settings/page.tsx`
- Notification templates page:
  - `apps/web/src/app/(app)/c/[companyId]/settings/notifications/page.tsx`
  - Create template (name/channel/subject/body)
  - List templates
  - Rename template (patch)
  - Send test notification
- Hooks:
  - `apps/web/src/lib/settings/notificationsHooks.ts`
    - `useNotificationTemplates`, `useCreateNotificationTemplate`, `useUpdateNotificationTemplate`, `useTestNotification`

## Backend alignment
- Notifications controller:
  - `GET /api/companies/:companyId/notification-templates`
  - `POST /api/companies/:companyId/notification-templates`
  - `PATCH /api/companies/:companyId/notification-templates/:templateId`
  - `POST /api/companies/:companyId/notifications/test`

## Deferred (blocked by missing APIs in repo)
- Historical note: this deferred list has been superseded by later implementation.

## Quality gates
- `apps/web` lint: PASS
- `apps/web` build: PASS
