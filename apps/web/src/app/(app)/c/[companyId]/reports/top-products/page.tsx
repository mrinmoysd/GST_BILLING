"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";
import { type TopProductRow, useTopProducts } from "@/lib/reports/hooks";
import {
  ChartEmptyState,
  ChartFrame,
  ChartLegend,
  ChartShell,
  ChartTooltip,
  formatChartCompactNumber,
  formatChartCurrency,
  formatChartNumber,
  getChartAxisColor,
  getChartGridColor,
  getChartSeriesColor,
} from "@/lib/ui/chart";
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
  const [selectedProductId, setSelectedProductId] = React.useState("");
  const query = useTopProducts({
    companyId: companyId,
    from: from || undefined,
    to: to || undefined,
    limit: Number(limit || 10),
    sort_by: sortBy,
  });

  const payload = query.data?.data as
    | TopProductRow[]
    | { data?: TopProductRow[]; meta?: { limit?: number; sort_by?: "amount" | "quantity" } }
    | undefined;
  const rows = React.useMemo(
    () =>
      Array.isArray(payload)
        ? payload
        : (payload?.data ?? []),
    [payload],
  );
  const meta = Array.isArray(payload) ? undefined : payload?.meta;
  React.useEffect(() => {
    if (!rows.length) {
      setSelectedProductId("");
      return;
    }
    if (!selectedProductId || !rows.some((row) => row.product_id === selectedProductId)) {
      setSelectedProductId(rows[0]?.product_id ?? "");
    }
  }, [rows, selectedProductId]);
  const selectedRow = rows.find((row) => row.product_id === selectedProductId) ?? rows[0] ?? null;
  const chartRows = rows.slice(0, Math.min(rows.length, 8)).map((row) => ({
    productId: row.product_id,
    label: row.name.length > 26 ? `${row.name.slice(0, 26)}…` : row.name,
    fullLabel: row.name,
    amount: row.amount,
    quantity: row.quantity,
  }));
  const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0);
  const totalQuantity = rows.reduce((sum, row) => sum + row.quantity, 0);
  const chartTone = sortBy === "quantity" ? "secondary" : "primary";

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
      {query.data && rows.length > 0 ? (
        <ChartShell
          title="Visual leaderboard"
          subtitle="Scan your highest-performing products instantly before reviewing the detailed ranking table."
          footer={selectedRow ? `${selectedRow.name} is focused in both the chart and table.` : `${rows.length} products returned for the selected window.`}
        >
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <ChartFrame height={340}>
              <BarChart data={chartRows} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
                <CartesianGrid stroke={getChartGridColor()} horizontal={false} />
                <XAxis
                  type="number"
                  stroke={getChartAxisColor()}
                  tickFormatter={sortBy === "quantity" ? formatChartNumber : formatChartCompactNumber}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={140}
                  stroke={getChartAxisColor()}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  labelFormatter={(label) => {
                    const match = chartRows.find((row) => row.label === label);
                    return match?.fullLabel ?? String(label);
                  }}
                  valueFormatter={sortBy === "quantity" ? formatChartNumber : formatChartCurrency}
                />
                <Bar
                  dataKey={sortBy === "quantity" ? "quantity" : "amount"}
                  name={sortBy === "quantity" ? "Quantity sold" : "Sales amount"}
                  radius={[0, 10, 10, 0]}
                >
                  {chartRows.map((row, index) => (
                    <Cell
                      key={`${row.productId}-${index}`}
                      fill={
                        row.productId === selectedProductId
                          ? getChartSeriesColor("primary")
                          : index === 0
                            ? getChartSeriesColor(chartTone)
                            : getChartSeriesColor(index % 2 === 0 ? "info" : "accent")
                      }
                      className="cursor-pointer"
                      onClick={() => setSelectedProductId(row.productId)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ChartFrame>
            <div className="space-y-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)]">
              <ChartLegend
                items={[
                  {
                    label: sortBy === "quantity" ? "Sorted by quantity" : "Sorted by amount",
                    tone: chartTone,
                    value: sortBy === "quantity" ? formatChartNumber(totalQuantity) : formatChartCurrency(totalAmount),
                  },
                  {
                    label: "Products visualized",
                    tone: "neutral",
                    value: String(chartRows.length),
                  },
                ]}
              />
              <div className="grid gap-3">
                <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Focused product</div>
                  <div className="mt-2 text-sm font-semibold text-[var(--foreground)]">{selectedRow?.name ?? "—"}</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    {sortBy === "quantity"
                      ? `${formatChartNumber(selectedRow?.quantity ?? 0)} units`
                      : formatChartCurrency(selectedRow?.amount ?? 0)}
                  </div>
                </div>
                <div className="rounded-[12px] border border-[var(--border)] bg-[var(--surface)] p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Coverage</div>
                  <div className="mt-2 text-sm text-[var(--muted-strong)]">
                    Click a chart bar or table row to keep the same product focused while you compare ranking and exact values.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ChartShell>
      ) : null}
      {query.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>
              {rows.length > 0 ? `${rows.length} product record(s) ranked by ${meta?.sort_by ?? sortBy}.` : "No products matched the current filter window."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rows.length === 0 ? (
              <ChartEmptyState
                title="No top-product data"
                hint="Try widening the date range or switching the ranking basis."
                className="border-0 bg-transparent p-0 shadow-none"
              />
            ) : null}
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
                    <DataTr
                      key={row.product_id}
                      className={selectedRow?.product_id === row.product_id ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                      onClick={() => setSelectedProductId(row.product_id)}
                    >
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
