"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Boxes,
  FileText,
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
};

const nav: NavItem[] = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.view" },
  { href: "masters/customers", label: "Customers", icon: Users, permission: "masters.view" },
  { href: "masters/suppliers", label: "Suppliers", icon: ShoppingCart, permission: "masters.view" },
  { href: "masters/categories", label: "Categories", icon: Tags, permission: "masters.view" },
  { href: "masters/products", label: "Products", icon: Package, permission: "masters.view" },
  { href: "sales/invoices", label: "Invoices", icon: Receipt, permission: "sales.view" },
  { href: "pos", label: "POS", icon: ScanBarcode, permission: "sales.view" },
  { href: "purchases", label: "Purchases", icon: FileText, permission: "purchases.view" },
  { href: "payments", label: "Payments", icon: Wallet, permission: "payments.view" },
  { href: "inventory", label: "Inventory", icon: Boxes, permission: "inventory.view" },
  { href: "accounting", label: "Accounting", icon: BookOpen, permission: "accounting.view" },
  { href: "reports", label: "Reports", icon: BarChart3, permission: "reports.view" },
  { href: "settings", label: "Settings", icon: Settings, permission: "settings.view" },
];

export function CompanyNav(props: {
  companyId: string;
  onNavigate?: () => void;
  variant?: "sidebar" | "sheet";
}) {
  const pathname = usePathname();
  const { session } = useAuth();
  const visibleNav = nav.filter((item) => hasPermission(session, item.permission));

  return (
    <nav className={cn("space-y-1.5", props.variant === "sheet" && "mt-4")}>
      {visibleNav.map((i) => {
        const fullHref = `/c/${props.companyId}/${i.href}`;
        const active = pathname === fullHref || pathname.startsWith(fullHref + "/");
        const Icon = i.icon;
        return (
          <Link
            key={i.href}
            href={fullHref}
            onClick={props.onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[var(--muted-strong)] hover:bg-[var(--surface-muted)]",
              active && "bg-[var(--surface-muted)] font-semibold text-[var(--foreground)] shadow-sm",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg border border-transparent bg-transparent transition-colors",
                active
                  ? "border-[var(--border)] bg-[var(--surface)] text-[var(--accent)]"
                  : "text-[var(--muted)] group-hover:bg-[var(--surface)] group-hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
