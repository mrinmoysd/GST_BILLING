"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Boxes,
  FileText,
  FileSignature,
  Files,
  LayoutDashboard,
  Package,
  ScanBarcode,
  Wallet,
  Receipt,
  Settings,
  ShoppingCart,
  Tags,
  Users,
} from "lucide-react";

import { useAuth } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission: string;
  section: "Operate" | "Finance" | "Govern";
  hint: string;
};

const nav: NavItem[] = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view", section: "Operate", hint: "Overview and activity" },
  { href: "masters/customers", label: "Customers", icon: Users, permission: "masters.view", section: "Operate", hint: "Customer records" },
  { href: "masters/suppliers", label: "Suppliers", icon: ShoppingCart, permission: "masters.view", section: "Operate", hint: "Vendor records" },
  { href: "masters/categories", label: "Categories", icon: Tags, permission: "masters.view", section: "Operate", hint: "Catalog grouping" },
  { href: "masters/products", label: "Products", icon: Package, permission: "masters.view", section: "Operate", hint: "Stocked items" },
  { href: "sales/quotations", label: "Quotations", icon: FileSignature, permission: "sales.view", section: "Operate", hint: "Quote and convert" },
  { href: "sales/orders", label: "Sales orders", icon: Files, permission: "sales.view", section: "Operate", hint: "Capture and fulfill" },
  { href: "sales/dispatch", label: "Dispatch queue", icon: Files, permission: "sales.view", section: "Operate", hint: "Plan pending dispatch work" },
  { href: "sales/challans", label: "Delivery challans", icon: Files, permission: "sales.view", section: "Operate", hint: "Dispatch and delivery register" },
  { href: "sales/invoices", label: "Invoices", icon: Receipt, permission: "sales.view", section: "Operate", hint: "Sales documents" },
  { href: "pos", label: "POS", icon: ScanBarcode, permission: "sales.view", section: "Operate", hint: "Counter billing" },
  { href: "purchases", label: "Purchases", icon: FileText, permission: "purchases.view", section: "Operate", hint: "Purchase flow" },
  { href: "payments", label: "Payments", icon: Wallet, permission: "payments.view", section: "Finance", hint: "Receipts and payouts" },
  { href: "payments/collections", label: "Collections", icon: Wallet, permission: "payments.view", section: "Finance", hint: "Due follow-up work" },
  { href: "payments/banking", label: "Banking", icon: Wallet, permission: "payments.view", section: "Finance", hint: "Bank masters and reconciliation" },
  { href: "inventory", label: "Inventory", icon: Boxes, permission: "inventory.view", section: "Finance", hint: "Movement and stock" },
  { href: "accounting", label: "Accounting", icon: BookOpen, permission: "accounting.view", section: "Finance", hint: "Books and reports" },
  { href: "reports", label: "Reports", icon: BarChart3, permission: "reports.view", section: "Finance", hint: "Business and GST" },
  { href: "settings", label: "Settings", icon: Settings, permission: "settings.view", section: "Govern", hint: "Access and preferences" },
];

export function CompanyNav(props: {
  companyId: string;
  onNavigate?: () => void;
  variant?: "sidebar" | "sheet";
}) {
  const pathname = usePathname();
  const { session } = useAuth();
  const visibleNav = nav.filter((item) => hasPermission(session, item.permission));
  const sections = ["Operate", "Finance", "Govern"] as const;

  return (
    <nav className={cn("space-y-6", props.variant === "sheet" && "mt-5")}>
      {sections.map((section) => {
        const items = visibleNav.filter((item) => item.section === section);
        if (items.length === 0) return null;
        return (
          <div key={section}>
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">{section}</div>
            <div className="space-y-1.5">
              {items.map((i) => {
                const fullHref = `/c/${props.companyId}/${i.href}`;
                const active = pathname === fullHref || pathname.startsWith(fullHref + "/");
                const Icon = i.icon;
                return (
                  <Link
                    key={i.href}
                    href={fullHref}
                    onClick={props.onNavigate}
                    className={cn(
                      "group flex items-start gap-3 rounded-2xl px-3 py-3 text-sm text-[var(--muted-strong)] hover:bg-[var(--surface-muted)]",
                      active && "bg-[var(--surface-muted)] font-semibold text-[var(--foreground)] shadow-sm",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent bg-transparent transition-colors",
                        active
                          ? "border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]"
                          : "text-[var(--muted)] group-hover:bg-[var(--surface)] group-hover:text-[var(--foreground)]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block">{i.label}</span>
                      <span className="mt-0.5 block text-xs font-normal text-[var(--muted)]">{i.hint}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
        <div className="text-sm font-semibold text-[var(--foreground)]">Tenant workspace</div>
        <div className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Operational surface for billing, stock, GST, books, and company configuration.
        </div>
      </div>
    </nav>
  );
}
