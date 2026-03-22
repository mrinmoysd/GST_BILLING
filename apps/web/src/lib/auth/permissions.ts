"use client";

import type { SessionState } from "@/lib/auth/types";

export function hasPermission(session: SessionState, permission: string) {
  return Boolean(session.user?.permissions?.includes(permission));
}

export function hasAnyPermission(session: SessionState, permissions: string[]) {
  return permissions.some((permission) => hasPermission(session, permission));
}
