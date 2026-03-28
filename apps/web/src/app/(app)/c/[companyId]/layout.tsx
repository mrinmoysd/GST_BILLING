"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/session";
import { CompanyHeader } from "@/components/app/company-header";
import { CompanyNav } from "@/components/app/company-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LoadingBlock } from "@/lib/ui/state";

type Props = {
  // Next (this repo version) types dynamic `params` as a Promise.
  params: Promise<{ companyId: string }>;
  children: ReactNode;
};

export default function CompanyLayout({ params, children }: Props) {
  const { companyId } = React.use(params);
  const pathname = usePathname();
  const router = useRouter();
  const { session, bootstrapped } = useAuth();
  const [navOpen, setNavOpen] = React.useState(false);

  React.useEffect(() => {
    if (!bootstrapped) return;

    if (!session.user) {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? `/c/${companyId}/dashboard`)}`);
      return;
    }

    // If we have a session and the route companyId doesn't match, prefer the session company.
    // This prevents confusing cross-company navigation in dev.
    if (session.company?.id && session.company.id !== companyId) {
      router.replace(`/c/${session.company.id}/dashboard`);
    }
  }, [bootstrapped, companyId, pathname, router, session.company?.id, session.user]);

  if (!bootstrapped) {
    return (
      <main className="min-h-screen px-4 py-10 md:px-6">
        <div className="mx-auto max-w-3xl">
          <LoadingBlock label="Loading workspace..." />
        </div>
      </main>
    );
  }

  if (!session.user) return null;

  return (
    <div className="min-h-dvh bg-[var(--background)] text-[var(--foreground)]">
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="border-[var(--shell-sidebar-border)] [background:var(--shell-sidebar-bg)] text-[var(--shell-sidebar-fg)] md:hidden">
          <div className="font-semibold text-lg tracking-[-0.02em]">GST Billing</div>
          <div className="mt-1 break-all text-xs text-[var(--shell-sidebar-fg-muted)]">
            Company: {session.company?.name ?? companyId}
          </div>
          <CompanyNav companyId={companyId} variant="sheet" onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="md:grid md:grid-cols-[116px_1fr]">
        <aside className="hidden border-r border-[var(--shell-sidebar-border)] [background:var(--shell-sidebar-bg)] md:block">
          <div className="sticky top-0 h-screen overflow-hidden">
            <CompanyNav companyId={companyId} variant="sidebar" />
          </div>
        </aside>

        <div className="min-w-0 [background-image:linear-gradient(180deg,transparent,rgba(255,255,255,0.02))]">
          <CompanyHeader companyId={companyId} onOpenNav={() => setNavOpen(true)} />
          <main className="px-4 py-5 md:px-7 md:py-7">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
