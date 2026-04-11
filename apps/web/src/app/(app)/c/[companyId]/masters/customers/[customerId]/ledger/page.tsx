"use client";

import Link from "next/link";
import * as React from "react";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";
import { formatDateLabel } from "@/lib/format/date";
import { useCustomer } from "@/lib/masters/hooks";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
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
  const columns = React.useMemo<ColumnDef<LedgerRow>[]>(
    () => [
      {
        id: "date",
        header: "Date",
        accessorFn: (row) => row.date,
        meta: { label: "Date" },
        cell: ({ row }) => formatDateLabel(row.original.date),
      },
      {
        id: "description",
        header: "Description",
        accessorFn: (row) => row.description,
        meta: { label: "Description" },
        cell: ({ row }) => (
          <div>
            <div className="font-medium">
              {row.original.type === "invoice" && row.original.invoice_id ? (
                <Link className="underline" href={`/c/${companyId}/sales/invoices/${row.original.invoice_id}`}>
                  {row.original.description}
                </Link>
              ) : (
                row.original.description
              )}
            </div>
            <div className="text-xs capitalize text-[var(--muted)]">
              {row.original.type}
              {row.original.type === "payment" && row.original.payment_method ? ` · ${row.original.payment_method}` : ""}
              {row.original.type === "payment" && row.original.payment_reference ? ` · Ref ${row.original.payment_reference}` : ""}
            </div>
          </div>
        ),
      },
      {
        id: "debit",
        header: "Debit",
        accessorFn: (row) => row.debit,
        meta: { label: "Debit", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => (row.original.debit ? formatMoney(row.original.debit) : "—"),
      },
      {
        id: "credit",
        header: "Credit",
        accessorFn: (row) => row.credit,
        meta: { label: "Credit", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => (row.original.credit ? formatMoney(row.original.credit) : "—"),
      },
      {
        id: "balance",
        header: "Balance",
        accessorFn: (row) => row.balance,
        meta: { label: "Balance", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => formatMoney(row.original.balance),
      },
    ],
    [companyId],
  );

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
        <DataGrid
          data={rows}
          columns={columns}
          getRowId={(row) => row.ref_id}
          initialSorting={[{ id: "date", desc: true }]}
          toolbarTitle="Customer ledger"
          toolbarDescription="Use the ledger as the dense financial audit trail behind the customer profile."
        />
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
