"use client";

import * as React from "react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, XAxis, YAxis } from "recharts";

import {
  type CommercialAuditSeriesPoint,
  type CommercialAuditReportRow,
  type DiscountLeakageReport,
  type ReportSeriesGrain,
  type SchemeUsageRow,
  useCommercialAuditReport,
  useCommercialAuditSeries,
  useDiscountLeakage,
  usePriceCoverage,
  useSchemeUsage,
} from "@/lib/reports/hooks";
import { formatDateLabel, formatDateTimeLabel } from "@/lib/format/date";
import {
  ChartFrame,
  ChartLegend,
  ChartShell,
  ChartTooltip,
  formatChartDateTick,
  formatChartCompactNumber,
  formatChartCurrency,
  getChartAxisColor,
  getChartGridColor,
  getChartSeriesColor,
} from "@/lib/ui/chart";
import { DataEmptyRow, DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField, SelectField } from "@/lib/ui/form";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };

const grainOptions: Array<{ value: ReportSeriesGrain; label: string }> = [
  { value: "day", label: "Daily" },
  { value: "week", label: "Weekly" },
  { value: "month", label: "Monthly" },
];

function getClickedPeriod(state: unknown) {
  if (!state || typeof state !== "object" || !("activePayload" in state)) return null;
  const activePayload = (state as { activePayload?: Array<{ payload?: { period?: string } }> }).activePayload;
  const period = activePayload?.[0]?.payload?.period;
  return typeof period === "string" ? period : null;
}

function formatMoney(value: number) {
  return value.toFixed(2);
}

