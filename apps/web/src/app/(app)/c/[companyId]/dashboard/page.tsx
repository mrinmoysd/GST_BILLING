"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, FilePlus2, PackagePlus, ReceiptIndianRupee, Users2, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInvoices, usePayments, usePurchases } from "@/lib/billing/hooks";
import { useLowStock } from "@/lib/masters/hooks";
import { useOutstandingInvoices, useSalesSummary } from "@/lib/reports/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";

type Props = {
  // Next (this repo version) types dynamic `params` as a Promise.
  params: Promise<{ companyId: string }>;
};

export default function CompanyDashboardPage({ params }: Props) {
  const { companyId } = React.use(params);
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const monthStart = React.useMemo(() => {
    const now = new Date();
    const month = `${now.getMonth() + 1}`.padStart(2, "0");
    return `${now.getFullYear()}-${month}-01`;
  }, []);

  const salesTodayQuery = useSalesSummary({ companyId, from: today, to: today });
  const salesMonthQuery = useSalesSummary({ companyId, from: monthStart, to: today });
  const outstandingQuery = useOutstandingInvoices({ companyId, page: 1, limit: 5 });
  const lowStockQuery = useLowStock({ companyId, threshold: 0, page: 1, limit: 5 });
  const recentInvoicesQuery = useInvoices({ companyId, page: 1, limit: 4 });
  const recentPurchasesQuery = usePurchases({ companyId, page: 1, limit: 4 });
  const recentPaymentsQuery = usePayments({ companyId, page: 1, limit: 4 });

  const salesToday = ((salesTodayQuery.data?.data as { data?: Record<string, unknown> } | undefined)?.data ?? {}) as Record<string, unknown>;
  const salesMonth = ((salesMonthQuery.data?.data as { data?: Record<string, unknown> } | undefined)?.data ?? {}) as Record<string, unknown>;
  const outstandingPayload = outstandingQuery.data?.data as { data?: Array<{ balanceDue?: string | number | null }> } | undefined;
  const lowStockItems = Array.isArray(lowStockQuery.data?.data) ? lowStockQuery.data.data : [];
  const recentInvoicesPayload = recentInvoicesQuery.data?.data as { data?: Array<Record<string, unknown>> } | undefined;
  const recentPurchasesPayload = recentPurchasesQuery.data?.data as { data?: Array<Record<string, unknown>> } | undefined;
  const recentPaymentsPayload = recentPaymentsQuery.data?.data as { data?: Array<Record<string, unknown>> } | undefined;

  const todaysSalesValue = Number(salesToday.total ?? 0);
  const monthlySalesValue = Number(salesMonth.total ?? 0);
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
    salesTodayQuery.isLoading ||
    salesMonthQuery.isLoading ||
    outstandingQuery.isLoading ||
    lowStockQuery.isLoading;

  const dashboardError =
    salesTodayQuery.isError ||
    salesMonthQuery.isError ||
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
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle="Track operational health, jump into your highest-frequency workflows, and keep billing activity moving."
        actions={<Badge variant="secondary">Company {companyId.slice(0, 8)}</Badge>}
      />

      {dashboardError ? <InlineError message={dashboardError} /> : null}
      {hasLoadingState ? <LoadingBlock label="Refreshing dashboard metrics…" /> : null}

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <StatCard label="Today's sales" value={formatCurrency(todaysSalesValue)} hint={`${Number(salesToday.count ?? 0)} invoice(s) today.`} />
          <StatCard label="This month" value={formatCurrency(monthlySalesValue)} hint={`${Number(salesMonth.count ?? 0)} invoice(s) in the current month.`} />
          <StatCard label="Outstanding" value={formatCurrency(outstandingValue)} hint={`${(outstandingPayload?.data ?? []).length} open receivable(s) in the current view.`} />
          <StatCard label="Low stock items" value={lowStockItems.length} hint="Products currently at or below reorder threshold." />
        </div>

        <Card className="bg-[linear-gradient(135deg,rgba(15,95,140,0.96),rgba(24,74,110,0.96))] text-white">
          <CardHeader>
            <Badge className="w-fit border-white/15 bg-white/10 text-white" variant="outline">
              Workspace
            </Badge>
            <CardTitle className="text-2xl tracking-[-0.02em] text-white">Stay on top of billing velocity</CardTitle>
            <CardDescription className="text-white/78">
              This dashboard now composes live operational data from the existing invoice, payment, report, and inventory APIs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-white/65">Readiness</div>
                <div className="mt-2 text-2xl font-semibold">{recentActivity.length ? "Live" : "Bootstrapping"}</div>
                <div className="mt-1 text-sm text-white/72">The workspace is now driven by current business activity rather than placeholders.</div>
              </div>
              <div className="rounded-2xl border border-white/12 bg-white/8 p-4">
                <div className="text-xs uppercase tracking-[0.14em] text-white/65">Attention</div>
                <div className="mt-2 text-2xl font-semibold">{lowStockItems.length}</div>
                <div className="mt-1 text-sm text-white/72">Products currently need replenishment review or stock action.</div>
              </div>
            </div>
            <Button asChild variant="secondary" className="border-white/15 bg-white text-[var(--accent)] hover:bg-white/95">
              <Link href={`/c/${companyId}/payments`}>
                Open payments
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Jump into the workflows your team uses every day.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>The latest invoice, purchase, and payment events across the company.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
