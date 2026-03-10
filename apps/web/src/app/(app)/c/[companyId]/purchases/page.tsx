"use client";

import Link from "next/link";
import * as React from "react";

import { usePurchases } from "@/lib/billing/hooks";
import { useAuth } from "@/lib/auth/session";
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

  const payload = query.data?.data as unknown;

  function isRecord(v: unknown): v is Record<string, unknown> {
    return !!v && typeof v === "object";
  }

  type PurchaseRow = {
    id: string;
    status?: string | null;
    purchaseDate?: string | null;
    purchase_date?: string | null;
  };

  const rows =
    (isRecord(payload) && Array.isArray(payload.data)
      ? (payload.data as PurchaseRow[])
      : isRecord(payload) && isRecord(payload.data) && Array.isArray(payload.data.data)
        ? (payload.data.data as PurchaseRow[])
        : []) ?? [];

  const total =
    (isRecord(payload) && isRecord(payload.meta) && typeof payload.meta.total === "number"
      ? (payload.meta.total as number)
      : isRecord(payload) && isRecord(payload.data) && isRecord(payload.data.meta) && typeof payload.data.meta.total === "number"
        ? (payload.data.meta.total as number)
        : 0) ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchases"
        subtitle="Create purchases, receive stock, and attach bills."
        actions={
          <Link href={`/c/${companyId}/purchases/new`}>
            <SecondaryButton type="button">New purchase</SecondaryButton>
          </Link>
        }
      />

      <div className="rounded-xl border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <TextField label="Search" value={q} onChange={setQ} placeholder="Supplier / notes" />
          <div className="text-xs text-neutral-500">{total} total</div>
        </div>
      </div>

      {query.isLoading ? <LoadingBlock label="Loading purchases…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load purchases")} /> : null}

      {!query.isLoading && !query.isError && rows.length === 0 ? (
        <EmptyState title="No purchases" hint="Create a purchase to record stock." />
      ) : null}

      {rows.length > 0 ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">ID</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Purchase date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link className="underline" href={`/c/${companyId}/purchases/${p.id}`}>
                      {p.id}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.status ?? "—"}</td>
                  <td className="px-4 py-3">{p.purchaseDate ?? p.purchase_date ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

