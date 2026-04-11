"use client";

import * as React from "react";

import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

import { useLowStock } from "@/lib/masters/hooks";
import {
  ChartEmptyState,
  ChartFrame,
  ChartLegend,
  ChartShell,
  ChartTooltip,
  formatChartCompactNumber,
  formatChartNumber,
  getChartAxisColor,
  getChartGridColor,
  getChartSeriesColor,
} from "@/lib/ui/chart";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { SecondaryButton } from "@/lib/ui/form";
import { StatCard } from "@/lib/ui/stat";
import {
  QueueInspector,
  QueueMetaList,
  QueueQuickActions,
  QueueSavedViews,
  QueueSegmentBar,
  QueueShell,
} from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


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
  const shortageUnits = React.useMemo(
    () =>
      items.reduce((sum, item) => {
        const reorderLevel = Number(item.reorderLevel ?? 0);
        const stock = Number(item.stock ?? 0);
        return sum + Math.max(0, reorderLevel - stock);
      }, 0),
    [items],
  );
  const topGapItems = React.useMemo(
    () =>
      [...items]
        .map((item) => ({
          id: item.id,
          name: item.name,
          gap: Math.max(0, Number(item.reorderLevel ?? 0) - Number(item.stock ?? 0)),
          stock: Number(item.stock ?? 0),
        }))
        .sort((left, right) => right.gap - left.gap)
        .slice(0, 6),
    [items],
  );
  const severityMix = React.useMemo(
    () => [
      { name: "Out of stock", value: counts.critical },
      { name: "Below reorder", value: Math.max(0, counts.reorderGap - counts.critical) },
    ].filter((item) => item.value > 0),
    [counts.critical, counts.reorderGap],
  );

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

      <WorkspaceSection
        eyebrow="Control room"
        title="Inventory attention profile"
        subtitle="Use the overview to decide whether the next move is replenishment, transfer, or batch review."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Flagged items" value={items.length} hint="Products visible in the current shortage watch." />
          <StatCard label="Out of stock" value={counts.critical} hint="Products currently at zero or negative stock." tone="quiet" />
          <StatCard label="Below reorder" value={counts.reorderGap} hint="Products already under their reorder line." tone="quiet" />
          <StatCard label="Shortage units" value={shortageUnits} hint="Aggregate reorder gap across flagged products." tone="strong" />
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {topGapItems.length > 0 ? (
            <ChartShell title="Largest reorder gaps" subtitle="Which products need the quickest buyer or transfer decision.">
              <ChartFrame height={250}>
                <BarChart data={topGapItems} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid horizontal={false} stroke={getChartGridColor()} />
                  <XAxis type="number" tickFormatter={formatChartCompactNumber} tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: getChartAxisColor(), fontSize: 12 }} axisLine={false} tickLine={false} width={108} />
                  <ChartTooltip valueFormatter={formatChartNumber} />
                  <Bar dataKey="gap" name="Gap units" fill={getChartSeriesColor("warning")} radius={[0, 8, 8, 0]} />
                </BarChart>
              </ChartFrame>
            </ChartShell>
          ) : (
            <ChartEmptyState title="Largest reorder gaps" hint="Gap analysis appears once low-stock products are present." />
          )}

          {severityMix.length > 0 ? (
            <ChartShell
              title="Shortage severity"
              subtitle="How the current issue mix splits between true stock-outs and reorder pressure."
              footer={<ChartLegend items={severityMix.map((item, index) => ({ label: item.name, tone: index === 0 ? "danger" : "warning", value: item.value }))} />}
            >
              <ChartFrame height={250}>
                <PieChart>
                  <Pie data={severityMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} paddingAngle={2}>
                    {severityMix.map((_, index) => (
                      <Cell key={severityMix[index]?.name ?? index} fill={index === 0 ? getChartSeriesColor("danger") : getChartSeriesColor("warning")} />
                    ))}
                  </Pie>
                  <ChartTooltip valueFormatter={formatChartNumber} />
                </PieChart>
              </ChartFrame>
            </ChartShell>
          ) : (
            <ChartEmptyState title="Shortage severity" hint="Severity mix will appear when flagged inventory exists." />
          )}

          <ChartShell
            title="Action routing"
            subtitle="Use the overview to route operators into the correct inventory workflow instead of scanning multiple pages."
            footer="Transfers solve location imbalance, batches handle lot visibility, and adjustments handle corrections."
          >
            <div className="grid gap-3">
              <Link href={`/c/${companyId}/inventory/transfers`} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)]">
                <div className="text-sm font-semibold text-[var(--foreground)]">Warehouse transfers</div>
                <div className="mt-1 text-sm text-[var(--muted)]">Rebalance stock across active locations.</div>
              </Link>
              <Link href={`/c/${companyId}/inventory/batches`} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)]">
                <div className="text-sm font-semibold text-[var(--foreground)]">Batch review</div>
                <div className="mt-1 text-sm text-[var(--muted)]">Check lot posture before buying or moving stock.</div>
              </Link>
              <Link href={`/c/${companyId}/inventory/movements`} className="rounded-[16px] border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 shadow-[var(--shadow-soft)] transition hover:border-[var(--border-strong)]">
                <div className="text-sm font-semibold text-[var(--foreground)]">Movement audit</div>
                <div className="mt-1 text-sm text-[var(--muted)]">Inspect direction and quantity before adjusting stock.</div>
              </Link>
            </div>
          </ChartShell>
        </div>
      </WorkspaceSection>

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
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-4 py-3 text-sm leading-6 text-[var(--muted)] shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
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
                    className={selectedItem?.id === p.id ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]" : "cursor-pointer hover:bg-[var(--surface-secondary)]"}
                    onClick={() => setSelectedProductId(p.id)}
                  >
                    <DataTd>
                      <Link className="font-medium text-[var(--secondary)] transition hover:text-[var(--secondary-hover)]" href={`/c/${companyId}/masters/products/${p.id}`}>
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
