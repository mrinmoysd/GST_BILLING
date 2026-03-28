"use client";

import Link from "next/link";
import * as React from "react";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";
import { useCustomer } from "@/lib/masters/hooks";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string; customerId: string }> };

type LedgerRow = {
  date: string;
  type: "invoice" | "payment";
  ref_id: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  invoice_id?: string;
  invoice_number?: string | null;
  payment_id?: string;
  payment_method?: string | null;
  payment_reference?: string | null;
};

type LedgerResp = {
  ok: true;
  data: {
    opening_balance: number;
    closing_balance: number;
    rows: LedgerRow[];
    meta: { page: number; limit: number; total: number; from?: string; to?: string };
  };
};


function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export default function CustomerLedgerPage({ params }: Props) {
  const { companyId, customerId } = React.use(params);
  const customer = useCustomer({ companyId, customerId });
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [page, setPage] = React.useState(1);
  const limit = 20;

  const [data, setData] = React.useState<LedgerResp["data"] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function load(nextPage: number) {
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(nextPage));
      qs.set("limit", String(limit));
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);

      const res = await apiClient.get<LedgerResp>(
        companyPath(
          companyId,
          `/customers/${customerId}/ledger?${qs.toString()}`,
        ),
      );
  setData(res.data.data);
      setPage(nextPage);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load ledger"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = data?.rows ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer ledger"
        subtitle={
          <span>
            <span className="font-medium">
              {customer.data?.data?.name ?? "Customer"} <code>{customerId}</code>
            </span>
            {data ? (
              <span className="ml-3 text-sm text-[var(--muted)]">
                Opening: {formatMoney(data.opening_balance)} · Closing: {formatMoney(data.closing_balance)}
              </span>
            ) : null}
          </span>
        }
        actions={
          <div className="flex gap-3">
            <Link
              className="text-sm underline"
              href={`/c/${companyId}/masters/customers/${customerId}`}
            >
              Back
            </Link>
          </div>
        }
      />

      <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 shadow-[var(--shadow-soft)]">
        <div className="grid gap-4 md:grid-cols-3">
          <TextField label="From" type="date" value={from} onChange={setFrom} />
          <TextField label="To" type="date" value={to} onChange={setTo} />
          <div className="flex items-end gap-2">
            <PrimaryButton type="button" disabled={loading} onClick={() => load(1)}>
              {loading ? "Loading…" : "Apply"}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              disabled={loading}
              onClick={() => {
                setFrom("");
                setTo("");
                void load(1);
              }}
            >
              Reset
            </SecondaryButton>
          </div>
        </div>
      </div>

  {loading ? <LoadingBlock label="Loading ledger…" /> : null}
      {error ? <InlineError message={error} /> : null}

      {!loading && !error && rows.length === 0 ? (
        <EmptyState title="No entries" hint="No invoices or payments in this range." />
      ) : null}

      {!loading && !error && rows.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] shadow-[var(--shadow-soft)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface-muted)] text-[var(--muted-strong)]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-right px-4 py-3 font-medium">Debit</th>
                <th className="text-right px-4 py-3 font-medium">Credit</th>
                <th className="text-right px-4 py-3 font-medium">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.ref_id} className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">{r.date || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {r.type === "invoice" && r.invoice_id ? (
                        <Link
                          className="underline"
                          href={`/c/${companyId}/sales/invoices/${r.invoice_id}`}
                        >
                          {r.description}
                        </Link>
                      ) : (
                        r.description
                      )}
                    </div>
                    <div className="text-xs capitalize text-[var(--muted)]">
                      {r.type}
                      {r.type === "payment" && r.payment_method ? ` · ${r.payment_method}` : ""}
                      {r.type === "payment" && r.payment_reference ? ` · Ref ${r.payment_reference}` : ""}
                    </div>
                    {r.type === "payment" ? (
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
                        <Link className="underline" href={`/c/${companyId}/payments`}>
                          Open payments workspace
                        </Link>
                        {r.invoice_id ? (
                          <Link
                            className="underline"
                            href={`/c/${companyId}/sales/invoices/${r.invoice_id}`}
                          >
                            {`Invoice ${r.invoice_number ?? r.invoice_id}`}
                          </Link>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-right">{r.debit ? formatMoney(r.debit) : "—"}</td>
                  <td className="px-4 py-3 text-right">{r.credit ? formatMoney(r.credit) : "—"}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {data ? (
        <div className="flex items-center justify-between text-sm text-[var(--muted)]">
          <div>
            Page {page} of {totalPages} · {total} entries
          </div>
          <div className="flex gap-2">
            <SecondaryButton type="button" disabled={loading || page <= 1} onClick={() => load(page - 1)}>
              Prev
            </SecondaryButton>
            <SecondaryButton
              type="button"
              disabled={loading || page >= totalPages}
              onClick={() => load(page + 1)}
            >
              Next
            </SecondaryButton>
          </div>
        </div>
      ) : null}
    </div>
  );
}
