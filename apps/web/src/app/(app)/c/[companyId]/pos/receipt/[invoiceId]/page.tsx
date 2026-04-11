"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInvoice } from "@/lib/billing/hooks";
import type { Invoice, InvoiceItem } from "@/lib/billing/types";
import { getErrorMessage } from "@/lib/errors";
import { formatDateLabel } from "@/lib/format/date";
import { usePrintTemplates } from "@/lib/migration/hooks";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string; invoiceId: string }> };

type ReceiptInvoiceItem = InvoiceItem & {
  productId?: string;
  unitPrice?: string | number | null;
  lineTotal?: string | number | null;
};


function toNumber(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

export default function PosReceiptPage({ params }: Props) {
  const { companyId, invoiceId } = React.use(params);
  const searchParams = useSearchParams();
  const printRequested = searchParams.get("print") === "1";
  const printedRef = React.useRef(false);

  const query = useInvoice({ companyId, invoiceId });
  const printTemplates = usePrintTemplates(companyId);
  const invoice = query.data?.data as Invoice | undefined;
  const items = (invoice?.items ?? []) as ReceiptInvoiceItem[];
  const templateRows = Array.isArray(printTemplates.data?.data) ? printTemplates.data.data : [];
  const receiptTemplate = templateRows.find(
    (template) =>
      (template.templateType ?? template.template_type) === "receipt" &&
      Boolean(template.isDefault ?? template.is_default),
  );
  const latestVersion = Array.isArray(receiptTemplate?.versions) ? receiptTemplate?.versions?.[0] : null;
  const layout = (latestVersion?.layoutJson ?? latestVersion?.layout_json ?? {}) as {
    header?: { title?: string };
    sections?: Array<{ key?: string }>;
    footer?: { text?: string };
  };
  const visibleSections = new Set(
    Array.isArray(layout.sections) && layout.sections.length > 0
      ? layout.sections.map((section) => String(section.key ?? ""))
      : ["party", "items", "totals", "footer"],
  );

  React.useEffect(() => {
    if (!printRequested || printedRef.current || !invoice) return;
    printedRef.current = true;
    const timer = window.setTimeout(() => window.print(), 300);
    return () => window.clearTimeout(timer);
  }, [invoice, printRequested]);

  const subTotal = toNumber(invoice?.sub_total);
  const taxTotal = toNumber(invoice?.tax_total);
  const total = toNumber(invoice?.total);

  return (
    <div className="space-y-7">
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print-hidden {
            display: none !important;
          }
          .receipt-shell {
            max-width: 80mm !important;
            width: 80mm !important;
            padding: 0 !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: none !important;
          }
          .receipt-shell * {
            color: #000 !important;
          }
          .receipt-page {
            padding: 0 !important;
          }
        }
      `}</style>

      <div className="print-hidden">
        <PageHeader
          eyebrow="POS"
          title="Receipt"
          subtitle="Use the browser print dialog for thermal output or return to billing for the next customer."
          actions={
            <div className="flex flex-wrap gap-2">
              <Link href={`/c/${companyId}/pos/billing`}>
                <PrimaryButton type="button">Next sale</PrimaryButton>
              </Link>
              <Link href={`/c/${companyId}/sales/invoices/${invoiceId}`}>
                <SecondaryButton type="button">Open invoice</SecondaryButton>
              </Link>
            </div>
          }
        />
      </div>

      {(query.isLoading || printTemplates.isLoading) ? <LoadingBlock label="Loading receipt…" /> : null}
      {query.isError ? <InlineError message={getErrorMessage(query.error, "Failed to load receipt")} /> : null}
      {printTemplates.isError ? <InlineError message={getErrorMessage(printTemplates.error, "Failed to load receipt template")} /> : null}

      {invoice ? (
        <div className="receipt-page flex justify-center">
          <Card className="receipt-shell w-full max-w-[420px] border-[var(--border)] bg-white text-black shadow-lg">
            <CardHeader className="space-y-3 text-center">
              <div className="flex justify-center gap-2 print-hidden">
                <Badge variant="secondary">{invoice.status ?? "ISSUED"}</Badge>
                <Badge variant="outline">{invoice.invoice_no ?? invoice.id.slice(0, 8)}</Badge>
              </div>
              <CardTitle className="text-xl">{layout.header?.title ?? "Tax invoice"}</CardTitle>
              <CardDescription className="text-black/70">
                Receipt-ready thermal layout for browser print.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-1 text-center">
                <div className="text-base font-semibold">Vyapar Genie</div>
                <div>Invoice {invoice.invoice_no ?? invoice.id.slice(0, 8)}</div>
                <div>Date {formatDateLabel(invoice.issue_date ?? null)}</div>
              </div>

              {visibleSections.has("party") ? (
                <div className="rounded-xl border border-black/10 p-3">
                  <div className="font-semibold">{invoice.customer?.name ?? "Walk-in customer"}</div>
                  {invoice.customer?.phone ? <div>{invoice.customer.phone}</div> : null}
                  {invoice.customer?.gstin ? <div>GSTIN {invoice.customer.gstin}</div> : null}
                </div>
              ) : null}

              {visibleSections.has("items") ? (
                <div className="space-y-2">
                  {items.map((item, index) => {
                    const qty = toNumber(item.quantity);
                    const unit = toNumber(item.unitPrice ?? item.unit_price);
                    const lineTotal = toNumber(item.lineTotal ?? item.line_total);
                    const productName = item.product?.name ?? item.productId ?? item.product_id;
                    return (
                      <div key={item.id ?? `${item.product_id}_${index}`} className="border-b border-dashed border-black/10 pb-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="font-medium">{productName}</div>
                          <div className="font-semibold">{lineTotal.toFixed(2)}</div>
                        </div>
                        <div className="mt-1 text-xs text-black/70">
                          {qty.toFixed(2)} × {unit.toFixed(2)}
                          {item.tax_rate ? ` · GST ${toNumber(item.tax_rate).toFixed(0)}%` : ""}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}

              {visibleSections.has("totals") ? (
                <div className="space-y-1 rounded-xl border border-black/10 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-black/70">Sub-total</span>
                    <span>{subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-black/70">GST</span>
                    <span>{taxTotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span>{total.toFixed(2)}</span>
                  </div>
                </div>
              ) : null}

              {visibleSections.has("footer") ? (
                <div className="space-y-2 text-center text-xs text-black/60">
                  {layout.footer?.text ?? "Thank you for your purchase."}
                  <div className="rounded-xl border border-black/10 bg-black/[0.02] px-3 py-2 text-[11px] text-black/65">
                    This receipt is generated from the live invoice record and is ready for thermal print or PDF save.
                  </div>
                </div>
              ) : null}

              <div className="print-hidden flex flex-wrap gap-2 pt-2">
                <PrimaryButton type="button" className="flex-1" onClick={() => window.print()}>
                  Print receipt
                </PrimaryButton>
                <Link className="flex-1" href={`/c/${companyId}/pos/billing`}>
                  <SecondaryButton type="button" className="w-full">Back to POS</SecondaryButton>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
