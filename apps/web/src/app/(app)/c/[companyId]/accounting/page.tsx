"use client";

import * as React from "react";
import Link from "next/link";

import { SecondaryButton } from "@/lib/ui/form";
import { QueueSavedViews, QueueSegmentBar } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

export default function AccountingPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [segment, setSegment] = React.useState("operations");
  const [savedView, setSavedView] = React.useState("operations");
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

  const visibleSections = sections.filter((section) => {
    if (segment === "operations") return section.title === "Operational accounting";
    if (segment === "reports") return section.title === "Financial reports";
    return true;
  });

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Finance"
        title="Accounting"
        subtitle="Use one finance hub for journals, ledgers, books, and statements, with the operational and reporting lanes separated more clearly."
        badges={[
          <WorkspaceStatBadge key="routes" label="Routes" value={7} />,
          <WorkspaceStatBadge key="mode" label="Mode" value="Manual-first" variant="outline" />,
        ]}
        actions={
          <Link href={`/c/${companyId}/dashboard`}>
            <SecondaryButton type="button">Back to dashboard</SecondaryButton>
          </Link>
        }
      />

      <QueueSegmentBar
        items={[
          { id: "operations", label: "Operations", count: sections[0]?.items.length ?? 0 },
          { id: "reports", label: "Reports and books", count: sections[1]?.items.length ?? 0 },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "operations", label: "Posting desk" },
              { id: "reports", label: "Statement review" },
            ]}
            value={savedView}
            onValueChange={(value) => {
              setSavedView(value);
              setSegment(value);
            }}
          />
        }
      />

      <div className="grid gap-5 xl:grid-cols-2">
        {visibleSections.map((section) => (
          <WorkspacePanel key={section.title} title={section.title} subtitle={section.description}>
            <div className="grid gap-3">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent-soft)] hover:bg-[var(--surface-panel)]"
                  href={item.href}
                >
                  <div className="font-semibold text-[var(--foreground)]">{item.title}</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">{item.hint}</div>
                </Link>
              ))}
            </div>
          </WorkspacePanel>
        ))}
      </div>
    </div>
  );
}
