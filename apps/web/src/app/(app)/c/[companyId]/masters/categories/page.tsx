"use client";

import * as React from "react";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";
import { useAuth } from "@/lib/auth/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { EmptyState, InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

type Category = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type ListResp = { ok: true; data: Category[] };

type MutationResp = { ok: true; data: Category };

type DeleteResp = { ok: true; data: { id: string } };

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

export default function CategoriesPage({ params }: Props) {
  const { companyId } = React.use(params);
  const { bootstrapped } = useAuth();
  const [rows, setRows] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [newName, setNewName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ListResp>(companyPath(companyId, "/categories"));
  // apiClient returns ApiEnvelope<T>, and Categories API returns { ok, data: Category[] }
  setRows(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (e: unknown) {
      setError(getErrorMessage(e, "Failed to load categories"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  const safeRows = Array.isArray(rows) ? rows : [];

  React.useEffect(() => {
    if (!bootstrapped) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, companyId]);

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
              disabled={saving}
              onClick={async () => {
                setError(null);
                if (!newName.trim()) {
                  setError("Enter a category name.");
                  return;
                }
                setSaving(true);
                try {
                  await apiClient.post<MutationResp>(
                    companyPath(companyId, "/categories"),
                    { name: newName.trim() },
                  );
                  setNewName("");
                  await load();
                } catch (e: unknown) {
                  setError(getErrorMessage(e, "Failed to create category"));
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? "Creating…" : "Create"}
            </PrimaryButton>
          </div>
        </CardContent>
      </Card>

      {loading ? <LoadingBlock label="Loading categories…" /> : null}
      {error ? <InlineError message={error} /> : null}

  {!loading && !error && safeRows.length === 0 ? (
        <EmptyState title="No categories" hint="Create your first category to structure the product catalog." />
      ) : null}

  {!loading && !error && safeRows.length > 0 ? (
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
              {safeRows.map((c) => (
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
                          await apiClient.del<DeleteResp>(
                            companyPath(companyId, `/categories/${c.id}`),
                          );
                          await load();
                        } catch (e: unknown) {
                          setError(getErrorMessage(e, "Failed to delete category"));
                        }
                      }}
                    >
                      Delete
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
