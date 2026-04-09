"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";
import { useCategories, useDeleteProduct, useProduct, useStockAdjustment, useUpdateProduct } from "@/lib/masters/hooks";
import { COMMON_PRODUCT_UNITS, formatQuantityWithUnit, formatUnitLabel } from "@/lib/masters/product-units";
import { toastError, toastSuccess } from "@/lib/toast";
import { DetailInfoList, DetailRail, DetailTabPanel, DetailTabs } from "@/lib/ui/detail";
import { EmptyState, InlineError, LoadingBlock, PageContextStrip, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string; productId: string }> };

export default function ProductDetailPage({ params }: Props) {
  const resolved = React.use(params);
  const router = useRouter();
  const query = useProduct({ companyId: resolved.companyId, productId: resolved.productId });
  const categories = useCategories({ companyId: resolved.companyId });
  const update = useUpdateProduct({ companyId: resolved.companyId, productId: resolved.productId });
  const del = useDeleteProduct({ companyId: resolved.companyId, productId: resolved.productId });
  const adjust = useStockAdjustment({ companyId: resolved.companyId, productId: resolved.productId });

  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [hsn, setHsn] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [costPrice, setCostPrice] = React.useState("");
  const [taxRate, setTaxRate] = React.useState("");
  const [reorderLevel, setReorderLevel] = React.useState("");
  const [batchTrackingEnabled, setBatchTrackingEnabled] = React.useState(false);
  const [expiryTrackingEnabled, setExpiryTrackingEnabled] = React.useState(false);
  const [batchIssuePolicy, setBatchIssuePolicy] = React.useState<"NONE" | "FIFO" | "FEFO">("NONE");
  const [nearExpiryDays, setNearExpiryDays] = React.useState("");
  const [changeQty, setChangeQty] = React.useState("");
  const [note, setNote] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!query.data) return;
    const p = query.data.data;
    setName(p.name ?? "");
    setSku(p.sku ?? "");
    setHsn(p.hsn ?? "");
    setUnit(p.unit ?? "");
    setCategoryId(p.categoryId ?? "");
    setPrice(p.price !== null && p.price !== undefined ? String(p.price) : "");
    setCostPrice(
      p.costPrice !== null && p.costPrice !== undefined ? String(p.costPrice) : "",
    );
  setTaxRate(p.taxRate !== null && p.taxRate !== undefined ? String(p.taxRate) : "");
    setReorderLevel(p.reorderLevel !== null && p.reorderLevel !== undefined ? String(p.reorderLevel) : "");
    setBatchTrackingEnabled(Boolean(p.batchTrackingEnabled ?? p.batch_tracking_enabled));
    setExpiryTrackingEnabled(Boolean(p.expiryTrackingEnabled ?? p.expiry_tracking_enabled));
    setBatchIssuePolicy(
      ((p.batchIssuePolicy ?? p.batch_issue_policy ?? "NONE") as "NONE" | "FIFO" | "FEFO"),
    );
    setNearExpiryDays(
      p.nearExpiryDays !== null && p.nearExpiryDays !== undefined
        ? String(p.nearExpiryDays)
        : p.near_expiry_days !== null && p.near_expiry_days !== undefined
          ? String(p.near_expiry_days)
          : "",
    );
  }, [query.data]);

  const product = query.data?.data;
  const productDetailRail = product ? (
    <>
      <DetailRail
        eyebrow="Quick actions"
        title="Product workspace"
        subtitle="Move into stock history or the broader catalog without losing the current item context."
      >
        <div className="flex flex-col gap-2">
          <Link href={`/c/${resolved.companyId}/masters/products`}>
            <SecondaryButton type="button" className="w-full justify-start">Back to products</SecondaryButton>
          </Link>
          <Link href={`/c/${resolved.companyId}/masters/products/${resolved.productId}/stock-movements`}>
            <SecondaryButton type="button" className="w-full justify-start">Open stock movements</SecondaryButton>
          </Link>
        </div>
      </DetailRail>
      <DetailRail
        eyebrow="Inventory snapshot"
        title="Current stock posture"
        subtitle="Keep the stock and replenishment signals visible while switching between tabs."
      >
        <DetailInfoList
          items={[
            { label: "Current stock", value: String(product.stock ?? "—") },
            { label: "Stock with unit", value: formatQuantityWithUnit(product.stock, product.unit) },
            { label: "Reorder level", value: String(product.reorderLevel ?? "Not set") },
            {
              label: "Batch policy",
              value:
                product.batchTrackingEnabled || product.batch_tracking_enabled
                  ? String(product.batchIssuePolicy ?? product.batch_issue_policy ?? "NONE")
                  : "Not tracked",
            },
            { label: "Near expiry days", value: String(product.nearExpiryDays ?? product.near_expiry_days ?? "Not set") },
          ]}
        />
      </DetailRail>
    </>
  ) : null;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Masters"
        title={product?.name ?? "Product"}
        subtitle="Review product metadata and stock controls from a more structured detail view."
        badges={[
          <Badge key="sku" variant="secondary">{product?.sku ?? "No SKU"}</Badge>,
          <Badge key="unit" variant="outline">{formatUnitLabel(product?.unit)}</Badge>,
          <Badge key="batch" variant="outline">
            {product?.batchTrackingEnabled || product?.batch_tracking_enabled
              ? product?.batchIssuePolicy ?? product?.batch_issue_policy ?? "NONE"
              : "No batch tracking"}
          </Badge>,
        ]}
        actions={
          <div className="flex gap-3">
            <Link href={`/c/${resolved.companyId}/masters/products`}>
              <SecondaryButton type="button">Back</SecondaryButton>
            </Link>
            <Link href={`/c/${resolved.companyId}/masters/products/${resolved.productId}/stock-movements`}>
              <SecondaryButton type="button">Stock movements</SecondaryButton>
            </Link>
          </div>
        }
        context={
          product ? (
            <PageContextStrip>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Current stock</div>
                  <div className="mt-2 text-xl font-semibold">{product.stock ?? "—"}</div>
                  <div className="mt-1 text-xs text-[var(--muted)]">{formatQuantityWithUnit(product.stock, product.unit)}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Default sell price</div>
                  <div className="mt-2 text-xl font-semibold">{product.price ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Default cost price</div>
                  <div className="mt-2 text-xl font-semibold">{product.costPrice ?? "—"}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Tax rate</div>
                  <div className="mt-2 text-xl font-semibold">{product.taxRate ?? "—"}%</div>
                </div>
              </div>
            </PageContextStrip>
          ) : null
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading product…" /> : null}
      {query.isError ? (
  <InlineError message={getErrorMessage(query.error, "Failed to load product")} />
      ) : null}
      {product ? (
        <DetailTabs
          defaultValue="overview"
          items={[
            { id: "overview", label: "Overview" },
            { id: "inventory", label: "Inventory" },
            { id: "edit", label: "Edit" },
          ]}
        >
          <DetailTabPanel value="overview" rail={productDetailRail}>
            <Card className="[background-image:var(--surface-highlight)]">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">Catalog profile</Badge>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>Product id: <code>{resolved.productId}</code></CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">SKU</div>
                    <div className="mt-2 text-sm font-medium">{product.sku ?? "Not set"}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">HSN</div>
                    <div className="mt-2 text-sm font-medium">{product.hsn ?? "Not set"}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Unit</div>
                    <div className="mt-2 text-sm font-medium">{formatUnitLabel(product.unit)}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Current stock</div>
                    <div className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{formatQuantityWithUnit(product.stock, product.unit)}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Tax rate</div>
                    <div className="mt-2 text-sm font-medium">{product.taxRate ?? "—"}%</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)] [background-image:var(--surface-highlight)]">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Batch mode</div>
                    <div className="mt-2 text-sm font-medium">
                      {product.batchTrackingEnabled || product.batch_tracking_enabled
                        ? `${product.batchIssuePolicy ?? product.batch_issue_policy ?? "NONE"}`
                        : "Not tracked"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </DetailTabPanel>

          <DetailTabPanel value="inventory" rail={productDetailRail}>
            <Card>
              <CardHeader>
                <CardTitle>Stock adjustment</CardTitle>
                <CardDescription>Add or remove stock for this product. Use negative values to reduce stock.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_auto]"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setFormError(null);
                    const qty = Number(changeQty);
                    if (!Number.isFinite(qty) || qty === 0) {
                      setFormError("Enter a non-zero quantity.");
                      return;
                    }
                    try {
                      await adjust.mutateAsync({ changeQty: qty, note: note || undefined });
                      setChangeQty("");
                      setNote("");
                      toastSuccess("Stock adjusted.");
                    } catch (e: unknown) {
                      const message = getErrorMessage(e, "Stock adjustment failed.");
                      setFormError(message);
                      toastError(e, {
                        fallback: "Stock adjustment failed.",
                        title: message,
                        context: "product-stock-adjust",
                        metadata: { companyId: resolved.companyId, productId: resolved.productId },
                      });
                    }
                  }}
                >
                  <TextField label="Change quantity" value={changeQty} onChange={setChangeQty} type="number" />
                  <TextField label="Note" value={note} onChange={setNote} placeholder="Optional" />
                  <div className="flex items-end">
                    <PrimaryButton type="submit" disabled={adjust.isPending}>
                      {adjust.isPending ? "Applying…" : "Apply adjustment"}
                    </PrimaryButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          </DetailTabPanel>

          <DetailTabPanel value="edit" rail={productDetailRail}>
            <Card>
              <CardHeader>
                <CardTitle>Edit product</CardTitle>
                <CardDescription>Update product defaults, GST posture, and reorder settings. Time-based sell price changes still belong in pricing rules.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setFormError(null);
                    try {
                      await update.mutateAsync({
                        name,
                        sku: sku || null,
                        hsn: hsn || null,
                        unit: unit || null,
                        categoryId: categoryId || null,
                        price: price ? Number(price) : null,
                        costPrice: costPrice ? Number(costPrice) : null,
                        gstRate: taxRate ? Number(taxRate) : null,
                        reorderLevel: reorderLevel ? Number(reorderLevel) : null,
                        batchTrackingEnabled,
                        expiryTrackingEnabled: batchTrackingEnabled ? expiryTrackingEnabled : false,
                        batchIssuePolicy: batchTrackingEnabled ? batchIssuePolicy : "NONE",
                        nearExpiryDays:
                          batchTrackingEnabled && expiryTrackingEnabled && nearExpiryDays
                            ? Number(nearExpiryDays)
                            : null,
                      });
                      toastSuccess("Product updated.");
                    } catch (e: unknown) {
                      const message = getErrorMessage(e, "Failed to update product.");
                      setFormError(message);
                      toastError(e, {
                        fallback: "Failed to update product.",
                        title: message,
                        context: "product-update",
                        metadata: { companyId: resolved.companyId, productId: resolved.productId },
                      });
                    }
                  }}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <TextField label="Name" value={name} onChange={setName} required />
                    <TextField label="SKU" value={sku} onChange={setSku} />
                    <TextField label="HSN" value={hsn} onChange={setHsn} />
                    <SelectField label="Unit" value={unit} onChange={setUnit}>
                      <option value="">Select unit</option>
                      {COMMON_PRODUCT_UNITS.map((itemUnit) => (
                        <option key={itemUnit} value={itemUnit}>
                          {itemUnit}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField label="Category" value={categoryId} onChange={setCategoryId}>
                      <option value="">Uncategorized</option>
                      {categories.data?.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </SelectField>
                    <TextField label="Price" value={price} onChange={setPrice} type="number" />
                    <TextField label="Cost price" value={costPrice} onChange={setCostPrice} type="number" />
                    <TextField label="Tax rate (%)" value={taxRate} onChange={setTaxRate} type="number" />
                    <TextField label="Reorder level" value={reorderLevel} onChange={setReorderLevel} type="number" />
                    <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={batchTrackingEnabled}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setBatchTrackingEnabled(next);
                          if (!next) {
                            setExpiryTrackingEnabled(false);
                            setBatchIssuePolicy("NONE");
                            setNearExpiryDays("");
                          }
                        }}
                      />
                      Batch tracking enabled
                    </label>
                    <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
                      <input type="checkbox" checked={expiryTrackingEnabled} disabled={!batchTrackingEnabled} onChange={(e) => setExpiryTrackingEnabled(e.target.checked)} />
                      Expiry tracking enabled
                    </label>
                    <SelectField
                      label="Batch issue policy"
                      value={batchIssuePolicy}
                      onChange={(value) => setBatchIssuePolicy(value as "NONE" | "FIFO" | "FEFO")}
                    >
                      <option value="NONE">No enforced policy</option>
                      <option value="FIFO">FIFO</option>
                      <option value="FEFO">FEFO</option>
                    </SelectField>
                    <TextField label="Near expiry days" value={nearExpiryDays} onChange={setNearExpiryDays} type="number" />
                  </div>

                  {formError ? <InlineError message={formError} /> : null}

                  <div className="flex flex-wrap gap-3">
                    <PrimaryButton type="submit" disabled={update.isPending}>
                      {update.isPending ? "Saving…" : "Save changes"}
                    </PrimaryButton>
                    <SecondaryButton
                      type="button"
                      disabled={del.isPending}
                      onClick={async () => {
                        setFormError(null);
                        const ok = window.confirm("Delete this product? This cannot be undone.");
                        if (!ok) return;
                        try {
                          await del.mutateAsync();
                          toastSuccess("Product deleted.");
                          router.replace(`/c/${resolved.companyId}/masters/products`);
                        } catch (e: unknown) {
                          const message = getErrorMessage(e, "Failed to delete product.");
                          setFormError(message);
                          toastError(e, {
                            fallback: "Failed to delete product.",
                            title: message,
                            context: "product-delete",
                            metadata: { companyId: resolved.companyId, productId: resolved.productId },
                          });
                        }
                      }}
                    >
                      {del.isPending ? "Deleting…" : "Delete"}
                    </SecondaryButton>
                  </div>
                </form>
              </CardContent>
            </Card>
          </DetailTabPanel>
        </DetailTabs>
      ) : null}
      {!query.isLoading && !query.isError && !query.data ? <EmptyState title="Not found" /> : null}
    </div>
  );
}
