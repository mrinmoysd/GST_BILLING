"use client";

import Link from "next/link";
import * as React from "react";

import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import type { Customer } from "@/lib/masters/types";
import { useCustomers } from "@/lib/masters/hooks";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { SecondaryButton, TextField } from "@/lib/ui/form";
import { QueueInspector, QueueMetaList, QueueQuickActions, QueueRowStateBadge, QueueSavedViews, QueueSegmentBar, QueueShell, QueueToolbar } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";


type Props = { params: Promise<{ companyId: string }> };

export default function CustomersPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedCustomerId, setSelectedCustomerId] = React.useState("");
  const query = useCustomers({ companyId, q });
  const customers = React.useMemo<Customer[]>(
    () => (Array.isArray(query.data?.data) ? (query.data.data as Customer[]) : []),
    [query.data],
  );
  const total =
    (query.data?.meta as { total?: number } | undefined)?.total ?? customers.length;

  const counts = React.useMemo(() => {
    const creditHold = customers.filter((customer) => Boolean(customer.creditHold ?? customer.credit_hold)).length;
    const assigned = customers.filter((customer) => Boolean(customer.salesperson?.id)).length;
    const dueAttention = customers.filter((customer) => Number(customer.summary?.credit?.overdue_amount ?? 0) > 0).length;
    return { all: customers.length, creditHold, assigned, dueAttention };
  }, [customers]);

  const filteredCustomers = React.useMemo(() => {
    return customers.filter((customer) => {
      if (segment === "credit-hold") return Boolean(customer.creditHold ?? customer.credit_hold);
      if (segment === "assigned") return Boolean(customer.salesperson?.id);
      if (segment === "attention") return Number(customer.summary?.credit?.overdue_amount ?? 0) > 0;
      return true;
    });
  }, [customers, segment]);

  React.useEffect(() => {
    if (!filteredCustomers.length) {
      setSelectedCustomerId("");
      return;
    }
    if (!selectedCustomerId || !filteredCustomers.some((customer) => customer.id === selectedCustomerId)) {
      setSelectedCustomerId(filteredCustomers[0]?.id ?? "");
    }
  }, [filteredCustomers, selectedCustomerId]);

  const selectedCustomer = filteredCustomers.find((customer) => customer.id === selectedCustomerId) ?? filteredCustomers[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Masters"
        title="Customers"
        subtitle="Work the customer directory as an operating queue, with credit posture and ownership visible before you open the full profile."
        badges={[
          <WorkspaceStatBadge key="total" label="Customers" value={total} />,
          <WorkspaceStatBadge key="attention" label="Need attention" value={counts.dueAttention} variant="outline" />,
        ]}
        actions={
          <Link href={`/c/${companyId}/masters/customers/new`}>
            <SecondaryButton type="button">New customer</SecondaryButton>
          </Link>
        }
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All customers", count: counts.all },
          { id: "attention", label: "Need attention", count: counts.dueAttention },
          { id: "assigned", label: "Assigned", count: counts.assigned },
          { id: "credit-hold", label: "Credit hold", count: counts.creditHold },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full directory" },
              { id: "attention", label: "Collections focus" },
              { id: "credit-hold", label: "Held accounts" },
            ]}
            value={savedView}
            onValueChange={(value) => {
              setSavedView(value);
              setSegment(value);
            }}
          />
        }
      />

      <QueueToolbar
        filters={<TextField label="Search customers" value={q} onChange={setQ} placeholder="Name / email / phone" />}
        summary={
          <>
            <QueueRowStateBadge label={`${filteredCustomers.length} in view`} />
            <QueueRowStateBadge label={`${counts.assigned} assigned`} variant="outline" />
          </>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading customers…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load customers")} />
      ) : null}

      {!query.isLoading && !query.isError && filteredCustomers.length === 0 ? (
        <EmptyState
          title="No customers yet"
          hint="Create your first customer to start invoicing and tracking receivables."
          action={
            <Link href={`/c/${companyId}/masters/customers/new`}>
              <SecondaryButton type="button">Create customer</SecondaryButton>
            </Link>
          }
        />
      ) : null}

      {filteredCustomers.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected customer"
              title={selectedCustomer?.name ?? "Select customer"}
              subtitle="Review commercial ownership, credit posture, and next jump-off before opening the full customer workspace."
              footer={
                selectedCustomer ? (
                  <QueueQuickActions>
                    <Link href={`/c/${companyId}/masters/customers/${selectedCustomer.id}`}>
                      <SecondaryButton type="button">Open customer</SecondaryButton>
                    </Link>
                    <Link href={`/c/${companyId}/masters/customers/${selectedCustomer.id}/ledger`}>
                      <SecondaryButton type="button">Open ledger</SecondaryButton>
                    </Link>
                  </QueueQuickActions>
                ) : null
              }
            >
              {selectedCustomer ? (
                <>
                  <QueueQuickActions>
                    <QueueRowStateBadge label={selectedCustomer.salesperson?.name ?? selectedCustomer.salesperson?.email ?? "Unassigned"} variant="outline" />
                    {Boolean(selectedCustomer.creditHold ?? selectedCustomer.credit_hold) ? <QueueRowStateBadge label="Credit hold" /> : null}
                  </QueueQuickActions>
                  <QueueMetaList
                    items={[
                      { label: "Phone", value: selectedCustomer.phone ?? "—" },
                      { label: "Email", value: selectedCustomer.email ?? "—" },
                      { label: "Pricing tier", value: selectedCustomer.pricingTier ?? selectedCustomer.pricing_tier ?? "—" },
                      { label: "Credit limit", value: selectedCustomer.creditLimit ?? selectedCustomer.credit_limit ?? "—" },
                      { label: "Overdue amount", value: Number(selectedCustomer.summary?.credit?.overdue_amount ?? 0).toFixed(2) },
                      { label: "Open tasks", value: selectedCustomer.summary?.collections?.open_tasks_count ?? 0 },
                    ]}
                  />
                </>
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a customer to inspect ownership and credit posture.</div>
              )}
            </QueueInspector>
          }
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Name</DataTh>
                  <DataTh>Email</DataTh>
                  <DataTh>Phone</DataTh>
                  <DataTh>Salesperson</DataTh>
                  <DataTh className="text-right">Overdue</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <DataTr
                    key={c.id}
                    className={selectedCustomer?.id === c.id ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                    onClick={() => setSelectedCustomerId(c.id)}
                  >
                    <DataTd>
                      <Link
                        className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline"
                        href={`/c/${companyId}/masters/customers/${c.id}`}
                      >
                        {c.name}
                      </Link>
                    </DataTd>
                    <DataTd>{c.email ?? "—"}</DataTd>
                    <DataTd>{c.phone ?? "—"}</DataTd>
                    <DataTd>{c.salesperson?.name ?? c.salesperson?.email ?? "—"}</DataTd>
                    <DataTd className="text-right">{Number(c.summary?.credit?.overdue_amount ?? 0).toFixed(2)}</DataTd>
                  </DataTr>
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </QueueShell>
      ) : null}
    </div>
  );
}
