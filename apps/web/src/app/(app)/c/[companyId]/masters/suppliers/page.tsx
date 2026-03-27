"use client";

import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { useSuppliers } from "@/lib/masters/hooks";
import type { Supplier } from "@/lib/masters/types";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { SecondaryButton, TextField } from "@/lib/ui/form";
import {
  QueueInspector,
  QueueMetaList,
  QueueQuickActions,
  QueueSavedViews,
  QueueSegmentBar,
  QueueShell,
  QueueToolbar,
} from "@/lib/ui/queue";
import { WorkspaceHero, WorkspaceStatBadge } from "@/lib/ui/workspace";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

type Props = { params: Promise<{ companyId: string }> };

export default function SuppliersPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [q, setQ] = React.useState("");
  const [segment, setSegment] = React.useState("all");
  const [savedView, setSavedView] = React.useState("all");
  const [selectedSupplierId, setSelectedSupplierId] = React.useState("");
  const query = useSuppliers({ companyId: companyId, q });
  const suppliers = React.useMemo<Supplier[]>(
    () => (Array.isArray(query.data?.data) ? (query.data.data as Supplier[]) : []),
    [query.data],
  );
  const total =
    (query.data?.meta as { total?: number } | undefined)?.total ?? suppliers.length;
  const counts = React.useMemo(() => {
    const missingContact = suppliers.filter((supplier) => !supplier.email && !supplier.phone).length;
    const withEmail = suppliers.filter((supplier) => Boolean(supplier.email)).length;
    const withPhone = suppliers.filter((supplier) => Boolean(supplier.phone)).length;
    return { all: suppliers.length, missingContact, withEmail, withPhone };
  }, [suppliers]);

  const filteredSuppliers = React.useMemo(() => {
    return suppliers.filter((supplier) => {
      if (segment === "missing-contact") return !supplier.email && !supplier.phone;
      if (segment === "with-email") return Boolean(supplier.email);
      if (segment === "with-phone") return Boolean(supplier.phone);
      return true;
    });
  }, [segment, suppliers]);

  React.useEffect(() => {
    if (!filteredSuppliers.length) {
      setSelectedSupplierId("");
      return;
    }
    if (!selectedSupplierId || !filteredSuppliers.some((supplier) => supplier.id === selectedSupplierId)) {
      setSelectedSupplierId(filteredSuppliers[0]?.id ?? "");
    }
  }, [filteredSuppliers, selectedSupplierId]);

  const selectedSupplier = filteredSuppliers.find((supplier) => supplier.id === selectedSupplierId) ?? filteredSuppliers[0] ?? null;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Masters"
        title="Suppliers"
        subtitle="Run supplier maintenance as a clean operating queue, with contact completeness visible before you enter the full payable workspace."
        badges={[
          <WorkspaceStatBadge key="total" label="Suppliers" value={total} />,
          <WorkspaceStatBadge key="missing" label="Need contact cleanup" value={counts.missingContact} variant="outline" />,
        ]}
        actions={
          <Link href={`/c/${companyId}/masters/suppliers/new`}>
            <SecondaryButton type="button">New supplier</SecondaryButton>
          </Link>
        }
      />

      <QueueSegmentBar
        items={[
          { id: "all", label: "All suppliers", count: counts.all },
          { id: "missing-contact", label: "Missing contact", count: counts.missingContact },
          { id: "with-email", label: "With email", count: counts.withEmail },
          { id: "with-phone", label: "With phone", count: counts.withPhone },
        ]}
        value={segment}
        onValueChange={setSegment}
        trailing={
          <QueueSavedViews
            items={[
              { id: "all", label: "Full directory" },
              { id: "missing-contact", label: "Cleanup" },
              { id: "with-email", label: "Email-ready" },
            ]}
            value={savedView}
            onValueChange={(value) => {
              setSavedView(value);
              setSegment(value);
            }}
          />
        }
      />

      <QueueToolbar
        filters={<TextField label="Search suppliers" value={q} onChange={setQ} placeholder="Name / email / phone" />}
        summary={
          <>
            <Badge variant="secondary">{filteredSuppliers.length} in view</Badge>
            <Badge variant="outline">{total} total</Badge>
          </>
        }
      />

      {query.isLoading ? <LoadingBlock label="Loading suppliers…" /> : null}
      {query.isError ? (
        <InlineError message={getErrorMessage(query.error, "Failed to load suppliers")} />
      ) : null}

      {!query.isLoading && !query.isError && filteredSuppliers.length === 0 ? (
        <EmptyState
          title="No suppliers yet"
          hint="Create your first supplier to start tracking purchases and payables."
          action={
            <Link href={`/c/${companyId}/masters/suppliers/new`}>
              <SecondaryButton type="button">Create supplier</SecondaryButton>
            </Link>
          }
        />
      ) : null}

      {filteredSuppliers.length > 0 ? (
        <QueueShell
          inspector={
            <QueueInspector
              eyebrow="Selected supplier"
              title={selectedSupplier?.name ?? "Select supplier"}
              subtitle="Keep the payable contact posture visible before you open the supplier detail workspace."
              footer={
                selectedSupplier ? (
                  <QueueQuickActions>
                    <Link href={`/c/${companyId}/masters/suppliers/${selectedSupplier.id}`}>
                      <SecondaryButton type="button">Open supplier</SecondaryButton>
                    </Link>
                    <Link href={`/c/${companyId}/masters/suppliers/${selectedSupplier.id}/ledger`}>
                      <SecondaryButton type="button">Open ledger</SecondaryButton>
                    </Link>
                  </QueueQuickActions>
                ) : null
              }
            >
              {selectedSupplier ? (
                <QueueMetaList
                  items={[
                    { label: "Email", value: selectedSupplier.email ?? "—" },
                    { label: "Phone", value: selectedSupplier.phone ?? "—" },
                    { label: "Created", value: selectedSupplier.createdAt?.slice?.(0, 10) ?? "—" },
                  ]}
                />
              ) : (
                <div className="text-sm text-[var(--muted)]">Select a supplier to review contact completeness and jump into the ledger.</div>
              )}
            </QueueInspector>
          }
        >
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Name</DataTh>
                  <DataTh>Email</DataTh>
                  <DataTh>Phone</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {filteredSuppliers.map((s) => (
                  <DataTr
                    key={s.id}
                    className={selectedSupplier?.id === s.id ? "border-t border-[var(--accent-soft)] bg-[rgba(180,104,44,0.08)]" : "cursor-pointer hover:bg-[var(--surface-muted)]"}
                    onClick={() => setSelectedSupplierId(s.id)}
                  >
                    <DataTd>
                      <Link
                        className="font-semibold text-[var(--accent)] hover:text-[var(--accent-hover)] hover:underline"
                        href={`/c/${companyId}/masters/suppliers/${s.id}`}
                      >
                        {s.name}
                      </Link>
                    </DataTd>
                    <DataTd>{s.email ?? "—"}</DataTd>
                    <DataTd>{s.phone ?? "—"}</DataTd>
                  </DataTr>
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </QueueShell>
      ) : null}
    </div>
  );
}
