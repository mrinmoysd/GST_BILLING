"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  BarChart3,
  Building2,
  CreditCard,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  ShieldCheck,
  ServerCog,
  Users2,
} from "lucide-react";

import { useAdminAuth } from "@/lib/admin/session";
import { cn } from "@/lib/utils";

type AdminNavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  section: "Control" | "Operations" | "Governance";
  hint: string;
  permission?: string;
};

const navItems: AdminNavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    section: "Control",
    hint: "Overview and priorities",
    permission: "admin.dashboard.read",
  },
  {
    href: "/admin/companies",
    label: "Companies",
    icon: Building2,
    section: "Control",
    hint: "Tenant lifecycle",
    permission: "admin.companies.manage",
  },
  {
    href: "/admin/subscriptions",
    label: "Subscriptions",
    icon: CreditCard,
    section: "Control",
    hint: "Billing oversight",
    permission: "admin.subscriptions.manage",
  },
  {
    href: "/admin/usage",
    label: "Usage",
    icon: BarChart3,
    section: "Operations",
    hint: "Adoption and meters",
    permission: "admin.usage.read",
  },
  {
    href: "/admin/support-tickets",
    label: "Support",
    icon: LifeBuoy,
    section: "Operations",
    hint: "Ticket triage",
    permission: "admin.support.manage",
  },
  {
    href: "/admin/queues",
    label: "Queues",
    icon: ServerCog,
    section: "Operations",
    hint: "Jobs and failures",
    permission: "admin.observability.read",
  },
  {
    href: "/admin/internal-users",
    label: "Internal Users",
    icon: Users2,
    section: "Governance",
    hint: "Admin identities and access",
    permission: "admin.internal_users.manage",
  },
  {
    href: "/admin/audit-logs",
    label: "Audit Logs",
    icon: ClipboardList,
    section: "Governance",
    hint: "Privileged action history",
    permission: "admin.audit.read",
  },
];

export function AdminNav(props: {
  onNavigate?: () => void;
  variant?: "sidebar" | "sheet";
}) {
  const pathname = usePathname();
  const { session } = useAdminAuth();
  const sections = ["Control", "Operations", "Governance"] as const;
  const permissions = new Set(session.user?.permissions ?? []);

  return (
    <nav className={cn("space-y-6", props.variant === "sheet" && "mt-5")}>
      {sections.map((section) => {
        const items = navItems.filter(
          (item) => item.section === section && (!item.permission || permissions.has(item.permission)),
        );
        if (items.length === 0) return null;
        return (
          <div key={section}>
            <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {section}
            </div>
            <div className="space-y-1.5">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={props.onNavigate}
                    className={cn(
                      "group flex items-start gap-3 rounded-2xl border px-3 py-3 text-sm text-[var(--muted-strong)] transition",
                      active
                        ? "border-[var(--row-selected-border)] bg-[var(--surface-secondary)] font-semibold text-[var(--foreground)] shadow-sm"
                        : "border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-muted)]",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent bg-transparent transition-colors",
                        active
                          ? "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--secondary)]"
                          : "text-[var(--muted)] group-hover:bg-[var(--surface)] group-hover:text-[var(--foreground)]",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block">{item.label}</span>
                      <span className="mt-0.5 block text-xs font-normal text-[var(--muted)]">{item.hint}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="rounded-[24px] border border-[var(--border)] [background-image:var(--surface-header-admin)] p-4 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--foreground)]">
          <ShieldCheck className="h-4 w-4 text-[var(--secondary)]" />
          Admin workspace
        </div>
        <div className="mt-2 text-xs leading-5 text-[var(--muted)]">
          Internal operations area for running the SaaS platform, not tenant-facing workflows.
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted)]">
          <Gauge className="h-3.5 w-3.5" />
          Governance and audit now live alongside ops workflows.
        </div>
      </div>
    </nav>
  );
}
