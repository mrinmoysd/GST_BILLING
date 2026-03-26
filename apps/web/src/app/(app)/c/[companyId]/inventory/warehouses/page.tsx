"use client";

import Link from "next/link";
import * as React from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCreateWarehouse,
  useUpdateWarehouse,
  useWarehouseStock,
  useWarehouses,
} from "@/lib/masters/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function WarehousesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState("");
  const list = useWarehouses({ companyId, activeOnly: false, limit: 100 });
  const create = useCreateWarehouse({ companyId });
  const stock = useWarehouseStock({
    companyId,
    warehouseId: selectedWarehouseId,
    limit: 50,
    enabled: Boolean(selectedWarehouseId),
  });

  const rows = React.useMemo(() => list.data?.data.data ?? [], [list.data]);
  const stockRows =
    selectedWarehouseId && Array.isArray(stock.data?.data.data)
      ? stock.data.data.data
      : [];

  React.useEffect(() => {
    if (!selectedWarehouseId && rows.length > 0) {
      const defaultWarehouse =
        rows.find((warehouse: { isDefault?: boolean; is_default?: boolean }) => warehouse.isDefault ?? warehouse.is_default) ?? rows[0];
      setSelectedWarehouseId(defaultWarehouse.id);
    }
  }, [rows, selectedWarehouseId]);

  const [name, setName] = React.useState("");
  const [code, setCode] = React.useState("");
  const [locationLabel, setLocationLabel] = React.useState("");
  const [isDefault, setIsDefault] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Inventory"
        title="Warehouses"
        subtitle="Define godowns, assign a default operating location, and inspect stock by warehouse without losing company-level stock visibility."
        actions={
          <Link href={`/c/${companyId}/inventory`} className="text-sm underline">
            Back
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <CardHeader>
            <Badge variant="secondary" className="w-fit">
              Location master
            </Badge>
            <CardTitle>Create warehouse</CardTitle>
            <CardDescription>
              Use a short code for operational clarity. The default warehouse becomes the natural stock context for distributor workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  toast.success("Warehouse created");
                  setName("");
                  setCode("");
                  setLocationLabel("");
                  setIsDefault(false);
                } catch (err: unknown) {
                  const message = getErrorMessage(err, "Failed to create warehouse");
                  setError(message);
                  toast.error(message);
                }
              }}
            >
              {create.isPending ? "Creating…" : "Create warehouse"}
            </PrimaryButton>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warehouse roster</CardTitle>
            <CardDescription>All active and inactive locations in the current company.</CardDescription>
          </CardHeader>
          <CardContent>
            {list.isLoading ? <LoadingBlock label="Loading warehouses…" /> : null}
            {list.isError ? <InlineError message={getErrorMessage(list.error, "Failed to load warehouses")} /> : null}
            {!list.isLoading && !list.isError && rows.length === 0 ? (
              <EmptyState title="No warehouses yet" hint="Create the first godown to begin location-aware stock tracking." />
            ) : null}
            {rows.length > 0 ? (
              <DataTableShell>
                <DataTable>
                  <DataThead>
                    <tr>
                      <DataTh>Name</DataTh>
                      <DataTh>Code</DataTh>
                      <DataTh>Location</DataTh>
                      <DataTh>Status</DataTh>
                      <DataTh>Default</DataTh>
                    </tr>
                  </DataThead>
                  <tbody>
                    {rows.map((warehouse) => (
                      <WarehouseRow
                        key={warehouse.id}
                        companyId={companyId}
                        warehouse={warehouse}
                        selected={selectedWarehouseId === warehouse.id}
                        onSelect={() => setSelectedWarehouseId(warehouse.id)}
                      />
                    ))}
                  </tbody>
                </DataTable>
              </DataTableShell>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Warehouse stock view</CardTitle>
          <CardDescription>
            Inspect product quantity at the selected warehouse while keeping company-level stock intact.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SelectField
            label="Warehouse"
            value={selectedWarehouseId}
            onChange={setSelectedWarehouseId}
            options={[
              { value: "", label: "Select warehouse" },
              ...rows.map((warehouse: { id: string; name: string }) => ({
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
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Product</DataTh>
                    <DataTh>SKU</DataTh>
                    <DataTh>Warehouse qty</DataTh>
                    <DataTh>Company qty</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {stockRows.map((row) => (
                    <DataTr key={row.product.id}>
                      <DataTd>{row.product.name}</DataTd>
                      <DataTd>{row.product.sku ?? "—"}</DataTd>
                      <DataTd>{row.quantity}</DataTd>
                      <DataTd>{row.product.stock ?? "—"}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function WarehouseRow(props: {
  companyId: string;
  warehouse: {
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
  selected: boolean;
  onSelect: () => void;
}) {
  const update = useUpdateWarehouse({
    companyId: props.companyId,
    warehouseId: props.warehouse.id,
  });

  const isDefault = props.warehouse.isDefault ?? props.warehouse.is_default;
  const isActive = props.warehouse.isActive ?? props.warehouse.is_active;
  const location = props.warehouse.locationLabel ?? props.warehouse.location_label;

  return (
    <DataTr
      className={props.selected ? "bg-[var(--surface-muted)]" : undefined}
      onClick={props.onSelect}
    >
      <DataTd className="font-medium">{props.warehouse.name}</DataTd>
      <DataTd>{props.warehouse.code}</DataTd>
      <DataTd>{location ?? "—"}</DataTd>
      <DataTd>{isActive ? "Active" : "Inactive"}</DataTd>
      <DataTd>
        <div className="flex items-center gap-3">
          <span>{isDefault ? "Yes" : "No"}</span>
          {!isDefault ? (
            <SecondaryButton
              type="button"
              disabled={update.isPending}
              onClick={async (event) => {
                event.stopPropagation();
                await update.mutateAsync({ is_default: true });
                toast.success("Default warehouse updated");
              }}
            >
              Make default
            </SecondaryButton>
          ) : null}
        </div>
      </DataTd>
    </DataTr>
  );
}
