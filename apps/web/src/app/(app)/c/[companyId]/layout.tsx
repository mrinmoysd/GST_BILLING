"use client";

import type { ReactNode } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/session";
import { CompanyHeader } from "@/components/app/company-header";
import { CompanyNav } from "@/components/app/company-nav";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type Props = {
  // Next (this repo version) types dynamic `params` as a Promise.
  params: Promise<{ companyId: string }>;
  children: ReactNode;
};

export default function CompanyLayout({ params, children }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const { session } = useAuth();
  const [navOpen, setNavOpen] = React.useState(false);

  React.useEffect(() => {
    // If we have a session and the route companyId doesn't match, prefer the session company.
    // This prevents confusing cross-company navigation in dev.
    if (session.company?.id && session.company.id !== companyId) {
      router.replace(`/c/${session.company.id}/dashboard`);
    }
  }, [companyId, router, session.company?.id]);

  return (
    <div className="min-h-dvh bg-neutral-50">
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="md:hidden">
          <div className="font-semibold text-lg">GST Billing</div>
          <div className="mt-1 text-xs text-neutral-500 break-all">Company: {session.company?.name ?? companyId}</div>
          <CompanyNav companyId={companyId} variant="sheet" onNavigate={() => setNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="md:grid md:grid-cols-[280px_1fr]">
        <aside className="hidden md:block border-r bg-white">
          <div className="p-4">
            <div className="font-semibold text-lg">GST Billing</div>
            <div className="mt-1 text-xs text-neutral-500 break-all">Company: {session.company?.name ?? companyId}</div>
            <div className="mt-4">
              <CompanyNav companyId={companyId} variant="sidebar" />
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <CompanyHeader companyId={companyId} onOpenNav={() => setNavOpen(true)} />
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
