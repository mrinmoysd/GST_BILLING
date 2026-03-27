"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { usePurchases } from "@/lib/billing/hooks";
import { useAuth } from "@/lib/auth/session";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { SecondaryButton, TextField } from "@/lib/ui/form";
import {
  QueueInspector,
  QueueMetaList,
  QueueQuickActions,
  QueueRowStateBadge,
  QueueSavedViews,
  QueueSegmentBar,
  QueueShell,
  QueueToolbar,
} from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function PurchasesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedPurchaseId, setSelectedPurchaseId] = React.useState<string | null>(null);
  const { bootstrapped } = useAuth();
  const query = usePurchases({ companyId: companyId, q, enabled: bootstrapped });

  const payload = query.data as unknown;

  function isRecord(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === "object";
  }

  type PurchaseRow = {
    id: string;
    status?: string | null;
    purchaseDate?: string | null;
    purchase_date?: string | null;
    supplier?: { name?: string | null } | null;
    warehouse?: { name?: string | null; code?: string | null } | null;
    total?: string | number | null;
    notes?: string | null;
  };

  const rows = React.useMemo(
    () => ((isRecord(payload) && Array.isArray(payload.data) ? (payload.data as PurchaseRow[]) : []) ?? []),
    [payload],
  );

  const total =
    (isRecord(payload) && isRecord(payload.meta) && typeof payload.meta.total === "number"
      ? (payload.meta.total as number)
      : 0) ?? 0;
  const counts = React.useMemo(() => {
    const draft = rows.filter((row) => String(row.status ?? "").toUpperCase() === "DRAFT").length;
    const received = rows.filter((row) => String(row.status ?? "").toUpperCase() === "RECEIVED").length;
    const cancelled = rows.filter((row) => String(row.status ?? "").toUpperCase() === "CANCELLED").length;
    return { all: rows.length, draft, received, cancelled };
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      const status = String(row.status ?? "").toUpperCase();
      if (segment === "draft") return status === "DRAFT";
      if (segment === "received") return status === "RECEIVED";
      if (segment === "cancelled") return status === "CANCELLED";
      return true;
    });
  }, [rows, segment]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedPurchaseId(null);
      return;
    }
    if (!selectedPurchaseId || !filteredRows.some((row) => row.id === selectedPurchaseId)) {
      setSelectedPurchaseId(filteredRows[0]?.id ?? null);
    }
  }, [filteredRows, selectedPurchaseId]);

  const selectedPurchase = filteredRows.find((row) => row.id === selectedPurchaseId) ?? filteredRows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Purchase list"
        title="Purchases"
        subtitle="Review supplier-side document flow, receiving status, and purchase records from one operational table plane."
        badges={[
          <WorkspaceStatBadge key="total" label="Purchases" value={total} />,
          <WorkspaceStatBadge key="mode" label="View" value={q ? "Filtered" : "All"} variant="outline" />,
        ]}
        actions={
          <Link href={`/c/${companyId}/purchases/new`}>
            <SecondaryButton type="button">New purchase</SecondaryButton>
          </Link>
        }
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All purchases", count: counts.all },
          { id: "draft", label: "Draft", count: counts.draft },
          { id: "received", label: "Received", count: counts.received },
          { id: "cancelled", label: "Cancelled", count: counts.cancelled },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full queue" },
              { id: "draft", label: "Receiving desk" },
              { id: "received", label: "Settled stock" },
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
        filters={<TextField label="Search purchases" value={q} onChange={setQ} placeholder="Supplier / notes" />}
        summary={
          <>
            <Badge variant="secondary">{filteredRows.length} in view</Badge>
            <Badge variant="outline">{total} total</Badge>
          </>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading purchases…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load purchases")} /> : null}

      {!query.isLoading && !query.isError && filteredRows.length === 0 ? (
        <EmptyState
          title="No purchases"
          hint="Create a purchase to record incoming stock and supplier documents."
          action={
            <Link href={`/c/${companyId}/purchases/new`}>
              <SecondaryButton type="button">Create purchase</SecondaryButton>
            </Link>
          }
        />
      ) : null}

      {filteredRows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected purchase"
              title={selectedPurchase?.id ?? "Select purchase"}
              subtitle="Keep receiving status, warehouse context, and payment readiness beside the purchase queue."
              footer={
                selectedPurchase ? (
                  <QueueQuickActions>
                    <Link href={`/c/${companyId}/purchases/${selectedPurchase.id}`}>
                      <SecondaryButton type="button">Open purchase</SecondaryButton>
                    </Link>
                    <Link href={`/c/${companyId}/purchases/new`}>
                      <SecondaryButton type="button">New purchase</SecondaryButton>
                    </Link>
                  </QueueQuickActions>
                ) : null
              }
            >
              {selectedPurchase ? (
                <>
                  <QueueQuickActions>
                    <QueueRowStateBadge label={selectedPurchase.status ?? "—"} />
                    {selectedPurchase.warehouse?.name ? <Badge variant="outline">{selectedPurchase.warehouse.name}</Badge> : null}
                  </QueueQuickActions>
                  <QueueMetaList
                    items={[
                      { label: "Supplier", value: selectedPurchase.supplier?.name ?? "—" },
                      { label: "Purchase date", value: selectedPurchase.purchaseDate ?? selectedPurchase.purchase_date ?? "—" },
                      { label: "Warehouse", value: selectedPurchase.warehouse?.name ?? selectedPurchase.warehouse?.code ?? "—" },
                      { label: "Total", value: selectedPurchase.total ?? "—" },
                    ]}
                  />
                </>
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a purchase to review receiving and payable context.</div>
              )}
            </QueueInspector>
          }
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Purchase</DataTh>
                  <DataTh>Supplier</DataTh>
                  <DataTh>Status</DataTh>
                  <DataTh>Purchase date</DataTh>
                  <DataTh className="text-right">Total</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {filteredRows.map((p) => (
                  <DataTr
                    key={p.id}
                    className={selectedPurchase?.id === p.id ? "border-t border-[var(--accent-soft)] bg-[rgba(180,104,44,0.08)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                    onClick={() => setSelectedPurchaseId(p.id)}
                  >
                    <DataTd>
                      <Link className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline" href={`/c/${companyId}/purchases/${p.id}`}>
                        {p.id}
                      </Link>
                    </DataTd>
                    <DataTd>{p.supplier?.name ?? "—"}</DataTd>
                    <DataTd>
                      <QueueRowStateBadge label={p.status ?? "—"} />
                    </DataTd>
                    <DataTd>{p.purchaseDate ?? p.purchase_date ?? "—"}</DataTd>
                    <DataTd className="text-right">{p.total ?? "—"}</DataTd>
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
