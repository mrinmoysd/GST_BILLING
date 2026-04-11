"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { PrimaryButton, SecondaryButton } from "@/lib/ui/form";
import { WorkspaceHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

export default function PosLandingPage({ params }: Props) {
  const { companyId } = React.use(params);

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Sales"
        title="Point of sale"
        subtitle="Run retail billing with a scan-first cart, instant payment capture, and a receipt surface optimized for browser printing."
        badges={[
          <WorkspaceStatBadge key="mode" label="Mode" value="Retail counter" />,
          <WorkspaceStatBadge key="receipt" label="Receipt" value="Browser thermal print" variant="outline" />,
        ]}
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <WorkspacePanel
          title="Retail billing workspace"
          subtitle="Start a cashier-friendly sale flow that uses the existing invoice and payment engine underneath, then print a thermal receipt in the browser."
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Online POS</Badge>
              <Badge variant="outline">Browser print</Badge>
              <Badge variant="outline">GST aware</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Search model</div>
                <div className="mt-2 text-sm text-[var(--foreground)]">SKU and name search with Enter-to-add handling.</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Payment capture</div>
                <div className="mt-2 text-sm text-[var(--foreground)]">Immediate cash, card, bank, or UPI collection during sale completion.</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Receipt output</div>
                <div className="mt-2 text-sm text-[var(--foreground)]">Thermal browser print stylesheet with a compact receipt layout.</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href={`/c/${companyId}/pos/billing`}>
                <PrimaryButton type="button">Start billing</PrimaryButton>
              </Link>
              <Link href={`/c/${companyId}/sales/invoices`}>
                <SecondaryButton type="button">Open invoice register</SecondaryButton>
              </Link>
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="MVP scope lock" subtitle="Phase J keeps the retail mode tight and operational." tone="muted">
          <div className="space-y-3 text-sm text-[var(--muted-strong)]">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              Print is browser-based only. Offline mode and direct ESC/POS agents remain out of scope.
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              POS uses standard invoice issuance with `DEFAULT` numbering, so accounting, GST, and stock behavior stay aligned with the rest of the system.
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
              Cashier shift open/close and reconciliation are not part of this phase.
            </div>
          </div>
        </WorkspacePanel>
      </div>
    </div>
  );
}
