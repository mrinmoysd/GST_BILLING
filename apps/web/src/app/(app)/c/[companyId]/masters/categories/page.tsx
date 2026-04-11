"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { DataGrid, type ColumnDef } from "@/lib/ui/data-grid";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/lib/masters/hooks";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceHero, WorkspacePanel, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


export default function CategoriesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [error, setError] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState("");
  const list = useCategories({ companyId });
  const create = useCreateCategory({ companyId });
  const remove = useDeleteCategory({ companyId });
  const rows = list.data ?? [];
  const activeCount = rows.filter((row) => row.is_active).length;

  const columns = React.useMemo<ColumnDef<(typeof rows)[number]>[]>(
    () => [
      {
        id: "name",
        header: "Category",
        accessorFn: (row) => row.name,
        meta: { label: "Category" },
        cell: ({ row }) => (
          <div>
            <div className="font-semibold text-[var(--foreground)]">{row.original.name}</div>
            <div className="text-xs text-[var(--muted)]">{row.original.id}</div>
          </div>
        ),
      },
      {
        id: "state",
        header: "State",
        accessorFn: (row) => (row.is_active ? "Active" : "Inactive"),
        meta: { label: "State" },
        cell: ({ row }) => (
          <Badge variant={row.original.is_active ? "secondary" : "outline"}>
            {row.original.is_active ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        meta: { label: "Actions", headerClassName: "text-right", cellClassName: "text-right" },
        cell: ({ row }) => (
          <SecondaryButton
            type="button"
            onClick={async (event) => {
              event.stopPropagation();
              const ok = window.confirm("Delete this category? This will fail if products still use it.");
              if (!ok) return;
              setError(null);
              try {
                await remove.mutateAsync(row.original.id);
              } catch (e: unknown) {
                setError(getErrorMessage(e, "Failed to delete category"));
              }
            }}
          >
            {remove.isPending ? "Deleting…" : "Delete"}
          </SecondaryButton>
        ),
      },
    ],
    [remove],
  );

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Masters"
        title="Categories"
        subtitle="Maintain product grouping as a lightweight registry with the same enterprise structure as the rest of the catalog."
        badges={[
          <WorkspaceStatBadge key="total" label="Categories" value={rows.length} />,
          <WorkspaceStatBadge key="active" label="Active" value={activeCount} variant="outline" />,
        ]}
        actions={
          <Link href={`/c/${companyId}/masters/products`}>
            <SecondaryButton type="button">Open products</SecondaryButton>
          </Link>
        }
      />

      <WorkspaceSection
        eyebrow="Catalog controls"
        title="Category registry"
        subtitle="Keep category creation simple. Richer rename and activation controls can still be added later without changing the base registry."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="All categories" value={rows.length} hint="Current catalog grouping entries." />
          <StatCard label="Active categories" value={activeCount} hint="Categories currently available to assign." tone="quiet" />
          <StatCard label="Inactive categories" value={rows.length - activeCount} hint="Entries not currently active." tone="quiet" />
          <StatCard label="Delete policy" value="Guarded" hint="Delete still fails when products reference the category." tone="strong" />
        </div>
      </WorkspaceSection>

      <WorkspacePanel title="Create category" subtitle="Add a grouping that products can reuse across masters, reports, and commercial workflows.">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <TextField label="Category name" value={newName} onChange={setNewName} placeholder="e.g. Batteries" />
            <PrimaryButton
              type="button"
              disabled={create.isPending}
              onClick={async () => {
                setError(null);
                if (!newName.trim()) {
                  setError("Enter a category name.");
                  return;
                }
                try {
                  await create.mutateAsync({ name: newName.trim() });
                  setNewName("");
                } catch (e: unknown) {
                  setError(getErrorMessage(e, "Failed to create category"));
                }
              }}
            >
              {create.isPending ? "Creating…" : "Create"}
            </PrimaryButton>
          </div>
      </WorkspacePanel>

      {list.isLoading ? <LoadingBlock label="Loading categories…" /> : null}
      {list.isError ? <InlineError message={getErrorMessage(list.error, "Failed to load categories")} /> : null}
      {error ? <InlineError message={error} /> : null}

      {!list.isLoading && !list.isError && !error && rows.length === 0 ? (
        <EmptyState title="No categories" hint="Create your first category to structure the product catalog." />
      ) : null}

      {!list.isLoading && !list.isError && !error && rows.length > 0 ? (
        <DataGrid
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          initialSorting={[{ id: "name", desc: false }]}
          toolbarTitle="Category registry"
          toolbarDescription="Keep categories visible and disciplined while the richer catalog flows continue to live on products."
        />
      ) : null}

      <div className="text-xs text-[var(--muted)]">
        Note: rename/activate toggles can be added later; API supports PATCH already.
      </div>
    </div>
  );
}
