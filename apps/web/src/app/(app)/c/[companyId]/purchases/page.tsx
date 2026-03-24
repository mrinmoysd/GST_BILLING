"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePurchases } from "@/lib/billing/hooks";
import { useAuth } from "@/lib/auth/session";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
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

export default function PurchasesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const { bootstrapped } = useAuth();
  const query = usePurchases({ companyId: companyId, q, enabled: bootstrapped });

  const payload = query.data as unknown;

  function isRecord(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === "object";
  }

  type PurchaseRow = {
    id: string;
    status?: string | null;
    purchaseDate?: string | null;
    purchase_date?: string | null;
  };

  const rows = ((isRecord(payload) && Array.isArray(payload.data) ? (payload.data as PurchaseRow[]) : []) ?? []);

  const total =
    (isRecord(payload) && isRecord(payload.meta) && typeof payload.meta.total === "number"
      ? (payload.meta.total as number)
      : 0) ?? 0;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Purchases"
        title="Purchases"
        subtitle="Track supplier purchases, receiving status, and attached documentation in a cleaner operational list view."
        actions={
          <Link href={`/c/${companyId}/purchases/new`}>
            <SecondaryButton type="button">New purchase</SecondaryButton>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-5">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <TextField label="Search purchases" value={q} onChange={setQ} placeholder="Supplier / notes" />
            <div className="flex items-center gap-2 lg:justify-end">
              <Badge variant="secondary">{total} total</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? <LoadingBlock label="Loading purchases…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load purchases")} /> : null}

      {!query.isLoading && !query.isError && rows.length === 0 ? (
        <EmptyState
          title="No purchases"
          hint="Create a purchase to record incoming stock and supplier documents."
          action={
            <Link href={`/c/${companyId}/purchases/new`}>
              <SecondaryButton type="button">Create purchase</SecondaryButton>
            </Link>
          }
        />
      ) : null}

      {rows.length > 0 ? (
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Purchase</DataTh>
                <DataTh>Status</DataTh>
                <DataTh>Purchase date</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {rows.map((p) => (
                <DataTr key={p.id}>
                  <DataTd>
                    <Link className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline" href={`/c/${companyId}/purchases/${p.id}`}>
                      {p.id}
                    </Link>
                  </DataTd>
                  <DataTd>
                    <Badge variant="secondary">{p.status ?? "—"}</Badge>
                  </DataTd>
                  <DataTd>{p.purchaseDate ?? p.purchase_date ?? "—"}</DataTd>
                </DataTr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      ) : null}
    </div>
  );
}
