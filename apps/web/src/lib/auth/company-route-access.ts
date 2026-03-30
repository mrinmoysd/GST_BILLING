import type { SessionState } from "@/lib/auth/types";
import { hasAnyPermission, hasPermission } from "@/lib/auth/permissions";

export type PermissionMatchMode = "any" | "all";

export type CompanyRouteAccessRule = {
  pattern: string;
  permissions: string[];
  mode?: PermissionMatchMode;
  label: string;
};

export const settingsOverviewPermissions = [
  "settings.view",
  "settings.company.manage",
  "settings.invoice_series.manage",
  "settings.users.manage",
  "settings.roles.manage",
  "settings.notifications.manage",
  "settings.pricing.manage",
  "settings.subscription.manage",
  "settings.migrations.manage",
  "settings.print_templates.manage",
  "settings.custom_fields.manage",
  "integrations.webhooks.manage",
  "integrations.api_keys.manage",
];

export const companyRouteAccessRules: CompanyRouteAccessRule[] = [
  { pattern: "dashboard", permissions: ["dashboard.view"], label: "Dashboard" },
  { pattern: "accounting/**", permissions: ["accounting.view"], label: "Accounting" },
  { pattern: "inventory/**", permissions: ["inventory.view"], label: "Inventory" },
  { pattern: "masters/customers/new", permissions: ["masters.manage"], label: "Create customer" },
  { pattern: "masters/customers/**", permissions: ["masters.view"], label: "Customers" },
  { pattern: "masters/products/new", permissions: ["masters.manage"], label: "Create product" },
  { pattern: "masters/products/**", permissions: ["masters.view"], label: "Products" },
  { pattern: "masters/suppliers/new", permissions: ["masters.manage"], label: "Create supplier" },
  { pattern: "masters/suppliers/**", permissions: ["masters.view"], label: "Suppliers" },
  { pattern: "masters/categories/**", permissions: ["masters.view"], label: "Categories" },
  { pattern: "payments/**", permissions: ["payments.view"], label: "Payments" },
  { pattern: "pos/billing", permissions: ["sales.manage"], label: "POS billing" },
  { pattern: "pos/receipt/**", permissions: ["sales.view"], label: "POS receipt" },
  { pattern: "pos/**", permissions: ["sales.view"], label: "POS" },
  { pattern: "purchases/new", permissions: ["purchases.manage"], label: "Create purchase" },
  { pattern: "purchases/**", permissions: ["purchases.view"], label: "Purchases" },
  { pattern: "reports/**", permissions: ["reports.view"], label: "Reports" },
  { pattern: "sales/field/today", permissions: ["field_sales.log_visits"], label: "Field worklist" },
  { pattern: "sales/field/visits/**", permissions: ["field_sales.log_visits"], label: "Field visit" },
  { pattern: "sales/field/dcr", permissions: ["field_sales.submit_dcr"], label: "Daily call report" },
  { pattern: "sales/invoices/new", permissions: ["sales.manage"], label: "Create invoice" },
  { pattern: "sales/invoices/**", permissions: ["sales.view"], label: "Invoices" },
  { pattern: "sales/orders/new", permissions: ["sales.manage"], label: "Create sales order" },
  { pattern: "sales/orders/**", permissions: ["sales.view"], label: "Sales orders" },
  { pattern: "sales/quotations/new", permissions: ["sales.manage"], label: "Create quotation" },
  { pattern: "sales/quotations/**", permissions: ["sales.view"], label: "Quotations" },
  { pattern: "sales/challans/**", permissions: ["sales.view"], label: "Delivery challans" },
  { pattern: "sales/dispatch/**", permissions: ["sales.view"], label: "Dispatch" },
  { pattern: "settings/company", permissions: ["settings.company.manage"], label: "Company settings" },
  { pattern: "settings/invoice-series", permissions: ["settings.invoice_series.manage"], label: "Invoice series" },
  { pattern: "settings/users", permissions: ["settings.users.manage"], label: "User settings" },
  { pattern: "settings/roles", permissions: ["settings.roles.manage"], label: "Role settings" },
  { pattern: "settings/notifications", permissions: ["settings.notifications.manage"], label: "Notification settings" },
  { pattern: "settings/pricing", permissions: ["settings.pricing.manage"], label: "Pricing settings" },
  { pattern: "settings/subscription", permissions: ["settings.subscription.manage"], label: "Subscription settings" },
  { pattern: "settings/migrations", permissions: ["settings.migrations.manage"], label: "Migration settings" },
  { pattern: "settings/print-templates", permissions: ["settings.print_templates.manage"], label: "Print templates" },
  { pattern: "settings/custom-fields", permissions: ["settings.custom_fields.manage"], label: "Custom fields" },
  {
    pattern: "settings/integrations",
    permissions: ["integrations.webhooks.manage", "integrations.api_keys.manage"],
    mode: "all",
    label: "Integrations",
  },
  { pattern: "settings/sales/assignments", permissions: ["field_sales.manage_masters"], label: "Field sales setup" },
  { pattern: "settings", permissions: settingsOverviewPermissions, mode: "any", label: "Settings" },
];

function matchesPattern(localPath: string, pattern: string) {
  if (pattern.endsWith("/**")) {
    const prefix = pattern.slice(0, -3);
    return localPath === prefix || localPath.startsWith(`${prefix}/`);
  }
  return localPath === pattern;
}

export function getCompanyRouteAccess(localPath: string) {
  return companyRouteAccessRules.find((rule) => matchesPattern(localPath, rule.pattern)) ?? null;
}

export function hasCompanyRouteAccess(session: SessionState, localPath: string) {
  const rule = getCompanyRouteAccess(localPath);
  if (!rule) return true;
  if (rule.mode === "all") {
    return rule.permissions.every((permission) => hasPermission(session, permission));
  }
  return hasAnyPermission(session, rule.permissions);
}
