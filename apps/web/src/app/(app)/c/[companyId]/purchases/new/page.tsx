"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreatePurchase } from "@/lib/billing/hooks";
import { useProducts, useSuppliers } from "@/lib/masters/hooks";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { DateField, PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function NewPurchasePage({ params }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const create = useCreatePurchase({ companyId: companyId });
  const suppliers = useSuppliers({ companyId: companyId, limit: 50 });
  const products = useProducts({ companyId: companyId, limit: 50 });

  const [supplierId, setSupplierId] = React.useState("");
  const [purchaseDate, setPurchaseDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  type Line = { id: string; productId: string; quantity: string; unitCost: string; discount?: string };
  const [lines, setLines] = React.useState<Line[]>([
    { id: "l1", productId: "", quantity: "1", unitCost: "" },
  ]);

  const productsById = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; price?: string | number | null }>();
    for (const p of (Array.isArray(products.data?.data) ? products.data.data : [])) map.set(p.id, p);
    return map;
  }, [products.data]);

  const subTotal = React.useMemo(() => {
    return lines.reduce((sum, l) => {
      const q = Number(l.quantity || 0);
      const uc = Number(l.unitCost || 0);
      const disc = Number(l.discount || 0);
      return sum + Math.max(0, q * uc - disc);
    }, 0);
  }, [lines]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Purchases"
        title="New purchase"
        subtitle="Capture supplier purchases with a cleaner item-entry layout and a live draft summary."
        actions={
          <Link className="text-sm underline" href={`/c/${companyId}/purchases`}>
            Back
          </Link>
        }
      />

      <form
        className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (!supplierId) return setError("Select a supplier.");

          const clean = lines
            .map((l) => ({
              product_id: l.productId,
              quantity: l.quantity,
              unit_cost: l.unitCost,
              discount: l.discount || undefined,
            }))
            .filter((l) => l.product_id);

          if (clean.length === 0) {
            setError("Add at least one product line.");
            return;
          }

          for (const [idx, l] of clean.entries()) {
            if (!l.quantity || Number(l.quantity) <= 0) {
              setError(`Line ${idx + 1}: enter quantity.`);
              return;
            }
            if (!l.unit_cost || Number(l.unit_cost) <= 0) {
              setError(`Line ${idx + 1}: enter unit cost.`);
              return;
            }
          }

          try {
            const res = await create.mutateAsync({
              supplier_id: supplierId,
              purchase_date: purchaseDate || undefined,
              notes: notes || undefined,
              items: clean,
            });
            toast.success("Purchase draft created");
            router.replace(`/c/${companyId}/purchases/${res.data.id}`);
          } catch (e: unknown) {
            const message = getErrorMessage(e, "Failed to create purchase");
            setError(message);
            toast.error(message);
          }
        }}
      >
        <div className="space-y-6">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">Draft workflow</Badge>
            <CardTitle>Purchase builder</CardTitle>
            <CardDescription>Select the supplier, add purchased products, and review the draft before saving it.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Supplier"
              value={supplierId}
              onChange={setSupplierId}
              options={[
                { value: "", label: "Select…" },
                ...(Array.isArray(suppliers.data?.data) ? suppliers.data.data : []).map((s) => ({
                  value: s.id,
                  label: s.name,
                })),
              ]}
            />
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--muted)]">
              Use this builder to stage incoming stock before receive. Unit cost can auto-fill from the existing product price as a starting point.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>Capture the purchased products, quantities, and unit costs before saving the draft.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="min-w-[880px] w-full text-sm">
            <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em]">Product</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em]">Qty</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em]">Unit cost</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em]">Discount</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em]">Line total</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em]"> </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => {
                const q = Number(l.quantity || 0);
                const uc = Number(l.unitCost || 0);
                const disc = Number(l.discount || 0);
                const lt = Math.max(0, q * uc - disc);
                return (
                  <tr key={l.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2">
                      <SelectField
                        label=""
                        value={l.productId}
                        className="mt-0"
                        onChange={(next) => {
                          const p = productsById.get(next);
                          setLines((prev) =>
                            prev.map((x) =>
                              x.id === l.id
                                ? {
                                    ...x,
                                    productId: next,
                                    unitCost:
                                      x.unitCost || p?.price === undefined || p?.price === null
                                        ? x.unitCost
                                        : String(p.price),
                                  }
                                : x,
                            ),
                          );
                        }}
                        options={[
                          { value: "", label: "Select…" },
                          ...(Array.isArray(products.data?.data) ? products.data.data : []).map((p) => ({
                            value: p.id,
                            label: p.name,
                          })),
                        ]}
                      />
                      <div className="mt-1 text-xs text-[var(--muted)]">Line {idx + 1}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        className="w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm text-right shadow-sm"
                        value={l.quantity}
                        onChange={(e) =>
                          setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, quantity: e.target.value } : x)))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        className="w-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm text-right shadow-sm"
                        value={l.unitCost}
                        onChange={(e) =>
                          setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, unitCost: e.target.value } : x)))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        className="w-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-sm text-right shadow-sm"
                        value={l.discount ?? ""}
                        onChange={(e) =>
                          setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, discount: e.target.value } : x)))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium">{Number.isFinite(lt) ? lt.toFixed(2) : "—"}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        className="text-sm font-medium text-[var(--danger)] underline disabled:opacity-50"
                        disabled={lines.length <= 1}
                        onClick={() => setLines((prev) => prev.filter((x) => x.id !== l.id))}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <SecondaryButton
            type="button"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                { id: `l${prev.length + 1}_${Date.now()}`, productId: "", quantity: "1", unitCost: "" },
              ])
            }
          >
            Add line
          </SecondaryButton>
          <div className="ml-auto text-sm text-[var(--muted)]">
            Draft lines: <span className="font-semibold text-[var(--foreground)]">{lines.length}</span>
          </div>
        </div>

        <DateField label="Purchase date" value={purchaseDate} onChange={setPurchaseDate} />
        <TextField label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />

        {error ? <InlineError message={error} /> : null}
          </CardContent>
        </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Draft summary</CardTitle>
              <CardDescription>Live cost summary for the current purchase draft.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Sub-total</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.03em]">{subTotal.toFixed(2)}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted)]">
                Draft purchases can be received later on the detail page. This summary block will expand further once richer totals and taxes are added.
              </div>
              <div className="space-y-3 pt-2">
                <PrimaryButton type="submit" disabled={create.isPending} className="w-full">
                  {create.isPending ? "Creating…" : "Create draft"}
                </PrimaryButton>
                <SecondaryButton type="button" className="w-full" onClick={() => router.back()}>
                  Cancel
                </SecondaryButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
}
