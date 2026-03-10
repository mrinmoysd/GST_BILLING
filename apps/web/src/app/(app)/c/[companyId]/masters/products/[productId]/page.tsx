"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useDeleteProduct, useProduct, useStockAdjustment, useUpdateProduct } from "@/lib/masters/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string; productId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function ProductDetailPage({ params }: Props) {
  const resolved = React.use(params);
  const router = useRouter();
  const query = useProduct({ companyId: resolved.companyId, productId: resolved.productId });
  const update = useUpdateProduct({ companyId: resolved.companyId, productId: resolved.productId });
  const del = useDeleteProduct({ companyId: resolved.companyId, productId: resolved.productId });
  const adjust = useStockAdjustment({ companyId: resolved.companyId, productId: resolved.productId });

  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [hsn, setHsn] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [taxRate, setTaxRate] = React.useState("");
  const [reorderLevel, setReorderLevel] = React.useState("");
  const [changeQty, setChangeQty] = React.useState("");
  const [note, setNote] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!query.data) return;
    const p = query.data.data;
    setName(p.name ?? "");
    setSku(p.sku ?? "");
    setHsn(p.hsn ?? "");
    setPrice(p.price !== null && p.price !== undefined ? String(p.price) : "");
  setTaxRate(p.taxRate !== null && p.taxRate !== undefined ? String(p.taxRate) : "");
    setReorderLevel(p.reorderLevel !== null && p.reorderLevel !== undefined ? String(p.reorderLevel) : "");
  }, [query.data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product"
        subtitle={
          <span>
            <code>{resolved.productId}</code>
          </span>
        }
        actions={
          <div className="flex gap-3">
            <Link className="text-sm underline" href={`/c/${resolved.companyId}/masters/products`}>
              Back
            </Link>
            <Link
              className="text-sm underline"
              href={`/c/${resolved.companyId}/masters/products/${resolved.productId}/stock-movements`}
            >
              Stock movements
            </Link>
          </div>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading product…" /> : null}
      {query.isError ? (
  <InlineError message={getErrorMessage(query.error, "Failed to load product")} />
      ) : null}
      {query.data ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border bg-white p-4 space-y-4">
            <div className="text-lg font-semibold">{query.data.data.name}</div>

            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setFormError(null);
                try {
                  await update.mutateAsync({
                    name,
                    sku: sku || null,
                    hsn: hsn || null,
                    price: price ? Number(price) : null,
                    taxRate: taxRate ? Number(taxRate) : null,
                    reorderLevel: reorderLevel ? Number(reorderLevel) : null,
                  });
                } catch (e: unknown) {
                  setFormError(getErrorMessage(e, "Failed to update product"));
                }
              }}
            >
              <TextField label="Name" value={name} onChange={setName} required />
              <TextField label="SKU" value={sku} onChange={setSku} />
              <TextField label="HSN" value={hsn} onChange={setHsn} />
              <TextField label="Price" value={price} onChange={setPrice} type="number" />
              <TextField label="Tax rate (%)" value={taxRate} onChange={setTaxRate} type="number" />
              <TextField
                label="Reorder level"
                value={reorderLevel}
                onChange={setReorderLevel}
                type="number"
              />

              {formError ? <InlineError message={formError} /> : null}

              <div className="flex gap-3">
                <PrimaryButton type="submit" disabled={update.isPending}>
                  {update.isPending ? "Saving…" : "Save"}
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
                      router.replace(`/c/${resolved.companyId}/masters/products`);
                    } catch (e: unknown) {
                      setFormError(getErrorMessage(e, "Failed to delete product"));
                    }
                  }}
                >
                  {del.isPending ? "Deleting…" : "Delete"}
                </SecondaryButton>
              </div>
            </form>
          </div>

          <div className="rounded-xl border bg-white p-4 space-y-4">
            <div>
              <div className="text-sm text-neutral-600">Current stock</div>
              <div className="text-2xl font-semibold">{query.data.data.stock ?? "—"}</div>
            </div>

            <div className="border-t pt-4">
              <div className="font-medium">Stock adjustment</div>
              <p className="text-sm text-neutral-500 mt-1">
                Add or remove stock for this product. Use negative values to reduce stock.
              </p>

              <form
                className="space-y-3 mt-3"
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
                  } catch (e: unknown) {
                    setFormError(getErrorMessage(e, "Stock adjustment failed"));
                  }
                }}
              >
                <TextField label="Change quantity" value={changeQty} onChange={setChangeQty} type="number" />
                <TextField label="Note" value={note} onChange={setNote} placeholder="Optional" />

                <PrimaryButton type="submit" disabled={adjust.isPending}>
                  {adjust.isPending ? "Applying…" : "Apply adjustment"}
                </PrimaryButton>
              </form>
            </div>
          </div>
        </div>
      ) : null}
      {!query.isLoading && !query.isError && !query.data ? <EmptyState title="Not found" /> : null}
    </div>
  );
}
