"use client";

import Link from "next/link";
import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStockMovements } from "@/lib/masters/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function InventoryMovementsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const query = useStockMovements({ companyId, from: from || undefined, to: to || undefined, page: 1, limit: 50 });
  const rows = query.data?.data.data ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Inventory"
        title="Stock movements"
        subtitle="Review stock changes across the company with a dedicated movement ledger."
        actions={<Link href={`/c/${companyId}/inventory`} className="text-sm underline">Back</Link>}
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Use the date range to isolate the stock activity you want to review.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <TextField label="From (YYYY-MM-DD)" value={from} onChange={setFrom} />
          <TextField label="To (YYYY-MM-DD)" value={to} onChange={setTo} />
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading stock movements…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load stock movements")} /> : null}
      {!query.isLoading && !query.isError && rows.length === 0 ? <EmptyState title="No movements" hint="Try adjusting the date range." /> : null}

      {rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Movement ledger</CardTitle>
            <CardDescription>Most recent stock movements returned by the current query.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>When</DataTh>
                    <DataTh>Product</DataTh>
                    <DataTh>Change</DataTh>
                    <DataTh>Balance</DataTh>
                    <DataTh>Source</DataTh>
                    <DataTh>Note</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {rows.map((row) => (
                    <DataTr key={row.id}>
                      <DataTd>{new Date(row.createdAt).toLocaleString()}</DataTd>
                      <DataTd>
                        <Link href={`/c/${companyId}/masters/products/${row.productId}`} className="font-medium text-[var(--accent)] hover:underline">
                          {row.productId.slice(0, 8)}
                        </Link>
                      </DataTd>
                      <DataTd>{row.changeQty}</DataTd>
                      <DataTd>{row.balanceQty}</DataTd>
                      <DataTd>{row.sourceType}</DataTd>
                      <DataTd>{row.note ?? "—"}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
