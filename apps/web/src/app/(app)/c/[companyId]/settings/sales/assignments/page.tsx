"use client";

import * as React from "react";

import { getErrorMessage } from "@/lib/errors";
import {
  useAssignCustomerCoverage,
  useCreateSalesBeat,
  useCreateSalesRoute,
  useCreateSalesTerritory,
  useCreateSalespersonAssignment,
  useCustomerCoverage,
  useSalespersonAssignments,
  useSalesBeats,
  useSalesRoutes,
  useSalesTerritories,
} from "@/lib/field-sales/hooks";
import { useCustomers, useWarehouses } from "@/lib/masters/hooks";
import { useCompanySalespeople } from "@/lib/settings/usersHooks";
import { toastError, toastSuccess } from "@/lib/toast";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { PrimaryButton, SelectField, TextField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspaceConfigHero, WorkspacePanel, WorkspaceStatBadge } from "@/lib/ui/workspace";

type Props = { params: Promise<{ companyId: string }> };

export default function FieldSalesAssignmentsPage({ params }: Props) {
  const { companyId } = React.use(params);
  const territories = useSalesTerritories(companyId);
  const routes = useSalesRoutes({ companyId });
  const beats = useSalesBeats({ companyId });
  const coverage = useCustomerCoverage({ companyId });
  const customers = useCustomers({ companyId, page: 1, limit: 200 });
  const salespeople = useCompanySalespeople(companyId);
  const warehouses = useWarehouses({ companyId });
  const createTerritory = useCreateSalesTerritory(companyId);
  const createRoute = useCreateSalesRoute(companyId);
  const createBeat = useCreateSalesBeat(companyId);
  const assignCoverage = useAssignCustomerCoverage(companyId);

  const [territoryCode, setTerritoryCode] = React.useState("");
  const [territoryName, setTerritoryName] = React.useState("");
  const [territoryManagerUserId, setTerritoryManagerUserId] = React.useState("");

  const [routeCode, setRouteCode] = React.useState("");
  const [routeName, setRouteName] = React.useState("");
  const [routeTerritoryId, setRouteTerritoryId] = React.useState("");
  const [routeWarehouseId, setRouteWarehouseId] = React.useState("");

  const [beatCode, setBeatCode] = React.useState("");
  const [beatName, setBeatName] = React.useState("");
  const [beatRouteId, setBeatRouteId] = React.useState("");
  const [beatTerritoryId, setBeatTerritoryId] = React.useState("");
  const [beatDayOfWeek, setBeatDayOfWeek] = React.useState("monday");
  const [beatSequenceNo, setBeatSequenceNo] = React.useState("1");

  const [coverageCustomerId, setCoverageCustomerId] = React.useState("");
  const [coverageSalespersonUserId, setCoverageSalespersonUserId] = React.useState("");
  const [coverageTerritoryId, setCoverageTerritoryId] = React.useState("");
  const [coverageRouteId, setCoverageRouteId] = React.useState("");
  const [coverageBeatId, setCoverageBeatId] = React.useState("");
  const [coverageFrequency, setCoverageFrequency] = React.useState("weekly");
  const [coveragePreferredDay, setCoveragePreferredDay] = React.useState("monday");
  const [coveragePriority, setCoveragePriority] = React.useState("normal");
  const [coverageNotes, setCoverageNotes] = React.useState("");

  const [assignmentSalespersonUserId, setAssignmentSalespersonUserId] = React.useState("");
  const [assignmentRouteId, setAssignmentRouteId] = React.useState("");
  const [assignmentBeatId, setAssignmentBeatId] = React.useState("");

  const customerRows =
    (((customers.data as unknown as { data?: { data?: Array<{ id: string; name: string }> } })?.data?.data) ?? []);
  const salespersonRows = Array.isArray(salespeople.data?.data) ? salespeople.data.data : [];
  const territoryRows = territories.data?.data?.data ?? [];
  const routeRows = routes.data?.data?.data ?? [];
  const beatRows = beats.data?.data?.data ?? [];
  const coverageRows = coverage.data?.data?.data ?? [];
  const warehouseRows = Array.isArray(warehouses.data?.data) ? warehouses.data.data : [];

  const assignmentMutation = useCreateSalespersonAssignment(companyId, assignmentSalespersonUserId || "placeholder");
  const assignmentRows = useSalespersonAssignments(companyId, assignmentSalespersonUserId, Boolean(assignmentSalespersonUserId));

  const filteredRouteRows = routeTerritoryId
    ? routeRows.filter((row) => row.territory?.id === routeTerritoryId)
    : routeRows;
  const filteredBeatRows = coverageRouteId
    ? beatRows.filter((row) => row.route?.id === coverageRouteId)
    : coverageTerritoryId
      ? beatRows.filter((row) => row.territory?.id === coverageTerritoryId)
      : beatRows;

  return (
    <div className="space-y-7">
      <WorkspaceConfigHero
        eyebrow="Field sales"
        title="Routes and coverage"
        subtitle="Build the daily field-execution layer with territories, routes, beats, and customer ownership assignments that feed D12 worklists and reports."
        badges={[
          <WorkspaceStatBadge key="territories" label="Territories" value={territoryRows.length} />,
          <WorkspaceStatBadge key="routes" label="Routes" value={routeRows.length} />,
          <WorkspaceStatBadge key="coverages" label="Active coverage" value={coverageRows.length} />,
        ]}
      />

      {territories.isLoading || routes.isLoading || beats.isLoading || coverage.isLoading ? (
        <LoadingBlock label="Loading field-sales masters…" />
      ) : null}
      {territories.isError ? <InlineError message={getErrorMessage(territories.error, "Failed to load territories")} /> : null}
      {routes.isError ? <InlineError message={getErrorMessage(routes.error, "Failed to load routes")} /> : null}
      {beats.isError ? <InlineError message={getErrorMessage(beats.error, "Failed to load beats")} /> : null}
      {coverage.isError ? <InlineError message={getErrorMessage(coverage.error, "Failed to load customer coverage")} /> : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <WorkspacePanel title="Create territory" subtitle="Start with sales geography and optional manager ownership.">
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await createTerritory.mutateAsync({
                  code: territoryCode,
                  name: territoryName,
                  manager_user_id: territoryManagerUserId || undefined,
                });
                setTerritoryCode("");
                setTerritoryName("");
                setTerritoryManagerUserId("");
                toastSuccess("Territory created.");
              } catch (err) {
                toastError(err, {
                  fallback: "Failed to create territory.",
                  context: "field-sales-territory-create",
                  metadata: { companyId, code: territoryCode },
                });
              }
            }}
          >
            <TextField label="Code" value={territoryCode} onChange={setTerritoryCode} required />
            <TextField label="Name" value={territoryName} onChange={setTerritoryName} required />
            <SelectField label="Manager" value={territoryManagerUserId} onChange={setTerritoryManagerUserId}>
              <option value="">Optional manager</option>
              {salespersonRows.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name || person.email}
                </option>
              ))}
            </SelectField>
            <PrimaryButton type="submit" disabled={createTerritory.isPending}>
              {createTerritory.isPending ? "Saving…" : "Create territory"}
            </PrimaryButton>
          </form>
        </WorkspacePanel>

        <WorkspacePanel title="Create route" subtitle="Map operational paths and optionally tie a default warehouse.">
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await createRoute.mutateAsync({
                  code: routeCode,
                  name: routeName,
                  territory_id: routeTerritoryId || undefined,
                  default_warehouse_id: routeWarehouseId || undefined,
                });
                setRouteCode("");
                setRouteName("");
                setRouteTerritoryId("");
                setRouteWarehouseId("");
                toastSuccess("Route created.");
              } catch (err) {
                toastError(err, {
                  fallback: "Failed to create route.",
                  context: "field-sales-route-create",
                  metadata: { companyId, code: routeCode },
                });
              }
            }}
          >
            <TextField label="Code" value={routeCode} onChange={setRouteCode} required />
            <TextField label="Name" value={routeName} onChange={setRouteName} required />
            <SelectField label="Territory" value={routeTerritoryId} onChange={setRouteTerritoryId}>
              <option value="">Optional territory</option>
              {territoryRows.map((territory) => (
                <option key={territory.id} value={territory.id}>
                  {territory.code} · {territory.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Default warehouse" value={routeWarehouseId} onChange={setRouteWarehouseId}>
              <option value="">Optional warehouse</option>
              {warehouseRows.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.code} · {warehouse.name}
                </option>
              ))}
            </SelectField>
            <PrimaryButton type="submit" disabled={createRoute.isPending}>
              {createRoute.isPending ? "Saving…" : "Create route"}
            </PrimaryButton>
          </form>
        </WorkspacePanel>

        <WorkspacePanel title="Create beat" subtitle="Define day-wise recurring outlet clusters inside each route.">
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await createBeat.mutateAsync({
                  code: beatCode,
                  name: beatName,
                  territory_id: beatTerritoryId || undefined,
                  route_id: beatRouteId,
                  day_of_week: beatDayOfWeek,
                  sequence_no: Number(beatSequenceNo || 0),
                });
                setBeatCode("");
                setBeatName("");
                setBeatRouteId("");
                setBeatTerritoryId("");
                setBeatDayOfWeek("monday");
                setBeatSequenceNo("1");
                toastSuccess("Beat created.");
              } catch (err) {
                toastError(err, {
                  fallback: "Failed to create beat.",
                  context: "field-sales-beat-create",
                  metadata: { companyId, code: beatCode },
                });
              }
            }}
          >
            <TextField label="Code" value={beatCode} onChange={setBeatCode} required />
            <TextField label="Name" value={beatName} onChange={setBeatName} required />
            <SelectField label="Territory" value={beatTerritoryId} onChange={setBeatTerritoryId}>
              <option value="">Optional territory</option>
              {territoryRows.map((territory) => (
                <option key={territory.id} value={territory.id}>
                  {territory.code} · {territory.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Route" value={beatRouteId} onChange={setBeatRouteId}>
              <option value="">Select route</option>
              {routeRows.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.code} · {route.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Day of week" value={beatDayOfWeek} onChange={setBeatDayOfWeek}>
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </SelectField>
            <TextField label="Sequence" value={beatSequenceNo} onChange={setBeatSequenceNo} type="number" />
            <PrimaryButton type="submit" disabled={createBeat.isPending || !beatRouteId}>
              {createBeat.isPending ? "Saving…" : "Create beat"}
            </PrimaryButton>
          </form>
        </WorkspacePanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <WorkspacePanel title="Current coverage map" subtitle="Use the live assignment list to confirm which outlet belongs to which lane before plan generation.">
          <DataTableShell>
            <DataTable>
              <DataThead>
                <tr>
                  <DataTh>Customer</DataTh>
                  <DataTh>Salesperson</DataTh>
                  <DataTh>Route</DataTh>
                  <DataTh>Beat</DataTh>
                  <DataTh>Priority</DataTh>
                </tr>
              </DataThead>
              <tbody>
                {coverageRows.slice(0, 12).map((row) => (
                  <DataTr key={row.id} className="hover:bg-[var(--surface-secondary)]">
                    <DataTd>{row.customer?.name ?? "—"}</DataTd>
                    <DataTd>{row.salesperson?.name ?? row.salesperson?.email ?? "—"}</DataTd>
                    <DataTd>{row.route?.name ?? "—"}</DataTd>
                    <DataTd>{row.beat?.name ?? "—"}</DataTd>
                    <DataTd>{row.priority ?? "normal"}</DataTd>
                  </DataTr>
                ))}
              </tbody>
            </DataTable>
          </DataTableShell>
        </WorkspacePanel>

        <WorkspacePanel title="Rep route assignment" subtitle="Tie a salesperson to a route or beat so D12 planning can generate a cleaner worklist.">
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await assignmentMutation.mutateAsync({
                  route_id: assignmentRouteId || undefined,
                  beat_id: assignmentBeatId || undefined,
                });
                toastSuccess("Salesperson assignment updated.");
              } catch (err) {
                toastError(err, {
                  fallback: "Failed to update assignment.",
                  context: "field-sales-assignment-update",
                  metadata: { companyId, salespersonUserId: assignmentSalespersonUserId },
                });
              }
            }}
          >
            <SelectField label="Salesperson" value={assignmentSalespersonUserId} onChange={setAssignmentSalespersonUserId}>
              <option value="">Select salesperson</option>
              {salespersonRows.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name || person.email}
                </option>
              ))}
            </SelectField>
            <SelectField label="Route" value={assignmentRouteId} onChange={setAssignmentRouteId}>
              <option value="">Optional route</option>
              {routeRows.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.code} · {route.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Beat" value={assignmentBeatId} onChange={setAssignmentBeatId}>
              <option value="">Optional beat</option>
              {beatRows.map((beat) => (
                <option key={beat.id} value={beat.id}>
                  {beat.code} · {beat.name}
                </option>
              ))}
            </SelectField>
            <PrimaryButton type="submit" disabled={assignmentMutation.isPending || !assignmentSalespersonUserId}>
              {assignmentMutation.isPending ? "Saving…" : "Save assignment"}
            </PrimaryButton>
          </form>

          <div className="mt-5 space-y-3">
            {(assignmentRows.data?.data?.data ?? []).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-panel)] p-4 text-sm text-[var(--muted)]">
                Select a salesperson to inspect or update current route ownership.
              </div>
            ) : (
              (assignmentRows.data?.data?.data ?? []).map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] p-4 [background-image:var(--surface-highlight)] shadow-[var(--shadow-soft)]">
                  <div className="font-medium text-[var(--foreground)]">{assignment.salesperson?.name ?? assignment.salesperson?.email ?? "Salesperson"}</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    {assignment.route?.name ?? "No route"} · {assignment.beat?.name ?? "No beat"}
                  </div>
                </div>
              ))
            )}
          </div>
        </WorkspacePanel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <WorkspacePanel title="Assign customer coverage" subtitle="This is the main D12 ownership layer that drives plan generation and field routing.">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await assignCoverage.mutateAsync({
                  customer_id: coverageCustomerId,
                  salesperson_user_id: coverageSalespersonUserId,
                  territory_id: coverageTerritoryId || undefined,
                  route_id: coverageRouteId || undefined,
                  beat_id: coverageBeatId || undefined,
                  visit_frequency: coverageFrequency,
                  preferred_visit_day: coveragePreferredDay,
                  priority: coveragePriority,
                  notes: coverageNotes || undefined,
                });
                setCoverageCustomerId("");
                setCoverageSalespersonUserId("");
                setCoverageTerritoryId("");
                setCoverageRouteId("");
                setCoverageBeatId("");
                setCoverageFrequency("weekly");
                setCoveragePreferredDay("monday");
                setCoveragePriority("normal");
                setCoverageNotes("");
                toastSuccess("Coverage assigned.");
              } catch (err) {
                toastError(err, {
                  fallback: "Failed to assign coverage.",
                  context: "field-sales-coverage-assign",
                  metadata: { companyId, customerId: coverageCustomerId },
                });
              }
            }}
          >
            <SelectField label="Customer" value={coverageCustomerId} onChange={setCoverageCustomerId}>
              <option value="">Select customer</option>
              {customerRows.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Salesperson" value={coverageSalespersonUserId} onChange={setCoverageSalespersonUserId}>
              <option value="">Select salesperson</option>
              {salespersonRows.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name || person.email}
                </option>
              ))}
            </SelectField>
            <SelectField label="Territory" value={coverageTerritoryId} onChange={setCoverageTerritoryId}>
              <option value="">Optional territory</option>
              {territoryRows.map((territory) => (
                <option key={territory.id} value={territory.id}>
                  {territory.code} · {territory.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Route" value={coverageRouteId} onChange={setCoverageRouteId}>
              <option value="">Optional route</option>
              {filteredRouteRows.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.code} · {route.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Beat" value={coverageBeatId} onChange={setCoverageBeatId}>
              <option value="">Optional beat</option>
              {filteredBeatRows.map((beat) => (
                <option key={beat.id} value={beat.id}>
                  {beat.code} · {beat.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Visit frequency" value={coverageFrequency} onChange={setCoverageFrequency}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="fortnightly">Fortnightly</option>
              <option value="monthly">Monthly</option>
            </SelectField>
            <SelectField label="Preferred visit day" value={coveragePreferredDay} onChange={setCoveragePreferredDay}>
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </SelectField>
            <SelectField label="Priority" value={coveragePriority} onChange={setCoveragePriority}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
            </SelectField>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">Notes</label>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent-soft)]"
                value={coverageNotes}
                onChange={(event) => setCoverageNotes(event.target.value)}
                placeholder="Outlet priority, recovery nuance, preferred ordering window…"
              />
            </div>
            <div className="md:col-span-2">
              <PrimaryButton type="submit" disabled={assignCoverage.isPending || !coverageCustomerId || !coverageSalespersonUserId}>
                {assignCoverage.isPending ? "Saving…" : "Assign coverage"}
              </PrimaryButton>
            </div>
          </form>
        </WorkspacePanel>

        <WorkspacePanel title="Assign route to salesperson" subtitle="Optional route stewardship and manager-ready route ownership mapping.">
          <form
            className="grid gap-4"
            onSubmit={async (event) => {
              event.preventDefault();
              try {
                await assignmentMutation.mutateAsync({
                  route_id: assignmentRouteId || undefined,
                  beat_id: assignmentBeatId || undefined,
                  is_primary: true,
                });
                setAssignmentRouteId("");
                setAssignmentBeatId("");
                toastSuccess("Route assignment created.");
              } catch (err) {
                toastError(err, {
                  fallback: "Failed to create assignment.",
                  context: "field-sales-route-assignment-create",
                  metadata: { companyId, salespersonUserId: assignmentSalespersonUserId },
                });
              }
            }}
          >
            <SelectField label="Salesperson" value={assignmentSalespersonUserId} onChange={setAssignmentSalespersonUserId}>
              <option value="">Select salesperson</option>
              {salespersonRows.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name || person.email}
                </option>
              ))}
            </SelectField>
            <SelectField label="Route" value={assignmentRouteId} onChange={setAssignmentRouteId}>
              <option value="">Select route</option>
              {routeRows.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.code} · {route.name}
                </option>
              ))}
            </SelectField>
            <SelectField label="Beat" value={assignmentBeatId} onChange={setAssignmentBeatId}>
              <option value="">Optional beat</option>
              {beatRows
                .filter((beat) => !assignmentRouteId || beat.route?.id === assignmentRouteId)
                .map((beat) => (
                  <option key={beat.id} value={beat.id}>
                    {beat.code} · {beat.name}
                  </option>
                ))}
            </SelectField>
            <PrimaryButton type="submit" disabled={assignmentMutation.isPending || !assignmentSalespersonUserId}>
              {assignmentMutation.isPending ? "Saving…" : "Create assignment"}
            </PrimaryButton>
          </form>

          {assignmentRows.isLoading ? <LoadingBlock label="Loading salesperson assignments…" /> : null}
          {assignmentRows.isError ? <InlineError message={getErrorMessage(assignmentRows.error, "Failed to load assignments")} /> : null}
          {assignmentRows.data?.data?.data?.length ? (
            <div className="mt-5 space-y-2 text-sm text-[var(--muted-strong)]">
              {assignmentRows.data.data.data.map((assignment) => (
                <div key={assignment.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
                  {(assignment.route?.name ?? "No route")} {assignment.beat?.name ? `· ${assignment.beat.name}` : ""}
                </div>
              ))}
            </div>
          ) : null}
        </WorkspacePanel>
      </div>

      <WorkspacePanel title="Active customer coverage" subtitle="Use this to sanity-check which outlets are actually assigned before plan generation.">
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Customer</DataTh>
                <DataTh>Salesperson</DataTh>
                <DataTh>Territory</DataTh>
                <DataTh>Route</DataTh>
                <DataTh>Beat</DataTh>
                <DataTh>Frequency</DataTh>
                <DataTh>Preferred day</DataTh>
                <DataTh>Priority</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {coverageRows.map((row) => (
                <DataTr key={row.id}>
                  <DataTd>{row.customer?.name ?? "—"}</DataTd>
                  <DataTd>{row.salesperson?.name ?? row.salesperson?.email ?? "—"}</DataTd>
                  <DataTd>{row.territory?.name ?? "—"}</DataTd>
                  <DataTd>{row.route?.name ?? "—"}</DataTd>
                  <DataTd>{row.beat?.name ?? "—"}</DataTd>
                  <DataTd>{row.visitFrequency ?? row.visit_frequency ?? "—"}</DataTd>
                  <DataTd>{row.preferredVisitDay ?? row.preferred_visit_day ?? "—"}</DataTd>
                  <DataTd>{row.priority ?? "—"}</DataTd>
                </DataTr>
              ))}
            </tbody>
          </DataTable>
        </DataTableShell>
      </WorkspacePanel>
    </div>
  );
}
