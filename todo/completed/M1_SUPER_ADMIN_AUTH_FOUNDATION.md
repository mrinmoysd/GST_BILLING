# M1 — Super-Admin Auth Foundation

Status:

- Completed on 2026-03-22

Outcome:

- admin authentication is now a real product flow instead of a placeholder

Delivered:

- dedicated admin auth endpoints under `/api/admin/auth`
- separate admin refresh cookie path using `admin_refresh_token`
- global super-admin session support via nullable `sessions.company_id`
- real [admin login page](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/login/page.tsx)
- protected admin route wrapper in [admin layout](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/layout.tsx)
- admin API client/session hooks in:
  - [api-client.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/admin/api-client.ts)
  - [session.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/admin/session.tsx)
  - [auth-hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/admin/auth-hooks.ts)
- admin queue metrics guard corrected in [queues.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/queues.controller.ts)
- bootstrap seed support for a super-admin user in [auth.seed.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/auth/auth.seed.ts)

Verification:

- `npm --workspace apps/api run prisma:generate`
- `npm --workspace apps/api run typecheck`
- `npm --workspace apps/api run build`
- `npm --workspace apps/web run lint`
- `npx next build --webpack` in `apps/web`

Notes:

- M1 intentionally stops at auth foundation and basic protected admin entry
- the richer admin shell, navigation, and detailed operations workspaces start in M2 and later admin phases
