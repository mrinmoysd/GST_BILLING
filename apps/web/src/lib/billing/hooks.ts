"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";
import { createIdempotencyKey, idempotencyHeaders } from "@/lib/api/idempotency";
import type { Paginated } from "@/lib/masters/types";
import type { Invoice, Ledger, Journal, PaginatedPayments, Payment, Purchase } from "@/lib/billing/types";

export function useInvoices(args: {
  companyId: string;
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  enabled?: boolean;
}) {
  const { companyId, page = 1, limit = 20, q, status, from, to, enabled = true } = args;
  return useQuery({
    queryKey: ["companies", companyId, "invoices", { page, limit, q, status, from, to }],
    enabled,
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (q) qs.set("q", q);
      if (status) qs.set("status", status);
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);

      return apiClient.get<Paginated<Invoice>>(companyPath(companyId, `/invoices?${qs.toString()}`));
    },
  });
}

export function useInvoice(args: { companyId: string; invoiceId: string }) {
  const { companyId, invoiceId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "invoices", invoiceId],
    queryFn: async () => {
      return apiClient.get<Invoice>(companyPath(companyId, `/invoices/${invoiceId}`));
    },
  });
}

export function useCreateInvoice(args: { companyId: string }) {
  const qc = useQueryClient();
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "invoices", "create"],
    mutationFn: async (body: {
      customer_id: string;
      series_code?: string;
      issue_date?: string;
      due_date?: string;
      notes?: string;
      items: Array<{ product_id: string; quantity: string; unit_price: string; discount?: string }>;
    }) => {
      const key = createIdempotencyKey("invoice_create");
      return apiClient.post<Invoice>(
        companyPath(companyId, `/invoices`),
        body,
        idempotencyHeaders(key),
      );
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "invoices"] });
    },
  });
}

export function usePayments(args: {
  companyId: string;
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  method?: string;
}) {
  const { companyId, page = 1, limit = 20, from, to, method } = args;
  return useQuery({
    queryKey: ["companies", companyId, "payments", { page, limit, from, to, method }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      if (method) qs.set("method", method);
      return apiClient.get<PaginatedPayments>(companyPath(companyId, `/payments?${qs.toString()}`));
    },
  });
}

export function useRecordPayment(args: { companyId: string }) {
  const qc = useQueryClient();
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "payments", "record"],
    mutationFn: async (body: {
  invoice_id?: string;
  purchase_id?: string;
      amount: string;
      method: string;
      reference?: string;
      payment_date?: string;
    }) => {
      const key = createIdempotencyKey("payment_record");
      return apiClient.post<Payment>(
        companyPath(companyId, `/payments`),
        body,
        idempotencyHeaders(key),
      );
    },
    onSuccess: async (_res, vars) => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "payments"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "invoices"] });
      if (vars.invoice_id) {
        await qc.invalidateQueries({ queryKey: ["companies", companyId, "invoices", vars.invoice_id] });
      }
      if (vars.purchase_id) {
        await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases", vars.purchase_id] });
        await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases"] });
      }
    },
  });
}

export function usePatchInvoice(args: { companyId: string; invoiceId: string }) {
  const qc = useQueryClient();
  const { companyId, invoiceId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "invoices", invoiceId, "patch"],
    mutationFn: async (body: { notes?: string; issue_date?: string; due_date?: string }) => {
      return apiClient.patch<Invoice>(companyPath(companyId, `/invoices/${invoiceId}`), body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "invoices", invoiceId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "invoices"] });
    },
  });
}

export function useIssueInvoice(args: { companyId: string; invoiceId: string }) {
  const qc = useQueryClient();
  const { companyId, invoiceId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "invoices", invoiceId, "issue"],
    mutationFn: async (body: { series_code: string }) => {
      return apiClient.post<Invoice>(companyPath(companyId, `/invoices/${invoiceId}/issue`), body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "invoices", invoiceId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "invoices"] });
    },
  });
}

export function useCancelInvoice(args: { companyId: string; invoiceId: string }) {
  const qc = useQueryClient();
  const { companyId, invoiceId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "invoices", invoiceId, "cancel"],
    mutationFn: async () => {
      return apiClient.post<Invoice>(companyPath(companyId, `/invoices/${invoiceId}/cancel`), {});
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "invoices", invoiceId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "invoices"] });
    },
  });
}

export function useCreateCreditNote(args: { companyId: string; invoiceId: string }) {
  const qc = useQueryClient();
  const { companyId, invoiceId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "invoices", invoiceId, "credit-notes", "create"],
    mutationFn: async (body: {
      note_date?: string;
      notes?: string;
      restock?: boolean;
      kind?: "credit_note" | "sales_return";
      items: Array<{ invoice_item_id?: string; product_id: string; quantity: string }>;
    }) => {
      return apiClient.post<{ id: string }>(companyPath(companyId, `/invoices/${invoiceId}/credit-notes`), body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "invoices", invoiceId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "invoices"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "payments"] });
    },
  });
}

