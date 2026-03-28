"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronsUpDown,
  Clock3,
  Command,
  LogOut,
  Menu,
  Plus,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ThemeMenuItems } from "@/components/ui/theme-menu-items";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/session";
import { useLogout } from "@/lib/auth/hooks";
import { logError } from "@/lib/errors";
import { toastError, toastInfo } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  flattenCommandLinks,
  getActiveWorkflow,
  getPathLabel,
  getQuickCreateItems,
  getVisibleWorkflows,
  toCompanyHref,
} from "@/components/app/company-shell-config";

const RECENTS_KEY_PREFIX = "gst_billing.recents";

type RecentItem = {
  href: string;
  label: string;
  workflowLabel: string;
};

export function CompanyHeader(props: {
  companyId: string;
  onOpenNav?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { session } = useAuth();
  const logout = useLogout();
  const [mounted, setMounted] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchText, setSearchText] = React.useState("");
  const [recentItems, setRecentItems] = React.useState<RecentItem[]>([]);

  const workflows = React.useMemo(() => getVisibleWorkflows(session), [session]);
  const activeWorkflow = React.useMemo(
    () => getActiveWorkflow(pathname, props.companyId, workflows),
    [pathname, props.companyId, workflows],
  );
  const quickCreateItems = React.useMemo(() => getQuickCreateItems(session), [session]);
  const commandLinks = React.useMemo(() => flattenCommandLinks(workflows), [workflows]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  React.useEffect(() => {
    if (!pathname) return;
    const storageKey = `${RECENTS_KEY_PREFIX}.${props.companyId}`;
    const label = getPathLabel(pathname, props.companyId, workflows);
    const nextItem: RecentItem = {
      href: pathname,
      label: label.label,
      workflowLabel: label.workflowLabel,
    };
    try {
      const current = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as RecentItem[];
      const next = [nextItem, ...current.filter((item) => item.href !== pathname)].slice(0, 8);
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setRecentItems(next);
    } catch (error) {
      logError(error, "company-header-store-recents", {
        companyId: props.companyId,
        pathname,
      });
      setRecentItems([nextItem]);
    }
  }, [pathname, props.companyId, workflows]);

  React.useEffect(() => {
    const storageKey = `${RECENTS_KEY_PREFIX}.${props.companyId}`;
    try {
      const current = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as RecentItem[];
      setRecentItems(current);
    } catch (error) {
      logError(error, "company-header-load-recents", {
        companyId: props.companyId,
      });
      setRecentItems([]);
    }
  }, [props.companyId]);

  const filteredCommands = commandLinks.filter((item) => {
    const query = searchText.trim().toLowerCase();
    if (!query) return true;
    return (
      item.label.toLowerCase().includes(query) ||
      item.hint.toLowerCase().includes(query) ||
      item.workflowLabel.toLowerCase().includes(query)
    );
  });

  const label = session.company?.name ?? props.companyId;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--shell-header-bg)] backdrop-blur supports-[backdrop-filter]:bg-[var(--shell-header-bg)]">
        <div className="border-b border-[var(--border)]/80 [background-image:var(--shell-header-highlight)] px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
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
                <Badge variant="outline" className="hidden bg-[var(--shell-subnav-chip)] md:inline-flex">
                  {activeWorkflow?.label ?? "Workspace"}
                </Badge>
                <Badge variant="secondary" className="hidden lg:inline-flex">
                  {session.user?.assigned_roles?.[0] ?? session.user?.role ?? "operator"}
                </Badge>
                <div className="text-sm font-semibold tracking-[-0.02em] text-[var(--foreground)]">
                  {label}
                </div>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-[var(--muted)]">
                <span className="hidden h-1.5 w-1.5 rounded-full bg-[var(--success)] md:inline-block" />
                {activeWorkflow?.description ?? "Workflow-centered workspace"}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="ml-auto hidden min-w-[280px] items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-left text-sm text-[var(--muted)] shadow-sm md:flex"
            >
              <Search className="h-4 w-4" />
              <span>Search workflows, pages, and tools</span>
              <span className="ml-auto rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
                ⌘K
              </span>
            </button>

            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="gap-2 border-[var(--border)] bg-[var(--surface-elevated)]">
                    <Plus className="h-4 w-4" />
                    <span className="hidden md:inline">Quick create</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Create</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {quickCreateItems.map((item) => (
                    <DropdownMenuItem
                      key={item.href}
                      onSelect={() => router.push(toCompanyHref(props.companyId, item.href))}
                      className="flex flex-col items-start"
                    >
                      <span>{item.label}</span>
                      <span className="text-xs text-[var(--muted)]">{item.hint}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" className="gap-2 border-[var(--border)] bg-[var(--surface-elevated)]">
                    <Clock3 className="h-4 w-4" />
                    <span className="hidden md:inline">Recent</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>Recent items</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {recentItems.length ? (
                    recentItems.map((item) => (
                      <DropdownMenuItem
                        key={item.href}
                        onSelect={() => router.push(item.href)}
                        className="flex flex-col items-start"
                      >
                        <span>{item.label}</span>
                        <span className="text-xs text-[var(--muted)]">{item.workflowLabel}</span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>No recent pages yet</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {mounted ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="gap-2 border-[var(--border)] bg-[var(--surface-elevated)]">
                      <span className="hidden h-2 w-2 rounded-full bg-[var(--success)] md:inline-block" />
                      <span className="hidden max-w-[18ch] truncate md:inline">{label}</span>
                      <ChevronsUpDown className="h-4 w-4 text-[var(--muted)]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <div className="px-2 py-1.5">
                      <div className="text-xs text-[var(--muted)]">Signed in as</div>
                      <div className="text-sm font-medium truncate">{session.user?.email ?? "—"}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      Roles: {session.user?.assigned_roles?.join(", ") ?? session.user?.role ?? "—"}
                    </div>
                  </div>
                  <ThemeMenuItems />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => router.push("/dashboard")}>
                    Switch workspace
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onSelect={async (event) => {
                        event.preventDefault();
                        try {
                          await logout.mutateAsync();
                          toastInfo("Signed out.");
                        } catch (error) {
                          toastError(error, {
                            fallback: "We signed you out locally, but could not confirm it with the server.",
                            context: "tenant-logout",
                            metadata: { companyId: props.companyId },
                          });
                        }
                        router.replace("/login");
                      }}
                      className={cn(logout.isPending && "pointer-events-none opacity-60")}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      {logout.isPending ? "Signing out…" : "Logout"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="secondary" className="gap-2 border-[var(--border)] bg-[var(--surface-elevated)]" disabled>
                  <ChevronsUpDown className="h-4 w-4 text-[var(--muted)]" />
                </Button>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="mt-3 flex w-full items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-left text-sm text-[var(--muted)] shadow-sm md:hidden"
          >
            <Search className="h-4 w-4" />
            <span>Search workflows and pages</span>
            <Command className="ml-auto h-4 w-4" />
          </button>
        </div>

        {activeWorkflow?.links?.length ? (
          <div className="border-t border-[var(--border)]/80 px-4 py-3 md:px-6">
            <div className="flex items-center gap-3 overflow-x-auto">
              <div className="hidden shrink-0 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--shell-subnav-chip)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-strong)] lg:flex">
                Active lane
              </div>
              <div className="flex items-center gap-2 rounded-[22px] border border-[var(--border)] bg-[var(--shell-subnav-bg)] p-1.5 shadow-[var(--shadow-soft)]">
                {activeWorkflow.links.map((link) => {
                  const href = toCompanyHref(props.companyId, link.href);
                  const active =
                    pathname === href || pathname?.startsWith(`${href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={href}
                      title={link.hint}
                      className={cn(
                        "group rounded-full border px-3 py-2 text-sm whitespace-nowrap transition-colors",
                        active
                          ? "border-[var(--row-selected-border)] bg-[var(--surface-elevated)] font-semibold text-[var(--foreground)] shadow-sm"
                          : "border-transparent text-[var(--muted-strong)] hover:border-[var(--border)] hover:bg-[var(--surface)]",
                      )}
                    >
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl border-[var(--border)] bg-[var(--surface)] p-0">
          <DialogHeader className="border-b border-[var(--border)] px-5 py-4">
            <DialogTitle>Search workspace</DialogTitle>
            <DialogDescription>Jump across workflows, queues, and setup areas.</DialogDescription>
          </DialogHeader>
          <div className="px-5 py-4">
            <Input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search invoices, collections, products, settings..."
              autoFocus
            />
          </div>
          <div className="max-h-[420px] overflow-y-auto px-3 pb-3">
            {filteredCommands.length ? (
              filteredCommands.map((item) => (
                <button
                  key={`${item.workflowLabel}-${item.href}`}
                  type="button"
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchText("");
                    router.push(toCompanyHref(props.companyId, item.href));
                  }}
                  className="flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left hover:bg-[var(--surface-muted)]"
                >
                  <span className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                    {item.workflowLabel}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--foreground)]">
                      {item.label}
                    </span>
                    <span className="block text-sm text-[var(--muted)]">{item.hint}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-6 text-sm text-[var(--muted)]">
                No matching workspace page found.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
