import { NextResponse } from "next/server";

/**
 * Route guarding note:
 *
 * The refresh session is stored as an httpOnly cookie on the API origin (localhost:4000)
 * with `Path=/api/auth`. That cookie is NOT visible to Next.js middleware running on the
 * web origin (localhost:3000). If we redirect based on cookie presence here, users will
 * get stuck on /login even after a successful login.
 *
 * Guarding is handled client-side (AuthProvider refresh + access token) on the app pages.
 */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/c/:path*"],
};
