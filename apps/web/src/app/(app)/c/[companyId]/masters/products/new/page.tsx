"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { useCreateProduct } from "@/lib/masters/hooks";
import { InlineError, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

export default function NewProductPage({ params }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const create = useCreateProduct({ companyId: companyId });

  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [hsn, setHsn] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [taxRate, setTaxRate] = React.useState("");
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
              price: price ? Number(price) : undefined,
              taxRate: taxRate ? Number(taxRate) : undefined,
            });
            router.replace(`/c/${companyId}/masters/products/${res.data.id}`);
          } catch (e: unknown) {
            const message =
              e && typeof e === "object" && "message" in e && typeof (e as { message?: unknown }).message === "string"
                ? ((e as { message?: unknown }).message as string)
                : "Failed to create product";
            setError(message);
          }
        }}
      >
        <TextField label="Name" value={name} onChange={setName} required />
        <TextField label="SKU" value={sku} onChange={setSku} />
        <TextField label="HSN" value={hsn} onChange={setHsn} />
        <TextField label="Price" value={price} onChange={setPrice} type="number" />
  <TextField label="Tax rate (%)" value={taxRate} onChange={setTaxRate} type="number" />

        {error ? <InlineError message={error} /> : null}

        <PrimaryButton type="submit" disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create"}
        </PrimaryButton>
      </form>
    </div>
  );
}
