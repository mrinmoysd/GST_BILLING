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
      <nav className="mt-6 space-y-6">
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
    <nav className="flex h-full flex-col items-center gap-3 px-3 py-5">
      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-[20px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.06)] text-sm font-semibold tracking-[-0.03em] text-white/95">
        GB
      </div>
      <div className="w-full space-y-2">
        {workflows.map((workflow) => {
          const Icon = workflow.icon;
          const active = workflow.key === activeWorkflow?.key;
          return (
            <Link
              key={workflow.key}
              href={toCompanyHref(props.companyId, workflow.defaultHref)}
              className={cn(
                "group flex flex-col items-center gap-2 rounded-[22px] px-2 py-3 text-center text-[11px] font-medium tracking-[0.01em]",
                active
                  ? "bg-[rgba(255,255,255,0.12)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-white/62 hover:bg-[rgba(255,255,255,0.08)] hover:text-white/90",
              )}
              title={workflow.label}
            >
              <span
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-[18px] border transition-colors",
                  active
                    ? "border-white/12 bg-white/10 text-white"
                    : "border-transparent bg-white/[0.03] text-white/70 group-hover:bg-white/[0.08]",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="leading-[1.05rem]">{workflow.shortLabel}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-auto w-full rounded-[22px] border border-white/10 bg-white/[0.04] p-3 text-[11px] leading-5 text-white/60">
        Workflow-led shell for distribution operations.
      </div>
    </nav>
  );
}
