"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { useCategories, useCreateProduct } from "@/lib/masters/hooks";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SelectField, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

export default function NewProductPage({ params }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const categories = useCategories({ companyId });
  const create = useCreateProduct({ companyId: companyId });

  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [hsn, setHsn] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [costPrice, setCostPrice] = React.useState("");
  const [taxRate, setTaxRate] = React.useState("");
  const [batchTrackingEnabled, setBatchTrackingEnabled] = React.useState(false);
  const [expiryTrackingEnabled, setExpiryTrackingEnabled] = React.useState(false);
  const [batchIssuePolicy, setBatchIssuePolicy] = React.useState<"NONE" | "FIFO" | "FEFO">("NONE");
  const [nearExpiryDays, setNearExpiryDays] = React.useState("30");
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader title="New product" subtitle="Create a product." />

      <form
        className="rounded-xl border bg-white p-4 space-y-4 max-w-xl"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            const res = await create.mutateAsync({
              name,
              sku: sku || undefined,
              hsn: hsn || undefined,
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
            toast.success("Product created");
            router.replace(`/c/${companyId}/masters/products/${res.data.id}`);
          } catch (e: unknown) {
            const message =
              e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string"
                ? ((e as { message?: unknown }).message as string)
                : "Failed to create product";
            setError(message);
            toast.error(message);
          }
        }}
      >
        <TextField label="Name" value={name} onChange={setName} required />
        <TextField label="SKU" value={sku} onChange={setSku} />
        <TextField label="HSN" value={hsn} onChange={setHsn} />
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

        {error ? <InlineError message={error} /> : null}

        <PrimaryButton type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create"}
        </PrimaryButton>
      </form>
    </div>
  );
}
