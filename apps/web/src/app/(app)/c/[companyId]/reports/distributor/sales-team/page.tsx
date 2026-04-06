"use client";

import * as React from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type SalespersonCollectionsRow,
  type SalespersonOutstandingRow,
  type SalespersonSalesRow,
  useCollectionsBySalesperson,
  useOutstandingBySalesperson,
  useSalesBySalesperson,
} from "@/lib/reports/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField } from "@/lib/ui/form";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


function formatMoney(value: number) {
  return value.toFixed(2);
}

export default function SalesTeamReportPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [asOf, setAsOf] = React.useState("");

  const sales = useSalesBySalesperson({ companyId, from: from || undefined, to: to || undefined });
  const collections = useCollectionsBySalesperson({ companyId, from: from || undefined, to: to || undefined });
  const outstanding = useOutstandingBySalesperson({ companyId, asOf: asOf || undefined });

  const salesPayload = sales.data?.data as SalespersonSalesRow[] | { data?: SalespersonSalesRow[] } | undefined;
  const collectionsPayload = collections.data?.data as SalespersonCollectionsRow[] | { data?: SalespersonCollectionsRow[] } | undefined;
  const outstandingPayload = outstanding.data?.data as SalespersonOutstandingRow[] | { data?: SalespersonOutstandingRow[] } | undefined;
  const salesRows = Array.isArray(salesPayload)
    ? salesPayload
    : (salesPayload?.data ?? []);
  const collectionRows = Array.isArray(collectionsPayload)
    ? collectionsPayload
    : (collectionsPayload?.data ?? []);
  const outstandingRows = Array.isArray(outstandingPayload)
    ? outstandingPayload
    : (outstandingPayload?.data ?? []);

  const totalSales = salesRows.reduce((sum, row) => sum + row.gross_sales, 0);
  const totalCollections = collectionRows.reduce((sum, row) => sum + row.collections_amount, 0);
  const totalOutstanding = outstandingRows.reduce((sum, row) => sum + row.outstanding_amount, 0);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Distributor reports"
        title="Sales team performance"
        subtitle="Review sales ownership, collections pace, and outstanding exposure by salesperson."
      />

      <Card>
        <CardHeader>
          <CardTitle>Reporting window</CardTitle>
          <CardDescription>Use one period for sales and collections, and an optional as-of date for dues.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
          <DateField label="Outstanding as of" value={asOf} onChange={setAsOf} />
        </CardContent>
      </Card>

      {sales.isLoading || collections.isLoading || outstanding.isLoading ? (
        <LoadingBlock label="Loading sales team report…" />
      ) : null}

      {sales.isError ? <InlineError message={getErrorMessage(sales.error, "Failed to load sales by salesperson")} /> : null}
      {collections.isError ? (
        <InlineError message={getErrorMessage(collections.error, "Failed to load collections by salesperson")} />
      ) : null}
      {outstanding.isError ? (
        <InlineError message={getErrorMessage(outstanding.error, "Failed to load outstanding by salesperson")} />
      ) : null}

      {!sales.isLoading && !collections.isLoading && !outstanding.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Gross sales" value={formatMoney(totalSales)} />
          <StatCard label="Collections" value={formatMoney(totalCollections)} />
          <StatCard label="Outstanding" value={formatMoney(totalOutstanding)} />
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Sales ownership</CardTitle>
          <CardDescription>Invoices, paid amount, and due amount grouped by salesperson.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Salesperson</DataTh>
                  <DataTh>Email</DataTh>
                  <DataTh>Invoices</DataTh>
                  <DataTh>Gross sales</DataTh>
                  <DataTh>Collected</DataTh>
                  <DataTh>Due</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {salesRows.map((row) => (
                  <DataTr key={row.salesperson_user_id ?? row.salesperson_name}>
                    <DataTd>{row.salesperson_name}</DataTd>
                    <DataTd>{row.salesperson_email ?? "—"}</DataTd>
                    <DataTd>{row.invoices_count}</DataTd>
                    <DataTd>{formatMoney(row.gross_sales)}</DataTd>
                    <DataTd>{formatMoney(row.amount_paid)}</DataTd>
                    <DataTd>{formatMoney(row.amount_due)}</DataTd>
                  </DataTr>
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Collections by salesperson</CardTitle>
            <CardDescription>Payment receipts tied back to invoice ownership.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Salesperson</DataTh>
                    <DataTh>Payments</DataTh>
                    <DataTh>Collections</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {collectionRows.map((row) => (
                    <DataTr key={row.salesperson_user_id ?? row.salesperson_name}>
                      <DataTd>{row.salesperson_name}</DataTd>
                      <DataTd>{row.payments_count}</DataTd>
                      <DataTd>{formatMoney(row.collections_amount)}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outstanding by salesperson</CardTitle>
            <CardDescription>Open dues grouped by the invoice owner.</CardDescription>
          </CardHeader>
          <CardContent>
            <DataTableShell>
              <DataTable>
                <DataThead>
                  <tr>
                    <DataTh>Salesperson</DataTh>
                    <DataTh>Open invoices</DataTh>
                    <DataTh>Outstanding</DataTh>
                  </tr>
                </DataThead>
                <tbody>
                  {outstandingRows.map((row) => (
                    <DataTr key={row.salesperson_user_id ?? row.salesperson_name}>
                      <DataTd>{row.salesperson_name}</DataTd>
                      <DataTd>{row.invoices_count}</DataTd>
                      <DataTd>{formatMoney(row.outstanding_amount)}</DataTd>
                    </DataTr>
                  ))}
                </tbody>
              </DataTable>
            </DataTableShell>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