export default function CommercialReportsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [grain, setGrain] = React.useState<ReportSeriesGrain>("week");
  const [selectedAuditPeriod, setSelectedAuditPeriod] = React.useState<string | null>(null);

  const schemeUsage = useSchemeUsage({ companyId, from: from || undefined, to: to || undefined });
  const discountLeakage = useDiscountLeakage({ companyId, from: from || undefined, to: to || undefined });
  const priceCoverage = usePriceCoverage({ companyId });
  const audit = useCommercialAuditReport({ companyId, limit: 50 });
  const auditSeries = useCommercialAuditSeries({
    companyId,
    from: from || undefined,
    to: to || undefined,
    grain,
  });

  const schemePayload = schemeUsage.data?.data as SchemeUsageRow[] | { data?: SchemeUsageRow[] } | undefined;
  const leakagePayload = discountLeakage.data?.data as DiscountLeakageReport | { data?: DiscountLeakageReport } | undefined;
  const auditPayload = audit.data?.data as CommercialAuditReportRow[] | { data?: CommercialAuditReportRow[] } | undefined;
  const schemeRows = React.useMemo(
    () => (Array.isArray(schemePayload) ? schemePayload : (schemePayload?.data ?? [])),
    [schemePayload],
  );
  const leakage = leakagePayload
    ? ("totals" in leakagePayload ? leakagePayload : (leakagePayload.data ?? undefined))
    : undefined;
  const coverage = priceCoverage.data?.data;
  const auditRows = React.useMemo(
    () => (Array.isArray(auditPayload) ? auditPayload : (auditPayload?.data ?? [])),
    [auditPayload],
  );
  const schemeChartRows = React.useMemo(
    () =>
      schemeRows.slice(0, 8).map((row) => ({
        name: row.scheme_name,
        discountAmount: row.discount_amount,
        freeQuantity: row.free_quantity,
      })),
    [schemeRows],
  );
  const leakageChartRows = React.useMemo(
    () =>
      (leakage?.top_override_products ?? []).slice(0, 8).map((row) => ({
        name: row.product_name,
        manualDiscount: row.manual_discount,
        overrides: row.overrides,
      })),
    [leakage?.top_override_products],
  );
  const auditTrendRows = (Array.isArray(auditSeries.data?.data) ? auditSeries.data.data : []).map(
    (row: CommercialAuditSeriesPoint) => ({
      ...row,
      label: row.period_start,
    }),
  );
  const selectedAuditWindow = selectedAuditPeriod
    ? auditTrendRows.find((row) => row.period === selectedAuditPeriod)
    : null;
  const filteredAuditRows = selectedAuditWindow
    ? auditRows.filter((row) => {
        const createdAt = new Date(row.created_at);
        const start = new Date(`${selectedAuditWindow.period_start}T00:00:00.000Z`);
        const end = new Date(`${selectedAuditWindow.period_end}T23:59:59.999Z`);
        return createdAt >= start && createdAt <= end;
      })
    : auditRows;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Distributor reports"
        title="Commercial control"
        subtitle="Track scheme usage, discount leakage, price-rule coverage, and manual pricing overrides from one commercial workspace."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <DateField label="From" value={from} onChange={setFrom} />
        <DateField label="To" value={to} onChange={setTo} />
        <SelectField
          label="Trend grain"
          value={grain}
          onChange={(value) => setGrain((value as ReportSeriesGrain) || "week")}
          options={grainOptions}
        />
      </div>

      {schemeUsage.isLoading || discountLeakage.isLoading || priceCoverage.isLoading || audit.isLoading || auditSeries.isLoading ? (
        <LoadingBlock label="Loading commercial reports…" />
      ) : null}

      {schemeUsage.isError ? <InlineError message={getErrorMessage(schemeUsage.error, "Failed to load scheme usage")} /> : null}
      {discountLeakage.isError ? <InlineError message={getErrorMessage(discountLeakage.error, "Failed to load discount leakage")} /> : null}
      {priceCoverage.isError ? <InlineError message={getErrorMessage(priceCoverage.error, "Failed to load price coverage")} /> : null}
      {audit.isError ? <InlineError message={getErrorMessage(audit.error, "Failed to load commercial audit")} /> : null}
      {auditSeries.isError ? <InlineError message={getErrorMessage(auditSeries.error, "Failed to load commercial trend")} /> : null}

      {leakage && coverage ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Resolved discount" value={formatMoney(leakage.totals.resolved_discount)} />
          <StatCard label="Manual discount" value={formatMoney(leakage.totals.manual_discount)} />
          <StatCard label="Override lines" value={String(leakage.totals.override_lines)} />
          <StatCard label="Price-list coverage" value={`${coverage.price_list_coverage_percent.toFixed(1)}%`} />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartShell
          title="Scheme value concentration"
          subtitle="See which schemes are actually driving discount amount through billing."
          footer={<ChartLegend items={[{ label: "Discount value", tone: "primary" }, { label: "Free quantity", tone: "secondary" }]} />}
        >
          <ChartFrame height={320}>
            <BarChart data={schemeChartRows} margin={{ top: 12, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid vertical={false} stroke={getChartGridColor()} />
              <XAxis dataKey="name" tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="amount" tickFormatter={formatChartCompactNumber} tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} width={72} />
              <YAxis yAxisId="qty" orientation="right" tickFormatter={formatChartCompactNumber} tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
              <ChartTooltip valueFormatter={formatChartCompactNumber} />
              <Bar yAxisId="amount" dataKey="discountAmount" fill={getChartSeriesColor("primary")} radius={[8, 8, 0, 0]} />
              <Bar yAxisId="qty" dataKey="freeQuantity" fill={getChartSeriesColor("secondary")} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartFrame>
        </ChartShell>

        <ChartShell
          title="Manual discount leakage"
          subtitle="Products with repeated override pressure deserve pricing or policy attention."
        >
          <ChartFrame height={320}>
            <BarChart data={leakageChartRows} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 8 }}>
              <CartesianGrid horizontal={false} stroke={getChartGridColor()} />
              <XAxis type="number" tickFormatter={formatChartCompactNumber} tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} width={104} />
              <ChartTooltip valueFormatter={formatChartCurrency} />
              <Bar dataKey="manualDiscount" radius={[0, 8, 8, 0]}>
                {leakageChartRows.map((row) => (
                  <Cell key={row.name} fill={getChartSeriesColor("warning")} />
                ))}
              </Bar>
            </BarChart>
          </ChartFrame>
        </ChartShell>
      </div>

      {auditSeries.data && auditTrendRows.length ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <ChartShell
            title="Commercial audit pressure over time"
            subtitle="Track overall pricing activity with manual overrides and warning pressure by period."
            footer={
              <ChartLegend
                items={[
                  { label: "Total events", tone: "primary" },
                  { label: "Manual overrides", tone: "warning" },
                  { label: "Warning events", tone: "danger" },
                ]}
              />
            }
            >
              <ChartFrame height={320}>
              <ComposedChart
                data={auditTrendRows}
                margin={{ top: 12, right: 12, bottom: 8, left: 0 }}
                onClick={(state: unknown) => {
                  const period = getClickedPeriod(state);
                  if (period) {
                    setSelectedAuditPeriod((current) => (current === period ? null : period));
                  }
                }}
              >
                <CartesianGrid vertical={false} stroke={getChartGridColor()} />
                <XAxis
                  dataKey="label"
                  tickFormatter={(value) => formatChartDateTick(value)}
                  tick={{ fill: getChartAxisColor(), fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatChartCompactNumber}
                  tick={{ fill: getChartAxisColor(), fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <ChartTooltip
                  valueFormatter={formatChartCompactNumber}
                  labelFormatter={(label) => formatChartDateTick(String(label), { day: "2-digit", month: "short", year: "numeric" })}
                />
                <Bar dataKey="total_events" name="Total events" fill={getChartSeriesColor("primary")} radius={[8, 8, 0, 0]} />
                <Line type="monotone" dataKey="manual_override_events" name="Manual overrides" stroke={getChartSeriesColor("warning")} strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="warning_events" name="Warning events" stroke={getChartSeriesColor("danger")} strokeWidth={2.25} dot={{ r: 3 }} />
              </ComposedChart>
            </ChartFrame>
          </ChartShell>

          <ChartShell
            title="Pricing source discipline"
            subtitle="See whether override-heavy activity is coming from customer-specific rates, price lists, or base product pricing."
            footer={
              <ChartLegend
                items={[
                  { label: "Customer override", tone: "warning" },
                  { label: "Price list", tone: "secondary" },
                  { label: "Product price", tone: "info" },
                ]}
              />
            }
            >
              <ChartFrame height={320}>
              <BarChart
                data={auditTrendRows}
                margin={{ top: 12, right: 12, bottom: 8, left: 0 }}
                onClick={(state: unknown) => {
                  const period = getClickedPeriod(state);
                  if (period) {
                    setSelectedAuditPeriod((current) => (current === period ? null : period));
                  }
                }}
              >
                <CartesianGrid vertical={false} stroke={getChartGridColor()} />
                <XAxis
                  dataKey="label"
                  tickFormatter={(value) => formatChartDateTick(value)}
                  tick={{ fill: getChartAxisColor(), fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={formatChartCompactNumber}
                  tick={{ fill: getChartAxisColor(), fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <ChartTooltip
                  valueFormatter={formatChartCompactNumber}
                  labelFormatter={(label) => formatChartDateTick(String(label), { day: "2-digit", month: "short", year: "numeric" })}
                />
                <Bar dataKey="customer_override_events" name="Customer override" stackId="source" fill={getChartSeriesColor("warning")} radius={[6, 6, 0, 0]} />
                <Bar dataKey="price_list_events" name="Price list" stackId="source" fill={getChartSeriesColor("secondary")} radius={[6, 6, 0, 0]} />
                <Bar dataKey="product_price_events" name="Product price" stackId="source" fill={getChartSeriesColor("info")} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartFrame>
          </ChartShell>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="text-sm font-semibold">Scheme usage</div>
          <div className="mt-1 text-sm text-[var(--muted)]">Applied commercial schemes on issued invoices.</div>
          <div className="mt-4">
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Scheme</DataTh>
                    <DataTh>Type</DataTh>
                    <DataTh>Lines</DataTh>
                    <DataTh>Discount</DataTh>
                    <DataTh>Free qty</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {schemeRows.map((row) => (
                    <DataTr key={row.scheme_code}>
                      <DataTd>{row.scheme_name}</DataTd>
                      <DataTd>{row.scheme_type}</DataTd>
                      <DataTd>{row.line_count}</DataTd>
                      <DataTd>{formatMoney(row.discount_amount)}</DataTd>
                      <DataTd>{row.free_quantity}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="text-sm font-semibold">Price coverage</div>
          <div className="mt-1 text-sm text-[var(--muted)]">Coverage of reusable pricing rules across the catalog.</div>
          {coverage ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <StatCard label="Total products" value={String(coverage.total_products)} />
              <StatCard label="Products with price lists" value={String(coverage.products_with_price_lists)} />
              <StatCard label="Customer special rates" value={String(coverage.customer_special_rates)} />
              <StatCard label="Active schemes" value={String(coverage.active_schemes)} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="text-sm font-semibold">Top override products</div>
          <div className="mt-1 text-sm text-[var(--muted)]">Products with the most manual commercial leakage.</div>
          <div className="mt-4">
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Product</DataTh>
                    <DataTh>SKU</DataTh>
                    <DataTh>Manual discount</DataTh>
                    <DataTh>Overrides</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {(leakage?.top_override_products ?? []).map((row) => (
                    <DataTr key={row.product_id}>
                      <DataTd>{row.product_name}</DataTd>
                      <DataTd>{row.sku ?? "—"}</DataTd>
                      <DataTd>{formatMoney(row.manual_discount)}</DataTd>
                      <DataTd>{row.overrides}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
          <div className="text-sm font-semibold">Commercial audit trail</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            {selectedAuditWindow
              ? `Focused on ${formatDateLabel(selectedAuditWindow.period_start)} to ${formatDateLabel(selectedAuditWindow.period_end)}.`
              : "Latest pricing decisions and manual overrides."}
          </div>
          <div className="mt-4">
            {selectedAuditWindow ? (
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-9 items-center rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 text-sm font-medium text-[var(--foreground)]"
                  onClick={() => setSelectedAuditPeriod(null)}
                >
                  Clear period focus
                </button>
                <div className="text-sm text-[var(--muted)]">
                  Showing {filteredAuditRows.length} of {auditRows.length} audit rows.
                </div>
              </div>
            ) : null}
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>When</DataTh>
                    <DataTh>Document</DataTh>
                    <DataTh>Action</DataTh>
                    <DataTh>Customer</DataTh>
                    <DataTh>Product</DataTh>
                    <DataTh>Actor</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {filteredAuditRows.length ? (
                    filteredAuditRows.map((row) => (
                    <DataTr key={row.id}>
                      <DataTd>{formatDateTimeLabel(row.created_at)}</DataTd>
                      <DataTd>{row.document_type}</DataTd>
                      <DataTd>{row.override_reason || row.action}</DataTd>
                      <DataTd>{row.customer?.name ?? "—"}</DataTd>
                      <DataTd>{row.product?.name ?? "—"}</DataTd>
                      <DataTd>{row.actor?.name || row.actor?.email || "System"}</DataTd>
                    </DataTr>
                  ))
                  ) : (
                    <DataEmptyRow colSpan={6} title="No audit rows for this period" hint="Choose another chart period or clear the focus." />
                  )}
                </tbody>
              </DataTable>
            </DataTableShell>
          </div>
        </div>
      </div>
    </div>
  );
}
