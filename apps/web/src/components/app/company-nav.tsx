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
  Receipt,
  Settings,
  ShoppingCart,
  Tags,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const nav: NavItem[] = [
  { href: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "masters/customers", label: "Customers", icon: Users },
  { href: "masters/suppliers", label: "Suppliers", icon: ShoppingCart },
  { href: "masters/categories", label: "Categories", icon: Tags },
  { href: "masters/products", label: "Products", icon: Package },
  { href: "sales/invoices", label: "Invoices", icon: Receipt },
  { href: "purchases", label: "Purchases", icon: FileText },
  { href: "inventory", label: "Inventory", icon: Boxes },
  { href: "accounting", label: "Accounting", icon: BookOpen },
  { href: "reports", label: "Reports", icon: BarChart3 },
  { href: "settings", label: "Settings", icon: Settings },
];

export function CompanyNav(props: {
  companyId: string;
  onNavigate?: () => void;
  variant?: "sidebar" | "sheet";
}) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-1", props.variant === "sheet" && "mt-3")}>
      {nav.map((i) => {
        const fullHref = `/c/${props.companyId}/${i.href}`;
        const active = pathname === fullHref || pathname.startsWith(fullHref + "/");
        const Icon = i.icon;
        return (
          <Link
            key={i.href}
            href={fullHref}
            onClick={props.onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-neutral-100",
              active && "bg-neutral-100 font-medium",
            )}
          >
            <Icon className="h-4 w-4 text-neutral-600" />
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
