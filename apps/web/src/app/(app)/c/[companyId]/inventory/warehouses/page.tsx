"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { getErrorMessage } from "@/lib/errors";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import {
  useCreateWarehouse,
  useUpdateWarehouse,
  useWarehouseStock,
  useWarehouses,
} from "@/lib/masters/hooks";
import { toastError, toastSuccess } from "@/lib/toast";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import {
  QueueInspector,
  QueueMetaList,
  QueueQuickActions,
  QueueRowStateBadge,
  QueueSavedViews,
  QueueSegmentBar,
  QueueShell,
} from "@/lib/ui/queue";
import { WorkspaceHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

type WarehouseRow = {
  id: string;
  name: string;
  code: string;
  locationLabel?: string | null;
  location_label?: string | null;
  isDefault?: boolean;
  is_default?: boolean;
  isActive?: boolean;
  is_active?: boolean;
};

type WarehouseStockRow = {
  product: { id: string; name: string; sku?: string | null; stock?: string | number | null };
  quantity: string | number;
};

export default function WarehousesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const list = useWarehouses({ companyId, activeOnly: false, limit: 100 });
  const create = useCreateWarehouse({ companyId });
  const stock = useWarehouseStock({
    companyId,
    warehouseId: selectedWarehouseId,
    limit: 50,
    enabled: Boolean(selectedWarehouseId),
  });

  const rows = React.useMemo<WarehouseRow[]>(
    () => (Array.isArray(list.data?.data) ? (list.data.data as WarehouseRow[]) : []),
    [list.data],
  );
  const stockRows = React.useMemo<WarehouseStockRow[]>(
    () => (selectedWarehouseId && Array.isArray(stock.data?.data) ? (stock.data.data as WarehouseStockRow[]) : []),
    [selectedWarehouseId, stock.data],
  );

  React.useEffect(() => {
    if (!selectedWarehouseId && rows.length > 0) {
      const defaultWarehouse =
        rows.find((warehouse) => warehouse.isDefault ?? warehouse.is_default) ?? rows[0];
      setSelectedWarehouseId(defaultWarehouse.id);
    }
  }, [rows, selectedWarehouseId]);

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [locationLabel, setLocationLabel] = React.useState("");
  const [isDefault, setIsDefault] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const counts = React.useMemo(() => {
    const active = rows.filter((warehouse) => warehouse.isActive ?? warehouse.is_active).length;
    const inactive = rows.filter((warehouse) => !(warehouse.isActive ?? warehouse.is_active)).length;
    const defaults = rows.filter((warehouse) => warehouse.isDefault ?? warehouse.is_default).length;
    return { all: rows.length, active, inactive, defaults };
  }, [rows]);

  const filteredRows = React.useMemo(() => {
    return rows.filter((warehouse) => {
      if (segment === "active") return Boolean(warehouse.isActive ?? warehouse.is_active);
      if (segment === "inactive") return !(warehouse.isActive ?? warehouse.is_active);
      if (segment === "default") return Boolean(warehouse.isDefault ?? warehouse.is_default);
      return true;
    });
  }, [rows, segment]);

  React.useEffect(() => {
    if (!filteredRows.length) {
      setSelectedWarehouseId("");
      return;
    }
    if (!selectedWarehouseId || !filteredRows.some((warehouse) => warehouse.id === selectedWarehouseId)) {
      setSelectedWarehouseId(filteredRows[0]?.id ?? "");
    }
  }, [filteredRows, selectedWarehouseId]);

  const selectedWarehouse = filteredRows.find((warehouse) => warehouse.id === selectedWarehouseId) ?? filteredRows[0] ?? null;

  const columns = React.useMemo<ColumnDef<WarehouseRow>[]>(
    () => [
      {
        id: "name",
        header: "Name",
        accessorFn: (warehouse) => warehouse.name,
        meta: { label: "Name" },
        cell: ({ row }) => <div className="font-medium text-[var(--foreground)]">{row.original.name}</div>,
      },
      {
        id: "code",
        header: "Code",
        accessorFn: (warehouse) => warehouse.code,
        meta: { label: "Code" },
        cell: ({ row }) => row.original.code,
      },
      {
        id: "location",
        header: "Location",
        accessorFn: (warehouse) => warehouse.locationLabel ?? warehouse.location_label ?? "",
        meta: { label: "Location" },
        cell: ({ row }) => row.original.locationLabel ?? row.original.location_label ?? "—",
      },
      {
        id: "status",
        header: "Status",
        accessorFn: (warehouse) => (warehouse.isActive ?? warehouse.is_active) ? "Active" : "Inactive",
        meta: { label: "Status" },
        cell: ({ row }) => (
          <QueueRowStateBadge label={(row.original.isActive ?? row.original.is_active) ? "Active" : "Inactive"} />
        ),
      },
      {
        id: "default",
        header: "Default",
        accessorFn: (warehouse) => (warehouse.isDefault ?? warehouse.is_default) ? 1 : 0,
        meta: { label: "Default" },
        cell: ({ row }) => ((row.original.isDefault ?? row.original.is_default) ? "Yes" : "No"),
      },
    ],
    [],
  );

  const stockColumns = React.useMemo<ColumnDef<WarehouseStockRow>[]>(
    () => [
      {
        id: "product",
        header: "Product",
        accessorFn: (row) => row.product.name,
        meta: { label: "Product" },
        cell: ({ row }) => (
          <Link
            href={`/c/${companyId}/masters/products/${row.original.product.id}`}
            className="font-medium text-[var(--secondary)] transition hover:text-[var(--secondary-hover)]"
          >
            {row.original.product.name}
          </Link>
        ),
      },
      {
        id: "sku",
        header: "SKU",
        accessorFn: (row) => row.product.sku ?? "",
        meta: { label: "SKU" },
        cell: ({ row }) => row.original.product.sku ?? "—",
      },
      {
        id: "warehouseQty",
        header: "Warehouse qty",
        accessorFn: (row) => Number(row.quantity ?? 0),
        meta: { label: "Warehouse qty", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => row.original.quantity,
      },
      {
        id: "companyQty",
        header: "Company qty",
        accessorFn: (row) => Number(row.product.stock ?? 0),
        meta: { label: "Company qty", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => row.original.product.stock ?? "—",
      },
    ],
    [companyId],
  );

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Inventory"
        title="Warehouses"
        subtitle="Define operating godowns, set the default stock context, and inspect location-level stock without leaving the inventory workspace."
        badges={[
          <WorkspaceStatBadge key="warehouses" label="Warehouses" value={rows.length} />,
          <WorkspaceStatBadge key="active" label="Active" value={counts.active} variant="outline" />,
        ]}
        actions={
          <Link href={`/c/${companyId}/inventory`}>
            <SecondaryButton type="button">Back to inventory</SecondaryButton>
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <WorkspacePanel
          title="Create warehouse"
          subtitle="Use a short operational code and optional location label so stock teams can work quickly across godowns."
        >
          <div className="space-y-4">
            <TextField label="Warehouse name" value={name} onChange={setName} />
            <TextField label="Code" value={code} onChange={setCode} />
            <TextField
              label="Location label"
              value={locationLabel}
              onChange={setLocationLabel}
              placeholder="Optional"
            />
            <SelectField
              label="Default warehouse"
              value={isDefault ? "yes" : "no"}
              onChange={(value) => setIsDefault(value === "yes")}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
            />
            {error ? <InlineError message={error} /> : null}
            <PrimaryButton
              type="button"
              disabled={create.isPending}
              onClick={async () => {
                setError(null);
                if (!name.trim()) return setError("Enter warehouse name.");
                if (!code.trim()) return setError("Enter warehouse code.");
                try {
                  await create.mutateAsync({
                    name,
                    code,
                    location_label: locationLabel || undefined,
                    is_default: isDefault,
                  });
                  toastSuccess("Warehouse created.");
                  setName("");
                  setCode("");
                  setLocationLabel("");
                  setIsDefault(false);
                } catch (err: unknown) {
                  const message = getErrorMessage(err, "Failed to create warehouse.");
                  setError(message);
                  toastError(err, {
                    fallback: "Failed to create warehouse.",
                    title: message,
                    context: "warehouse-create",
                    metadata: { companyId, name, code },
                  });
                }
              }}
            >
              {create.isPending ? "Creating…" : "Create warehouse"}
            </PrimaryButton>
          </div>
        </WorkspacePanel>

        <div className="space-y-6">
          <QueueSegmentBar
            items={[
              { id: "all", label: "All warehouses", count: counts.all },
              { id: "active", label: "Active", count: counts.active },
              { id: "inactive", label: "Inactive", count: counts.inactive },
              { id: "default", label: "Default", count: counts.defaults },
            ]}
            value={segment}
            onValueChange={setSegment}
            trailing={
              <QueueSavedViews
                items={[
                  { id: "all", label: "Full roster" },
                  { id: "active", label: "Live operations" },
                  { id: "default", label: "Primary stock context" },
                ]}
                value={savedView}
                onValueChange={(value) => {
                  setSavedView(value);
                  setSegment(value);
                }}
              />
            }
          />

          {list.isLoading ? <LoadingBlock label="Loading warehouses…" /> : null}
          {list.isError ? <InlineError message={getErrorMessage(list.error, "Failed to load warehouses")} /> : null}
          {!list.isLoading && !list.isError && filteredRows.length === 0 ? (
            <EmptyState title="No warehouses yet" hint="Create the first godown to begin location-aware stock tracking." />
          ) : null}

          {filteredRows.length > 0 ? (
            <QueueShell
              inspector={
                <QueueInspector
                  eyebrow="Selected warehouse"
                  title={selectedWarehouse?.name ?? "Select warehouse"}
                  subtitle="Keep default status, stock posture, and quick control actions visible beside the warehouse roster."
                  footer={
                    selectedWarehouse ? (
                      <QueueQuickActions>
                        <WarehouseDefaultAction companyId={companyId} warehouse={selectedWarehouse} />
                        <SecondaryButton type="button" onClick={() => setSegment("all")}>Show full roster</SecondaryButton>
                      </QueueQuickActions>
                    ) : null
                  }
                >
                  {selectedWarehouse ? (
                    <>
                      <QueueQuickActions>
                        <QueueRowStateBadge label={(selectedWarehouse.isActive ?? selectedWarehouse.is_active) ? "Active" : "Inactive"} />
                        {(selectedWarehouse.isDefault ?? selectedWarehouse.is_default) ? <Badge variant="outline">Default</Badge> : null}
                      </QueueQuickActions>
                      <QueueMetaList
                        items={[
                          { label: "Code", value: selectedWarehouse.code },
                          { label: "Location", value: selectedWarehouse.locationLabel ?? selectedWarehouse.location_label ?? "—" },
                          { label: "Roster status", value: (selectedWarehouse.isActive ?? selectedWarehouse.is_active) ? "Active" : "Inactive" },
                          { label: "Stock rows", value: selectedWarehouse.id === selectedWarehouseId ? stockRows.length : "—" },
                        ]}
                      />
                    </>
                  ) : (
                    <div className="text-sm text-[var(--muted)]">Select a warehouse to inspect stock posture and default routing.</div>
                  )}
                </QueueInspector>
              }
            >
              <DataGrid
                data={filteredRows}
                columns={columns}
                getRowId={(row) => row.id}
                onRowClick={(row) => setSelectedWarehouseId(row.id)}
                rowClassName={(row) =>
                  selectedWarehouse?.id === row.original.id
                    ? "border-t border-[var(--row-selected-border)] bg-[var(--row-selected-bg)]"
                    : "hover:bg-[var(--surface-secondary)]"
                }
                initialSorting={[{ id: "name", desc: false }]}
                toolbarTitle="Warehouse roster"
                toolbarDescription="Sort and trim the warehouse list while keeping the selected location and its stock posture in view."
              />
            </QueueShell>
          ) : null}
        </div>
      </div>

      <WorkspacePanel
        title="Warehouse stock view"
        subtitle="Inspect warehouse-level product balances while keeping the full company stock context visible beside each row."
      >
        <div className="space-y-4">
          <SelectField
            label="Warehouse"
            value={selectedWarehouseId}
            onChange={setSelectedWarehouseId}
            options={[
              { value: "", label: "Select warehouse" },
              ...rows.map((warehouse) => ({
                value: warehouse.id,
                label: warehouse.name,
              })),
            ]}
          />

          {selectedWarehouseId && stock.isLoading ? <LoadingBlock label="Loading warehouse stock…" /> : null}
          {selectedWarehouseId && stock.isError ? (
            <InlineError message={getErrorMessage(stock.error, "Failed to load warehouse stock")} />
          ) : null}
          {selectedWarehouseId && !stock.isLoading && !stock.isError && stockRows.length === 0 ? (
            <EmptyState title="No stock in this warehouse" hint="Receive purchases or complete transfers to start filling this location." />
          ) : null}

          {stockRows.length > 0 ? (
            <DataGrid
              data={stockRows}
              columns={stockColumns}
              getRowId={(row) => row.product.id}
              initialSorting={[{ id: "warehouseQty", desc: true }]}
              toolbarTitle="Warehouse stock"
              toolbarDescription="Use this stock slice to compare location balance against total company stock."
            />
          ) : null}
        </div>
      </WorkspacePanel>
    </div>
  );
}

function WarehouseDefaultAction(props: { companyId: string; warehouse: WarehouseRow }) {
  const update = useUpdateWarehouse({
    companyId: props.companyId,
    warehouseId: props.warehouse.id,
  });

  if (props.warehouse.isDefault ?? props.warehouse.is_default) {
    return <SecondaryButton type="button" disabled>Already default</SecondaryButton>;
  }

  return (
    <SecondaryButton
      type="button"
      disabled={update.isPending}
      onClick={async () => {
        await update.mutateAsync({ is_default: true });
        toastSuccess("Default warehouse updated.");
      }}
    >
      {update.isPending ? "Updating…" : "Make default"}
    </SecondaryButton>
  );
}
