"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/lib/auth/session";
import { cn } from "@/lib/utils";
import {
  getActiveWorkflow,
  getVisibleWorkflows,
  toCompanyHref,
} from "@/components/app/company-shell-config";

export function CompanyNav(props: {
  companyId: string;
  onNavigate?: () => void;
  variant?: "sidebar" | "sheet";
}) {
  const pathname = usePathname();
  const { session } = useAuth();
  const workflows = getVisibleWorkflows(session);
  const activeWorkflow = getActiveWorkflow(pathname, props.companyId, workflows);

  if (!workflows.length) return null;

  if (props.variant === "sheet") {
    return (
      <nav className="mt-6 max-h-[calc(100dvh-7rem)] space-y-6 overflow-y-auto pr-1">
        <div className="space-y-2">
          <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
            Workflows
          </div>
          <div className="space-y-1.5">
            {workflows.map((workflow) => {
              const Icon = workflow.icon;
              const active = workflow.key === activeWorkflow?.key;
              return (
                <Link
                  key={workflow.key}
                  href={toCompanyHref(props.companyId, workflow.defaultHref)}
                  onClick={props.onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-3 py-3",
                    active
                      ? "border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)]"
                      : "border-transparent bg-transparent text-[var(--muted-strong)] hover:border-[var(--border)] hover:bg-[var(--surface)]",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-2xl border",
                      active
                        ? "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--accent)]"
                        : "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--muted)]",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{workflow.label}</span>
                    <span className="block text-xs text-[var(--muted)]">{workflow.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {activeWorkflow ? (
          <div className="space-y-2">
            <div className="px-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
              {activeWorkflow.label}
            </div>
            <div className="space-y-1.5">
              {activeWorkflow.links.map((link) => {
                const href = toCompanyHref(props.companyId, link.href);
                const active =
                  pathname === href || pathname?.startsWith(`${href}/`);
                return (
                  <Link
                    key={link.href}
                    href={href}
                    onClick={props.onNavigate}
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-2xl px-3 py-3 text-sm",
                      active
                        ? "bg-[var(--surface)] font-semibold text-[var(--foreground)] shadow-sm"
                        : "text-[var(--muted-strong)] hover:bg-[var(--surface)]",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block">{link.label}</span>
                      <span className="mt-0.5 block text-xs font-normal text-[var(--muted)]">
                        {link.hint}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </nav>
    );
  }

  return (
    <nav className="flex h-full min-h-0 flex-col items-center gap-3 overflow-hidden px-3 py-5">
      <div className="mb-3 flex w-full flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-[22px] border border-[var(--shell-sidebar-border)] bg-[linear-gradient(180deg,var(--shell-rail-card-strong),var(--shell-sidebar-hover))] text-sm font-semibold tracking-[-0.03em] text-[var(--shell-sidebar-fg)] shadow-[0_14px_36px_rgba(5,10,18,0.18)]">
          GB
        </div>
        <div className="rounded-full border border-[var(--shell-sidebar-border)] bg-[var(--shell-rail-card)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--shell-sidebar-fg-muted)]">
          Ops
        </div>
      </div>
      <div className="min-h-0 w-full flex-1 space-y-2 overflow-y-auto pr-1">
        {workflows.map((workflow) => {
          const Icon = workflow.icon;
          const active = workflow.key === activeWorkflow?.key;
          return (
            <Link
              key={workflow.key}
              href={toCompanyHref(props.companyId, workflow.defaultHref)}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-[22px] border px-2 py-3 text-center text-[11px] font-medium tracking-[0.01em] transition-all",
                active
                  ? "border-[var(--shell-sidebar-border)] bg-[linear-gradient(180deg,var(--shell-sidebar-active),var(--shell-sidebar-active-strong))] text-[var(--shell-sidebar-fg)] shadow-[inset_0_1px_0_var(--shell-sidebar-border),0_12px_28px_rgba(5,10,18,0.16)]"
                  : "border-[color:color-mix(in_srgb,var(--shell-sidebar-border)_72%,transparent)] text-[var(--shell-sidebar-fg-muted)] hover:border-[var(--shell-sidebar-border)] hover:bg-[var(--shell-sidebar-hover)] hover:text-[var(--shell-sidebar-fg)]",
              )}
              title={workflow.label}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-[18px] border transition-colors",
                  active
                    ? "border-[var(--shell-sidebar-border)] bg-[var(--shell-rail-card)] text-[var(--shell-sidebar-fg)]"
                    : "border-[color:color-mix(in_srgb,var(--shell-sidebar-border)_72%,transparent)] bg-[color:color-mix(in_srgb,var(--shell-rail-card)_84%,transparent)] text-[var(--shell-sidebar-fg-muted)] group-hover:bg-[var(--shell-sidebar-hover)] group-hover:text-[var(--shell-sidebar-fg)]",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="leading-[1.05rem]">{workflow.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
