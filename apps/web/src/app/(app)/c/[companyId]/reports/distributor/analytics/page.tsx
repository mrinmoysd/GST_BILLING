"use client";

import * as React from "react";

import {
  type CustomerOutstandingRow,
  type ProductMovementRow,
  type WarehouseStockRow,
  useDistributorDashboard,
  useOutstandingByCustomer,
  useProductMovement,
  useStockByWarehouse,
} from "@/lib/reports/hooks";
import { formatDateLabel } from "@/lib/format/date";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { DateField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { StatCard } from "@/lib/ui/stat";
import { WorkspaceFilterBar, WorkspaceHero, WorkspacePanel, WorkspaceSection, WorkspaceStatBadge } from "@/lib/ui/workspace";
import { getErrorMessage } from "@/lib/errors";

type Props = { params: Promise<{ companyId: string }> };


function formatMoney(value: number) {
  return value.toFixed(2);
}

export default function DistributorAnalyticsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const monthStart = React.useMemo(() => `${today.slice(0, 8)}01`, [today]);

  const [from, setFrom] = React.useState(monthStart);
  const [to, setTo] = React.useState(today);
  const [asOf, setAsOf] = React.useState(today);

  const dashboard = useDistributorDashboard({ companyId, from, to, asOf });
  const outstandingByCustomer = useOutstandingByCustomer({ companyId, asOf });
  const stockByWarehouse = useStockByWarehouse({ companyId });
  const productMovement = useProductMovement({ companyId, from, to, limit: 8 });

  const summary = dashboard.data?.data;
  const outstandingPayload = outstandingByCustomer.data?.data as CustomerOutstandingRow[] | { data?: CustomerOutstandingRow[] } | undefined;
  const warehousePayload = stockByWarehouse.data?.data as WarehouseStockRow[] | { data?: WarehouseStockRow[] } | undefined;
  const movementPayload = productMovement.data?.data as
    | { fast_moving: ProductMovementRow[]; slow_moving: ProductMovementRow[] }
    | { data?: { fast_moving: ProductMovementRow[]; slow_moving: ProductMovementRow[] } }
    | undefined;
  const dueCustomers = Array.isArray(outstandingPayload)
    ? outstandingPayload
    : (outstandingPayload?.data ?? []);
  const warehouses = Array.isArray(warehousePayload)
    ? warehousePayload
    : (warehousePayload?.data ?? []);
  const movement = movementPayload
    ? ("fast_moving" in movementPayload ? movementPayload : movementPayload.data)
    : undefined;

  const isLoading =
    dashboard.isLoading ||
    outstandingByCustomer.isLoading ||
    stockByWarehouse.isLoading ||
    productMovement.isLoading;

  const isError =
    dashboard.isError ||
    outstandingByCustomer.isError ||
    stockByWarehouse.isError ||
    productMovement.isError;

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Distributor reports"
        title="Operational distributor analytics"
        subtitle="Track team-led sales, overdue exposure, warehouse stock value, and movement signals from one owner-facing workspace."
        badges={[
          <WorkspaceStatBadge key="period" label="Period" value={`${from} to ${to}`} />,
          <WorkspaceStatBadge key="asof" label="As of" value={asOf} variant="outline" />,
        ]}
        aside={
          <WorkspacePanel
            tone="muted"
            title="What this workspace is for"
            subtitle="Use this when an owner wants quick answers on who sold, who collected, where stock is parked, and which SKUs are moving or slowing."
          >
            <div className="grid gap-3 text-sm text-[var(--muted-strong)]">
              <div>Sales ownership and collections</div>
              <div>Customer-level overdue control</div>
              <div>Warehouse-wise stock visibility</div>
              <div>Fast-moving vs slow-moving products</div>
            </div>
          </WorkspacePanel>
        }
      />

      <WorkspaceFilterBar
        summary={
          summary ? (
            <>
              <WorkspaceStatBadge label="Gross sales" value={formatMoney(summary.totals.gross_sales)} />
              <WorkspaceStatBadge label="Collections" value={formatMoney(summary.totals.collections)} variant="outline" />
              <WorkspaceStatBadge label="Outstanding" value={formatMoney(summary.totals.outstanding)} variant="outline" />
            </>
          ) : null
        }
      >
        <div className="grid gap-4 md:grid-cols-3">
          <DateField label="From" value={from} onChange={setFrom} />
          <DateField label="To" value={to} onChange={setTo} />
          <DateField label="Outstanding as of" value={asOf} onChange={setAsOf} />
        </div>
      </WorkspaceFilterBar>

      {isLoading ? <LoadingBlock label="Loading distributor analytics…" /> : null}

      {dashboard.isError ? <InlineError message={getErrorMessage(dashboard.error, "Failed to load distributor dashboard")} /> : null}
      {outstandingByCustomer.isError ? (
        <InlineError message={getErrorMessage(outstandingByCustomer.error, "Failed to load outstanding by customer")} />
      ) : null}
      {stockByWarehouse.isError ? (
        <InlineError message={getErrorMessage(stockByWarehouse.error, "Failed to load stock by warehouse")} />
      ) : null}
      {productMovement.isError ? (
        <InlineError message={getErrorMessage(productMovement.error, "Failed to load product movement")} />
      ) : null}

      {!isLoading && !isError && summary ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Gross sales" value={formatMoney(summary.totals.gross_sales)} />
            <StatCard label="Collections" value={formatMoney(summary.totals.collections)} />
            <StatCard label="Outstanding" value={formatMoney(summary.totals.outstanding)} />
            <StatCard label="Stock value" value={formatMoney(summary.totals.stock_value)} />
          </div>

          <WorkspaceSection
            eyebrow="Performance"
            title="Team and receivables view"
            subtitle="Keep the owner view focused on who is selling, who is collecting, and which customers need intervention."
          >
            <div className="grid gap-6 xl:grid-cols-3">
              <WorkspacePanel title="Top salespeople" subtitle="Sales volume for the selected period.">
                <DataTableShell>
                  <DataTable>
                    <DataThead>
                      <tr>
                        <DataTh>Salesperson</DataTh>
                        <DataTh>Invoices</DataTh>
                        <DataTh>Gross sales</DataTh>
                      </tr>
                    </DataThead>
                    <tbody>
                      {summary.top_salespeople.map((row) => (
                        <DataTr key={row.salesperson_user_id ?? row.salesperson_name}>
                          <DataTd>{row.salesperson_name}</DataTd>
                          <DataTd>{row.invoices_count}</DataTd>
                          <DataTd>{formatMoney(row.gross_sales)}</DataTd>
                        </DataTr>
                      ))}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </WorkspacePanel>

              <WorkspacePanel title="Top collectors" subtitle="Collections recorded against owned invoices.">
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
                      {summary.top_collectors.map((row) => (
                        <DataTr key={row.salesperson_user_id ?? row.salesperson_name}>
                          <DataTd>{row.salesperson_name}</DataTd>
                          <DataTd>{row.payments_count}</DataTd>
                          <DataTd>{formatMoney(row.collections_amount)}</DataTd>
                        </DataTr>
                      ))}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </WorkspacePanel>

              <WorkspacePanel title="Top due customers" subtitle="Highest overdue customers as of the selected date.">
                <DataTableShell>
                  <DataTable>
                    <DataThead>
                      <tr>
                        <DataTh>Customer</DataTh>
                        <DataTh>Rep</DataTh>
                        <DataTh>Outstanding</DataTh>
                      </tr>
                    </DataThead>
                    <tbody>
                      {dueCustomers.slice(0, 8).map((row) => (
                        <DataTr key={row.customer_id}>
                          <DataTd>{row.customer_name}</DataTd>
                          <DataTd>{row.salesperson_name}</DataTd>
                          <DataTd>{formatMoney(row.outstanding_amount)}</DataTd>
                        </DataTr>
                      ))}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </WorkspacePanel>
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            eyebrow="Stock"
            title="Warehouse and movement view"
            subtitle="See where inventory sits, how much it is worth, and which products are moving versus stalling."
          >
            <div className="grid gap-6 xl:grid-cols-2">
              <WorkspacePanel title="Warehouse stock snapshot" subtitle="SKU coverage, quantity, stock value, and low-stock pressure by warehouse.">
                <DataTableShell>
                  <DataTable>
                    <DataThead>
                      <tr>
                        <DataTh>Warehouse</DataTh>
                        <DataTh>SKUs</DataTh>
                        <DataTh>Quantity</DataTh>
                        <DataTh>Stock value</DataTh>
                        <DataTh>Low stock</DataTh>
                      </tr>
                    </DataThead>
                    <tbody>
                      {warehouses.map((row) => (
                        <DataTr key={row.warehouse_id}>
                          <DataTd>
                            <div className="font-medium">{row.warehouse_name}</div>
                            <div className="text-xs text-[var(--muted)]">{row.warehouse_code}{row.is_default ? " · Default" : ""}</div>
                          </DataTd>
                          <DataTd>{row.sku_count}</DataTd>
                          <DataTd>{row.total_quantity}</DataTd>
                          <DataTd>{formatMoney(row.stock_value)}</DataTd>
                          <DataTd>{row.low_stock_lines}</DataTd>
                        </DataTr>
                      ))}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </WorkspacePanel>

              <WorkspacePanel title="Outstanding by customer" subtitle="Customer-level ageing focus for collection review.">
                <DataTableShell>
                  <DataTable>
                    <DataThead>
                      <tr>
                        <DataTh>Customer</DataTh>
                        <DataTh>Rep</DataTh>
                        <DataTh>Invoices</DataTh>
                        <DataTh>Oldest due</DataTh>
                        <DataTh>Outstanding</DataTh>
                      </tr>
                    </DataThead>
                    <tbody>
                      {dueCustomers.map((row) => (
                        <DataTr key={row.customer_id}>
                          <DataTd>{row.customer_name}</DataTd>
                          <DataTd>{row.salesperson_name}</DataTd>
                          <DataTd>{row.invoices_count}</DataTd>
                          <DataTd>{formatDateLabel(row.oldest_due_date)}</DataTd>
                          <DataTd>{formatMoney(row.outstanding_amount)}</DataTd>
                        </DataTr>
                      ))}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </WorkspacePanel>
            </div>
          </WorkspaceSection>

          <WorkspaceSection
            eyebrow="Movement"
            title="Fast-moving and slow-moving products"
            subtitle="Use movement signals to guide stocking, transfer, and collections decisions across the distribution network."
          >
            <div className="grid gap-6 xl:grid-cols-2">
              <WorkspacePanel title="Fast-moving" subtitle="Highest sold quantity in the selected window.">
                <DataTableShell>
                  <DataTable>
                    <DataThead>
                      <tr>
                        <DataTh>Product</DataTh>
                        <DataTh>SKU</DataTh>
                        <DataTh>Sold qty</DataTh>
                        <DataTh>Sales amount</DataTh>
                        <DataTh>Current stock</DataTh>
                      </tr>
                    </DataThead>
                    <tbody>
                      {(movement?.fast_moving ?? []).map((row) => (
                        <DataTr key={row.product_id}>
                          <DataTd>{row.product_name}</DataTd>
                          <DataTd>{row.sku ?? "—"}</DataTd>
                          <DataTd>{row.sold_quantity}</DataTd>
                          <DataTd>{formatMoney(row.sales_amount)}</DataTd>
                          <DataTd>{row.current_stock}</DataTd>
                        </DataTr>
                      ))}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </WorkspacePanel>

              <WorkspacePanel title="Slow-moving" subtitle="Lowest moved SKUs that still carry stock.">
                <DataTableShell>
                  <DataTable>
                    <DataThead>
                      <tr>
                        <DataTh>Product</DataTh>
                        <DataTh>SKU</DataTh>
                        <DataTh>Sold qty</DataTh>
                        <DataTh>Sales amount</DataTh>
                        <DataTh>Current stock</DataTh>
                      </tr>
                    </DataThead>
                    <tbody>
                      {(movement?.slow_moving ?? []).map((row) => (
                        <DataTr key={row.product_id}>
                          <DataTd>{row.product_name}</DataTd>
                          <DataTd>{row.sku ?? "—"}</DataTd>
                          <DataTd>{row.sold_quantity}</DataTd>
                          <DataTd>{formatMoney(row.sales_amount)}</DataTd>
                          <DataTd>{row.current_stock}</DataTd>
                        </DataTr>
                      ))}
                    </tbody>
                  </DataTable>
                </DataTableShell>
              </WorkspacePanel>
            </div>
          </WorkspaceSection>
        </>
      ) : null}
    </div>
  );
}
