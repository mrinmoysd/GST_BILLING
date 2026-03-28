"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getErrorMessage } from "@/lib/errors";
import {
  useCancelStockTransfer,
  useCreateStockTransfer,
  useDispatchStockTransfer,
  useProducts,
  useReceiveStockTransfer,
  useStockTransfers,
  useWarehouses,
} from "@/lib/masters/hooks";
import { toastError, toastSuccess } from "@/lib/toast";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField, PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };

type TransferLine = {
  id: string;
  productId: string;
  quantity: string;
};

export default function TransfersPage({ params }: Props) {
  const { companyId } = React.use(params);
  const warehouses = useWarehouses({ companyId, activeOnly: true, limit: 100 });
  const products = useProducts({ companyId, limit: 100 });
  const transfers = useStockTransfers({ companyId, limit: 100 });
  const create = useCreateStockTransfer({ companyId });

  const [fromWarehouseId, setFromWarehouseId] = React.useState("");
  const [toWarehouseId, setToWarehouseId] = React.useState("");
  const [transferDate, setTransferDate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [lines, setLines] = React.useState<TransferLine[]>([
    { id: "tr-1", productId: "", quantity: "1" },
  ]);

  const warehouseRows = warehouses.data?.data.data ?? [];
  const productRows = Array.isArray(products.data?.data) ? products.data.data : [];
  const transferRows = transfers.data?.data.data ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Inventory"
        title="Stock transfers"
        subtitle="Move stock between godowns in two steps: dispatch from source, then receive into destination."
        actions={
          <Link href={`/c/${companyId}/inventory`}>
            <SecondaryButton type="button">Back</SecondaryButton>
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Transfer request
            </Badge>
            <CardTitle>Create stock transfer</CardTitle>
            <CardDescription>Distributor-ready movement between warehouses without changing total company stock.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                label="From warehouse"
                value={fromWarehouseId}
                onChange={setFromWarehouseId}
                options={[
                  { value: "", label: "Select…" },
                  ...warehouseRows.map((warehouse: { id: string; name: string }) => ({
                    value: warehouse.id,
                    label: warehouse.name,
                  })),
                ]}
              />
              <SelectField
                label="To warehouse"
                value={toWarehouseId}
                onChange={setToWarehouseId}
                options={[
                  { value: "", label: "Select…" },
                  ...warehouseRows.map((warehouse: { id: string; name: string }) => ({
                    value: warehouse.id,
                    label: warehouse.name,
                  })),
                ]}
              />
            </div>
            <DateField label="Transfer date" value={transferDate} onChange={setTransferDate} />
            <TextField label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />

            <div className="space-y-3">
              {lines.map((line, index) => (
                <div key={line.id} className="grid gap-3 rounded-2xl border border-[var(--border)] p-4 md:grid-cols-[1fr_160px_110px]">
                  <SelectField
                    label={`Product ${index + 1}`}
                    value={line.productId}
                    onChange={(value) =>
                      setLines((prev) =>
                        prev.map((current) =>
                          current.id === line.id ? { ...current, productId: value } : current,
                        ),
                      )
                    }
                    options={[
                      { value: "", label: "Select…" },
                      ...productRows.map((product) => ({
                        value: product.id,
                        label: product.name,
                      })),
                    ]}
                  />
                  <TextField
                    label="Quantity"
                    value={line.quantity}
                    onChange={(value) =>
                      setLines((prev) =>
                        prev.map((current) =>
                          current.id === line.id ? { ...current, quantity: value } : current,
                        ),
                      )
                    }
                  />
                  <div className="flex items-end">
                    <SecondaryButton
                      type="button"
                      disabled={lines.length <= 1}
                      onClick={() =>
                        setLines((prev) => prev.filter((current) => current.id !== line.id))
                      }
                    >
                      Remove
                    </SecondaryButton>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <SecondaryButton
                type="button"
                onClick={() =>
                  setLines((prev) => [
                    ...prev,
                    {
                      id: `tr-${prev.length + 1}-${Date.now()}`,
                      productId: "",
                      quantity: "1",
                    },
                  ])
                }
              >
                Add line
              </SecondaryButton>
              <PrimaryButton
                type="button"
                disabled={create.isPending}
                onClick={async () => {
                  setError(null);
                  if (!fromWarehouseId) return setError("Select source warehouse.");
                  if (!toWarehouseId) return setError("Select destination warehouse.");
                  if (fromWarehouseId === toWarehouseId) {
                    return setError("Source and destination must be different.");
                  }

                  const clean = lines
                    .map((line) => ({
                      product_id: line.productId,
                      quantity: line.quantity,
                    }))
                    .filter((line) => line.product_id);

                  if (clean.length === 0) return setError("Add at least one transfer line.");

                  try {
                    await create.mutateAsync({
                      from_warehouse_id: fromWarehouseId,
                      to_warehouse_id: toWarehouseId,
                      transfer_date: transferDate || undefined,
                      notes: notes || undefined,
                      items: clean,
                    });
                    toastSuccess("Transfer created.");
                    setFromWarehouseId("");
                    setToWarehouseId("");
                    setTransferDate("");
                    setNotes("");
                    setLines([{ id: "tr-1", productId: "", quantity: "1" }]);
                  } catch (err: unknown) {
                    const message = getErrorMessage(err, "Failed to create transfer.");
                    setError(message);
                    toastError(err, {
                      fallback: "Failed to create transfer.",
                      title: message,
                      context: "inventory-transfer-create",
                      metadata: { companyId, fromWarehouseId, toWarehouseId },
                    });
                  }
                }}
              >
                {create.isPending ? "Creating…" : "Create transfer"}
              </PrimaryButton>
            </div>
            {error ? <InlineError message={error} /> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transfer queue</CardTitle>
            <CardDescription>Requested, dispatched, received, and cancelled transfer requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {transfers.isLoading ? <LoadingBlock label="Loading transfers…" /> : null}
            {transfers.isError ? <InlineError message={getErrorMessage(transfers.error, "Failed to load transfers")} /> : null}
            {!transfers.isLoading && !transfers.isError && transferRows.length === 0 ? (
              <EmptyState title="No transfers" hint="Create the first stock transfer to start warehouse movement control." />
            ) : null}
            {transferRows.length > 0 ? (
              <DataTableShell>
                <DataTable>
                  <DataThead>
                    <tr>
                      <DataTh>Transfer</DataTh>
                      <DataTh>Route</DataTh>
                      <DataTh>Status</DataTh>
                      <DataTh>Items</DataTh>
                      <DataTh>Actions</DataTh>
                    </tr>
                  </DataThead>
                  <tbody>
                    {transferRows.map((transfer: {
                      id: string;
                      transferNumber?: string | null;
                      transfer_number?: string | null;
                      status?: string | null;
                      fromWarehouse?: { name?: string | null } | null;
                      toWarehouse?: { name?: string | null } | null;
                      items?: Array<{
                        id: string;
                        quantity: string | number;
                        product?: { name?: string | null };
                        batchAllocations?: Array<{
                          quantity: string | number;
                          productBatch?: { batchNumber?: string | null; batch_number?: string | null } | null;
                        }>;
                      }>;
                    }) => (
                      <TransferRow key={transfer.id} companyId={companyId} transfer={transfer} />
                    ))}
                  </tbody>
                </DataTable>
              </DataTableShell>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TransferRow(props: {
  companyId: string;
  transfer: {
    id: string;
    transferNumber?: string | null;
    transfer_number?: string | null;
    status?: string | null;
    fromWarehouse?: { name?: string | null } | null;
    toWarehouse?: { name?: string | null } | null;
    items?: Array<{
      id: string;
      quantity: string | number;
      product?: { name?: string | null };
      batchAllocations?: Array<{
        quantity: string | number;
        productBatch?: { batchNumber?: string | null; batch_number?: string | null } | null;
      }>;
    }>;
  };
}) {
  const transferId = props.transfer.id;
  const dispatch = useDispatchStockTransfer({ companyId: props.companyId, transferId });
  const receive = useReceiveStockTransfer({ companyId: props.companyId, transferId });
  const cancel = useCancelStockTransfer({ companyId: props.companyId, transferId });

  const status = props.transfer.status ?? "requested";
  const itemSummary =
    props.transfer.items
      ?.map((item) => {
        const batchSummary =
          item.batchAllocations && item.batchAllocations.length > 0
            ? ` (${item.batchAllocations
                .map(
                  (allocation) =>
                    `${allocation.productBatch?.batchNumber ?? allocation.productBatch?.batch_number ?? "Batch"} × ${allocation.quantity}`,
                )
                .join(", ")})`
            : "";
        return `${item.product?.name ?? "Item"} × ${item.quantity}${batchSummary}`;
      })
      .join(", ") ?? "—";

  return (
    <DataTr>
      <DataTd className="font-medium">
        {props.transfer.transferNumber ?? props.transfer.transfer_number ?? transferId}
      </DataTd>
      <DataTd>
        {(props.transfer.fromWarehouse?.name ?? "—") + " → " + (props.transfer.toWarehouse?.name ?? "—")}
      </DataTd>
      <DataTd>
        <Badge variant="secondary">{status}</Badge>
      </DataTd>
      <DataTd>{itemSummary}</DataTd>
      <DataTd>
        <div className="flex gap-2">
          {status === "requested" ? (
            <>
              <SecondaryButton
                type="button"
                disabled={dispatch.isPending}
                onClick={async () => {
                  await dispatch.mutateAsync();
                  toastSuccess("Transfer dispatched.");
                }}
              >
                Dispatch
              </SecondaryButton>
              <SecondaryButton
                type="button"
                disabled={cancel.isPending}
                onClick={async () => {
                  await cancel.mutateAsync();
                  toastSuccess("Transfer cancelled.");
                }}
              >
                Cancel
              </SecondaryButton>
            </>
          ) : null}
          {status === "dispatched" ? (
            <PrimaryButton
              type="button"
              disabled={receive.isPending}
              onClick={async () => {
                await receive.mutateAsync();
                toastSuccess("Transfer received.");
              }}
            >
              Receive
            </PrimaryButton>
          ) : null}
        </div>
      </DataTd>
    </DataTr>
  );
}