export function useShareInvoice(args: { companyId: string; invoiceId: string }) {
  const qc = useQueryClient();
  const { companyId, invoiceId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "invoices", invoiceId, "share"],
    mutationFn: async (body: { channel: "email" | "whatsapp" | "sms"; recipient: string; message?: string }) => {
      return apiClient.post<{ share: { id: string }; pdf_url?: string }>(companyPath(companyId, `/invoices/${invoiceId}/share`), body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "invoices", invoiceId] });
    },
  });
}

export function useRegenerateInvoicePdf(args: { companyId: string; invoiceId: string }) {
  const { companyId, invoiceId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "invoices", invoiceId, "pdf", "regenerate"],
    mutationFn: async () => {
      return apiClient.post<{ ok: true }>(
        companyPath(companyId, `/invoices/${invoiceId}/pdf/regenerate`),
        {},
      );
    },
  });
}

export function useJob(args: { companyId: string; jobId?: string; enabled?: boolean }) {
  const { companyId, jobId, enabled = true } = args;
  return useQuery({
    enabled: enabled && Boolean(jobId),
    queryKey: ["companies", companyId, "jobs", jobId],
    queryFn: async () => {
      return apiClient.get<{
        data: {
          id: string;
          name: string;
          state: "queued" | "running" | "succeeded" | "failed" | string;
          created_at: string | null;
          started_at: string | null;
          finished_at: string | null;
          failed_reason: string | null;
        };
      }>(companyPath(companyId, `/jobs/${jobId}`));
    },
    refetchInterval: (query) => {
      const state = query.state.data?.data.data.state;
      return state === "succeeded" || state === "failed" ? false : 2000;
    },
  });
}

export function invoicePdfUrl(companyId: string, invoiceId: string) {
  return apiClient.resolveUrl(companyPath(companyId, `/invoices/${invoiceId}/pdf`));
}

export function usePurchases(args: {
  companyId: string;
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
  from?: string;
  to?: string;
  enabled?: boolean;
}) {
  const { companyId, page = 1, limit = 20, q, status, from, to, enabled = true } = args;
  return useQuery({
    queryKey: ["companies", companyId, "purchases", { page, limit, q, status, from, to }],
    enabled,
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (q) qs.set("q", q);
      if (status) qs.set("status", status);
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      return apiClient.get<Paginated<Purchase>>(companyPath(companyId, `/purchases?${qs.toString()}`));
    },
  });
}

export function usePurchase(args: { companyId: string; purchaseId: string }) {
  const { companyId, purchaseId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "purchases", purchaseId],
    queryFn: async () => {
      return apiClient.get<Purchase>(companyPath(companyId, `/purchases/${purchaseId}`));
    },
  });
}

export function useCreatePurchase(args: { companyId: string }) {
  const qc = useQueryClient();
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "purchases", "create"],
    mutationFn: async (body: {
      supplier_id: string;
      purchase_date?: string;
      notes?: string;
      items: Array<{ product_id: string; quantity: string; unit_cost: string; discount?: string }>;
    }) => {
      return apiClient.post<Purchase>(companyPath(companyId, `/purchases`), body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases"] });
    },
  });
}

export function usePatchPurchase(args: { companyId: string; purchaseId: string }) {
  const qc = useQueryClient();
  const { companyId, purchaseId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "purchases", purchaseId, "patch"],
    mutationFn: async (body: Record<string, unknown>) => {
      return apiClient.patch<Purchase>(companyPath(companyId, `/purchases/${purchaseId}`), body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases", purchaseId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases"] });
    },
  });
}

export function useReceivePurchase(args: { companyId: string; purchaseId: string }) {
  const qc = useQueryClient();
  const { companyId, purchaseId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "purchases", purchaseId, "receive"],
    mutationFn: async () => {
      return apiClient.post<Purchase>(companyPath(companyId, `/purchases/${purchaseId}/receive`), {});
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases", purchaseId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases"] });
    },
  });
}

export function useCancelPurchase(args: { companyId: string; purchaseId: string }) {
  const qc = useQueryClient();
  const { companyId, purchaseId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "purchases", purchaseId, "cancel"],
    mutationFn: async () => {
      return apiClient.post<Purchase>(companyPath(companyId, `/purchases/${purchaseId}/cancel`), {});
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases", purchaseId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases"] });
    },
  });
}

export function useCreatePurchaseReturn(args: { companyId: string; purchaseId: string }) {
  const qc = useQueryClient();
  const { companyId, purchaseId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "purchases", purchaseId, "returns", "create"],
    mutationFn: async (body: {
      return_date?: string;
      notes?: string;
      items: Array<{ purchase_item_id?: string; product_id: string; quantity: string }>;
    }) => {
      return apiClient.post<{ id: string }>(companyPath(companyId, `/purchases/${purchaseId}/returns`), body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases", purchaseId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "payments"] });
    },
  });
}

export function purchaseBillUrl(companyId: string, purchaseId: string) {
  return apiClient.resolveUrl(companyPath(companyId, `/purchases/${purchaseId}/bill`));
}

export function useUploadPurchaseBill(args: { companyId: string; purchaseId: string }) {
  const qc = useQueryClient();
  const { companyId, purchaseId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "purchases", purchaseId, "bill", "upload"],
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiClient.postForm<{ ok: boolean }>(companyPath(companyId, `/purchases/${purchaseId}/bill`), form);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases", purchaseId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "purchases"] });
    },
  });
}

