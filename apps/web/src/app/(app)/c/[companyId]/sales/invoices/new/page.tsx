"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateInvoice } from "@/lib/billing/hooks";
import { useCustomers, useProducts } from "@/lib/masters/hooks";
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

export default function NewInvoicePage({ params }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const create = useCreateInvoice({ companyId: companyId });
  const customers = useCustomers({ companyId: companyId, limit: 50 });
  const products = useProducts({ companyId: companyId, limit: 50 });

  const [customerId, setCustomerId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  type Line = { id: string; productId: string; quantity: string; unitPrice: string; discount?: string };
  const [lines, setLines] = React.useState<Line[]>([
    { id: "l1", productId: "", quantity: "1", unitPrice: "" },
  ]);

  const productsById = React.useMemo(() => {
    const map = new Map<string, { id: string; name: string; price?: string | number | null; taxRate?: string | number | null }>();
    for (const p of (Array.isArray(products.data?.data) ? products.data.data : [])) map.set(p.id, p);
    return map;
  }, [products.data]);

  const subTotal = React.useMemo(() => {
    return lines.reduce((sum, l) => {
      const q = Number(l.quantity || 0);
      const up = Number(l.unitPrice || 0);
      const disc = Number(l.discount || 0);
      return sum + Math.max(0, q * up - disc);
    }, 0);
  }, [lines]);

  const estimatedTax = React.useMemo(() => {
    return lines.reduce((sum, l) => {
      const q = Number(l.quantity || 0);
      const up = Number(l.unitPrice || 0);
      const disc = Number(l.discount || 0);
      const taxable = Math.max(0, q * up - disc);
      const rate = Number(productsById.get(l.productId)?.taxRate || 0);
      return sum + (taxable * rate) / 100;
    }, 0);
  }, [lines, productsById]);

  const taxBreakdown = React.useMemo(() => {
    const bucket = new Map<number, { taxable: number; tax: number }>();
    for (const line of lines) {
      const quantity = Number(line.quantity || 0);
      const unitPrice = Number(line.unitPrice || 0);
      const discount = Number(line.discount || 0);
      const taxable = Math.max(0, quantity * unitPrice - discount);
      const rate = Number(productsById.get(line.productId)?.taxRate || 0);
      if (!bucket.has(rate)) bucket.set(rate, { taxable: 0, tax: 0 });
      const current = bucket.get(rate)!;
      current.taxable += taxable;
      current.tax += (taxable * rate) / 100;
    }
    return Array.from(bucket.entries())
      .map(([rate, values]) => ({ rate, taxable: values.taxable, tax: values.tax }))
      .filter((row) => row.taxable > 0)
      .sort((a, b) => a.rate - b.rate);
  }, [lines, productsById]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales"
        title="New invoice"
        subtitle="Build a draft invoice with a clearer line-item workspace, stronger summary panel, and better operational hierarchy."
        actions={
          <Link className="text-sm underline" href={`/c/${companyId}/sales/invoices`}>
            Back
          </Link>
        }
      />

      <form
        className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          if (!customerId) {
            setError("Select a customer.");
            return;
          }
          const clean = lines
            .map((l) => ({
              product_id: l.productId,
              quantity: l.quantity,
              unit_price: l.unitPrice,
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
            if (!l.unit_price || Number(l.unit_price) <= 0) {
              setError(`Line ${idx + 1}: enter unit price.`);
              return;
            }
          }

          try {
            const res = await create.mutateAsync({
              customer_id: customerId,
              notes: notes || undefined,
              items: clean,
            });
            router.replace(`/c/${companyId}/sales/invoices/${res.data.id}`);
          } catch (e: unknown) {
            setError(getErrorMessage(e, "Failed to create invoice"));
          }
        }}
      >
        <div className="space-y-6">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">Draft workflow</Badge>
            <CardTitle>Invoice builder</CardTitle>
            <CardDescription>Select a customer, add products, and review the totals before saving the draft.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Customer</label>
              <select
                className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">Select…</option>
                {(Array.isArray(customers.data?.data) ? customers.data.data : []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--muted)]">
              Add products below. Unit price auto-fills from the current product price where available, and the right-hand summary reflects draft totals in real time.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
            <CardDescription>Use the table to build the invoice body. Each row contributes to the live draft summary.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]">
              <tr>
                <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.12em]">Product</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em]">Qty</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em]">Unit price</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em]">Discount</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em]">Line total</th>
                <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-[0.12em]"> </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, idx) => {
                const q = Number(l.quantity || 0);
                const up = Number(l.unitPrice || 0);
                const disc = Number(l.discount || 0);
                const lt = Math.max(0, q * up - disc);
                return (
                  <tr key={l.id} className="border-t border-[var(--border)]">
                    <td className="px-3 py-2">
                      <select
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-sm"
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
                                    unitPrice:
                                      x.unitPrice || p?.price === undefined || p?.price === null
                                        ? x.unitPrice
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
                        value={l.unitPrice}
                        onChange={(e) =>
                          setLines((prev) => prev.map((x) => (x.id === l.id ? { ...x, unitPrice: e.target.value } : x)))
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
                { id: `l${prev.length + 1}_${Date.now()}`, productId: "", quantity: "1", unitPrice: "" },
              ])
            }
          >
            Add line
          </SecondaryButton>
          <div className="ml-auto text-sm text-[var(--muted)]">
            Draft lines: <span className="font-semibold text-[var(--foreground)]">{lines.length}</span>
          </div>
        </div>

        <TextField label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />

        {error ? <InlineError message={error} /> : null}
          </CardContent>
        </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Draft summary</CardTitle>
              <CardDescription>Live totals based on the current line items and selected products.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Sub-total</div>
                <div className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{subTotal.toFixed(2)}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Estimated tax</div>
                <div className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{estimatedTax.toFixed(2)}</div>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Draft total</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.03em]">{(subTotal + estimatedTax).toFixed(2)}</div>
              </div>

              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Tax breakdown</div>
                <div className="mt-3 space-y-2">
                  {taxBreakdown.length > 0 ? (
                    taxBreakdown.map((row) => (
                      <div key={row.rate} className="flex items-center justify-between gap-3 text-sm">
                        <div className="text-[var(--muted-strong)]">
                          {row.rate}% on {row.taxable.toFixed(2)}
                        </div>
                        <div className="font-medium text-[var(--foreground)]">{row.tax.toFixed(2)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-[var(--muted)]">Tax will appear once products with GST rates are added to the draft.</div>
                  )}
                </div>
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
