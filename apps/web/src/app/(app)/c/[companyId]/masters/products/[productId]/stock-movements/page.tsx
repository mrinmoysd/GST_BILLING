"use client";

import * as React from "react";

import { formatDateTimeLabel } from "@/lib/format/date";
import { useStockMovements } from "@/lib/masters/hooks";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { getErrorMessage } from "@/lib/errors";


type Props = { params: Promise<{ companyId: string; productId: string }> };

export default function ProductStockMovementsPage({ params }: Props) {
  const { companyId, productId } = React.use(params);
  const query = useStockMovements({ companyId, productId });
  const rows = query.data?.data.data ?? [];
  const columns = React.useMemo<
    ColumnDef<(typeof rows)[number]>[]
  >(
    () => [
      {
        id: "createdAt",
        header: "When",
        accessorFn: (row) => row.createdAt,
        meta: { label: "When" },
        cell: ({ row }) => formatDateTimeLabel(row.original.createdAt),
      },
      {
        id: "changeQty",
        header: "Change",
        accessorFn: (row) => Number(row.changeQty ?? 0),
        meta: { label: "Change", cellClassName: "font-medium" },
        cell: ({ row }) => row.original.changeQty,
      },
      {
        id: "balanceQty",
        header: "Balance",
        accessorFn: (row) => Number(row.balanceQty ?? 0),
        meta: { label: "Balance" },
        cell: ({ row }) => row.original.balanceQty,
      },
      {
        id: "sourceType",
        header: "Source",
        accessorFn: (row) => row.sourceType,
        meta: { label: "Source" },
      },
      {
        id: "note",
        header: "Note",
        accessorFn: (row) => row.note ?? "",
        meta: { label: "Note" },
        cell: ({ row }) => row.original.note ?? "—",
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Stock movements" subtitle={<code>{productId}</code>} />

      {query.isLoading ? <LoadingBlock label="Loading movements…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load movements")} />
      ) : null}

      {query.data && rows.length === 0 ? <EmptyState title="No movements" /> : null}

      {query.data && rows.length > 0 ? (
        <DataGrid
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          initialSorting={[{ id: "createdAt", desc: true }]}
          toolbarTitle="Stock movement log"
          toolbarDescription="Audit every inventory movement affecting this product from the shared masters workspace."
        />
      ) : null}
    </div>
  );
}
