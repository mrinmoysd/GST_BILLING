import * as React from "react";
import Link from "next/link";

import { PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };

export default function AccountingPage({ params }: Props) {
  const { companyId } = React.use(params);
  return (
    <div className="space-y-6">
      <PageHeader title="Accounting" subtitle="Ledgers, journals, and financial reports." />

      <div className="grid gap-4 md:grid-cols-2">
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/accounting/ledgers`}>
          <div className="font-medium">Ledgers</div>
          <div className="text-sm text-neutral-600">Create and list ledgers.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/accounting/journals`}>
          <div className="font-medium">Journals</div>
          <div className="text-sm text-neutral-600">Post journal entries.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/accounting/reports/trial-balance`}>
          <div className="font-medium">Trial balance</div>
          <div className="text-sm text-neutral-600">Balances by ledger.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/accounting/reports/profit-loss`}>
          <div className="font-medium">Profit & loss</div>
          <div className="text-sm text-neutral-600">Income vs expenses.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/accounting/reports/balance-sheet`}>
          <div className="font-medium">Balance sheet</div>
          <div className="text-sm text-neutral-600">Assets and liabilities.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/accounting/books/cash`}>
          <div className="font-medium">Cash book</div>
          <div className="text-sm text-neutral-600">Cash receipts and payments.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/accounting/books/bank`}>
          <div className="font-medium">Bank book</div>
          <div className="text-sm text-neutral-600">Bank receipts and payments.</div>
        </Link>
      </div>
    </div>
  );
}

