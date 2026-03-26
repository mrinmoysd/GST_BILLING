"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomers, useProducts } from "@/lib/masters/hooks";
import {
  useCommercialAuditLogs,
  useCommercialSchemes,
  useCreateCustomerProductPrice,
  useCreateCommercialScheme,
  useCreatePriceList,
  useCustomerProductPrices,
  usePriceLists,
} from "@/lib/pricing/hooks";
import { useCompany, useUpdateCompany } from "@/lib/settings/companyHooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SelectField, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function PricingSettingsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const products = useProducts({ companyId, limit: 100 });
  const customers = useCustomers({ companyId, limit: 100 });
  const priceLists = usePriceLists({ companyId });
  const customerRates = useCustomerProductPrices({ companyId });
  const schemes = useCommercialSchemes({ companyId });
  const auditLogs = useCommercialAuditLogs({ companyId, limit: 20 });
  const createPriceList = useCreatePriceList({ companyId });
  const createCustomerRate = useCreateCustomerProductPrice({ companyId });
  const createScheme = useCreateCommercialScheme({ companyId });
  const company = useCompany(companyId);
  const updateCompany = useUpdateCompany(companyId);

  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [pricingTier, setPricingTier] = React.useState("");
  const [priority, setPriority] = React.useState("0");
  const [productId, setProductId] = React.useState("");
  const [fixedPrice, setFixedPrice] = React.useState("");
  const [discountPercent, setDiscountPercent] = React.useState("");
  const [customerId, setCustomerId] = React.useState("");
  const [customerRateProductId, setCustomerRateProductId] = React.useState("");
  const [customerFixedPrice, setCustomerFixedPrice] = React.useState("");
  const [customerDiscountPercent, setCustomerDiscountPercent] = React.useState("");
  const [schemeCode, setSchemeCode] = React.useState("");
  const [schemeName, setSchemeName] = React.useState("");
  const [schemeType, setSchemeType] = React.useState("percentage_discount");
  const [schemeDocumentType, setSchemeDocumentType] = React.useState("");
  const [schemeProductId, setSchemeProductId] = React.useState("");
  const [schemeCustomerId, setSchemeCustomerId] = React.useState("");
  const [schemePricingTier, setSchemePricingTier] = React.useState("");
  const [schemePercentDiscount, setSchemePercentDiscount] = React.useState("");
  const [schemeFlatDiscountAmount, setSchemeFlatDiscountAmount] = React.useState("");
  const [schemeFreeQuantity, setSchemeFreeQuantity] = React.useState("");
  const [schemeMinQuantity, setSchemeMinQuantity] = React.useState("");
  const [schemeMinAmount, setSchemeMinAmount] = React.useState("");
  const [schemePriority, setSchemePriority] = React.useState("0");
  const [schemeExclusive, setSchemeExclusive] = React.useState(false);
  const [schemeStartsAt, setSchemeStartsAt] = React.useState("");
  const [schemeEndsAt, setSchemeEndsAt] = React.useState("");
  const [maxLineDiscountPercent, setMaxLineDiscountPercent] = React.useState("");
  const [discountGuardrailMode, setDiscountGuardrailMode] = React.useState("warn");
  const [minMarginPercent, setMinMarginPercent] = React.useState("");
  const [marginGuardrailMode, setMarginGuardrailMode] = React.useState("warn");
  const [error, setError] = React.useState<string | null>(null);

  const productOptions = Array.isArray(products.data?.data) ? products.data.data : [];
  const customerOptions = Array.isArray(customers.data?.data) ? customers.data.data : [];
  const priceListRows = Array.isArray(priceLists.data?.data) ? priceLists.data.data : [];
  const customerRateRows = Array.isArray(customerRates.data?.data) ? customerRates.data.data : [];
  const schemeRows = Array.isArray(schemes.data?.data) ? schemes.data.data : [];
  const auditRows = Array.isArray(auditLogs.data?.data) ? auditLogs.data.data : [];
  const companyRecord = company.data?.data;

  React.useEffect(() => {
    const rawSettings =
      companyRecord?.invoiceSettings && typeof companyRecord.invoiceSettings === "object"
        ? (companyRecord.invoiceSettings as Record<string, unknown>)
        : {};
    const rawPolicy =
      rawSettings.commercial_policy && typeof rawSettings.commercial_policy === "object"
        ? (rawSettings.commercial_policy as Record<string, unknown>)
        : {};

    setMaxLineDiscountPercent(String(rawPolicy.max_line_discount_percent ?? ""));
    setDiscountGuardrailMode(String(rawPolicy.discount_guardrail_mode ?? "warn"));
    setMinMarginPercent(String(rawPolicy.min_margin_percent ?? ""));
    setMarginGuardrailMode(String(rawPolicy.margin_guardrail_mode ?? "warn"));
  }, [companyRecord]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Configuration"
        title="Pricing"
        subtitle="Create reusable price lists and customer-specific product rates so sales forms can auto-resolve commercial values."
      />

      {(priceLists.isLoading || customerRates.isLoading || schemes.isLoading || auditLogs.isLoading) ? <LoadingBlock label="Loading pricing workspace…" /> : null}
      {priceLists.isError ? <InlineError message={getErrorMessage(priceLists.error, "Failed to load price lists")} /> : null}
      {customerRates.isError ? <InlineError message={getErrorMessage(customerRates.error, "Failed to load customer rates")} /> : null}
      {schemes.isError ? <InlineError message={getErrorMessage(schemes.error, "Failed to load commercial schemes")} /> : null}
      {auditLogs.isError ? <InlineError message={getErrorMessage(auditLogs.error, "Failed to load commercial audit logs")} /> : null}
      {company.isError ? <InlineError message={getErrorMessage(company.error, "Failed to load commercial policy")} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D7.2</Badge>
            <CardTitle>Commercial guardrails</CardTitle>
            <CardDescription>Set the maximum line discount and minimum margin policy used when operators override the resolved commercial outcome.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setError(null);
                try {
                  const existingSettings =
                    companyRecord?.invoiceSettings && typeof companyRecord.invoiceSettings === "object"
                      ? (companyRecord.invoiceSettings as Record<string, unknown>)
                      : {};

                  await updateCompany.mutateAsync({
                    invoice_settings: {
                      ...existingSettings,
                      commercial_policy: {
                        max_line_discount_percent: maxLineDiscountPercent || null,
                        discount_guardrail_mode: discountGuardrailMode,
                        min_margin_percent: minMarginPercent || null,
                        margin_guardrail_mode: marginGuardrailMode,
                      },
                    },
                  });
                } catch (err) {
                  setError(getErrorMessage(err, "Failed to save commercial guardrails"));
                }
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Max line discount %" value={maxLineDiscountPercent} onChange={setMaxLineDiscountPercent} type="number" placeholder="Optional" />
                <SelectField label="Discount breach behavior" value={discountGuardrailMode} onChange={setDiscountGuardrailMode}>
                  <option value="warn">Warn</option>
                  <option value="block">Block</option>
                </SelectField>
                <TextField label="Min margin %" value={minMarginPercent} onChange={setMinMarginPercent} type="number" placeholder="Optional" />
                <SelectField label="Margin breach behavior" value={marginGuardrailMode} onChange={setMarginGuardrailMode}>
                  <option value="warn">Warn</option>
                  <option value="block">Block</option>
                </SelectField>
              </div>
              <div className="text-sm text-[var(--muted)]">
                Manual discounts and price overrides now require a reason, and block-mode policies reject the save.
              </div>
              {error ? <InlineError message={error} /> : null}
              <PrimaryButton type="submit" disabled={updateCompany.isPending}>
                {updateCompany.isPending ? "Saving…" : "Save guardrails"}
              </PrimaryButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D7.1</Badge>
            <CardTitle>Create price list</CardTitle>
            <CardDescription>Start with one product row per list if needed. Tier-specific lists beat the global list during rate resolution.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setError(null);
                try {
                  await createPriceList.mutateAsync({
                    code,
                    name,
                    pricing_tier: pricingTier || undefined,
                    priority: Number(priority || 0),
                    items: [
                      {
                        product_id: productId,
                        fixed_price: fixedPrice || undefined,
                        discount_percent: discountPercent || undefined,
                      },
                    ],
                  });
                  setCode("");
                  setName("");
                  setPricingTier("");
                  setPriority("0");
                  setProductId("");
                  setFixedPrice("");
                  setDiscountPercent("");
                } catch (err) {
                  setError(getErrorMessage(err, "Failed to create price list"));
                }
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Code" value={code} onChange={setCode} required />
                <TextField label="Name" value={name} onChange={setName} required />
                <TextField label="Pricing tier" value={pricingTier} onChange={setPricingTier} placeholder="Optional, e.g. wholesale-a" />
                <TextField label="Priority" value={priority} onChange={setPriority} type="number" />
                <SelectField label="Product" value={productId} onChange={setProductId}>
                  <option value="">Select…</option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </SelectField>
                <TextField label="Fixed price" value={fixedPrice} onChange={setFixedPrice} type="number" />
                <TextField label="Discount %" value={discountPercent} onChange={setDiscountPercent} type="number" />
              </div>
              {error ? <InlineError message={error} /> : null}
              <PrimaryButton type="submit" disabled={createPriceList.isPending}>
                {createPriceList.isPending ? "Saving…" : "Create price list"}
              </PrimaryButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">D7.3</Badge>
            <CardTitle>Create commercial scheme</CardTitle>
            <CardDescription>Model quantity slabs, amount slabs, promotional discounts, and free-quantity offers on the same commercial engine.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setError(null);
                try {
                  await createScheme.mutateAsync({
                    code: schemeCode,
                    name: schemeName,
                    scheme_type: schemeType,
                    document_type: schemeDocumentType || undefined,
                    customer_id: schemeCustomerId || undefined,
                    pricing_tier: schemePricingTier || undefined,
                    product_id: schemeProductId || undefined,
                    min_quantity: schemeMinQuantity || undefined,
                    min_amount: schemeMinAmount || undefined,
                    percent_discount: schemePercentDiscount || undefined,
                    flat_discount_amount: schemeFlatDiscountAmount || undefined,
                    free_quantity: schemeFreeQuantity || undefined,
                    priority: Number(schemePriority || 0),
                    is_exclusive: schemeExclusive,
                    starts_at: schemeStartsAt || undefined,
                    ends_at: schemeEndsAt || undefined,
                  });
                  setSchemeCode("");
                  setSchemeName("");
                  setSchemeType("percentage_discount");
                  setSchemeDocumentType("");
                  setSchemeCustomerId("");
                  setSchemePricingTier("");
                  setSchemeProductId("");
                  setSchemeMinQuantity("");
                  setSchemeMinAmount("");
                  setSchemePercentDiscount("");
                  setSchemeFlatDiscountAmount("");
                  setSchemeFreeQuantity("");
                  setSchemePriority("0");
                  setSchemeExclusive(false);
                  setSchemeStartsAt("");
                  setSchemeEndsAt("");
                } catch (err) {
                  setError(getErrorMessage(err, "Failed to create commercial scheme"));
                }
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <TextField label="Code" value={schemeCode} onChange={setSchemeCode} required />
                <TextField label="Name" value={schemeName} onChange={setSchemeName} required />
                <SelectField label="Scheme type" value={schemeType} onChange={setSchemeType}>
                  <option value="percentage_discount">Percentage discount</option>
                  <option value="flat_discount_amount">Flat discount amount</option>
                  <option value="free_quantity">Free quantity</option>
                </SelectField>
                <SelectField label="Document type" value={schemeDocumentType} onChange={setSchemeDocumentType}>
                  <option value="">All document types</option>
                  <option value="quotation">Quotation</option>
                  <option value="sales_order">Sales order</option>
                  <option value="invoice">Invoice</option>
                </SelectField>
                <TextField label="Priority" value={schemePriority} onChange={setSchemePriority} type="number" />
                <SelectField label="Customer (optional)" value={schemeCustomerId} onChange={setSchemeCustomerId}>
                  <option value="">All customers</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </SelectField>
                <TextField label="Pricing tier (optional)" value={schemePricingTier} onChange={setSchemePricingTier} />
                <SelectField label="Product (optional)" value={schemeProductId} onChange={setSchemeProductId}>
                  <option value="">All products</option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </SelectField>
                <TextField label="Min quantity" value={schemeMinQuantity} onChange={setSchemeMinQuantity} type="number" />
                <TextField label="Min amount" value={schemeMinAmount} onChange={setSchemeMinAmount} type="number" />
                <TextField label="Starts at" value={schemeStartsAt} onChange={setSchemeStartsAt} type="date" />
                <TextField label="Ends at" value={schemeEndsAt} onChange={setSchemeEndsAt} type="date" />
                <TextField label="% discount" value={schemePercentDiscount} onChange={setSchemePercentDiscount} type="number" />
                <TextField label="Flat discount" value={schemeFlatDiscountAmount} onChange={setSchemeFlatDiscountAmount} type="number" />
                <TextField label="Free quantity" value={schemeFreeQuantity} onChange={setSchemeFreeQuantity} type="number" />
              </div>
              <label className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                <input type="checkbox" checked={schemeExclusive} onChange={(e) => setSchemeExclusive(e.target.checked)} />
                Exclusive scheme
              </label>
              {error ? <InlineError message={error} /> : null}
              <PrimaryButton type="submit" disabled={createScheme.isPending}>
                {createScheme.isPending ? "Saving…" : "Create scheme"}
              </PrimaryButton>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">Party special</Badge>
            <CardTitle>Customer special rate</CardTitle>
            <CardDescription>Direct customer-product pricing overrides any matching price list.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setError(null);
                try {
                  await createCustomerRate.mutateAsync({
                    customer_id: customerId,
                    product_id: customerRateProductId,
                    fixed_price: customerFixedPrice || undefined,
                    discount_percent: customerDiscountPercent || undefined,
                  });
                  setCustomerId("");
                  setCustomerRateProductId("");
                  setCustomerFixedPrice("");
                  setCustomerDiscountPercent("");
                } catch (err) {
                  setError(getErrorMessage(err, "Failed to save customer special rate"));
                }
              }}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField label="Customer" value={customerId} onChange={setCustomerId}>
                  <option value="">Select…</option>
                  {customerOptions.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </SelectField>
                <SelectField label="Product" value={customerRateProductId} onChange={setCustomerRateProductId}>
                  <option value="">Select…</option>
                  {productOptions.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </SelectField>
                <TextField label="Fixed price" value={customerFixedPrice} onChange={setCustomerFixedPrice} type="number" />
                <TextField label="Discount %" value={customerDiscountPercent} onChange={setCustomerDiscountPercent} type="number" />
              </div>
              {error ? <InlineError message={error} /> : null}
              <PrimaryButton type="submit" disabled={createCustomerRate.isPending}>
                {createCustomerRate.isPending ? "Saving…" : "Save special rate"}
              </PrimaryButton>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commercial schemes</CardTitle>
            <CardDescription>Active promotional and discount logic available to the pricing resolver.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {schemeRows.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No commercial schemes yet.</div>
            ) : (
              schemeRows.map((scheme) => (
                <div key={scheme.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{scheme.name}</div>
                    <Badge variant="outline">{scheme.code}</Badge>
                    <Badge variant="secondary">{scheme.schemeType ?? scheme.scheme_type}</Badge>
                  </div>
                  <div className="mt-1 text-[var(--muted)]">
                    Product {scheme.product?.name ?? "All"} · Customer {scheme.customer?.name ?? "All"} · Tier {scheme.pricingTier ?? scheme.pricing_tier ?? "Any"} · Doc {scheme.documentType ?? scheme.document_type ?? "Any"}
                  </div>
                  <div className="mt-1 text-[var(--muted)]">
                    % {String(scheme.percentDiscount ?? scheme.percent_discount ?? "—")} · Flat {String(scheme.flatDiscountAmount ?? scheme.flat_discount_amount ?? "—")} · Free qty {String(scheme.freeQuantity ?? scheme.free_quantity ?? "—")}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price lists</CardTitle>
            <CardDescription>Current global and tier-bound pricing rules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {priceListRows.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No price lists yet.</div>
            ) : (
              priceListRows.map((list) => (
                <div key={list.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold">{list.name}</div>
                    <Badge variant="outline">{list.code}</Badge>
                    <Badge variant="secondary">{list.pricingTier ?? list.pricing_tier ?? "Global"}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-[var(--muted)]">
                    Priority {(list.priority ?? 0).toString()} · {list.items.length} item{list.items.length === 1 ? "" : "s"}
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    {list.items.map((item) => (
                      <div key={item.id}>
                        {item.product?.name} · fixed {String(item.fixedPrice ?? item.fixed_price ?? "—")} · discount {String(item.discountPercent ?? item.discount_percent ?? "—")}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Commercial audit trail</CardTitle>
            <CardDescription>Recent manual overrides and resolved commercial decisions captured on documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {auditRows.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No commercial audit events yet.</div>
            ) : (
              auditRows.map((row) => (
                <div key={row.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
                  <div className="font-semibold">{row.customer?.name ?? "—"} · {row.product?.name ?? "—"}</div>
                  <div className="mt-1 text-[var(--muted)]">
                    {row.action} · {row.overrideReason ?? row.override_reason ?? "No override reason"} · {new Date(row.createdAt ?? row.created_at ?? "").toLocaleString()}
                  </div>
                  <div className="mt-1 text-[var(--muted)]">
                    Actor {(row.actor?.name || row.actor?.email || "System").toString()}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer special rates</CardTitle>
            <CardDescription>Direct customer-product overrides resolved before tier or global price lists.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {customerRateRows.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">No customer special rates yet.</div>
            ) : (
              customerRateRows.map((row) => (
                <div key={row.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
                  <div className="font-semibold">{row.customer?.name} · {row.product?.name}</div>
                  <div className="mt-1 text-[var(--muted)]">
                    Fixed {String(row.fixedPrice ?? row.fixed_price ?? "—")} · Discount {String(row.discountPercent ?? row.discount_percent ?? "—")}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
