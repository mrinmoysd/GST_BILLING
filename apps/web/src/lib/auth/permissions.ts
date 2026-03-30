"use client";

import type { SessionState } from "@/lib/auth/types";

export function hasPermission(session: SessionState, permission: string) {
  return Boolean(session.user?.permissions?.includes(permission));
}

export function hasAnyPermission(session: SessionState, permissions: string[]) {
  return permissions.some((permission) => hasPermission(session, permission));
}

export function hasAllPermissions(session: SessionState, permissions: string[]) {
  return permissions.every((permission) => hasPermission(session, permission));
}

export function hasPermissionMatch(
  session: SessionState,
  permissions: string[],
  mode: "any" | "all" = "any",
) {
  return mode === "all"
    ? hasAllPermissions(session, permissions)
    : hasAnyPermission(session, permissions);
}
