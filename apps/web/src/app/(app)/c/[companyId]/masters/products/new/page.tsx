"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { getErrorMessage } from "@/lib/errors";
import { useCategories, useCreateProduct } from "@/lib/masters/hooks";
import { COMMON_PRODUCT_UNITS, formatUnitLabel } from "@/lib/masters/product-units";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  ComposerBody,
  ComposerMiniList,
  ComposerSection,
  ComposerStepBar,
  ComposerStickyActions,
  ComposerSummaryRail,
  ComposerWarningStack,
} from "@/lib/ui/composer";
import { PrimaryButton, SelectField, TextField } from "@/lib/ui/form";
import { InlineError, PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };

export default function NewProductPage({ params }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const categories = useCategories({ companyId });
  const create = useCreateProduct({ companyId: companyId });

  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [hsn, setHsn] = React.useState("");
  const [unit, setUnit] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [costPrice, setCostPrice] = React.useState("");
  const [taxRate, setTaxRate] = React.useState("");
  const [batchTrackingEnabled, setBatchTrackingEnabled] = React.useState(false);
  const [expiryTrackingEnabled, setExpiryTrackingEnabled] = React.useState(false);
  const [batchIssuePolicy, setBatchIssuePolicy] = React.useState<"NONE" | "FIFO" | "FEFO">("NONE");
  const [nearExpiryDays, setNearExpiryDays] = React.useState("30");
  const [error, setError] = React.useState<string | null>(null);
  const activeStep = React.useMemo(() => {
    if (!name) return "identity";
    if (!price && !costPrice && !taxRate) return "commercial";
    return "inventory";
  }, [costPrice, name, price, taxRate]);

  return (
    <div className="space-y-6">
      <PageHeader title="New product" subtitle="Create a product with catalog, commercial, and inventory policy staged cleanly." />
      <ComposerStepBar
        activeId={activeStep}
        steps={[
          {
            id: "identity",
            label: "Catalog identity",
            description: "Define the product identity, SKU, HSN, unit, and category first.",
            meta: name ? "Product named" : "Waiting for core identity",
          },
          {
            id: "commercial",
            label: "Commercial setup",
            description: "Set the default selling price, default cost, and tax posture before the item is used in billing.",
            meta: price || costPrice ? "Commercial values set" : "Pricing still blank",
          },
          {
            id: "inventory",
            label: "Inventory policy",
            description: "Choose batch, expiry, and issue policy only when the item needs that control depth.",
            meta: batchTrackingEnabled ? `Policy ${batchIssuePolicy}` : "Standard inventory",
          },
        ]}
      />

      <form
        className="space-y-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            const res = await create.mutateAsync({
              name,
              sku: sku || undefined,
              hsn: hsn || undefined,
              unit: unit || undefined,
              categoryId: categoryId || undefined,
              price: price ? Number(price) : undefined,
              costPrice: costPrice ? Number(costPrice) : undefined,
              gstRate: taxRate ? Number(taxRate) : undefined,
              batchTrackingEnabled,
              expiryTrackingEnabled: batchTrackingEnabled ? expiryTrackingEnabled : false,
              batchIssuePolicy: batchTrackingEnabled ? batchIssuePolicy : "NONE",
              nearExpiryDays:
                batchTrackingEnabled && expiryTrackingEnabled && nearExpiryDays
                  ? Number(nearExpiryDays)
                  : undefined,
            });
            toastSuccess("Product created.");
            router.replace(`/c/${companyId}/masters/products/${res.data.id}`);
          } catch (e: unknown) {
            const message = getErrorMessage(e, "Failed to create product.");
            setError(message);
            toastError(e, {
              fallback: "Failed to create product.",
              title: message,
              context: "product-create",
              metadata: { companyId, name, sku },
            });
          }
        }}
      >
        <ComposerBody
          rail={
            <ComposerSummaryRail
              eyebrow="Review"
              title="Product draft"
              description="Keep the catalog identity and inventory posture visible while you finish the setup."
            >
              <ComposerMiniList
                items={[
                  { label: "Name", value: name || "Not set" },
                  { label: "Category", value: categories.data?.find((category) => category.id === categoryId)?.name ?? "Uncategorized" },
                  { label: "Unit", value: formatUnitLabel(unit) },
                  { label: "Price", value: price || "Not set" },
                  { label: "Cost", value: costPrice || "Not set" },
                  { label: "Tax rate", value: taxRate || "Not set" },
                  { label: "Inventory mode", value: batchTrackingEnabled ? (expiryTrackingEnabled ? "Batch + expiry" : "Batch only") : "Standard" },
                ]}
              />
              <ComposerWarningStack>
                {error ? <InlineError message={error} /> : null}
              </ComposerWarningStack>
              <ComposerStickyActions
                aside="Create the product once catalog identity, pricing, and inventory policy are good enough for real transactions."
                primary={
                  <PrimaryButton type="submit" disabled={create.isPending} className="w-full">
                    {create.isPending ? "Creating…" : "Create product"}
                  </PrimaryButton>
                }
              />
            </ComposerSummaryRail>
          }
        >
          <ComposerSection
            eyebrow="Step 1"
            title="Catalog identity"
            description="Define how this product will appear across masters, billing, and reports."
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
            </div>
          </ComposerSection>

          <ComposerSection
            eyebrow="Step 2"
            title="Commercial setup"
            description="Set the selling and cost basis before the product is used in invoices and purchases."
          >
            <div className="grid gap-4 md:grid-cols-3">
              <TextField label="Price" value={price} onChange={setPrice} type="number" />
              <TextField label="Cost price" value={costPrice} onChange={setCostPrice} type="number" />
              <TextField label="Tax rate (%)" value={taxRate} onChange={setTaxRate} type="number" />
            </div>
          </ComposerSection>

          <ComposerSection
            eyebrow="Step 3"
            title="Inventory policy"
            description="Turn on batch or expiry controls only for products that actually need tighter stock discipline."
            tone="muted"
          >
            <div className="grid gap-4">
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
                    }
                  }}
                />
                Batch tracking enabled
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={expiryTrackingEnabled}
                  disabled={!batchTrackingEnabled}
                  onChange={(e) => setExpiryTrackingEnabled(e.target.checked)}
                />
                Expiry tracking enabled
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label="Batch issue policy"
                  value={batchIssuePolicy}
                  onChange={(value) => setBatchIssuePolicy(value as "NONE" | "FIFO" | "FEFO")}
                >
                  <option value="NONE">No enforced policy</option>
                  <option value="FIFO">FIFO</option>
                  <option value="FEFO">FEFO</option>
                </SelectField>
                <TextField
                  label="Near expiry days"
                  value={nearExpiryDays}
                  onChange={setNearExpiryDays}
                  type="number"
                />
              </div>
            </div>
          </ComposerSection>
        </ComposerBody>
      </form>
    </div>
  );
}
