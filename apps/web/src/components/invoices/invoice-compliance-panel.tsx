"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  useCancelEInvoice,
  useCancelEWayBill,
  useGenerateEInvoice,
  useGenerateEWayBill,
  useInvoiceCompliance,
  useSyncEInvoice,
  useSyncEWayBill,
  useUpdateEWayBillVehicle,
} from "@/lib/billing/hooks";
import { DateField, PrimaryButton, SecondaryButton, SelectField, TextField } from "@/lib/ui/form";
import { InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspacePanel } from "@/lib/ui/workspace";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

type Props = {
  companyId: string;
  invoiceId: string;
};

export function InvoiceCompliancePanel({ companyId, invoiceId }: Props) {
  const query = useInvoiceCompliance({ companyId, invoiceId });
  const generateEInvoice = useGenerateEInvoice({ companyId, invoiceId });
  const cancelEInvoice = useCancelEInvoice({ companyId, invoiceId });
  const syncEInvoice = useSyncEInvoice({ companyId, invoiceId });
  const generateEWayBill = useGenerateEWayBill({ companyId, invoiceId });
  const updateVehicle = useUpdateEWayBillVehicle({ companyId, invoiceId });
  const cancelEWayBill = useCancelEWayBill({ companyId, invoiceId });
  const syncEWayBill = useSyncEWayBill({ companyId, invoiceId });

  const [transporterName, setTransporterName] = React.useState("");
  const [transporterId, setTransporterId] = React.useState("");
  const [vehicleNumber, setVehicleNumber] = React.useState("");
  const [distanceKm, setDistanceKm] = React.useState("");
  const [transportMode, setTransportMode] = React.useState("road");
  const [transportDocumentNumber, setTransportDocumentNumber] = React.useState("");
  const [transportDocumentDate, setTransportDocumentDate] = React.useState("");
  const [cancelReason, setCancelReason] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const compliance = query.data?.data;

  React.useEffect(() => {
    if (!compliance) return;
    setTransporterName(compliance.e_way_bill.transporter_name ?? "");
    setTransporterId(compliance.e_way_bill.transporter_id ?? "");
    setVehicleNumber(compliance.e_way_bill.vehicle_number ?? "");
    setDistanceKm(
      compliance.e_way_bill.distance_km !== null && compliance.e_way_bill.distance_km !== undefined
        ? String(compliance.e_way_bill.distance_km)
        : "",
    );
    setTransportMode(compliance.e_way_bill.transport_mode ?? "road");
    setTransportDocumentNumber(compliance.e_way_bill.transport_document_number ?? "");
    setTransportDocumentDate(compliance.e_way_bill.transport_document_date ?? "");
  }, [compliance]);

  if (query.isLoading) return <LoadingBlock label="Loading GST compliance…" />;
  if (query.isError) return <InlineError message={getErrorMessage(query.error, "Failed to load GST compliance")} />;
  if (!compliance) return null;

  const eInvoiceBlocked =
    !compliance.config.e_invoice_enabled ||
    compliance.e_invoice.eligibility_status === "blocked" ||
    compliance.e_invoice.eligibility_status === "not_configured";
  const eWayBlocked =
    !compliance.config.e_way_bill_enabled ||
    compliance.e_way_bill.eligibility_status === "blocked" ||
    compliance.e_way_bill.eligibility_status === "not_configured";

  async function runAction(fn: () => Promise<unknown>, successMessage: string) {
    setError(null);
    try {
      await fn();
      toast.success(successMessage);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Compliance action failed");
      setError(message);
      toast.error(message);
    }
  }

  return (
    <WorkspacePanel
      title="GST compliance"
      subtitle="Manage e-invoice and e-way bill status, retries, and transport updates from the invoice surface."
    >
      {error ? <InlineError message={error} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="text-sm font-semibold">E-invoice</div>
          <div className="grid gap-3 text-sm">
            <div>Status: <span className="font-medium">{compliance.e_invoice.status}</span></div>
            <div>Eligibility: <span className="font-medium">{compliance.e_invoice.eligibility_status}</span></div>
            <div>IRN: <span className="font-medium">{compliance.e_invoice.irn ?? "—"}</span></div>
            <div>Ack no: <span className="font-medium">{compliance.e_invoice.ack_no ?? "—"}</span></div>
            <div>Last sync: <span className="font-medium">{compliance.e_invoice.last_synced_at ? new Date(compliance.e_invoice.last_synced_at).toLocaleString() : "—"}</span></div>
            {compliance.e_invoice.eligibility_reasons.length > 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-[var(--muted-strong)]">
                {compliance.e_invoice.eligibility_reasons.join(" · ")}
              </div>
            ) : null}
            {compliance.e_invoice.last_error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                {compliance.e_invoice.last_error}
              </div>
            ) : null}
            {compliance.e_invoice.signed_qr_payload ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-xs text-[var(--muted-strong)] break-all">
                QR payload: {compliance.e_invoice.signed_qr_payload}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton
              type="button"
              disabled={generateEInvoice.isPending || eInvoiceBlocked || compliance.e_invoice.status === "generated"}
              onClick={() => runAction(() => generateEInvoice.mutateAsync({}), "E-invoice generated")}
            >
              {generateEInvoice.isPending ? "Generating…" : "Generate IRN"}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              disabled={syncEInvoice.isPending || compliance.e_invoice.status === "not_started"}
              onClick={() => runAction(() => syncEInvoice.mutateAsync({}), "E-invoice synced")}
            >
              {syncEInvoice.isPending ? "Syncing…" : "Sync"}
            </SecondaryButton>
            <SecondaryButton
              type="button"
              disabled={cancelEInvoice.isPending || compliance.e_invoice.status !== "generated"}
              onClick={() =>
                runAction(
                  () => cancelEInvoice.mutateAsync({ reason: cancelReason || undefined }),
                  "E-invoice cancelled",
                )
              }
            >
              {cancelEInvoice.isPending ? "Cancelling…" : "Cancel IRN"}
            </SecondaryButton>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
          <div className="text-sm font-semibold">E-way bill</div>
          <div className="grid gap-3 md:grid-cols-2">
            <TextField label="Transporter" value={transporterName} onChange={setTransporterName} />
            <TextField label="Transporter ID" value={transporterId} onChange={setTransporterId} />
            <TextField label="Vehicle number" value={vehicleNumber} onChange={setVehicleNumber} />
            <TextField label="Distance (km)" value={distanceKm} onChange={setDistanceKm} />
            <SelectField
              label="Transport mode"
              value={transportMode}
              onChange={setTransportMode}
              options={[
                { value: "road", label: "Road" },
                { value: "rail", label: "Rail" },
                { value: "air", label: "Air" },
                { value: "ship", label: "Ship" },
              ]}
            />
            <TextField
              label="Transport document no"
              value={transportDocumentNumber}
              onChange={setTransportDocumentNumber}
            />
            <DateField
              label="Transport document date"
              value={transportDocumentDate}
              onChange={setTransportDocumentDate}
            />
            <TextField label="Cancel reason" value={cancelReason} onChange={setCancelReason} />
          </div>
          <div className="grid gap-3 text-sm">
            <div>Status: <span className="font-medium">{compliance.e_way_bill.status}</span></div>
            <div>Eligibility: <span className="font-medium">{compliance.e_way_bill.eligibility_status}</span></div>
            <div>EWB no: <span className="font-medium">{compliance.e_way_bill.eway_bill_number ?? "—"}</span></div>
            <div>Valid until: <span className="font-medium">{compliance.e_way_bill.valid_until ? new Date(compliance.e_way_bill.valid_until).toLocaleString() : "—"}</span></div>
            {compliance.e_way_bill.eligibility_reasons.length > 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3 text-[var(--muted-strong)]">
                {compliance.e_way_bill.eligibility_reasons.join(" · ")}
              </div>
            ) : null}
            {compliance.e_way_bill.last_error ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                {compliance.e_way_bill.last_error}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            <PrimaryButton
              type="button"
              disabled={generateEWayBill.isPending || eWayBlocked || compliance.e_way_bill.status === "generated"}
              onClick={() =>
                runAction(
                  () =>
                    generateEWayBill.mutateAsync({
                      transporter_name: transporterName || undefined,
                      transporter_id: transporterId || undefined,
                      vehicle_number: vehicleNumber || undefined,
                      distance_km: distanceKm ? Number(distanceKm) : undefined,
                      transport_mode: transportMode || undefined,
                      transport_document_number: transportDocumentNumber || undefined,
                      transport_document_date: transportDocumentDate || undefined,
                    }),
                  "E-way bill generated",
                )
              }
            >
              {generateEWayBill.isPending ? "Generating…" : "Generate EWB"}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              disabled={updateVehicle.isPending || compliance.e_way_bill.status !== "generated"}
              onClick={() =>
                runAction(
                  () =>
                    updateVehicle.mutateAsync({
                      transporter_name: transporterName || undefined,
                      vehicle_number: vehicleNumber || undefined,
                      distance_km: distanceKm ? Number(distanceKm) : undefined,
                      transport_mode: transportMode || undefined,
                      transport_document_number: transportDocumentNumber || undefined,
                      transport_document_date: transportDocumentDate || undefined,
                    }),
                  "Vehicle updated",
                )
              }
            >
              {updateVehicle.isPending ? "Updating…" : "Update vehicle"}
            </SecondaryButton>
            <SecondaryButton
              type="button"
              disabled={syncEWayBill.isPending || compliance.e_way_bill.status === "not_started"}
              onClick={() => runAction(() => syncEWayBill.mutateAsync({}), "E-way bill synced")}
            >
              {syncEWayBill.isPending ? "Syncing…" : "Sync"}
            </SecondaryButton>
            <SecondaryButton
              type="button"
              disabled={cancelEWayBill.isPending || compliance.e_way_bill.status !== "generated"}
              onClick={() =>
                runAction(
                  () => cancelEWayBill.mutateAsync({ reason: cancelReason || undefined }),
                  "E-way bill cancelled",
                )
              }
            >
              {cancelEWayBill.isPending ? "Cancelling…" : "Cancel EWB"}
            </SecondaryButton>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
        <div className="text-sm font-semibold">Compliance event history</div>
        <div className="mt-3 space-y-3 text-sm">
          {compliance.events.length === 0 ? (
            <div className="text-[var(--muted)]">No compliance events yet.</div>
          ) : (
            compliance.events.slice(0, 8).map((event) => (
              <div key={event.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
                <div className="font-medium">{event.summary}</div>
                <div className="mt-1 text-[var(--muted)]">
                  {event.event_type} · {event.status} · {new Date(event.created_at).toLocaleString()}
                </div>
                {event.error_message ? <div className="mt-1 text-amber-800">{event.error_message}</div> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </WorkspacePanel>
  );
}
