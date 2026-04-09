"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { useCreateQuotation } from "@/lib/billing/hooks";
import { useCustomers, useProducts } from "@/lib/masters/hooks";
import { formatProductOptionLabel, formatUnitLabel } from "@/lib/masters/product-units";
import type { Product } from "@/lib/masters/types";
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

export default function NewQuotationPage({ params }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const create = useCreateQuotation({ companyId });
  const customers = useCustomers({ companyId, limit: 50 });
  const products = useProducts({ companyId, limit: 100 });
  const salespeople = useCompanySalespeople(companyId);
  const { mutateAsync: previewPricing, isPending: isPricingPreviewPending } = usePricingPreview({ companyId });

  const [customerId, setCustomerId] = React.useState("");
  const [salespersonUserId, setSalespersonUserId] = React.useState("");
  const [issueDate, setIssueDate] = React.useState("");
  const [expiryDate, setExpiryDate] = React.useState("");
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
  const [lines, setLines] = React.useState<Line[]>([{ id: "q1", productId: "", quantity: "1", unitPrice: "", discount: "" }]);

  const productRows = React.useMemo(
    () => (Array.isArray(products.data?.data) ? (products.data.data as Product[]) : []),
    [products.data],
  );
  const productsById = React.useMemo(() => {
    const map = new Map<string, Product>();
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
        issueDate,
        lines: previewableLines.map((line) => ({
          id: line.id,
          productId: line.productId,
          quantity: line.quantity,
        })),
      }),
    [issueDate, previewableLines],
  );

  React.useEffect(() => {
    const previewInput = pricingSignature
      ? (JSON.parse(pricingSignature) as {
          issueDate?: string;
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
        document_type: "quotation",
        document_date: previewInput.issueDate || undefined,
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

  const activeStep = React.useMemo(() => {
    if (!customerId) return "context";
    if (!lines.some((line) => line.productId)) return "lines";
    return "review";
  }, [customerId, lines]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Sales"
        title="New quotation"
        subtitle="Prepare a formal offer with dated validity and reusable line items so the next step can become an invoice draft instead of a rewrite."
        actions={
          <Link className="text-sm underline" href={`/c/${companyId}/sales/quotations`}>
            Back
          </Link>
        }
      />

      <ComposerStepBar
        activeId={activeStep}
        steps={[
          {
            id: "context",
            label: "Customer and validity",
            description: "Choose the party, ownership, and validity dates before the commercial body is shaped.",
            meta: customerId ? "Customer selected" : "Waiting for customer",
          },
          {
            id: "lines",
            label: "Quoted items",
            description: "Build the commercial offer with resolved price, quantity, and override guardrails.",
            meta: `${lines.filter((line) => line.productId).length} lines ready`,
          },
          {
            id: "review",
            label: "Review and save",
            description: "Confirm totals and internal notes before the quote enters the pipeline.",
            meta: `${(subTotal + estimatedTax).toFixed(2)} offer total`,
          },
        ]}
      />

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
              issue_date: issueDate || undefined,
              expiry_date: expiryDate || undefined,
              notes: notes || undefined,
              items: clean,
            });
            router.replace(`/c/${companyId}/sales/quotations/${res.data.id}`);
          } catch (err) {
            setError(getErrorMessage(err, "Failed to create quotation"));
          }
        }}
      >
        <ComposerBody
          rail={
            <ComposerSummaryRail
              eyebrow="Quote summary"
              title={customerId ? "Offer in progress" : "Awaiting customer"}
              description="Use the right rail to keep totals and commercial posture stable while the main body stays focused on editing."
            >
              <ComposerMetricCard label="Subtotal" value={subTotal.toFixed(2)} />
              <ComposerMetricCard label="Estimated tax" value={estimatedTax.toFixed(2)} />
              <ComposerMetricCard
                label="Offer total"
                value={(subTotal + estimatedTax).toFixed(2)}
                strong
                hint="This stays estimated until the quotation is saved and reviewed in the detail workspace."
              />
              <ComposerMiniList
                items={[
                  { label: "Customer", value: customerId ? "Selected" : "Pending" },
                  { label: "Issue date", value: issueDate || "Not set" },
                  { label: "Expiry date", value: expiryDate || "Not set" },
                  { label: "Lines", value: lines.filter((line) => line.productId).length },
                ]}
              />
            </ComposerSummaryRail>
          }
        >
          <ComposerSection
            eyebrow="Commercial context"
            title="Offer setup"
            description="Set the customer, salesperson ownership, and validity dates before shaping the offer body."
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
              <DateField label="Issue date" value={issueDate} onChange={setIssueDate} placeholder="Select issue date" />
              <DateField label="Expiry date" value={expiryDate} onChange={setExpiryDate} placeholder="Select expiry date" />
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm leading-6 text-[var(--muted)]">
                Quotes stay lightweight here: build, send, approve, then convert to invoice when the commercial commitment is ready.
              </div>
            </div>
          </ComposerSection>

          <ComposerSection
            eyebrow="Offer body"
            title="Line items"
            description="Capture the quoted items in one dense editing grid, while commercial hints and overrides stay contextual to each row."
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
                                  {formatProductOptionLabel(product)}
                                </option>
                              ))}
                            </SelectField>
                            <div className="mt-1 text-xs text-[var(--muted)]">Line {index + 1}</div>
                            <div className="mt-1 text-xs text-[var(--muted)]">
                              Unit {formatUnitLabel(productRows.find((product) => product.id === line.productId)?.unit)}
                            </div>
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
                            <button
                              type="button"
                              className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)]"
                              onClick={() => setLines((prev) => (prev.length === 1 ? prev : prev.filter((entry) => entry.id !== line.id)))}
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
              <SecondaryButton
                type="button"
                onClick={() => setLines((prev) => [...prev, { id: crypto.randomUUID(), productId: "", quantity: "1", unitPrice: "", discount: "" }])}
              >
                Add line
              </SecondaryButton>
          </ComposerSection>

          <ComposerSection
            eyebrow="Review"
            title="Internal note and save"
            description="Keep internal selling context here, then save the quotation into the operational pipeline."
            tone="muted"
          >
              <TextField label="Internal notes" value={notes} onChange={setNotes} placeholder="Commercial note, delivery context, validity terms…" />
          </ComposerSection>

          <ComposerWarningStack>
            {error ? <InlineError message={error} /> : null}
          </ComposerWarningStack>

          <ComposerStickyActions
            aside="Save the quotation once the customer, commercial lines, and validity posture are ready."
            primary={
              <PrimaryButton disabled={create.isPending} type="submit">
                {create.isPending ? "Saving…" : "Save quotation"}
              </PrimaryButton>
            }
            secondary={
              <Link href={`/c/${companyId}/sales/quotations`}>
                <SecondaryButton type="button" className="w-full">Cancel</SecondaryButton>
              </Link>
            }
          />
        </ComposerBody>
      </form>
    </div>
  );
}
