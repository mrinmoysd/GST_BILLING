import type { AdminSessionState } from "@/lib/admin/types";

export type AdminRouteAccessRule = {
  pattern: string;
  permissions: string[];
  label: string;
};

export const adminRouteAccessRules: AdminRouteAccessRule[] = [
  { pattern: "/admin/dashboard", permissions: ["admin.dashboard.read"], label: "Admin dashboard" },
  { pattern: "/admin/companies/new", permissions: ["admin.companies.manage"], label: "Create company" },
  { pattern: "/admin/companies/[companyId]", permissions: ["admin.companies.manage"], label: "Company detail" },
  { pattern: "/admin/companies", permissions: ["admin.companies.manage"], label: "Companies" },
  { pattern: "/admin/subscriptions/[subscriptionId]", permissions: ["admin.subscriptions.manage"], label: "Subscription detail" },
  { pattern: "/admin/subscriptions", permissions: ["admin.subscriptions.manage"], label: "Subscriptions" },
  { pattern: "/admin/usage", permissions: ["admin.usage.read"], label: "Usage" },
  { pattern: "/admin/support-tickets", permissions: ["admin.support.manage"], label: "Support tickets" },
  { pattern: "/admin/queues", permissions: ["admin.observability.read"], label: "Queues" },
  { pattern: "/admin/internal-users", permissions: ["admin.internal_users.manage"], label: "Internal users" },
  { pattern: "/admin/audit-logs", permissions: ["admin.audit.read"], label: "Audit logs" },
];

export function getAdminRouteAccess(pathname: string) {
  return adminRouteAccessRules.find(
    (rule) => pathname === rule.pattern || pathname.startsWith(`${rule.pattern}/`),
  ) ?? null;
}

export function hasAdminRouteAccess(session: AdminSessionState, pathname: string) {
  const rule = getAdminRouteAccess(pathname);
  if (!rule) return true;
  const permissions = new Set(session.user?.permissions ?? []);
  return rule.permissions.every((permission) => permissions.has(permission));
}
