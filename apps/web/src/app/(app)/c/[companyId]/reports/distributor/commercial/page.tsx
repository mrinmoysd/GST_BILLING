"use client";

import * as React from "react";

import {
  useCommercialAuditReport,
  useDiscountLeakage,
  usePriceCoverage,
  useSchemeUsage,
} from "@/lib/reports/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField } from "@/lib/ui/form";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function formatMoney(value: number) {
  return value.toFixed(2);
}

export default function CommercialReportsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");

  const schemeUsage = useSchemeUsage({ companyId, from: from || undefined, to: to || undefined });
  const discountLeakage = useDiscountLeakage({ companyId, from: from || undefined, to: to || undefined });
  const priceCoverage = usePriceCoverage({ companyId });
  const audit = useCommercialAuditReport({ companyId, limit: 50 });

  const schemeRows = schemeUsage.data?.data.data ?? [];
  const leakage = discountLeakage.data?.data.data;
  const coverage = priceCoverage.data?.data;
  const auditRows = audit.data?.data.data ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Distributor reports"
        title="Commercial control"
        subtitle="Track scheme usage, discount leakage, price-rule coverage, and manual pricing overrides from one commercial workspace."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <DateField label="From" value={from} onChange={setFrom} />
        <DateField label="To" value={to} onChange={setTo} />
      </div>

      {schemeUsage.isLoading || discountLeakage.isLoading || priceCoverage.isLoading || audit.isLoading ? (
        <LoadingBlock label="Loading commercial reports…" />
      ) : null}

      {schemeUsage.isError ? <InlineError message={getErrorMessage(schemeUsage.error, "Failed to load scheme usage")} /> : null}
      {discountLeakage.isError ? <InlineError message={getErrorMessage(discountLeakage.error, "Failed to load discount leakage")} /> : null}
      {priceCoverage.isError ? <InlineError message={getErrorMessage(priceCoverage.error, "Failed to load price coverage")} /> : null}
      {audit.isError ? <InlineError message={getErrorMessage(audit.error, "Failed to load commercial audit")} /> : null}

      {leakage && coverage ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Resolved discount" value={formatMoney(leakage.totals.resolved_discount)} />
          <StatCard label="Manual discount" value={formatMoney(leakage.totals.manual_discount)} />
          <StatCard label="Override lines" value={String(leakage.totals.override_lines)} />
          <StatCard label="Price-list coverage" value={`${coverage.price_list_coverage_percent.toFixed(1)}%`} />
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
          <div className="mt-1 text-sm text-[var(--muted)]">Latest pricing decisions and manual overrides.</div>
          <div className="mt-4">
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
                  {auditRows.map((row) => (
                    <DataTr key={row.id}>
                      <DataTd>{new Date(row.created_at).toLocaleString()}</DataTd>
                      <DataTd>{row.document_type}</DataTd>
                      <DataTd>{row.override_reason || row.action}</DataTd>
                      <DataTd>{row.customer?.name ?? "—"}</DataTd>
                      <DataTd>{row.product?.name ?? "—"}</DataTd>
                      <DataTd>{row.actor?.name || row.actor?.email || "System"}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </div>
        </div>
      </div>
    </div>
  );
}
