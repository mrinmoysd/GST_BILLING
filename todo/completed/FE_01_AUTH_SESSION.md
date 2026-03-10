# FE-01 — Auth + Session (Option A: refresh cookie, access token in memory)

Date: 2026-03-06

## Goal
Make frontend auth reliable end-to-end:
- Login sets refresh token cookie (httpOnly)
- Frontend stores access token in memory
- Auto-refresh on 401 (single-flight) + boot-time refresh
- Basic route protection for company-scoped pages

## What shipped
### Frontend (`apps/web`)
- API client (`src/lib/api/client.ts`):
  - `credentials: "include"` on all requests
  - in-memory access token
  - single-flight refresh on 401 via `POST /auth/refresh`
  - normalized error shape
- Auth/session provider (`src/lib/auth/session.tsx`):
  - boot-time refresh (`POST /auth/refresh`) → set access token → `GET /auth/me`
  - helpers to set/clear session
- Login screen (`src/app/login/page.tsx`):
  - Zod validation
  - calls `POST /auth/login`, stores access token + user/company, redirects to dashboard
  - preserves return URL via `?next=`
- Route protection (`src/middleware.ts`):
  - protects `/c/*` routes
  - redirects unauthenticated users to `/login?next=...`
  - heuristic: allows navigation if `refresh_token` cookie exists

### Backend (dependency for FE-01 verification)
- `POST /api/auth/login` now succeeds with `owner@example.com / password123`.
- Refresh token is set in `refresh_token` httpOnly cookie.

## Acceptance checks
- Login returns 200 and refresh cookie is set.
- Refresh endpoint works with cookie.
- `/api/auth/me` works with access token.
- Navigating to `/c/:companyId/*` without a refresh cookie redirects to `/login?next=...`.

## Notes
- Next.js warns that the `middleware` convention is deprecated in this version and suggests `proxy`.
  - This does not block FE-01.
  - We can migrate to the recommended convention later.
