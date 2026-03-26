"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export type BankAccount = {
  id: string;
  nickname: string;
  bankName: string;
  bank_name?: string;
  branchName?: string | null;
  branch_name?: string | null;
  accountHolderName?: string | null;
  account_holder_name?: string | null;
  accountNumberMasked?: string | null;
  account_number_masked?: string | null;
  accountNumberLast4?: string | null;
  account_number_last4?: string | null;
  ifscCode?: string | null;
  ifsc_code?: string | null;
  upiHandle?: string | null;
  upi_handle?: string | null;
  isActive?: boolean;
  is_active?: boolean;
  ledger?: {
    id: string;
    accountName?: string;
    account_name?: string;
    accountCode?: string;
    account_code?: string;
  } | null;
};

export type CollectionTask = {
  id: string;
  status: string;
  priority: string;
  channel?: string | null;
  dueDate?: string | null;
  due_date?: string | null;
  nextActionDate?: string | null;
  next_action_date?: string | null;
  promiseToPayDate?: string | null;
  promise_to_pay_date?: string | null;
  promiseToPayAmount?: string | number | null;
  promise_to_pay_amount?: string | number | null;
  outcome?: string | null;
  notes?: string | null;
  customer?: { id: string; name: string; phone?: string | null };
  invoice?: {
    id: string;
    invoiceNumber?: string | null;
    invoice_number?: string | null;
    balanceDue?: string | number | null;
    balance_due?: string | number | null;
  } | null;
  assignee?: { id: string; name?: string | null; email?: string | null } | null;
  salesperson?: { id: string; name?: string | null; email?: string | null } | null;
};

export type BankStatementImport = {
  id: string;
  sourceFilename?: string | null;
  source_filename?: string | null;
  lineCount?: number;
  line_count?: number;
  importedAt?: string;
  imported_at?: string;
  bankAccount?: BankAccount | null;
};

export type BankStatementLine = {
  id: string;
  txnDate?: string;
  txn_date?: string;
  description: string;
  reference?: string | null;
  amount: string | number;
  direction: string;
  status: string;
  matchedAt?: string | null;
  matched_at?: string | null;
  bankAccount?: BankAccount | null;
  import?: BankStatementImport | null;
  matchedPayment?: {
    id: string;
    method?: string | null;
    invoice?: {
      id: string;
      invoiceNumber?: string | null;
      invoice_number?: string | null;
      customer?: { id: string; name: string } | null;
    } | null;
  } | null;
  candidates?: Array<{
    id: string;
    amount: number;
    method: string;
    instrument_status?: string | null;
    payment_date?: string | null;
    invoice?: {
      id: string;
      invoiceNumber?: string | null;
      invoice_number?: string | null;
      customer?: { id: string; name: string } | null;
    } | null;
  }>;
};

export function useBankAccounts(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "bank-accounts"],
    queryFn: async () => apiClient.get<{ data: BankAccount[] }>(companyPath(companyId, "/bank-accounts")),
  });
}

export function useCreateBankAccount(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "bank-accounts", "create"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post<{ data: BankAccount }>(companyPath(companyId, "/bank-accounts"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "bank-accounts"] });
    },
  });
}

export function useUpdateBankAccount(companyId: string, bankAccountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "bank-accounts", bankAccountId, "update"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.patch<{ data: BankAccount }>(companyPath(companyId, `/bank-accounts/${bankAccountId}`), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "bank-accounts"] });
    },
  });
}

export function useCollectionTasks(args: {
  companyId: string;
  status?: string;
  assigned_to_user_id?: string;
  customer_id?: string;
}) {
  const { companyId, status, assigned_to_user_id, customer_id } = args;
  return useQuery({
    queryKey: ["companies", companyId, "collections", "tasks", { status, assigned_to_user_id, customer_id }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      if (assigned_to_user_id) qs.set("assigned_to_user_id", assigned_to_user_id);
      if (customer_id) qs.set("customer_id", customer_id);
      return apiClient.get<{ data: CollectionTask[] }>(companyPath(companyId, `/collections/tasks?${qs.toString()}`));
    },
  });
}

export function useCreateCollectionTask(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "collections", "tasks", "create"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post<{ data: CollectionTask }>(companyPath(companyId, "/collections/tasks"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "collections", "tasks"] });
    },
  });
}

export function useUpdateCollectionTask(companyId: string, taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "collections", "tasks", taskId, "update"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.patch<{ data: CollectionTask }>(companyPath(companyId, `/collections/tasks/${taskId}`), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "collections", "tasks"] });
    },
  });
}

export function useBankStatementImports(args: { companyId: string; bank_account_id?: string }) {
  const { companyId, bank_account_id } = args;
  return useQuery({
    queryKey: ["companies", companyId, "bank-statements", "imports", { bank_account_id }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (bank_account_id) qs.set("bank_account_id", bank_account_id);
      return apiClient.get<{ data: BankStatementImport[] }>(
        companyPath(companyId, `/bank-statements/imports?${qs.toString()}`),
      );
    },
  });
}

export function useImportBankStatement(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "bank-statements", "imports", "create"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post<{ data: BankStatementImport }>(companyPath(companyId, "/bank-statements/imports"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "bank-statements", "imports"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "bank-statements", "lines"] });
    },
  });
}

export function useBankStatementLines(args: {
  companyId: string;
  status?: string;
  bank_account_id?: string;
}) {
  const { companyId, status, bank_account_id } = args;
  return useQuery({
    queryKey: ["companies", companyId, "bank-statements", "lines", { status, bank_account_id }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (status) qs.set("status", status);
      if (bank_account_id) qs.set("bank_account_id", bank_account_id);
      return apiClient.get<{ data: BankStatementLine[] }>(
        companyPath(companyId, `/bank-statements/lines?${qs.toString()}`),
      );
    },
  });
}

export function useMatchBankStatementLine(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "bank-reconciliation", "match"],
    mutationFn: async (body: { statement_line_id: string; payment_id: string }) =>
      apiClient.post(companyPath(companyId, "/bank-reconciliation/match"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "bank-statements", "lines"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "payments"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "reports"] });
    },
  });
}

export function useUnmatchBankStatementLine(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "bank-reconciliation", "unmatch"],
    mutationFn: async (body: { statement_line_id: string }) =>
      apiClient.post(companyPath(companyId, "/bank-reconciliation/unmatch"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "bank-statements", "lines"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "payments"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "reports"] });
    },
  });
}
