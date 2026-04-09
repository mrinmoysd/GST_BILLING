"use client";

import Link from "next/link";
import * as React from "react";

import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { useProducts } from "@/lib/masters/hooks";
import { formatQuantityWithUnit, formatUnitLabel } from "@/lib/masters/product-units";
import type { Product } from "@/lib/masters/types";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { SecondaryButton, TextField } from "@/lib/ui/form";
import { QueueInspector, QueueMetaList, QueueQuickActions, QueueRowStateBadge, QueueSavedViews, QueueSegmentBar, QueueShell, QueueToolbar } from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function ProductsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedProductId, setSelectedProductId] = React.useState("");
  const query = useProducts({ companyId: companyId, q });
  const rows = React.useMemo<Product[]>(
    () => (Array.isArray(query.data?.data) ? (query.data.data as Product[]) : []),
    [query.data],
  );
  const total = (query.data?.meta as { total?: number } | undefined)?.total ?? rows.length;

  const counts = React.useMemo(() => {
    const batchTracked = rows.filter((row) => Boolean(row.batchTrackingEnabled ?? row.batch_tracking_enabled)).length;
    const expiryTracked = rows.filter((row) => Boolean(row.expiryTrackingEnabled ?? row.expiry_tracking_enabled)).length;
    const lowStock = rows.filter((row) => {
      const stock = Number(row.stock ?? 0);
      const reorder = Number(row.reorderLevel ?? 0);
      return reorder > 0 && stock <= reorder;
    }).length;
    return { all: rows.length, batchTracked, expiryTracked, lowStock };
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      if (segment === "batch") return Boolean(row.batchTrackingEnabled ?? row.batch_tracking_enabled);
      if (segment === "expiry") return Boolean(row.expiryTrackingEnabled ?? row.expiry_tracking_enabled);
      if (segment === "low") {
        const stock = Number(row.stock ?? 0);
        const reorder = Number(row.reorderLevel ?? 0);
        return reorder > 0 && stock <= reorder;
      }
      return true;
    });
  }, [rows, segment]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedProductId("");
      return;
    }
    if (!selectedProductId || !filteredRows.some((row) => row.id === selectedProductId)) {
      setSelectedProductId(filteredRows[0]?.id ?? "");
    }
  }, [filteredRows, selectedProductId]);

  const selectedProduct = filteredRows.find((row) => row.id === selectedProductId) ?? filteredRows[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Masters"
        title="Products"
        subtitle="Run the catalog as an operating queue, with stock posture and batch policy visible before you open the full product workspace."
        badges={[
          <WorkspaceStatBadge key="total" label="Products" value={total} />,
          <WorkspaceStatBadge key="low" label="Low stock" value={counts.lowStock} variant="outline" />,
        ]}
        actions={
          <Link href={`/c/${companyId}/masters/products/new`}>
            <SecondaryButton type="button">New product</SecondaryButton>
          </Link>
        }
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All products", count: counts.all },
          { id: "batch", label: "Batch tracked", count: counts.batchTracked },
          { id: "expiry", label: "Expiry tracked", count: counts.expiryTracked },
          { id: "low", label: "Low stock", count: counts.lowStock },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full catalog" },
              { id: "batch", label: "Batch operations" },
              { id: "low", label: "Reorder focus" },
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
        filters={<TextField label="Search products" value={q} onChange={setQ} placeholder="Name / SKU / HSN" />}
        summary={
          <>
            <QueueRowStateBadge label={`${filteredRows.length} in view`} />
            <QueueRowStateBadge label={`${counts.batchTracked} batch tracked`} variant="outline" />
          </>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading products…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load products")} />
      ) : null}

  {!query.isLoading && !query.isError && filteredRows.length === 0 ? (
        <EmptyState
          title="No products yet"
          hint="Create products to build invoices, record purchases, and monitor stock."
          action={
            <Link href={`/c/${companyId}/masters/products/new`}>
              <SecondaryButton type="button">Create product</SecondaryButton>
            </Link>
          }
        />
      ) : null}

  {filteredRows.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected product"
              title={selectedProduct?.name ?? "Select product"}
              subtitle="Review catalog, stock, and batch policy before opening the full product detail."
              footer={
                selectedProduct ? (
                  <QueueQuickActions>
                    <Link href={`/c/${companyId}/masters/products/${selectedProduct.id}`}>
                      <SecondaryButton type="button">Open product</SecondaryButton>
                    </Link>
                    <Link href={`/c/${companyId}/masters/products/${selectedProduct.id}/stock-movements`}>
                      <SecondaryButton type="button">Stock movements</SecondaryButton>
                    </Link>
                  </QueueQuickActions>
                ) : null
              }
            >
              {selectedProduct ? (
                <>
                  <QueueQuickActions>
                    {Boolean(selectedProduct.batchTrackingEnabled ?? selectedProduct.batch_tracking_enabled) ? <QueueRowStateBadge label="Batch tracked" /> : null}
                    {Boolean(selectedProduct.expiryTrackingEnabled ?? selectedProduct.expiry_tracking_enabled) ? <QueueRowStateBadge label="Expiry tracked" variant="outline" /> : null}
                  </QueueQuickActions>
                  <QueueMetaList
                    items={[
                      { label: "SKU", value: selectedProduct.sku ?? "—" },
                      { label: "Unit", value: formatUnitLabel(selectedProduct.unit) },
                      { label: "HSN", value: selectedProduct.hsn ?? "—" },
                      { label: "Price", value: selectedProduct.price ?? "—" },
                      { label: "Tax rate", value: selectedProduct.taxRate ?? "—" },
                      { label: "Stock", value: formatQuantityWithUnit(selectedProduct.stock, selectedProduct.unit) },
                      { label: "Batch policy", value: selectedProduct.batchIssuePolicy ?? selectedProduct.batch_issue_policy ?? "—" },
                    ]}
                  />
                </>
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a product to inspect stock and batch policy.</div>
              )}
            </QueueInspector>
          }
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Name</DataTh>
                  <DataTh>SKU</DataTh>
                  <DataTh>HSN</DataTh>
                  <DataTh>Unit</DataTh>
                  <DataTh>Tracking</DataTh>
                  <DataTh className="text-right">Stock</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {filteredRows.map((p) => (
                  <DataTr
                    key={p.id}
                    className={selectedProduct?.id === p.id ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                    onClick={() => setSelectedProductId(p.id)}
                  >
                    <DataTd>
                      <Link
                        className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline"
                        href={`/c/${companyId}/masters/products/${p.id}`}
                      >
                        {p.name}
                      </Link>
                    </DataTd>
                    <DataTd>{p.sku ?? "—"}</DataTd>
                    <DataTd>{p.hsn ?? "—"}</DataTd>
                    <DataTd>{formatUnitLabel(p.unit)}</DataTd>
                    <DataTd>
                      {Boolean(p.batchTrackingEnabled ?? p.batch_tracking_enabled)
                        ? Boolean(p.expiryTrackingEnabled ?? p.expiry_tracking_enabled)
                          ? "Batch + expiry"
                          : "Batch"
                        : "Standard"}
                    </DataTd>
                    <DataTd className="text-right">{formatQuantityWithUnit(p.stock, p.unit)}</DataTd>
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
