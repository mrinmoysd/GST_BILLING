"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
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
    <div className="space-y-7">
      <PageHeader
        eyebrow="Masters"
        title="Products"
        subtitle="Search products, inspect stock positions, and keep your catalog ready for billing."
        actions={
          <Link href={`/c/${companyId}/masters/products/new`}>
            <SecondaryButton type="button">New product</SecondaryButton>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <TextField label="Search products" value={q} onChange={setQ} placeholder="Name / SKU / HSN" />
            <div className="flex items-center gap-2 lg:justify-end">
              <Badge variant="secondary">{total} total</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading products…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load products")} />
      ) : null}

  {!query.isLoading && !query.isError && rows.length === 0 ? (
        <EmptyState
          title="No products yet"
          hint="Create products to build invoices, record purchases, and monitor stock."
          action={
            <Link href={`/c/${companyId}/masters/products/new`}>
              <SecondaryButton type="button">Create product</SecondaryButton>
            </Link>
          }
        />
      ) : null}

  {rows.length > 0 ? (
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Name</DataTh>
                <DataTh>SKU</DataTh>
                <DataTh>HSN</DataTh>
                <DataTh className="text-right">Stock</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {rows.map((p) => (
                <DataTr key={p.id}>
                  <DataTd>
                    <Link
                      className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline"
                      href={`/c/${companyId}/masters/products/${p.id}`}
                    >
                      {p.name}
                    </Link>
                  </DataTd>
                  <DataTd>{p.sku ?? "—"}</DataTd>
                  <DataTd>{p.hsn ?? "—"}</DataTd>
                  <DataTd className="text-right">{p.stock ?? "—"}</DataTd>
                </DataTr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      ) : null}
    </div>
  );
}
