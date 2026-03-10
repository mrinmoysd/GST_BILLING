# DE-08 — Super-admin support tickets (Completed)

Date: 2026-03-07

## Backend

- Added Prisma model `SupportTicket` and migration to create `support_tickets` table.
- Implemented real admin endpoints:
  - `GET /api/admin/support-tickets?page=&limit=&status=`
  - `PATCH /api/admin/support-tickets/:id` to update `status` and/or `priority`

## Frontend (Admin)

- Updated `/(admin)/support-tickets` to render a table and allow quick status changes.

## Quality gates

- `apps/api` build + typecheck: PASS
- `apps/api` tests: PASS
- `apps/web` build: PASS
