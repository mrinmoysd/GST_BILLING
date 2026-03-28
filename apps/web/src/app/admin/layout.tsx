"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { AdminHeader } from "@/components/admin/admin-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin/session";
import { LoadingBlock } from "@/lib/ui/state";

function AdminRouteGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session, bootstrapped } = useAdminAuth();
  const [navOpen, setNavOpen] = React.useState(false);
  const isLoginRoute = pathname === "/admin/login";
  const requestedNext = searchParams.get("next");
  const safeNext = requestedNext && requestedNext.startsWith("/admin/") ? requestedNext : "/admin/dashboard";

  React.useEffect(() => {
    if (!bootstrapped) return;

    if (!session.user && !isLoginRoute) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (session.user && isLoginRoute) {
      router.replace(safeNext);
    }
  }, [bootstrapped, isLoginRoute, pathname, router, safeNext, session.user]);

  if (!bootstrapped) {
    return (
      <main className="min-h-screen px-4 py-10 md:px-6">
        <div className="mx-auto max-w-3xl">
          <LoadingBlock label="Loading admin workspace..." />
        </div>
      </main>
    );
  }

  if (isLoginRoute) return <>{children}</>;
  if (!session.user) return null;

  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="border-[var(--border)] bg-[var(--surface-elevated)] md:hidden">
          <div className="font-semibold text-lg tracking-[-0.02em]">GST Billing Admin</div>
          <div className="mt-1 text-xs text-[var(--muted)] break-all">Operator: {session.user.email}</div>
          <AdminNav variant="sheet" onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="md:grid md:grid-cols-[352px_1fr]">
        <aside className="hidden border-r border-[var(--border)] bg-[var(--surface-panel-glass)] backdrop-blur md:block">
          <div className="sticky top-0 p-5">
            <div className="rounded-[30px] border border-[var(--border)] [background-image:var(--surface-header-admin)] p-4 shadow-[var(--shadow-soft)]">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Internal Admin</div>
              <div className="mt-1 text-xl font-semibold tracking-[-0.03em]">Platform operations</div>
              <div className="mt-1 text-xs text-[var(--muted)] break-all">{session.user.email}</div>
            </div>
            <div className="mt-6">
              <AdminNav variant="sidebar" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.02))]">
          <AdminHeader onOpenNav={() => setNavOpen(true)} />
          <main className="px-4 py-5 md:px-8 md:py-8">
            <div className="mx-auto w-full max-w-[1320px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <React.Suspense
        fallback={
          <main className="min-h-screen px-4 py-10 md:px-6">
            <div className="mx-auto max-w-3xl">
              <LoadingBlock label="Loading admin workspace..." />
            </div>
          </main>
        }
      >
        <AdminRouteGate>{children}</AdminRouteGate>
      </React.Suspense>
    </AdminAuthProvider>
  );
}
