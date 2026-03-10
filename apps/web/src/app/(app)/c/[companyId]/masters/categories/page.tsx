"use client";

import * as React from "react";
import Link from "next/link";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";
import { useAuth } from "@/lib/auth/session";
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
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        subtitle="Manage product categories."
        actions={
          <div className="flex gap-3">
            <Link className="text-sm underline" href={`/c/${companyId}/masters/products`}>
              Products
            </Link>
          </div>
        }
      />

      <div className="rounded-xl border bg-white p-4 space-y-3 max-w-xl">
        <div className="text-sm font-medium">Create category</div>
        <div className="flex gap-3">
          <div className="flex-1">
            <TextField label="Name" value={newName} onChange={setNewName} placeholder="e.g. Batteries" />
          </div>
          <div className="flex items-end">
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
        </div>
      </div>

      {loading ? <LoadingBlock label="Loading categories…" /> : null}
      {error ? <InlineError message={error} /> : null}

  {!loading && !error && safeRows.length === 0 ? (
        <EmptyState title="No categories" hint="Create your first category." />
      ) : null}

  {!loading && !error && safeRows.length > 0 ? (
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Active</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeRows.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-neutral-500">{c.id}</div>
                  </td>
                  <td className="px-4 py-3">{c.is_active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="text-xs text-neutral-500">
        Note: rename/activate toggles can be added later; API supports PATCH already.
      </div>
    </div>
  );
}
