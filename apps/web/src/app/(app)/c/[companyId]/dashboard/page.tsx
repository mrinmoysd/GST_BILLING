"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FilePlus2, PackagePlus, ReceiptIndianRupee, Users2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInvoices, usePayments, usePurchases } from "@/lib/billing/hooks";
import { useAuth } from "@/lib/auth/session";
import { useLowStock } from "@/lib/masters/hooks";
import { useDistributorDashboard, useOutstandingInvoices, useSalesSummary } from "@/lib/reports/hooks";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceHero, WorkspacePanel, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = {
  // Next (this repo version) types dynamic `params` as a Promise.
  params: Promise<{ companyId: string }>;
};

export default function CompanyDashboardPage({ params }: Props) {
  const { companyId } = React.use(params);
  const { session, bootstrapped } = useAuth();
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const monthStart = React.useMemo(() => {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    return `${now.getFullYear()}-${month}-01`;
  }, []);

  const queriesEnabled = bootstrapped && Boolean(session.accessToken);

  const salesTodayQuery = useSalesSummary({ companyId, from: today, to: today, enabled: queriesEnabled });
  const salesMonthQuery = useSalesSummary({ companyId, from: monthStart, to: today, enabled: queriesEnabled });
  const distributorDashboardQuery = useDistributorDashboard({
    companyId,
    from: monthStart,
    to: today,
    asOf: today,
    enabled: queriesEnabled,
  });
  const outstandingQuery = useOutstandingInvoices({ companyId, page: 1, limit: 5, enabled: queriesEnabled });
  const lowStockQuery = useLowStock({ companyId, threshold: 0, page: 1, limit: 5, enabled: queriesEnabled });
  const recentInvoicesQuery = useInvoices({ companyId, page: 1, limit: 4, enabled: queriesEnabled });
  const recentPurchasesQuery = usePurchases({ companyId, page: 1, limit: 4, enabled: queriesEnabled });
  const recentPaymentsQuery = usePayments({ companyId, page: 1, limit: 4, enabled: queriesEnabled });

  const salesToday = (salesTodayQuery.data?.data ?? {}) as Record<string, unknown>;
  const salesMonth = (salesMonthQuery.data?.data ?? {}) as Record<string, unknown>;
  const distributorDashboard = distributorDashboardQuery.data?.data;
  const outstandingPayload = outstandingQuery.data?.data as { data?: Array<{ balanceDue?: string | number | null }> } | undefined;
  const lowStockItems = Array.isArray(lowStockQuery.data?.data) ? lowStockQuery.data.data : [];
  const recentInvoicesPayload = recentInvoicesQuery.data?.data as { data?: Array<Record<string, unknown>> } | undefined;
  const recentPurchasesPayload = recentPurchasesQuery.data?.data as { data?: Array<Record<string, unknown>> } | undefined;
  const recentPaymentsPayload = recentPaymentsQuery.data?.data as { data?: Array<Record<string, unknown>> } | undefined;

  const todaysSalesValue = Number(salesToday.gross_sales ?? 0);
  const monthlySalesValue = Number(salesMonth.gross_sales ?? 0);
  const outstandingValue = React.useMemo(
    () =>
      (outstandingPayload?.data ?? []).reduce((sum, row) => {
        return sum + Number(row.balanceDue ?? 0);
      }, 0),
    [outstandingPayload?.data],
  );

  const recentActivity = React.useMemo(() => {
    const invoices = (recentInvoicesPayload?.data ?? []).map((row) => ({
      id: String(row.id ?? "invoice"),
      kind: "Invoice",
      title: String(row.invoiceNumber ?? row.invoice_no ?? row.id ?? "Invoice"),
      when: String(row.issueDate ?? row.issue_date ?? row.createdAt ?? ""),
      href: `/c/${companyId}/sales/invoices/${row.id}`,
      meta: String(row.status ?? "draft"),
    }));
    const purchases = (recentPurchasesPayload?.data ?? []).map((row) => ({
      id: String(row.id ?? "purchase"),
      kind: "Purchase",
      title: String(row.billNumber ?? row.purchaseNumber ?? row.id ?? "Purchase"),
      when: String(row.purchaseDate ?? row.purchase_date ?? row.createdAt ?? ""),
      href: `/c/${companyId}/purchases/${row.id}`,
      meta: String(row.status ?? "draft"),
    }));
    const payments = (recentPaymentsPayload?.data ?? []).map((row) => ({
      id: String(row.id ?? "payment"),
      kind: "Payment",
      title: `₹${Number(row.amount ?? 0).toFixed(2)}`,
      when: String(row.paymentDate ?? row.payment_date ?? row.createdAt ?? ""),
      href:
        row.invoiceId || row.invoice_id
          ? `/c/${companyId}/sales/invoices/${String(row.invoiceId ?? row.invoice_id)}`
          : row.purchaseId || row.purchase_id
            ? `/c/${companyId}/purchases/${String(row.purchaseId ?? row.purchase_id)}`
            : `/c/${companyId}/payments`,
      meta: String(row.method ?? "payment"),
    }));

    return [...invoices, ...purchases, ...payments]
      .filter((item) => item.when)
      .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
      .slice(0, 6);
  }, [companyId, recentInvoicesPayload?.data, recentPaymentsPayload?.data, recentPurchasesPayload?.data]);

  const hasLoadingState =
    !bootstrapped ||
    salesTodayQuery.isLoading ||
    salesMonthQuery.isLoading ||
    outstandingQuery.isLoading ||
    lowStockQuery.isLoading;

  const dashboardError =
    salesTodayQuery.isError ||
    salesMonthQuery.isError ||
    distributorDashboardQuery.isError ||
    outstandingQuery.isError ||
    lowStockQuery.isError
      ? "Some dashboard widgets could not be loaded. The page is showing the data that is currently available."
      : null;

  function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);
  }

  const quickActions = [
    {
      href: `/c/${companyId}/sales/invoices/new`,
      label: "Create invoice",
      hint: "Draft a new sales invoice and move to issue.",
      icon: FilePlus2,
    },
    {
      href: `/c/${companyId}/purchases/new`,
      label: "Create purchase",
      hint: "Add new stock received from a supplier.",
      icon: ReceiptIndianRupee,
    },
    {
      href: `/c/${companyId}/masters/customers/new`,
      label: "Add customer",
      hint: "Create a customer profile before billing.",
      icon: Users2,
    },
    {
      href: `/c/${companyId}/masters/products/new`,
      label: "Add product",
      hint: "Set up stock, price, and GST rate.",
      icon: PackagePlus,
    },
    {
      href: `/c/${companyId}/payments`,
      label: "Record payment",
      hint: "Use the dedicated payments workspace for invoices and purchases.",
      icon: Wallet,
    },
  ];

  return (
    <div className="space-y-8">
      <WorkspaceHero
        eyebrow="Tenant control surface"
        title="Dashboard"
        subtitle="Track operational health, jump into the next action quickly, and keep billing, stock, and collection activity moving from one company workspace."
        badges={[
          <WorkspaceStatBadge key="company" label="Company" value={session.company?.name ?? companyId.slice(0, 8)} />,
          <WorkspaceStatBadge key="status" label="Workspace" value={recentActivity.length ? "Live" : "Bootstrapping"} variant="outline" />,
        ]}
        actions={
          <>
            <Button asChild>
              <Link href={`/c/${companyId}/sales/invoices/new`}>Create invoice</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/c/${companyId}/payments`}>Open payments</Link>
            </Button>
          </>
        }
        aside={
          <WorkspacePanel
            tone="strong"
            title="Operational focus"
            subtitle="Use the overview to decide whether the next move is collections, replenishment, or document creation."
          >
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/58">Receivables</div>
                <div className="mt-2 text-2xl font-semibold">{formatCurrency(outstandingValue)}</div>
                <div className="mt-1 text-sm text-white/72">Open receivable exposure in the current view.</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/8 px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/58">Stock attention</div>
                <div className="mt-2 text-2xl font-semibold">{lowStockItems.length}</div>
                <div className="mt-1 text-sm text-white/72">Products currently need replenishment review.</div>
              </div>
            </div>
          </WorkspacePanel>
        }
      />

      {dashboardError ? <InlineError message={dashboardError} /> : null}
      {hasLoadingState ? <LoadingBlock label="Refreshing dashboard metrics…" /> : null}

      <WorkspaceSection
        eyebrow="Overview"
        title="Today’s operating picture"
        subtitle="Use these signals first, then move into collections, product setup, purchasing, or payment workflows."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Today's sales" value={formatCurrency(todaysSalesValue)} hint={`${Number(salesToday.count ?? 0)} invoice(s) today.`} />
          <StatCard label="This month" value={formatCurrency(monthlySalesValue)} hint={`${Number(salesMonth.count ?? 0)} invoice(s) in the current month.`} />
          <StatCard label="Outstanding" value={formatCurrency(outstandingValue)} hint={`${(outstandingPayload?.data ?? []).length} open receivable(s) in the current view.`} tone="quiet" />
          <StatCard label="Low stock items" value={lowStockItems.length} hint="Products currently at or below reorder threshold." tone="quiet" />
        </div>
      </WorkspaceSection>

      <WorkspaceSection
        eyebrow="Distributor view"
        title="Owner operating view"
        subtitle="Use this layer to understand rep contribution, due concentration, warehouse stock posture, and product movement."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Gross sales" value={formatCurrency(distributorDashboard?.totals.gross_sales ?? 0)} hint="Selected distributor period." />
          <StatCard label="Collections" value={formatCurrency(distributorDashboard?.totals.collections ?? 0)} hint="Payments recorded in the same window." />
          <StatCard label="Outstanding" value={formatCurrency(distributorDashboard?.totals.outstanding ?? 0)} hint="Open dues as of today." tone="quiet" />
          <StatCard label="Stock value" value={formatCurrency(distributorDashboard?.totals.stock_value ?? 0)} hint="Approximate cost-value across warehouses." tone="quiet" />
        </div>
      </WorkspaceSection>

      <section className="grid gap-4 xl:grid-cols-3">
        <WorkspacePanel title="Top salespeople" subtitle="Who is driving invoiced value this period.">
          <div className="space-y-3">
            {(distributorDashboard?.top_salespeople ?? []).slice(0, 5).map((row) => (
              <div key={row.salesperson_user_id ?? row.salesperson_name} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[var(--foreground)]">{row.salesperson_name}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">{row.invoices_count} invoice(s)</div>
                  </div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(row.gross_sales)}</div>
                </div>
              </div>
            ))}
            {(distributorDashboard?.top_salespeople?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--muted)]">
                Salesperson analytics will appear once attributed invoices are issued.
              </div>
            ) : null}
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Top due customers" subtitle="Which accounts need the fastest follow-up.">
          <div className="space-y-3">
            {(distributorDashboard?.top_due_customers ?? []).slice(0, 5).map((row) => (
              <div key={row.customer_id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[var(--foreground)]">{row.customer_name}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">{row.salesperson_name} · {row.invoices_count} open invoice(s)</div>
                  </div>
                  <div className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(row.outstanding_amount)}</div>
                </div>
              </div>
            ))}
            {(distributorDashboard?.top_due_customers?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--muted)]">
                No open customer dues are currently visible in the distributor window.
              </div>
            ) : null}
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Warehouse snapshot" subtitle="How stock is distributed across active locations.">
          <div className="space-y-3">
            {(distributorDashboard?.warehouse_snapshot ?? []).slice(0, 5).map((row) => (
              <div key={row.warehouse_id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[var(--foreground)]">{row.warehouse_name}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">{row.sku_count} SKU · {row.low_stock_lines} low-stock line(s)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[var(--foreground)]">{formatCurrency(row.stock_value)}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{row.total_quantity} units</div>
                  </div>
                </div>
              </div>
            ))}
            {(distributorDashboard?.warehouse_snapshot?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--muted)]">
                Warehouse analytics will appear once active locations hold stock.
              </div>
            ) : null}
          </div>
        </WorkspacePanel>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <WorkspacePanel title="Fast-moving products" subtitle="Products with the strongest sell-through this period.">
          <div className="space-y-3">
            {(distributorDashboard?.fast_moving ?? []).slice(0, 5).map((row) => (
              <div key={row.product_id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[var(--foreground)]">{row.product_name}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">Current stock {row.current_stock}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[var(--foreground)]">{row.sold_quantity} sold</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{formatCurrency(row.sales_amount)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Slow-moving products" subtitle="Products with stock still sitting against low movement.">
          <div className="space-y-3">
            {(distributorDashboard?.slow_moving ?? []).slice(0, 5).map((row) => (
              <div key={row.product_id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-[var(--foreground)]">{row.product_name}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">Sold {row.sold_quantity} in period</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-[var(--foreground)]">{row.current_stock} in stock</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">{formatCurrency(row.sales_amount)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <WorkspacePanel title="Quick actions" subtitle="Jump into the workflows your team uses every day.">
          <div className="grid gap-3 sm:grid-cols-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 hover:border-[var(--border-strong)] hover:bg-[var(--surface)]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--accent)] shadow-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="font-semibold text-[var(--foreground)]">{action.label}</div>
                      <div className="text-sm leading-6 text-[var(--muted)]">{action.hint}</div>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Recent activity" subtitle="The latest invoice, purchase, and payment events across the company." tone="muted">
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <Link
                  key={`${activity.kind}-${activity.id}`}
                  href={activity.href}
                  className="block rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 hover:bg-[var(--surface)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">{activity.kind}</div>
                      <div className="mt-1 font-medium text-[var(--foreground)]">{activity.title}</div>
                      <div className="mt-1 text-sm text-[var(--muted)]">{activity.meta}</div>
                    </div>
                    <div className="text-xs text-[var(--muted)]">{new Date(activity.when).toLocaleDateString()}</div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--muted-strong)]">
                Recent activity will appear here once invoices, purchases, or payments are recorded.
              </div>
            )}
          </div>
        </WorkspacePanel>
      </section>
    </div>
  );
}
