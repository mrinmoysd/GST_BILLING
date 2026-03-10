"use client";

import Link from "next/link";
import * as React from "react";

import { useProducts } from "@/lib/masters/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function ProductsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const query = useProducts({ companyId: companyId, q });
  const rows = Array.isArray(query.data?.data) ? query.data.data : [];
  const total = (query.data?.meta as { total?: number } | undefined)?.total ?? rows.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        subtitle="Create products and track stock."
        actions={
          <Link href={`/c/${companyId}/masters/products/new`}>
            <SecondaryButton type="button">New product</SecondaryButton>
          </Link>
        }
      />

      <div className="rounded-xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <TextField label="Search" value={q} onChange={setQ} placeholder="Name / SKU / HSN" />
          <div className="text-xs text-neutral-500">{total} total</div>
        </div>
      </div>

      {query.isLoading ? <LoadingBlock label="Loading products…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load products")} />
      ) : null}

  {!query.isLoading && !query.isError && rows.length === 0 ? (
        <EmptyState title="No products yet" hint="Create products to build invoices and manage stock." />
      ) : null}

  {rows.length > 0 ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">SKU</th>
                <th className="text-left px-4 py-3 font-medium">HSN</th>
                <th className="text-left px-4 py-3 font-medium">Stock</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link
                      className="underline"
                      href={`/c/${companyId}/masters/products/${p.id}`}
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.sku ?? "—"}</td>
                  <td className="px-4 py-3">{p.hsn ?? "—"}</td>
                  <td className="px-4 py-3">{p.stock ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
