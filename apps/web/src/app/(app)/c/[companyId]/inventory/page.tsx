"use client";

import * as React from "react";

import Link from "next/link";

import { useLowStock } from "@/lib/masters/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { SecondaryButton } from "@/lib/ui/form";
import {
  QueueInspector,
  QueueMetaList,
  QueueQuickActions,
  QueueSavedViews,
  QueueSegmentBar,
  QueueShell,
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

export default function InventoryPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedProductId, setSelectedProductId] = React.useState("");
  const low = useLowStock({ companyId: companyId, threshold: 0 });
  const items = React.useMemo(
    () => (Array.isArray(low.data?.data) ? low.data.data : []),
    [low.data],
  );
  const counts = React.useMemo(() => {
    const critical = items.filter((item) => Number(item.stock ?? 0) <= 0).length;
    const reorderGap = items.filter((item) => Number(item.stock ?? 0) <= Number(item.reorderLevel ?? 0)).length;
    return { all: items.length, critical, reorderGap };
  }, [items]);
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      if (segment === "critical") return Number(item.stock ?? 0) <= 0;
      if (segment === "reorder-gap") return Number(item.stock ?? 0) <= Number(item.reorderLevel ?? 0);
      return true;
    });
  }, [items, segment]);

  React.useEffect(() => {
    if (!filteredItems.length) {
      setSelectedProductId("");
      return;
    }
    if (!selectedProductId || !filteredItems.some((item) => item.id === selectedProductId)) {
      setSelectedProductId(filteredItems[0]?.id ?? "");
    }
  }, [filteredItems, selectedProductId]);

  const selectedItem = filteredItems.find((item) => item.id === selectedProductId) ?? filteredItems[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Inventory"
        title="Stock watch"
        subtitle="Work shortage, reorder, and batch-sensitive follow-up from one inventory control workspace instead of hopping across disconnected stock pages."
        badges={[
          <WorkspaceStatBadge key="flagged" label="Flagged items" value={items.length} />,
          <WorkspaceStatBadge key="critical" label="Critical" value={counts.critical} variant="outline" />,
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/c/${companyId}/inventory/batches`}>
              <SecondaryButton type="button">Batch stock</SecondaryButton>
            </Link>
            <Link href={`/c/${companyId}/inventory/transfers`}>
              <SecondaryButton type="button">Transfers</SecondaryButton>
            </Link>
            <Link href={`/c/${companyId}/inventory/movements`}>
              <SecondaryButton type="button">Movements</SecondaryButton>
            </Link>
            <Link href={`/c/${companyId}/inventory/adjustments`}>
              <SecondaryButton type="button">Adjustments</SecondaryButton>
            </Link>
          </div>
        }
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "Flagged stock", count: counts.all },
          { id: "critical", label: "Out of stock", count: counts.critical },
          { id: "reorder-gap", label: "Below reorder", count: counts.reorderGap },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Control room" },
              { id: "critical", label: "Urgent shortage" },
              { id: "reorder-gap", label: "Buyer follow-up" },
            ]}
            value={savedView}
            onValueChange={(value) => {
              setSavedView(value);
              setSegment(value);
            }}
          />
        }
      />

      {low.isLoading ? <LoadingBlock label="Loading low stock…" /> : null}
      {low.isError ? <InlineError message={getErrorMessage(low.error, "Failed to load")} /> : null}
      {!low.isLoading && !low.isError && filteredItems.length === 0 ? (
        <EmptyState title="No low stock items" hint="All products are above reorder level." />
      ) : null}

      {filteredItems.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected item"
              title={selectedItem?.name ?? "Select product"}
              subtitle="Use the inspector as the fast jump point into batches, transfers, and the product workspace."
              footer={
                selectedItem ? (
                  <QueueQuickActions>
                    <Link href={`/c/${companyId}/masters/products/${selectedItem.id}`}>
                      <SecondaryButton type="button">Open product</SecondaryButton>
                    </Link>
                    <Link href={`/c/${companyId}/inventory/batches`}>
                      <SecondaryButton type="button">Open batches</SecondaryButton>
                    </Link>
                  </QueueQuickActions>
                ) : null
              }
            >
              {selectedItem ? (
                <>
                  <QueueMetaList
                    items={[
                      { label: "Current stock", value: selectedItem.stock ?? "—" },
                      { label: "Reorder level", value: selectedItem.reorderLevel ?? "—" },
                      { label: "Gap", value: Math.max(0, Number(selectedItem.reorderLevel ?? 0) - Number(selectedItem.stock ?? 0)) },
                    ]}
                  />
                  <div className="rounded-2xl bg-[var(--surface-muted)] px-4 py-3 text-sm leading-6 text-[var(--muted)]">
                    Work warehouse transfers, batch availability, and replenishment decisions from the linked inventory pages.
                  </div>
                </>
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a product to review the shortage posture.</div>
              )}
            </QueueInspector>
          }
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Product</DataTh>
                  <DataTh>Stock</DataTh>
                  <DataTh>Reorder level</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {filteredItems.map((p) => (
                  <DataTr
                    key={p.id}
                    className={selectedItem?.id === p.id ? "border-t border-[var(--accent-soft)] bg-[rgba(180,104,44,0.08)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                    onClick={() => setSelectedProductId(p.id)}
                  >
                    <DataTd>
                      <Link className="font-medium text-[var(--accent)] hover:underline" href={`/c/${companyId}/masters/products/${p.id}`}>
                        {p.name}
                      </Link>
                    </DataTd>
                    <DataTd>{p.stock ?? "—"}</DataTd>
                    <DataTd>{p.reorderLevel ?? "—"}</DataTd>
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