export function useLedgers(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "ledgers"],
    queryFn: async () => {
      return apiClient.get<Ledger[]>(companyPath(companyId, `/ledgers`));
    },
  });
}

export function useCreateLedger(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "ledgers", "create"],
    mutationFn: async (body: { name: string; type?: string }) => {
      // Accounting controller returns { ok: true, data }
      return apiClient.post<{ ok: true; data: Ledger }>(companyPath(companyId, `/ledgers`), body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "ledgers"] });
    },
  });
}

export function useJournals(args: { companyId: string; from?: string; to?: string; page?: number; limit?: number }) {
  const { companyId, from, to, page = 1, limit = 20 } = args;
  return useQuery({
    queryKey: ["companies", companyId, "journals", { from, to, page, limit }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      return apiClient.get<Paginated<Journal>>(companyPath(companyId, `/journals?${qs.toString()}`));
    },
  });
}

export function useJournal(args: { companyId: string; journalId: string }) {
  const { companyId, journalId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "journals", journalId],
    queryFn: async () => apiClient.get<{ ok: true; data: unknown }>(companyPath(companyId, `/journals/${journalId}`)),
  });
}

export function useCreateJournal(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "journals", "create"],
    mutationFn: async (body: { date: string; narration?: string; lines: Array<{ debit_ledger_id?: string; credit_ledger_id?: string; amount: string }> }) => {
      return apiClient.post<{ ok: true; data: Journal }>(companyPath(companyId, `/journals`), body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "journals"] });
    },
  });
}

export function useAccountingPeriodLock(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "accounting", "period-lock"],
    queryFn: async () =>
      apiClient.get<{ ok: true; data: { lock_until?: string | null; reason?: string | null } }>(
        companyPath(companyId, `/accounting/period-lock`),
      ),
  });
}

export function useUpdateAccountingPeriodLock(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "accounting", "period-lock", "update"],
    mutationFn: async (body: { lock_until?: string | null; reason?: string | null }) =>
      apiClient.put<{ ok: true; data: { lock_until?: string | null; reason?: string | null } }>(
        companyPath(companyId, `/accounting/period-lock`),
        body,
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "accounting", "period-lock"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "journals"] });
    },
  });
}

export function useTrialBalance(args: { companyId: string; as_of?: string }) {
  const { companyId, as_of } = args;
  return useQuery({
    queryKey: ["companies", companyId, "reports", "trial-balance", { as_of }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (as_of) qs.set("as_of", as_of);
      return apiClient.get<{
        as_of: string;
        rows: Array<{
          ledger_id: string;
          ledger_name: string;
          ledger_type?: string;
          top_level?: string;
          debit: number;
          credit: number;
          net_balance: number;
        }>;
        totals: { debit: number; credit: number; difference: number };
      }>(companyPath(companyId, `/reports/trial-balance?${qs.toString()}`));
    },
  });
}

export function useProfitLoss(args: { companyId: string; from?: string; to?: string }) {
  const { companyId, from, to } = args;
  return useQuery({
    queryKey: ["companies", companyId, "reports", "profit-loss", { from, to }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      return apiClient.get<{
        period: { from: string; to: string };
        summary: { income: number; expense: number; profit: number };
        income: Array<{ ledger_id: string; ledger_name: string; amount: number }>;
        expenses: Array<{ ledger_id: string; ledger_name: string; amount: number }>;
      }>(companyPath(companyId, `/reports/profit-loss?${qs.toString()}`));
    },
  });
}

export function useBalanceSheet(args: { companyId: string; as_of?: string }) {
  const { companyId, as_of } = args;
  return useQuery({
    queryKey: ["companies", companyId, "reports", "balance-sheet", { as_of }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (as_of) qs.set("as_of", as_of);
      return apiClient.get<{
        as_of: string;
        summary: {
          assets: number;
          liabilities: number;
          equity: number;
          liabilities_and_equity: number;
          difference: number;
        };
        assets: Array<{ ledger_id: string; ledger_name: string; amount: number }>;
        liabilities: Array<{ ledger_id: string; ledger_name: string; amount: number }>;
        equity: Array<{ ledger_id: string; ledger_name: string; amount: number }>;
      }>(companyPath(companyId, `/reports/balance-sheet?${qs.toString()}`));
    },
  });
}

export function useCashBook(args: { companyId: string; from?: string; to?: string }) {
  const { companyId, from, to } = args;
  return useQuery({
    queryKey: ["companies", companyId, "books", "cash", { from, to }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      return apiClient.get<{ ok: true; data: unknown }>(companyPath(companyId, `/books/cash?${qs.toString()}`));
    },
  });
}

export function useBankBook(args: { companyId: string; from?: string; to?: string }) {
  const { companyId, from, to } = args;
  return useQuery({
    queryKey: ["companies", companyId, "books", "bank", { from, to }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      return apiClient.get<{ ok: true; data: unknown }>(companyPath(companyId, `/books/bank?${qs.toString()}`));
    },
  });
}
