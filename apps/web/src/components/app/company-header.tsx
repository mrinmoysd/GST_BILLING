"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, ChevronsUpDown, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumb";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/session";
import { useLogout } from "@/lib/auth/hooks";

export function CompanyHeader(props: {
  companyId: string;
  onOpenNav?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const logout = useLogout();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const label = session.company?.name ?? props.companyId;

  const breadcrumbItems = React.useMemo(() => {
    const suffix = pathname?.split(`/c/${props.companyId}`)[1] ?? "";
    const parts = suffix.split("/").filter(Boolean);
    const items: Array<{ href?: string; label: string }> = [
      { href: `/c/${props.companyId}/dashboard`, label: "Workspace" },
    ];
    let acc = `/c/${props.companyId}`;
    for (const part of parts) {
      acc += `/${part}`;
      const labelPart =
        /^[0-9a-f-]{8,}$/i.test(part)
          ? `${part.slice(0, 8)}...`
          : part
              .replace(/-/g, " ")
              .replace(/\b\w/g, (m) => m.toUpperCase());
      items.push({ href: acc, label: labelPart });
    }
    if (items.length > 0) {
      items[items.length - 1] = { label: items[items.length - 1].label };
    }
    return items;
  }, [pathname, props.companyId]);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[rgba(255,253,248,0.88)] backdrop-blur supports-[backdrop-filter]:bg-[rgba(255,253,248,0.72)]">
      <div className="flex min-h-16 items-center gap-3 px-4 md:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={props.onOpenNav}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden md:inline-flex">Tenant</Badge>
            <Link href={`/c/${props.companyId}/dashboard`} className="font-semibold tracking-[-0.02em] text-[var(--foreground)]">
              GST Billing
            </Link>
          </div>
          <div className="mt-1 hidden md:block">
            <Breadcrumbs items={breadcrumbItems} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link href="/dashboard" className="hidden items-center gap-1 text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] md:inline-flex">
            Switch
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <Badge variant="secondary" className="hidden md:inline-flex">
            {session.user?.role ?? "User"}
          </Badge>

          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" className="gap-2 border-[var(--border)] bg-[var(--surface)]">
                  <span className="max-w-[18ch] truncate">{label}</span>
                  <ChevronsUpDown className="h-4 w-4 text-[var(--muted)]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-1.5">
                  <div className="text-xs text-[var(--muted)]">Signed in as</div>
                  <div className="text-sm font-medium truncate">{session.user?.email ?? "—"}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    Roles: {session.user?.assigned_roles?.join(", ") ?? session.user?.role ?? "—"}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={async (e) => {
                    e.preventDefault();
                    await logout.mutateAsync();
                    router.replace("/login");
                  }}
                  className={cn(logout.isPending && "opacity-60 pointer-events-none")}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {logout.isPending ? "Signing out…" : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="secondary" className="gap-2 border-[var(--border)] bg-[var(--surface)]" disabled>
              <span className="max-w-[18ch] truncate">{label}</span>
              <ChevronsUpDown className="h-4 w-4 text-[var(--muted)]" />
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
    </header>
  );
}
