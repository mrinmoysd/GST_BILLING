"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, LogOut, Menu, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { ThemeMenuItems } from "@/components/ui/theme-menu-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminLogout } from "@/lib/admin/auth-hooks";
import { useAdminAuth } from "@/lib/admin/session";
import { toastError, toastInfo } from "@/lib/toast";
import { cn } from "@/lib/utils";

function makeBreadcrumbs(pathname: string | null) {
  const parts = (pathname ?? "").split("/").filter(Boolean);
  const items: Array<{ href?: string; label: string }> = [{ href: "/admin/dashboard", label: "Admin" }];
  let acc = "";

  for (const part of parts.slice(1)) {
    acc += `/${part}`;
    items.push({
      href: `/admin${acc}`,
      label: part.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
    });
  }

  if (items.length > 0) {
    items[items.length - 1] = { label: items[items.length - 1].label };
  }

  return items;
}

export function AdminHeader(props: { onOpenNav?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAdminLogout();
  const { session } = useAdminAuth();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const breadcrumbItems = React.useMemo(() => makeBreadcrumbs(pathname), [pathname]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--shell-header-bg)] backdrop-blur supports-[backdrop-filter]:bg-[var(--shell-header-bg)]">
      <div className="flex min-h-16 items-center gap-3 [background-image:var(--shell-header-highlight)] px-4 md:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={props.onOpenNav}
          aria-label="Open admin navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link href="/admin/dashboard" className="font-semibold tracking-[-0.02em] text-[var(--foreground)]">
              GST Billing Admin
            </Link>
            <Badge variant="secondary" className="hidden md:inline-flex">
              Internal
            </Badge>
          </div>
          <div className="mt-1 hidden md:block">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/dashboard"
            className="hidden items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] md:inline-flex"
          >
            Tenant app
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="gap-2 border-[var(--border)] bg-[var(--surface-elevated)]">
                  <ShieldCheck className="h-4 w-4 text-[var(--secondary)]" />
                  <span className="max-w-[20ch] truncate">{session.user?.email ?? "Admin"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <div className="px-2 py-1.5">
                  <div className="text-xs text-[var(--muted)]">Internal operator</div>
                  <div className="text-sm font-medium">{session.user?.email ?? "—"}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Roles: {session.user?.assigned_roles?.join(", ") ?? session.user?.role ?? "—"}
                  </div>
                </div>
                <ThemeMenuItems />
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async (e) => {
                    e.preventDefault();
                    try {
                      await logout.mutateAsync();
                      toastInfo("Signed out.");
                    } catch (error) {
                      toastError(error, {
                        fallback: "We signed you out locally, but could not confirm it with the server.",
                        context: "admin-logout",
                      });
                    }
                    router.replace("/admin/login");
                  }}
                  className={cn(logout.isPending && "pointer-events-none opacity-60")}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logout.isPending ? "Signing out..." : "Sign out"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="secondary" className="gap-2 border-[var(--border)] bg-[var(--surface-elevated)]" disabled>
              <ShieldCheck className="h-4 w-4 text-[var(--secondary)]" />
              <span className="max-w-[20ch] truncate">{session.user?.email ?? "Admin"}</span>
            </Button>
          )}
        </div>
      </div>

      <div className="border-t border-[var(--border)]/80 px-4 pb-3 pt-3 md:hidden">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
    </header>
  );
}
