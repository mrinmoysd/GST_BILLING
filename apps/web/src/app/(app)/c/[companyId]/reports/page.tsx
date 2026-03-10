import * as React from "react";
import Link from "next/link";

import { PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };

export default function ReportsPage({ params }: Props) {
  const { companyId } = React.use(params);
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" subtitle="Business summaries and GST exports." />

      <div className="grid gap-4 md:grid-cols-2">
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/reports/sales-summary`}>
          <div className="font-medium">Sales summary</div>
          <div className="text-sm text-neutral-600">Revenue and counts for a date range.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/reports/purchases-summary`}>
          <div className="font-medium">Purchases summary</div>
          <div className="text-sm text-neutral-600">Purchases and counts for a date range.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/reports/outstanding`}>
          <div className="font-medium">Outstanding invoices</div>
          <div className="text-sm text-neutral-600">Who owes you money.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/reports/top-products`}>
          <div className="font-medium">Top products</div>
          <div className="text-sm text-neutral-600">By amount or quantity.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/reports/profit-snapshot`}>
          <div className="font-medium">Profit snapshot</div>
          <div className="text-sm text-neutral-600">High-level profit view.</div>
        </Link>
        <Link className="rounded-xl border bg-white p-4 hover:bg-neutral-50" href={`/c/${companyId}/reports/gst/gstr1`}>
          <div className="font-medium">GST Export — GSTR1</div>
          <div className="text-sm text-neutral-600">Create export job and download CSV.</div>
        </Link>
      </div>
    </div>
  );
}

