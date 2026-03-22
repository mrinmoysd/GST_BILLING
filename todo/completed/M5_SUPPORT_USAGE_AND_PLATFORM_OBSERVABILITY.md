# M5 — Support, Usage, and Platform Observability

Status:

- Completed on 2026-03-22

Outcome:

- the admin panel now surfaces day-to-day operator signals for platform health, support pressure, and tenant usage instead of relying on raw/debug-style screens

Delivered:

- admin dashboard API in [admin-dashboard.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-dashboard.controller.ts)
- expanded admin analytics and observability logic in [platform-admin.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/platform-admin.service.ts)
- enriched support ticket context and operator metadata in [admin-support-tickets.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-support-tickets.controller.ts)
- expanded queue metrics with exports, notifications, webhooks, file storage, and recent failures in [queues.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/queues.controller.ts)
- dashboard hook and UI in:
  - [hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/admin/hooks.ts)
  - [page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/dashboard/page.tsx)
- richer usage analytics in [page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/usage/page.tsx)
- support workflow enrichment in [page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/support-tickets/page.tsx)
- platform failure drilldown in [page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/queues/page.tsx)

Verification:

- `npm --workspace apps/api run typecheck`
- `npm --workspace apps/api run build`
- `npm --workspace apps/web run lint`
- `npx next build --webpack` in `apps/web`

Notes:

- M5 closes the main observability and operator-visibility gap in admin
- M6 remains for audit explorer, internal admin governance, and admin acceptance coverage
