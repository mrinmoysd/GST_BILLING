# FE-11 — Super-admin UI (Status)

## Scope
- `/admin/login`
- `/admin/dashboard`
- `/admin/companies`
- `/admin/subscriptions`
- `/admin/usage` (placeholder ok)
- `/admin/support-tickets` (placeholder ok)
- queue metrics page

## What’s implemented
- Admin pages:
  - `apps/web/src/app/admin/dashboard/page.tsx`
  - `apps/web/src/app/admin/companies/page.tsx` (lists JSON payload; supports search)
  - `apps/web/src/app/admin/subscriptions/page.tsx` (lists JSON payload; supports status filter)
  - `apps/web/src/app/admin/usage/page.tsx` (JSON payload; date range)
  - `apps/web/src/app/admin/support-tickets/page.tsx` (backend placeholder)
  - `apps/web/src/app/admin/queues/page.tsx` (queue metrics; auto-refresh)
- Hooks:
  - `apps/web/src/lib/admin/hooks.ts`
    - `useAdminCompanies`, `useAdminSubscriptions`, `useAdminUsage`, `useAdminSupportTickets`, `useAdminQueueMetrics`

## Backend alignment
- `/api/admin/companies`
- `/api/admin/subscriptions`
- `/api/admin/usage`
- `/api/admin/support-tickets` (placeholder)
- `/api/admin/queues/metrics`

## Known gaps / follow-ups
- Admin navigation layout is minimal (no dedicated admin shell/sidebar yet).
- Company/subscription pages render JSON (table UI can be added once response shape is finalized).

## Quality gates
- `apps/web` lint: PASS
- `apps/web` build: PASS
