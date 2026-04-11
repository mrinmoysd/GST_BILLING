"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { useDeliveryChallans } from "@/lib/billing/hooks";
import { formatDateLabel } from "@/lib/format/date";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { QueueInspector, QueueMetaList, QueueQuickActions, QueueRowStateBadge, QueueSavedViews, QueueSegmentBar, QueueShell, QueueToolbar } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function DeliveryChallansPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedChallanId, setSelectedChallanId] = React.useState<string | null>(null);
  const query = useDeliveryChallans({
    companyId,
    page: 1,
    limit: 100,
    q: q || undefined,
    status: status || undefined,
  });
  const payload = query.data?.data as unknown;
  const rows = React.useMemo(() => {
    if (Array.isArray(payload)) return payload;
    if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown[] }).data)) {
      return (payload as { data: Array<Record<string, unknown>> }).data;
    }
    return [];
  }, [payload]);

  const counts = React.useMemo(() => {
    const draft = rows.filter((row) => String(row.status ?? "").toUpperCase() === "DRAFT").length;
    const inTransit = rows.filter((row) =>
      ["PICKED", "PACKED", "DISPATCHED"].includes(String(row.status ?? "").toUpperCase()),
    ).length;
    const delivered = rows.filter((row) => String(row.status ?? "").toUpperCase() === "DELIVERED").length;
    return { all: rows.length, draft, inTransit, delivered };
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const currentStatus = String(row.status ?? "").toUpperCase();
      if (segment === "draft") return currentStatus === "DRAFT";
      if (segment === "transit") return ["PICKED", "PACKED", "DISPATCHED"].includes(currentStatus);
      if (segment === "delivered") return currentStatus === "DELIVERED";
      return true;
    });
  }, [rows, segment]);

  const columns = React.useMemo<ColumnDef<Record<string, unknown>>[]>(
    () => [
      {
        id: "challan",
        header: "Challan",
        accessorFn: (row) => String(row.challanNumber ?? row.challan_number ?? row.id ?? ""),
        meta: { label: "Challan" },
        cell: ({ row }) => (
          <Link
            className="font-semibold text-[var(--secondary)] transition hover:text-[var(--secondary-hover)]"
            href={`/c/${companyId}/sales/challans/${row.original.id}`}
          >
            {String(row.original.challanNumber ?? row.original.challan_number ?? row.original.id)}
          </Link>
        ),
      },
      {
        id: "order",
        header: "Order",
        accessorFn: (row) =>
          String((row.salesOrder as { orderNumber?: string; order_number?: string } | undefined)?.orderNumber ?? (row.salesOrder as { order_number?: string } | undefined)?.order_number ?? ""),
        meta: { label: "Order" },
        cell: ({ row }) =>
          String((row.original.salesOrder as { orderNumber?: string; order_number?: string } | undefined)?.orderNumber ?? (row.original.salesOrder as { order_number?: string } | undefined)?.order_number ?? "—"),
      },
      {
        id: "customer",
        header: "Customer",
        accessorFn: (row) => String((row.customer as { name?: string } | undefined)?.name ?? ""),
        meta: { label: "Customer" },
        cell: ({ row }) => String((row.original.customer as { name?: string } | undefined)?.name ?? "—"),
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (row) => String(row.status ?? ""),
        meta: { label: "Status" },
        cell: ({ row }) => <QueueRowStateBadge label={String(row.original.status ?? "—")} />,
      },
      {
        id: "challanDate",
        header: "Challan date",
        accessorFn: (row) => String((row as { challanDate?: string; challan_date?: string }).challanDate ?? (row as { challan_date?: string }).challan_date ?? ""),
        meta: { label: "Challan date" },
        cell: ({ row }) =>
          formatDateLabel(
            String((row.original as { challanDate?: string; challan_date?: string }).challanDate ?? (row.original as { challan_date?: string }).challan_date ?? ""),
          ),
      },
      {
        id: "warehouse",
        header: "Warehouse",
        accessorFn: (row) => String((row.warehouse as { name?: string } | undefined)?.name ?? ""),
        meta: { label: "Warehouse" },
        cell: ({ row }) => String((row.original.warehouse as { name?: string } | undefined)?.name ?? "—"),
      },
      {
        id: "invoice",
        header: "Invoice",
        accessorFn: (row) => String((row.invoice as { invoiceNumber?: string; invoice_number?: string } | undefined)?.invoiceNumber ?? (row.invoice as { invoice_number?: string } | undefined)?.invoice_number ?? ""),
        meta: { label: "Invoice" },
        cell: ({ row }) => {
          const invoice = row.original.invoice as { id?: string; invoiceNumber?: string; invoice_number?: string } | undefined;
          return invoice?.id ? (
            <Link
              className="font-medium text-[var(--secondary)] transition hover:text-[var(--secondary-hover)]"
              href={`/c/${companyId}/sales/invoices/${invoice.id}`}
              onClick={(event) => event.stopPropagation()}
            >
              {String(invoice.invoiceNumber ?? invoice.invoice_number ?? "Linked")}
            </Link>
          ) : (
            "Not invoiced"
          );
        },
      },
    ],
    [companyId],
  );

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedChallanId(null);
      return;
    }
    if (!selectedChallanId || !filteredRows.some((row) => String(row.id) === selectedChallanId)) {
      setSelectedChallanId(String(filteredRows[0]?.id ?? ""));
    }
  }, [filteredRows, selectedChallanId]);

  const selectedChallan =
    filteredRows.find((row) => String(row.id) === selectedChallanId) ?? filteredRows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Dispatch register"
        title="Delivery challans"
        subtitle="Track challan creation, warehouse handoff status, and invoice traceability in one register."
        badges={[
          <WorkspaceStatBadge key="count" label="Challans" value={rows.length} />,
          <WorkspaceStatBadge key="filter" label="View" value={status || "All"} variant="outline" />,
        ]}
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All challans", count: counts.all },
          { id: "draft", label: "Draft", count: counts.draft },
          { id: "transit", label: "In transit", count: counts.inTransit },
          { id: "delivered", label: "Delivered", count: counts.delivered },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full register" },
              { id: "transit", label: "Dispatch in motion" },
              { id: "delivered", label: "Proof of delivery" },
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
        filters={
          <div className="grid gap-4 md:grid-cols-2">
            <TextField label="Search challans" value={q} onChange={setQ} placeholder="Challan / order / customer" />
            <SelectField
              label="Status"
              value={status}
              onChange={setStatus}
              options={[
                { value: "", label: "All statuses" },
                { value: "draft", label: "Draft" },
                { value: "picked", label: "Picked" },
                { value: "packed", label: "Packed" },
                { value: "dispatched", label: "Dispatched" },
                { value: "delivered", label: "Delivered" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          </div>
        }
        summary={
          <>
            <Badge variant="secondary">{filteredRows.length} in view</Badge>
            <Badge variant="outline">{rows.length} total</Badge>
          </>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading delivery challans…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load delivery challans")} /> : null}

      {!query.isLoading && !query.isError && filteredRows.length === 0 ? (
        <EmptyState title="No delivery challans yet" hint="Create the first challan from a sales order or dispatch queue." />
      ) : null}

      {filteredRows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected challan"
              title={
                selectedChallan
                  ? String(selectedChallan.challanNumber ?? selectedChallan.challan_number ?? selectedChallan.id)
                  : "Select challan"
              }
              subtitle="Keep warehouse, invoice traceability, and delivery posture visible while you work the challan register."
              footer={
                selectedChallan ? (
                  <QueueQuickActions>
                    <Link href={`/c/${companyId}/sales/challans/${selectedChallan.id}`}>
                      <SelectActionButton label="Open challan" />
                    </Link>
                    <Link href={`/c/${companyId}/sales/dispatch`}>
                      <SelectActionButton label="Dispatch queue" />
                    </Link>
                  </QueueQuickActions>
                ) : null
              }
            >
              {selectedChallan ? (
                <>
                  <QueueQuickActions>
                    <QueueRowStateBadge label={String(selectedChallan.status ?? "—")} />
                    <Badge variant="outline">
                      {String((selectedChallan.customer as { name?: string } | undefined)?.name ?? "No customer")}
                    </Badge>
                  </QueueQuickActions>
                  <QueueMetaList
                    items={[
                      {
                        label: "Challan date",
                        value: formatDateLabel(
                          String((selectedChallan as { challanDate?: string; challan_date?: string }).challanDate ?? (selectedChallan as { challan_date?: string }).challan_date ?? ""),
                        ),
                      },
                      { label: "Warehouse", value: String((selectedChallan.warehouse as { name?: string } | undefined)?.name ?? "—") },
                      { label: "Order", value: String((selectedChallan.salesOrder as { orderNumber?: string; order_number?: string } | undefined)?.orderNumber ?? (selectedChallan.salesOrder as { order_number?: string } | undefined)?.order_number ?? "—") },
                      {
                        label: "Invoice",
                        value: String((selectedChallan.invoice as { invoiceNumber?: string; invoice_number?: string } | undefined)?.invoiceNumber ?? (selectedChallan.invoice as { invoice_number?: string } | undefined)?.invoice_number ?? "Not invoiced"),
                      },
                    ]}
                  />
                </>
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a challan to inspect warehouse posture, dispatch state, and invoice traceability.</div>
              )}
            </QueueInspector>
          }
        >
          <DataGrid
            data={filteredRows}
            columns={columns}
            getRowId={(row) => String(row.id)}
            onRowClick={(row) => setSelectedChallanId(String(row.id))}
            rowClassName={(row) =>
              String(selectedChallan?.id ?? "") === String(row.original.id)
                ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]"
                : "hover:bg-[var(--surface-secondary)]"
            }
            initialSorting={[{ id: "challanDate", desc: true }]}
            toolbarTitle="Challan register"
            toolbarDescription="Sort and trim visible columns while keeping delivery and invoice traceability beside the register."
          />
        </QueueShell>
      ) : null}
    </div>
  );
}

function SelectActionButton(props: { label: string }) {
  return (
    <div className="inline-flex h-9 items-center rounded-full border border-[var(--border)] bg-[var(--surface-panel)] px-3 text-sm font-medium text-[var(--foreground)] shadow-sm transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)]">
      {props.label}
    </div>
  );
}
