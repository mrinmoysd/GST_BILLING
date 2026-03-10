# FE-09 — Settings (Status)

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
- Company profile settings UI
- Invoice series/settings UI
- Users/roles UI
- Subscription/checkout UI

## Quality gates
- `apps/web` lint: PASS
- `apps/web` build: PASS
