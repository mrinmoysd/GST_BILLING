"use client";

import type * as React from "react";
import {
  BarChart3,
  BookOpen,
  Boxes,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  Settings,
  Truck,
  Users,
  Wallet,
} from "lucide-react";

import type { SessionState } from "@/lib/auth/types";
import { hasAnyPermission } from "@/lib/auth/permissions";

export type WorkflowLink = {
  href: string;
  label: string;
  hint: string;
  permissions: string[];
};

export type WorkflowDefinition = {
  key: string;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  permissions: string[];
  defaultHref: string;
  matches: string[];
  links: WorkflowLink[];
};

export type QuickCreateItem = {
  href: string;
  label: string;
  hint: string;
  permissions: string[];
};

const workflowDefinitions: WorkflowDefinition[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    shortLabel: "Dash",
    icon: LayoutDashboard,
    description: "Today, risks, and open operating pressure.",
    permissions: ["dashboard.view"],
    defaultHref: "dashboard",
    matches: ["dashboard"],
    links: [{ href: "dashboard", label: "Overview", hint: "Workspace pulse", permissions: ["dashboard.view"] }],
  },
  {
    key: "order-to-cash",
    label: "Order to Cash",
    shortLabel: "Sales",
    icon: Receipt,
    description: "Quotes, orders, dispatch, invoices, and POS.",
    permissions: ["sales.view"],
    defaultHref: "sales/invoices",
    matches: ["sales/quotations", "sales/orders", "sales/dispatch", "sales/challans", "sales/invoices", "pos"],
    links: [
      { href: "sales/quotations", label: "Quotations", hint: "Price and convert", permissions: ["sales.view"] },
      { href: "sales/orders", label: "Orders", hint: "Capture and fulfill", permissions: ["sales.view"] },
      { href: "sales/dispatch", label: "Dispatch", hint: "Pick and move", permissions: ["sales.view"] },
      { href: "sales/challans", label: "Challans", hint: "Delivery register", permissions: ["sales.view"] },
      { href: "sales/invoices", label: "Invoices", hint: "Billing and due", permissions: ["sales.view"] },
      { href: "pos", label: "POS", hint: "Counter billing", permissions: ["sales.view"] },
    ],
  },
  {
    key: "purchase-to-stock",
    label: "Purchase to Stock",
    shortLabel: "Stock",
    icon: Boxes,
    description: "Purchases, warehouses, transfers, and batch control.",
    permissions: ["purchases.view", "inventory.view"],
    defaultHref: "inventory",
    matches: ["purchases", "inventory"],
    links: [
      { href: "inventory", label: "Inventory", hint: "Stock overview", permissions: ["inventory.view"] },
      { href: "purchases", label: "Purchases", hint: "Receive and pay", permissions: ["purchases.view"] },
      { href: "inventory/warehouses", label: "Warehouses", hint: "Storage points", permissions: ["inventory.view"] },
      { href: "inventory/transfers", label: "Transfers", hint: "Move stock", permissions: ["inventory.view"] },
      { href: "inventory/batches", label: "Batches", hint: "Expiry and FEFO", permissions: ["inventory.view"] },
    ],
  },
  {
    key: "collections",
    label: "Collections",
    shortLabel: "Dues",
    icon: Wallet,
    description: "Receipts, follow-up, and bank reconciliation.",
    permissions: ["payments.view"],
    defaultHref: "payments/collections",
    matches: ["payments"],
    links: [
      { href: "payments/collections", label: "Collections", hint: "Open follow-up", permissions: ["payments.view"] },
      { href: "payments", label: "Receipts", hint: "Instruments and settlements", permissions: ["payments.view"] },
      { href: "payments/banking", label: "Banking", hint: "Reconcile and review", permissions: ["payments.view"] },
    ],
  },
  {
    key: "field-sales",
    label: "Field Sales",
    shortLabel: "Field",
    icon: Truck,
    description: "Visits, DCR, and route coverage.",
    permissions: ["sales.view", "settings.view"],
    defaultHref: "sales/field/today",
    matches: ["sales/field", "settings/sales"],
    links: [
      { href: "sales/field/today", label: "Today", hint: "Planned and active visits", permissions: ["sales.view"] },
      { href: "sales/field/dcr", label: "DCR", hint: "Daily call report", permissions: ["sales.view"] },
      { href: "settings/sales/assignments", label: "Assignments", hint: "Territory and beat setup", permissions: ["settings.view"] },
    ],
  },
  {
    key: "gst-compliance",
    label: "GST & Compliance",
    shortLabel: "GST",
    icon: FolderKanban,
    description: "Filing, e-invoice, and compliance exceptions.",
    permissions: ["reports.view"],
    defaultHref: "reports/gst/compliance",
    matches: ["reports/gst"],
    links: [
      { href: "reports/gst/compliance", label: "Compliance", hint: "IRN and EWB status", permissions: ["reports.view"] },
      { href: "reports/gst/gstr1", label: "GSTR-1", hint: "Return prep and export", permissions: ["reports.view"] },
    ],
  },
  {
    key: "accounting",
    label: "Accounting",
    shortLabel: "Books",
    icon: BookOpen,
    description: "Ledgers, journals, cash, bank, and statements.",
    permissions: ["accounting.view"],
    defaultHref: "accounting",
    matches: ["accounting"],
    links: [
      { href: "accounting", label: "Overview", hint: "Books pulse", permissions: ["accounting.view"] },
      { href: "accounting/ledgers", label: "Ledgers", hint: "Account directory", permissions: ["accounting.view"] },
      { href: "accounting/journals", label: "Journals", hint: "Entry stream", permissions: ["accounting.view"] },
      { href: "accounting/books/cash", label: "Cash book", hint: "Cash movement", permissions: ["accounting.view"] },
      { href: "accounting/books/bank", label: "Bank book", hint: "Bank movement", permissions: ["accounting.view"] },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    shortLabel: "Reports",
    icon: BarChart3,
    description: "Business, distributor, and control reporting.",
    permissions: ["reports.view"],
    defaultHref: "reports",
    matches: ["reports"],
    links: [
      { href: "reports", label: "Hub", hint: "Report categories", permissions: ["reports.view"] },
      { href: "reports/outstanding", label: "Outstanding", hint: "Receivable pressure", permissions: ["reports.view"] },
      { href: "reports/distributor/analytics", label: "Distributor", hint: "Sales and stock", permissions: ["reports.view"] },
      { href: "reports/credit-control", label: "Credit control", hint: "Risk and dues", permissions: ["reports.view"] },
    ],
  },
  {
    key: "masters",
    label: "Masters",
    shortLabel: "Masters",
    icon: Users,
    description: "Customers, suppliers, products, and catalog setup.",
    permissions: ["masters.view"],
    defaultHref: "masters/customers",
    matches: ["masters"],
    links: [
      { href: "masters/customers", label: "Customers", hint: "Commercial ownership", permissions: ["masters.view"] },
      { href: "masters/suppliers", label: "Suppliers", hint: "Purchase partners", permissions: ["masters.view"] },
      { href: "masters/products", label: "Products", hint: "Pricing and stock", permissions: ["masters.view"] },
      { href: "masters/categories", label: "Categories", hint: "Catalog grouping", permissions: ["masters.view"] },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    shortLabel: "Setup",
    icon: Settings,
    description: "Commercial, access, templates, and integrations.",
    permissions: ["settings.view"],
    defaultHref: "settings",
    matches: ["settings"],
    links: [
      { href: "settings", label: "Overview", hint: "Setup areas", permissions: ["settings.view"] },
      { href: "settings/company", label: "Company", hint: "Identity and GST", permissions: ["settings.view"] },
      { href: "settings/pricing", label: "Pricing", hint: "Guardrails and schemes", permissions: ["settings.view"] },
      { href: "settings/roles", label: "Roles", hint: "Access structure", permissions: ["settings.view"] },
      { href: "settings/users", label: "Users", hint: "Team and invites", permissions: ["settings.view"] },
      { href: "settings/integrations", label: "Integrations", hint: "Webhooks and keys", permissions: ["settings.view"] },
    ],
  },
];

export function getVisibleWorkflows(session: SessionState) {
  return workflowDefinitions
    .filter((workflow) => hasAnyPermission(session, workflow.permissions))
    .map((workflow) => ({
      ...workflow,
      links: workflow.links.filter((link) => hasAnyPermission(session, link.permissions)),
    }))
    .filter((workflow) => workflow.links.length > 0);
}

export function getActiveWorkflow(pathname: string | null | undefined, companyId: string, workflows: WorkflowDefinition[]) {
  const localPath = pathname?.split(`/c/${companyId}/`)[1] ?? "dashboard";
  return (
    workflows.find((workflow) =>
      workflow.matches.some((match) => localPath === match || localPath.startsWith(`${match}/`)),
    ) ?? workflows[0]
  );
}

export function toCompanyHref(companyId: string, href: string) {
  return `/c/${companyId}/${href}`;
}

export function getQuickCreateItems(session: SessionState): QuickCreateItem[] {
  const items: QuickCreateItem[] = [
    { href: "sales/invoices/new", label: "New invoice", hint: "Issue sales bill", permissions: ["sales.view"] },
    { href: "sales/orders/new", label: "New order", hint: "Capture sales order", permissions: ["sales.view"] },
    { href: "sales/quotations/new", label: "New quotation", hint: "Create quote", permissions: ["sales.view"] },
    { href: "purchases/new", label: "New purchase", hint: "Receive supplier bill", permissions: ["purchases.view"] },
    { href: "masters/customers/new", label: "New customer", hint: "Add trading account", permissions: ["masters.view"] },
    { href: "masters/products/new", label: "New product", hint: "Add catalog item", permissions: ["masters.view"] },
  ];
  return items.filter((item) => hasAnyPermission(session, item.permissions));
}

export function flattenCommandLinks(workflows: WorkflowDefinition[]) {
  return workflows.flatMap((workflow) =>
    workflow.links.map((link) => ({
      ...link,
      workflowLabel: workflow.label,
    })),
  );
}

export function getPathLabel(pathname: string, companyId: string, workflows: WorkflowDefinition[]) {
  const localPath = pathname.split(`/c/${companyId}/`)[1] ?? "dashboard";
  for (const workflow of workflows) {
    const match = workflow.links.find(
      (link) => localPath === link.href || localPath.startsWith(`${link.href}/`),
    );
    if (match) {
      return {
        label: match.label,
        workflowLabel: workflow.label,
      };
    }
  }
  const lastPart = localPath.split("/").filter(Boolean).pop() ?? "Workspace";
  return {
    label: lastPart.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    workflowLabel: "Workspace",
  };
}

export { workflowDefinitions };
