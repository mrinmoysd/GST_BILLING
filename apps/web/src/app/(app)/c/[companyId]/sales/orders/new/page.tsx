"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useCreateSalesOrder } from "@/lib/billing/hooks";
import { useCustomers, useProducts } from "@/lib/masters/hooks";
import { usePricingPreview } from "@/lib/pricing/hooks";
import { useCompanySalespeople } from "@/lib/settings/usersHooks";
import {
  ComposerBody,
  ComposerMetricCard,
  ComposerMiniList,
  ComposerSection,
  ComposerStepBar,
  ComposerStickyActions,
  ComposerSummaryRail,
  ComposerWarningStack,
} from "@/lib/ui/composer";
import { DateField, PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


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

export default function NewSalesOrderPage({ params }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const create = useCreateSalesOrder({ companyId });
  const customers = useCustomers({ companyId, limit: 50 });
  const products = useProducts({ companyId, limit: 100 });
  const salespeople = useCompanySalespeople(companyId);
  const { mutateAsync: previewPricing, isPending: isPricingPreviewPending } = usePricingPreview({ companyId });

  const [customerId, setCustomerId] = React.useState("");
  const [salespersonUserId, setSalespersonUserId] = React.useState("");
  const [orderDate, setOrderDate] = React.useState("");
  const [expectedDispatchDate, setExpectedDispatchDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  type Line = {
    id: string;
    productId: string;
    quantity: string;
    unitPrice: string;
    discount: string;
    overrideReason?: string;
    resolvedUnitPrice?: string;
    resolvedDiscount?: string;
    pricingSource?: string;
    pricingHint?: string;
  };
  const [lines, setLines] = React.useState<Line[]>([{ id: "so1", productId: "", quantity: "1", unitPrice: "", discount: "" }]);

  const productRows = React.useMemo(
    () => (Array.isArray(products.data?.data) ? products.data.data : []),
    [products.data],
  );
  const productsById = React.useMemo(() => {
    const map = new Map<string, (typeof productRows)[number]>();
    for (const product of productRows) map.set(product.id, product);
    return map;
  }, [productRows]);

  const subTotal = React.useMemo(
    () =>
      lines.reduce((sum, line) => {
        const quantity = Number(line.quantity || 0);
        const unitPrice = Number(line.unitPrice || 0);
        const discount = Number(line.discount || 0);
        return sum + Math.max(0, quantity * unitPrice - discount);
      }, 0),
    [lines],
  );

  const estimatedTax = React.useMemo(
    () =>
      lines.reduce((sum, line) => {
        const quantity = Number(line.quantity || 0);
        const unitPrice = Number(line.unitPrice || 0);
        const discount = Number(line.discount || 0);
        const taxable = Math.max(0, quantity * unitPrice - discount);
        const rate = Number(productsById.get(line.productId)?.taxRate || 0);
        return sum + (taxable * rate) / 100;
      }, 0),
    [lines, productsById],
  );

  const activeStep = React.useMemo(() => {
    if (!customerId) return "party";
    if (!lines.some((line) => line.productId)) return "lines";
    return "review";
  }, [customerId, lines]);

  const stepItems = React.useMemo(
    () => [
      {
        id: "party",
        label: "Party and timing",
        description: "Choose the customer, owner, and dispatch commitment before the order body is locked.",
        meta: customerId ? "Customer selected" : "Waiting for customer",
      },
      {
        id: "lines",
        label: "Order lines",
        description: "Capture the exact demand, commercial rate, and any justified overrides.",
        meta: `${lines.filter((line) => line.productId).length} product lines ready`,
      },
      {
        id: "review",
        label: "Review and save",
        description: "Check totals, add context for ops, and save the draft for dispatch planning.",
        meta: `${(subTotal + estimatedTax).toFixed(2)} draft value`,
      },
    ],
    [customerId, estimatedTax, lines, subTotal],
  );

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
      JSON.stringify({
        orderDate,
        lines: previewableLines.map((line) => ({
          id: line.id,
          productId: line.productId,
          quantity: line.quantity,
        })),
      }),
    [orderDate, previewableLines],
  );

  React.useEffect(() => {
    const previewInput = pricingSignature
      ? (JSON.parse(pricingSignature) as {
          orderDate?: string;
          lines: Array<{ id: string; productId: string; quantity: string }>;
        })
      : { lines: [] };

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

    if (previewInput.lines.length === 0) return;

    let cancelled = false;
    previewPricing({
        customer_id: customerId,
        document_type: "sales_order",
        document_date: previewInput.orderDate || undefined,
        items: previewInput.lines.map((line) => ({
          product_id: line.productId,
          quantity: line.quantity,
        })),
      })
      .then((response) => {
        if (cancelled) return;
        const previewRows = Array.isArray(response.data) ? response.data : [];
        const rowsByLineId = new Map(
          previewInput.lines.map((line, index) => [line.id, previewRows[index]]),
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
        title="New sales order"
        subtitle="Capture order demand ahead of billing so dispatch and staged invoicing can happen without losing the commercial context."
        actions={
          <Link className="text-sm underline" href={`/c/${companyId}/sales/orders`}>
            Back
          </Link>
        }
      />

      <ComposerStepBar steps={stepItems} activeId={activeStep} />

      <form
        className="space-y-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setError(null);
          if (!customerId) {
            setError("Select a customer.");
            return;
          }
          const clean = lines
            .map((line) => ({
              product_id: line.productId,
              quantity: line.quantity,
              unit_price: line.unitPrice,
              discount: line.discount || undefined,
              override_reason: line.overrideReason || undefined,
            }))
            .filter((line) => line.product_id);
          if (clean.length === 0) {
            setError("Add at least one product line.");
            return;
          }
          try {
            const res = await create.mutateAsync({
              customer_id: customerId,
              salesperson_user_id: salespersonUserId || undefined,
              order_date: orderDate || undefined,
              expected_dispatch_date: expectedDispatchDate || undefined,
              notes: notes || undefined,
              items: clean,
            });
            router.replace(`/c/${companyId}/sales/orders/${res.data.id}`);
          } catch (err) {
            setError(getErrorMessage(err, "Failed to create sales order"));
          }
        }}
      >
        <ComposerBody
          rail={
            <ComposerSummaryRail
              eyebrow="Review"
              title="Order summary"
              description="Keep the commercial value, dispatch expectation, and final action together while you complete the draft."
            >
              <ComposerMetricCard label="Subtotal" value={subTotal.toFixed(2)} />
              <ComposerMetricCard label="Estimated tax" value={estimatedTax.toFixed(2)} />
              <ComposerMetricCard
                label="Draft total"
                value={(subTotal + estimatedTax).toFixed(2)}
                hint="The final invoice can still be staged later from this order."
                strong
              />
              <ComposerMiniList
                items={[
                  {
                    label: "Customer",
                    value: customerId
                      ? (Array.isArray(customers.data?.data) ? customers.data.data : []).find((customer) => customer.id === customerId)?.name ?? "Selected"
                      : "Not selected",
                  },
                  {
                    label: "Expected dispatch",
                    value: expectedDispatchDate || "Not set",
                  },
                  {
                    label: "Draft lines",
                    value: lines.filter((line) => line.productId).length,
                  },
                ]}
              />
              <ComposerWarningStack>
                {error ? <InlineError message={error} /> : null}
              </ComposerWarningStack>
              <ComposerStickyActions
                aside="Orders preserve the commercial conversation before billing, so dispatch and staged invoicing stay aligned."
                primary={
                  <PrimaryButton disabled={create.isPending} type="submit" className="w-full">
                    {create.isPending ? "Saving…" : "Save sales order"}
                  </PrimaryButton>
                }
                secondary={
                  <Link href={`/c/${companyId}/sales/orders`}>
                    <SecondaryButton type="button" className="w-full">
                      Cancel
                    </SecondaryButton>
                  </Link>
                }
              />
            </ComposerSummaryRail>
          }
        >
          <ComposerSection
            eyebrow="Step 1"
            title="Party and dispatch timing"
            description="Lock the demand signal before invoice issue and keep dispatch timing visible to the warehouse and sales team."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField label="Customer" value={customerId} onChange={setCustomerId}>
                <option value="">Select…</option>
                {(Array.isArray(customers.data?.data) ? customers.data.data : []).map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </SelectField>
              <SelectField label="Salesperson" value={salespersonUserId} onChange={setSalespersonUserId}>
                <option value="">Inherit from customer / unassigned</option>
                {(Array.isArray(salespeople.data?.data) ? salespeople.data.data : []).map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name || person.email}
                  </option>
                ))}
              </SelectField>
              <DateField label="Order date" value={orderDate} onChange={setOrderDate} placeholder="Select order date" />
              <DateField label="Expected dispatch date" value={expectedDispatchDate} onChange={setExpectedDispatchDate} placeholder="Select dispatch date" />
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--muted)]">
                Sales orders can later convert partially or fully into invoice drafts as the dispatch plan moves.
              </div>
            </div>
          </ComposerSection>

          <ComposerSection
            eyebrow="Step 2"
            title="Order lines"
            description="Capture the ordered quantities and agreed commercial rate per product."
            actions={
              <SecondaryButton
                type="button"
                onClick={() => setLines((prev) => [...prev, { id: crypto.randomUUID(), productId: "", quantity: "1", unitPrice: "", discount: "" }])}
              >
                Add line
              </SecondaryButton>
            }
          >
              <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
                <table className="min-w-[720px] w-full text-sm">
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
                    {lines.map((line, index) => {
                      const quantity = Number(line.quantity || 0);
                      const unitPrice = Number(line.unitPrice || 0);
                      const discount = Number(line.discount || 0);
                      const total = Math.max(0, quantity * unitPrice - discount);
                      const hasCommercialOverride =
                        (line.resolvedUnitPrice &&
                          line.unitPrice &&
                          line.unitPrice !== line.resolvedUnitPrice) ||
                        discount > 0;
                      return (
                        <tr key={line.id} className="border-t border-[var(--border)]">
                          <td className="px-3 py-2">
                            <SelectField
                              label=""
                              value={line.productId}
                              onChange={(next) => {
                                setLines((prev) =>
                                  prev.map((entry) =>
                                    entry.id === line.id
                                      ? {
                                          ...entry,
                                          productId: next,
                                          resolvedUnitPrice: undefined,
                                          resolvedDiscount: undefined,
                                          pricingSource: undefined,
                                          pricingHint: undefined,
                                        }
                                      : entry,
                                  ),
                                );
                              }}
                            >
                              <option value="">Select…</option>
                              {productRows.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.name}
                                </option>
                              ))}
                            </SelectField>
                            <div className="mt-1 text-xs text-[var(--muted)]">Line {index + 1}</div>
                            {line.productId ? (
                              <div className="mt-1 text-xs text-[var(--muted)]">
                                {line.pricingHint ||
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
                                  value={line.overrideReason ?? ""}
                                  onChange={(e) =>
                                    setLines((prev) =>
                                      prev.map((entry) =>
                                        entry.id === line.id
                                          ? { ...entry, overrideReason: e.target.value }
                                          : entry,
                                      ),
                                    )
                                  }
                                  placeholder="Why are you overriding the commercial value?"
                                />
                              </div>
                            ) : null}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input className="w-24 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-right" value={line.quantity} onChange={(e) => setLines((prev) => prev.map((entry) => (entry.id === line.id ? { ...entry, quantity: e.target.value } : entry)))} />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              className="w-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-right"
                              value={line.unitPrice}
                              onChange={(e) =>
                                setLines((prev) =>
                                  prev.map((entry) =>
                                    entry.id === line.id
                                      ? {
                                          ...entry,
                                          unitPrice: e.target.value,
                                          pricingSource:
                                            entry.resolvedUnitPrice && e.target.value !== entry.resolvedUnitPrice
                                              ? "manual_override"
                                              : entry.pricingSource,
                                          pricingHint:
                                            entry.resolvedUnitPrice && e.target.value !== entry.resolvedUnitPrice
                                              ? `Manual override against ${formatPricingSource(entry.pricingSource)}`
                                              : entry.pricingHint,
                                        }
                                      : entry,
                                  ),
                                )
                              }
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input className="w-28 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-2 py-2 text-right" value={line.discount} onChange={(e) => setLines((prev) => prev.map((entry) => (entry.id === line.id ? { ...entry, discount: e.target.value } : entry)))} />
                          </td>
                          <td className="px-3 py-2 text-right font-medium">{total.toFixed(2)}</td>
                          <td className="px-3 py-2 text-right">
                            <button type="button" className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]" onClick={() => setLines((prev) => (prev.length === 1 ? prev : prev.filter((entry) => entry.id !== line.id)))}>
                              Remove
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
          </ComposerSection>

          <ComposerSection
            eyebrow="Step 3"
            title="Review notes"
            description="Add the last bit of operating context so dispatch, billing, and collections start from the same expectation."
            tone="muted"
          >
            <TextField label="Internal notes" value={notes} onChange={setNotes} placeholder="Dispatch note, customer commitment, route context…" />
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-sm leading-6 text-[var(--muted)]">
              Use notes for route context, promised windows, or any instruction the invoicing team should preserve when the order converts later.
            </div>
          </ComposerSection>
        </ComposerBody>
      </form>
    </div>
  );
}
