"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";
import { useTopProducts } from "@/lib/reports/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { SelectField, TextField } from "@/lib/ui/form";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };

export default function TopProductsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [limit, setLimit] = React.useState("10");
  const [sortBy, setSortBy] = React.useState<"amount" | "quantity">("amount");
  const query = useTopProducts({
    companyId: companyId,
    from: from || undefined,
    to: to || undefined,
    limit: Number(limit || 10),
    sort_by: sortBy,
  });

  const rows = query.data?.data.data ?? [];
  const meta = query.data?.data.meta;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Reports"
        title="Top products"
        subtitle="Compare top-performing products by quantity or amount across a selected date range."
      />

      <Card>
        <CardHeader>
          <CardTitle>Ranking controls</CardTitle>
          <CardDescription>Change the window, result count, and ranking basis for this product leaderboard.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4 md:items-end">
          <TextField label="From" value={from} onChange={setFrom} />
          <TextField label="To" value={to} onChange={setTo} />
          <TextField label="Limit" value={limit} onChange={setLimit} type="number" />
          <div>
            <SelectField
              label="Sort by"
              value={sortBy}
              onChange={(value) => setSortBy(value === "quantity" ? "quantity" : "amount")}
            >
              <option value="amount">Amount</option>
              <option value="quantity">Quantity</option>
            </SelectField>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load report")} /> : null}
      {query.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>
              {rows.length > 0 ? `${rows.length} product record(s) ranked by ${meta?.sort_by ?? sortBy}.` : "No products matched the current filter window."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Product</DataTh>
                    <DataTh>SKU</DataTh>
                    <DataTh>HSN</DataTh>
                    <DataTh className="text-right">Quantity</DataTh>
                    <DataTh className="text-right">Amount</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {rows.map((row) => (
                    <DataTr key={row.product_id}>
                      <DataTd>{row.name}</DataTd>
                      <DataTd>{row.sku ?? "—"}</DataTd>
                      <DataTd>{row.hsn ?? "—"}</DataTd>
                      <DataTd className="text-right">{row.quantity.toFixed(2)}</DataTd>
                      <DataTd className="text-right">{row.amount.toFixed(2)}</DataTd>
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
