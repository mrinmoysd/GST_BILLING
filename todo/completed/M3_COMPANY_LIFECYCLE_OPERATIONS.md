# M3 — Company Lifecycle Operations

Status:

- Completed on 2026-03-22

Outcome:

- the admin panel can now create companies and operate a basic tenant lifecycle workflow instead of relying on a list page only

Delivered:

- admin company create endpoint and DTOs in:
  - [admin-companies.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-companies.controller.ts)
  - [platform-admin.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/platform-admin.service.ts)
  - [create-admin-company.dto.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/dto/create-admin-company.dto.ts)
- admin company detail and lifecycle endpoint support in:
  - [admin-companies.controller.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/admin-companies.controller.ts)
  - [update-admin-company-lifecycle.dto.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/admin/super/dto/update-admin-company-lifecycle.dto.ts)
- admin companies list upgraded as an operational entry point in [page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/companies/page.tsx)
- admin company create page in [page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/companies/new/page.tsx)
- admin company detail workspace in [page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/admin/companies/[companyId]/page.tsx)
- admin query and mutation hooks in [hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/admin/hooks.ts)

Verification:

- `npm --workspace apps/api run typecheck`
- `npm --workspace apps/api run build`
- `npm --workspace apps/web run lint`
- `npx next build --webpack` in `apps/web`

Notes:

- lifecycle status is currently stored in company `invoiceSettings.admin_lifecycle`
- M4 should build the matching subscription detail and billing-operations workspace next
