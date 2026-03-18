import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/lib/ui/state";

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
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
          <CardHeader>
            <CardTitle>Books and statements</CardTitle>
            <CardDescription>The accounting surface now groups operational posting separately from read-oriented finance reports.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="secondary">7 accounting routes</Badge>
            <Badge variant="outline">Journals + books + statements</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Current model</CardTitle>
            <CardDescription>The subsystem is still manual-first, so clear routing and dense summaries matter more than workflow automation.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {section.items.map((item) => (
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
