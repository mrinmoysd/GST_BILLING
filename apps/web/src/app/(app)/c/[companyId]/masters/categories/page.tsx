"use client";

import * as React from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategories, useCreateCategory, useDeleteCategory } from "@/lib/masters/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function CategoriesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [error, setError] = React.useState<string | null>(null);
  const [newName, setNewName] = React.useState("");
  const list = useCategories({ companyId });
  const create = useCreateCategory({ companyId });
  const remove = useDeleteCategory({ companyId });
  const rows = list.data ?? [];

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Masters"
        title="Categories"
        subtitle="Organize the product catalog with a simpler category registry and a more structured management view."
        actions={
          <div className="flex gap-3">
            <Link className="text-sm underline" href={`/c/${companyId}/masters/products`}>
              Products
            </Link>
          </div>
        }
      />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Create category</CardTitle>
          <CardDescription>Add a new grouping for products. Rename and activation controls can be expanded later.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {list.isLoading ? <LoadingBlock label="Loading categories…" /> : null}
      {list.isError ? <InlineError message={getErrorMessage(list.error, "Failed to load categories")} /> : null}
      {error ? <InlineError message={error} /> : null}

  {!list.isLoading && !list.isError && !error && rows.length === 0 ? (
        <EmptyState title="No categories" hint="Create your first category to structure the product catalog." />
      ) : null}

  {!list.isLoading && !list.isError && !error && rows.length > 0 ? (
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Name</DataTh>
                <DataTh>State</DataTh>
                <DataTh className="text-right">Actions</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {rows.map((c) => (
                <DataTr key={c.id}>
                  <DataTd>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-[var(--muted)]">{c.id}</div>
                  </DataTd>
                  <DataTd>
                    <Badge variant={c.is_active ? "secondary" : "outline"}>{c.is_active ? "Active" : "Inactive"}</Badge>
                  </DataTd>
                  <DataTd className="text-right">
                    <SecondaryButton
                      type="button"
                      onClick={async () => {
                        const ok = window.confirm(
                          "Delete this category? (Will fail if used by products)",
                        );
                        if (!ok) return;
                        setError(null);
                        try {
                          await remove.mutateAsync(c.id);
                        } catch (e: unknown) {
                          setError(getErrorMessage(e, "Failed to delete category"));
                        }
                      }}
                    >
                      {remove.isPending ? "Deleting…" : "Delete"}
                    </SecondaryButton>
                  </DataTd>
                </DataTr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      ) : null}

      <div className="text-xs text-[var(--muted)]">
        Note: rename/activate toggles can be added later; API supports PATCH already.
      </div>
    </div>
  );
}
