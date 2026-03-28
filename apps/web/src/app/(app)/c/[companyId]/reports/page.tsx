import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageActionGroup, PageContextStrip, PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };

export default function ReportsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const reportGroups = [
    {
      title: "Revenue reports",
      description: "Sales, purchases, outstanding receivables, and top-product views for daily operations.",
      items: [
        { href: `/c/${companyId}/reports/sales-summary`, title: "Sales summary", hint: "Revenue and invoice counts for a date range." },
        { href: `/c/${companyId}/reports/purchases-summary`, title: "Purchases summary", hint: "Spend and purchase counts for a date range." },
        { href: `/c/${companyId}/reports/outstanding`, title: "Outstanding invoices", hint: "Receivables and overdue exposure." },
        { href: `/c/${companyId}/reports/top-products`, title: "Top products", hint: "Best performers by amount or quantity." },
        { href: `/c/${companyId}/reports/credit-control`, title: "Credit and banking risk", hint: "Aging, task load, pending instruments, and reconciliation pressure." },
      ],
    },
    {
      title: "Profit and compliance",
      description: "High-level margin monitoring and GST filing workspaces with summary, tables, and export tracking.",
      items: [
        { href: `/c/${companyId}/reports/profit-snapshot`, title: "Profit snapshot", hint: "Quick margin view for a selected period." },
        { href: `/c/${companyId}/reports/gst/gstr1`, title: "GST compliance center", hint: "GSTR-1, GSTR-3B, HSN, ITC, and export job tracking." },
        { href: `/c/${companyId}/reports/gst/compliance`, title: "Invoice compliance exceptions", hint: "Blocked, failed, or pending e-invoice and e-way bill follow-up." },
      ],
    },
    {
      title: "Distributor control",
      description: "Track distributor performance across team ownership, customer dues, warehouse stock, and product movement.",
      items: [
        { href: `/c/${companyId}/reports/distributor/sales-team`, title: "Sales team performance", hint: "Sales, collections, and outstanding grouped by salesperson." },
        { href: `/c/${companyId}/reports/distributor/analytics`, title: "Distributor analytics", hint: "Owner view for dues, warehouse stock, and fast / slow movement." },
        { href: `/c/${companyId}/reports/distributor/dispatch`, title: "Dispatch operations", hint: "Pending dispatch, partial orders, in-transit challans, and delivered-not-invoiced pressure." },
        { href: `/c/${companyId}/reports/distributor/commercial`, title: "Commercial control", hint: "Scheme usage, pricing overrides, discount leakage, and rule coverage." },
        { href: `/c/${companyId}/reports/distributor/routes`, title: "Route coverage", hint: "Route discipline, productive visits, and route-linked dues." },
        { href: `/c/${companyId}/reports/distributor/dcr`, title: "DCR and visit discipline", hint: "Daily closeout register, missed visits, and rep productivity." },
      ],
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Navigate the business and compliance reports from a clearer, finance-oriented hub."
        badges={[
          <Badge key="routes" variant="secondary">11 live report routes</Badge>,
          <Badge key="scope" variant="outline">Business + GST + distributor</Badge>,
        ]}
        actions={
          <PageActionGroup
            primary={
              <Link className="inline-flex items-center text-sm font-medium text-[var(--secondary)] transition hover:text-[var(--secondary-hover)]" href={`/c/${companyId}/accounting`}>
                Open accounting hub
              </Link>
            }
          />
        }
        context={
          <PageContextStrip>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Business control</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">Revenue, purchases, dues, product performance, and credit pressure.</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Compliance</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">GST filing views and invoice compliance follow-up stay together.</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Distributor ops</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">Commercial control, routes, dispatch discipline, and sales team visibility.</div>
              </div>
            </div>
          </PageContextStrip>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {reportGroups.map((group) => (
          <Card key={group.title}>
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
              <CardDescription>{group.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)] transition hover:-translate-y-0.5 hover:border-[var(--border-strong)]"
                  href={item.href}
                >
                  <div className="font-semibold text-[var(--foreground)]">{item.title}</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">{item.hint}</div>
                </Link>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
