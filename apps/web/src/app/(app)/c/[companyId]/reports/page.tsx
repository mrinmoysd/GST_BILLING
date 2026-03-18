import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/lib/ui/state";

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
      ],
    },
    {
      title: "Profit and compliance",
      description: "High-level margin monitoring and the current GST export workflow.",
      items: [
        { href: `/c/${companyId}/reports/profit-snapshot`, title: "Profit snapshot", hint: "Quick margin view for a selected period." },
        { href: `/c/${companyId}/reports/gst/gstr1`, title: "GSTR1 export", hint: "Create export jobs and track download readiness." },
      ],
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        subtitle="Navigate the business and compliance reports from a clearer, finance-oriented hub."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
          <CardHeader>
            <CardTitle>Reporting workspace</CardTitle>
            <CardDescription>Use business summaries for day-to-day control and route formal books to the accounting area.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">6 live report routes</Badge>
            <Badge variant="outline">Business + GST</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Accounting books</CardTitle>
            <CardDescription>Trial balance, P&amp;L, balance sheet, cash book, and bank book stay grouped under accounting.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link className="text-sm font-medium text-[var(--accent)] hover:underline" href={`/c/${companyId}/accounting`}>
              Open accounting hub
            </Link>
          </CardContent>
        </Card>
      </div>

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
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent-soft)] hover:bg-[var(--surface)]"
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
