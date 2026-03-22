# M4 — Billing and Subscription Operations

Status:

- Completed on 2026-03-22

Outcome:

- the admin panel can now inspect and operate subscription state instead of relying on a list-only view

Delivered:

- enriched subscription list, detail, plan catalog, and admin operations in:
  - [admin-subscriptions.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-subscriptions.controller.ts)
  - [platform-admin.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/platform-admin.service.ts)
  - [update-admin-subscription.dto.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/dto/update-admin-subscription.dto.ts)
- public billing-domain usage sync exposed for admin operations in [billing.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/billing/billing.service.ts)
- upgraded admin subscriptions list in [page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/subscriptions/page.tsx)
- admin subscription detail workspace in [page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/subscriptions/[subscriptionId]/page.tsx)
- admin subscription hooks in [hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/admin/hooks.ts)

Verification:

- `npm --workspace apps/api run typecheck`
- `npm --workspace apps/api run build`
- `npm --workspace apps/web run lint`
- `npx next build --webpack` in `apps/web`

Notes:

- M4 uses operator-managed status and plan updates directly on the local subscription record
- deeper provider incident replay tooling and richer analytics remain part of M5 and later admin work
