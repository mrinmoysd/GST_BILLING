"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useCreatePurchase } from "@/lib/billing/hooks";
import { useProducts, useSuppliers } from "@/lib/masters/hooks";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

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
    <div className="space-y-6">
      <PageHeader
        title="New purchase"
        subtitle="Create a draft purchase."
        actions={
          <Link className="text-sm underline" href={`/c/${companyId}/purchases`}>
            Back
          </Link>
        }
      />

      <form
        className="rounded-xl border bg-white p-4 space-y-4 max-w-2xl"
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
            router.replace(`/c/${companyId}/purchases/${res.data.id}`);
          } catch (e: unknown) {
            setError(getErrorMessage(e, "Failed to create purchase"));
          }
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Supplier</label>
            <select
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Select…</option>
              {(Array.isArray(suppliers.data?.data) ? suppliers.data.data : []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Product</label>
            <div className="mt-2 text-xs text-neutral-500">Use the lines grid below to add products.</div>
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Product</th>
                <th className="text-right px-3 py-2 font-medium">Qty</th>
                <th className="text-right px-3 py-2 font-medium">Unit cost</th>
                <th className="text-right px-3 py-2 font-medium">Discount</th>
                <th className="text-right px-3 py-2 font-medium">Line total</th>
                <th className="text-right px-3 py-2 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => {
                const q = Number(l.quantity || 0);
                const uc = Number(l.unitCost || 0);
                const disc = Number(l.discount || 0);
                const lt = Math.max(0, q * uc - disc);
                return (
                  <tr key={l.id} className="border-t">
                    <td className="px-3 py-2">
                      <select
                        className="w-full rounded-md border px-2 py-1.5 text-sm"
                        value={l.productId}
                        onChange={(e) => {
                          const next = e.target.value;
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
                      >
                        <option value="">Select…</option>
                        {(Array.isArray(products.data?.data) ? products.data.data : []).map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <div className="text-xs text-neutral-500 mt-1">Line {idx + 1}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        className="w-24 rounded-md border px-2 py-1.5 text-sm text-right"
                        value={l.quantity}
                        onChange={(e) =>
                          setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, quantity: e.target.value } : x)))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        className="w-28 rounded-md border px-2 py-1.5 text-sm text-right"
                        value={l.unitCost}
                        onChange={(e) =>
                          setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, unitCost: e.target.value } : x)))
                        }
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <input
                        className="w-28 rounded-md border px-2 py-1.5 text-sm text-right"
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
                        className="text-sm underline disabled:opacity-50"
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
          <div className="ml-auto text-sm">
            <span className="text-neutral-500">Sub-total:</span> <span className="font-medium">{subTotal.toFixed(2)}</span>
          </div>
        </div>

        <TextField label="Purchase date (YYYY-MM-DD)" value={purchaseDate} onChange={setPurchaseDate} />
        <TextField label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />

        {error ? <InlineError message={error} /> : null}

        <div className="flex gap-3">
          <PrimaryButton type="submit" disabled={create.isPending}>
            {create.isPending ? "Creating…" : "Create draft"}
          </PrimaryButton>
          <SecondaryButton type="button" onClick={() => router.back()}>
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </div>
  );
}
