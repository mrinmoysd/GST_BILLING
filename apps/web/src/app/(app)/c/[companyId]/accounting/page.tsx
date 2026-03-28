import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextStrip, PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };

export default function AccountingPage({ params }: Props) {
  const { companyId } = React.use(params);
  const sections = [
    {
      title: "Operational accounting",
      description: "Manual posting and master-record management for the current accounting subsystem.",
      items: [
        { href: `/c/${companyId}/accounting/ledgers`, title: "Ledgers", hint: "Create and manage the chart of accounts." },
        { href: `/c/${companyId}/accounting/journals`, title: "Journals", hint: "Post entries and inspect recent journal activity." },
      ],
    },
    {
      title: "Financial reports",
      description: "Review the current books and financial statements.",
      items: [
        { href: `/c/${companyId}/accounting/reports/trial-balance`, title: "Trial balance", hint: "Balances by ledger as of a selected date." },
        { href: `/c/${companyId}/accounting/reports/profit-loss`, title: "Profit & loss", hint: "Income, expense, and profit summary." },
        { href: `/c/${companyId}/accounting/reports/balance-sheet`, title: "Balance sheet", hint: "Assets, liabilities, and equity view." },
        { href: `/c/${companyId}/accounting/books/cash`, title: "Cash book", hint: "Cash receipts and payments." },
        { href: `/c/${companyId}/accounting/books/bank`, title: "Bank book", hint: "Bank receipts and payments." },
      ],
    },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Finance"
        title="Accounting"
        subtitle="Use a dedicated hub for journals, ledgers, books, and financial statements."
        badges={[
          <Badge key="routes" variant="secondary">7 accounting routes</Badge>,
          <Badge key="mode" variant="outline">Manual-first subsystem</Badge>,
        ]}
        context={
          <PageContextStrip>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Operational accounting</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">Ledgers and journals stay close to day-to-day posting work.</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Books</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">Cash and bank books remain fast entry points for finance operators.</div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Statements</div>
                <div className="mt-1 text-sm leading-6 text-[var(--muted-strong)]">Formal reports stay grouped for review, export, and final checks.</div>
              </div>
            </div>
          </PageContextStrip>
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title} className="[background-image:var(--panel-highlight)]">
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 transition [background-image:var(--surface-highlight)] hover:-translate-y-0.5 hover:border-[var(--accent-soft)] hover:bg-[var(--surface-panel)]"
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
