"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCreateInvoice } from "@/lib/billing/hooks";
import { useBatchStock, useCustomers, useProducts, useWarehouses } from "@/lib/masters/hooks";
import { usePricingPreview } from "@/lib/pricing/hooks";
import { useCompanySalespeople } from "@/lib/settings/usersHooks";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function formatPricingSource(source?: string | null) {
  switch (source) {
    case "customer_product_price":
      return "Customer special price";
    case "pricing_tier_price_list":
      return "Pricing tier price list";
    case "global_price_list":
      return "Global price list";
    case "product_price":
      return "Product price";
    case "manual_override":
      return "Manual override";
    default:
      return "Resolved price";
  }
}

export default function NewInvoicePage({ params }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const create = useCreateInvoice({ companyId: companyId });
  const customers = useCustomers({ companyId: companyId, limit: 50 });
  const products = useProducts({ companyId: companyId, limit: 50 });
  const warehouses = useWarehouses({ companyId, activeOnly: true });
  const salespeople = useCompanySalespeople(companyId);
  const { mutateAsync: previewPricing, isPending: isPricingPreviewPending } = usePricingPreview({ companyId });

  const [customerId, setCustomerId] = React.useState("");
  const [salespersonUserId, setSalespersonUserId] = React.useState("");
  const [warehouseId, setWarehouseId] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const batchStock = useBatchStock({
    companyId,
    warehouseId: warehouseId || undefined,
    page: 1,
    limit: 200,
    enabled: Boolean(warehouseId),
  });

  type Line = {
    id: string;
    productId: string;
    quantity: string;
    unitPrice: string;
    discount?: string;
    overrideReason?: string;
    resolvedUnitPrice?: string;
    resolvedDiscount?: string;
    pricingSource?: string;
    pricingHint?: string;
    batchAllocations: Array<{
      id: string;
      productBatchId: string;
      quantity: string;
    }>;
  };
  const [lines, setLines] = React.useState<Line[]>([
    { id: "l1", productId: "", quantity: "1", unitPrice: "", batchAllocations: [] },
  ]);

  const productsById = React.useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        price?: string | number | null;
        taxRate?: string | number | null;
        batchTrackingEnabled?: boolean;
        batch_tracking_enabled?: boolean;
      }
    >();
    for (const p of (Array.isArray(products.data?.data) ? products.data.data : [])) map.set(p.id, p);
    return map;
  }, [products.data]);
  const batchRows = batchStock.data?.data.data ?? [];

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

  const previewableLines = React.useMemo(
    () =>
      lines
        .filter((line) => line.productId && Number(line.quantity || 0) > 0)
        .map((line) => ({
          id: line.id,
          productId: line.productId,
          quantity: line.quantity || "0",
        })),
    [lines],
  );

  const pricingSignature = React.useMemo(
    () =>
      JSON.stringify(
        previewableLines.map((line) => ({
          id: line.id,
          productId: line.productId,
          quantity: line.quantity,
        })),
      ),
    [previewableLines],
  );

  React.useEffect(() => {
    const previewInput = pricingSignature
      ? (JSON.parse(pricingSignature) as Array<{
          id: string;
          productId: string;
          quantity: string;
        }>)
      : [];

    if (!customerId) {
      setLines((prev) => {
        let changed = false;
        const next = prev.map((line) => {
          if (!line.resolvedUnitPrice && !line.resolvedDiscount && !line.pricingSource && !line.pricingHint) return line;
          changed = true;
          return {
            ...line,
            resolvedUnitPrice: undefined,
            resolvedDiscount: undefined,
            pricingSource: undefined,
            pricingHint: undefined,
          };
        });
        return changed ? next : prev;
      });
      return;
    }

    if (previewInput.length === 0) return;

    let cancelled = false;
    previewPricing({
        customer_id: customerId,
        document_type: "invoice",
        items: previewInput.map((line) => ({
          product_id: line.productId,
          quantity: line.quantity,
        })),
      })
      .then((response) => {
        if (cancelled) return;
        const previewRows = Array.isArray(response.data) ? response.data : [];
        const rowsByLineId = new Map(
          previewInput.map((line, index) => [line.id, previewRows[index]]),
        );

        setLines((prev) => {
          let changed = false;
          const next = prev.map((line) => {
            const match = rowsByLineId.get(line.id);
            if (!match) return line;

            const resolvedUnitPrice = match.resolved_unit_price;
            const resolvedDiscount = match.resolved_discount ?? "0";
            const nextUnitPrice =
              !line.unitPrice || line.unitPrice === line.resolvedUnitPrice
                ? resolvedUnitPrice
                : line.unitPrice;
            const nextDiscount =
              !line.discount || line.discount === line.resolvedDiscount
                ? resolvedDiscount
                : line.discount;
            const schemeLabel =
              Array.isArray(match.applied_schemes) && match.applied_schemes.length > 0
                ? ` · Scheme: ${match.applied_schemes.map((scheme) => scheme.name).join(", ")}`
                : "";
            const pricingHint = `Auto price: ${Number(resolvedUnitPrice || 0).toFixed(2)} from ${match.source_label || formatPricingSource(match.source)}${schemeLabel}`;

            if (
              line.unitPrice === nextUnitPrice &&
              String(line.discount ?? "") === String(nextDiscount ?? "") &&
              line.resolvedUnitPrice === resolvedUnitPrice &&
              line.resolvedDiscount === resolvedDiscount &&
              line.pricingSource === match.source &&
              line.pricingHint === pricingHint
            ) {
              return line;
            }

            changed = true;
            return {
              ...line,
              unitPrice: nextUnitPrice,
              discount: nextDiscount,
              resolvedUnitPrice,
              resolvedDiscount,
              pricingSource: match.source,
              pricingHint,
            };
          });

          return changed ? next : prev;
        });
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [customerId, previewPricing, pricingSignature]);

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
              override_reason: l.overrideReason || undefined,
              batch_allocations:
                l.batchAllocations.length > 0
                  ? l.batchAllocations
                      .filter((allocation) => allocation.productBatchId && Number(allocation.quantity || 0) > 0)
                      .map((allocation) => ({
                        product_batch_id: allocation.productBatchId,
                        quantity: allocation.quantity,
                      }))
                  : undefined,
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
            const product = productsById.get(l.product_id);
            const batchTrackingEnabled = Boolean(
              product?.batchTrackingEnabled ?? product?.batch_tracking_enabled,
            );
            if (batchTrackingEnabled && l.batch_allocations?.length) {
              if (!warehouseId) {
                setError("Select a warehouse before choosing preferred batches.");
                return;
              }
              const invalidBatch = l.batch_allocations.find(
                (allocation) =>
                  !allocation.product_batch_id || Number(allocation.quantity || 0) <= 0,
              );
              if (invalidBatch) {
                setError(`Line ${idx + 1}: complete preferred batch quantities.`);
                return;
              }
            }
          }

          try {
            const res = await create.mutateAsync({
              customer_id: customerId,
              salesperson_user_id: salespersonUserId || undefined,
              warehouse_id: warehouseId || undefined,
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
            <SelectField
              label="Customer"
              value={customerId}
              onChange={setCustomerId}
              options={[
                { value: "", label: "Select…" },
                ...((Array.isArray(customers.data?.data) ? customers.data.data : []).map((c) => ({
                  value: c.id,
                  label: c.name,
                }))),
              ]}
            />
            <SelectField
              label="Salesperson"
              value={salespersonUserId}
              onChange={setSalespersonUserId}
              options={[
                { value: "", label: "Inherit from customer / unassigned" },
                ...((Array.isArray(salespeople.data?.data) ? salespeople.data.data : []).map((person) => ({
                  value: person.id,
                  label: person.name || person.email,
                }))),
              ]}
            />
            <SelectField
              label="Warehouse"
              value={warehouseId}
              onChange={setWarehouseId}
              options={[
                { value: "", label: "Select warehouse (optional)" },
                ...((Array.isArray(warehouses.data?.data.data) ? warehouses.data.data.data : []).map((warehouse: { id: string; name: string }) => ({
                  value: warehouse.id,
                  label: warehouse.name,
                }))),
              ]}
            />
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
                const product = productsById.get(l.productId);
                const batchTrackingEnabled = Boolean(
                  product?.batchTrackingEnabled ?? product?.batch_tracking_enabled,
                );
                const productBatchRows = batchRows.filter(
                  (row) => row.productBatch?.product?.id === l.productId,
                );
                const hasCommercialOverride =
                  (l.resolvedUnitPrice && l.unitPrice && l.unitPrice !== l.resolvedUnitPrice) ||
                  disc > 0;
                return (
                  <React.Fragment key={l.id}>
                  <tr className="border-t border-[var(--border)]">
                    <td className="px-3 py-2">
                      <select
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-sm"
                        value={l.productId}
                        onChange={(e) => {
                          const next = e.target.value;
                          setLines((prev) =>
                            prev.map((x) =>
                              x.id === l.id
                                ? {
                                    ...x,
                                    productId: next,
                                    resolvedUnitPrice: undefined,
                                    resolvedDiscount: undefined,
                                    pricingSource: undefined,
                                    pricingHint: undefined,
                                    batchAllocations:
                                      (productsById.get(next)?.batchTrackingEnabled ??
                                        productsById.get(next)?.batch_tracking_enabled)
                                        ? x.batchAllocations
                                        : [],
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
                      {l.productId ? (
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          {l.pricingHint ||
                              (customerId
                              ? isPricingPreviewPending
                                ? "Resolving price..."
                                : "Price will resolve after the next commercial change."
                              : "Select a customer to preview pricing.")}
                        </div>
                      ) : null}
                      {hasCommercialOverride ? (
                        <div className="mt-2">
                          <input
                            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-sm"
                            value={l.overrideReason ?? ""}
                            onChange={(e) =>
                              setLines((prev) =>
                                prev.map((x) =>
                                  x.id === l.id ? { ...x, overrideReason: e.target.value } : x,
                                ),
                              )
                            }
                            placeholder="Why are you overriding the commercial value?"
                          />
                        </div>
                      ) : null}
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
                          setLines((prev) =>
                            prev.map((x) =>
                              x.id === l.id
                                ? {
                                    ...x,
                                    unitPrice: e.target.value,
                                    pricingSource:
                                      x.resolvedUnitPrice && e.target.value !== x.resolvedUnitPrice
                                        ? "manual_override"
                                        : x.pricingSource,
                                    pricingHint:
                                      x.resolvedUnitPrice && e.target.value !== x.resolvedUnitPrice
                                        ? `Manual override against ${formatPricingSource(x.pricingSource)}`
                                        : x.pricingHint,
                                  }
                                : x,
                            ),
                          )
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
                  {batchTrackingEnabled && warehouseId ? (
                    <tr className="border-t border-[var(--border)] bg-[var(--surface-muted)]/40">
                      <td colSpan={6} className="px-3 py-3">
                        <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-medium">Preferred batch override</div>
                              <div className="text-xs text-[var(--muted)]">
                                Optional. Chosen batches are consumed first before automatic allocation fills the remainder.
                              </div>
                            </div>
                            <SecondaryButton
                              type="button"
                              onClick={() =>
                                setLines((prev) =>
                                  prev.map((line) =>
                                    line.id === l.id
                                      ? {
                                          ...line,
                                          batchAllocations: [
                                            ...line.batchAllocations,
                                            {
                                              id: `inv-batch-${line.id}-${line.batchAllocations.length + 1}`,
                                              productBatchId: "",
                                              quantity: "",
                                            },
                                          ],
                                        }
                                      : line,
                                  ),
                                )
                              }
                            >
                              Add preferred batch
                            </SecondaryButton>
                          </div>
                          {l.batchAllocations.length === 0 ? (
                            <div className="text-xs text-[var(--muted)]">
                              Leave empty to use automatic batch allocation only.
                            </div>
                          ) : null}
                          <div className="space-y-2">
                            {l.batchAllocations.map((allocation) => (
                              <div key={allocation.id} className="grid gap-2 lg:grid-cols-[1.4fr_0.8fr_auto]">
                                <select
                                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-sm"
                                  value={allocation.productBatchId}
                                  onChange={(e) =>
                                    setLines((prev) =>
                                      prev.map((line) =>
                                        line.id === l.id
                                          ? {
                                              ...line,
                                              batchAllocations: line.batchAllocations.map((entry) =>
                                                entry.id === allocation.id
                                                  ? { ...entry, productBatchId: e.target.value }
                                                  : entry,
                                              ),
                                            }
                                          : line,
                                      ),
                                    )
                                  }
                                >
                                  <option value="">Select batch…</option>
                                  {productBatchRows.map((row) => (
                                    <option key={row.productBatch?.id} value={row.productBatch?.id}>
                                      {(row.productBatch?.batchNumber ?? row.productBatch?.batch_number ?? "Batch") +
                                        ` · Qty ${row.quantity}` +
                                        ((row.productBatch?.expiryDate ?? row.productBatch?.expiry_date)
                                          ? ` · Exp ${String(row.productBatch?.expiryDate ?? row.productBatch?.expiry_date)}`
                                          : "")}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm shadow-sm"
                                  value={allocation.quantity}
                                  onChange={(e) =>
                                    setLines((prev) =>
                                      prev.map((line) =>
                                        line.id === l.id
                                          ? {
                                              ...line,
                                              batchAllocations: line.batchAllocations.map((entry) =>
                                                entry.id === allocation.id
                                                  ? { ...entry, quantity: e.target.value }
                                                  : entry,
                                              ),
                                            }
                                          : line,
                                      ),
                                    )
                                  }
                                  placeholder="Qty"
                                />
                                <button
                                  type="button"
                                  className="text-sm font-medium text-[var(--danger)] underline"
                                  onClick={() =>
                                    setLines((prev) =>
                                      prev.map((line) =>
                                        line.id === l.id
                                          ? {
                                              ...line,
                                              batchAllocations: line.batchAllocations.filter(
                                                (entry) => entry.id !== allocation.id,
                                              ),
                                            }
                                          : line,
                                      ),
                                    )
                                  }
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                  </React.Fragment>
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
                {
                  id: `l${prev.length + 1}_${Date.now()}`,
                  productId: "",
                  quantity: "1",
                  unitPrice: "",
                  batchAllocations: [],
                },
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
