"use client";

import * as React from "react";
import { toast } from "sonner";

import { useLedgers } from "@/lib/billing/hooks";
import {
  useBankAccounts,
  useBankStatementImports,
  useBankStatementLines,
  useCreateBankAccount,
  useImportBankStatement,
  useMatchBankStatementLine,
  useUnmatchBankStatementLine,
} from "@/lib/finance/hooks";
import { DataTable, DataTableShell, DataTd, DataTh, DataThead, DataTr } from "@/lib/ui/datatable";
import { PrimaryButton, SelectField, TextField } from "@/lib/ui/form";
import { EmptyState, InlineError, LoadingBlock } from "@/lib/ui/state";
import { WorkspaceHero, WorkspacePanel } from "@/lib/ui/workspace";

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

type Props = { params: Promise<{ companyId: string }> };

export default function BankingPage({ params }: Props) {
  const { companyId } = React.use(params);
  const [nickname, setNickname] = React.useState("");
  const [bankName, setBankName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [ifscCode, setIfscCode] = React.useState("");
  const [ledgerId, setLedgerId] = React.useState("");
  const [statementBankAccountId, setStatementBankAccountId] = React.useState("");
  const [statementFilename, setStatementFilename] = React.useState("");
  const [statementContent, setStatementContent] = React.useState("");

  const bankAccountsQuery = useBankAccounts(companyId);
  const bankImportsQuery = useBankStatementImports({ companyId, bank_account_id: statementBankAccountId || undefined });
  const bankLinesQuery = useBankStatementLines({ companyId, bank_account_id: statementBankAccountId || undefined });
  const ledgersQuery = useLedgers(companyId);
  const createBankAccount = useCreateBankAccount(companyId);
  const importStatement = useImportBankStatement(companyId);
  const matchLine = useMatchBankStatementLine(companyId);
  const unmatchLine = useUnmatchBankStatementLine(companyId);

  const bankAccounts = bankAccountsQuery.data?.data.data ?? [];
  const ledgers = ledgersQuery.data?.data ?? [];
  const imports = bankImportsQuery.data?.data.data ?? [];
  const lines = bankLinesQuery.data?.data.data ?? [];

  return (
    <div className="space-y-7">
      <WorkspaceHero
        eyebrow="Banking"
        title="Banking and reconciliation"
        subtitle="Maintain bank masters, import statements, and reconcile real bank movement against recorded receipts."
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <WorkspacePanel title="Bank account master" subtitle="Map operating bank accounts to the finance workspace.">
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await createBankAccount.mutateAsync({
                  nickname,
                  bank_name: bankName,
                  account_number: accountNumber || undefined,
                  ifsc_code: ifscCode || undefined,
                  ledger_id: ledgerId || undefined,
                });
                setNickname("");
                setBankName("");
                setAccountNumber("");
                setIfscCode("");
                toast.success("Bank account added");
              } catch (err: unknown) {
                toast.error(getErrorMessage(err, "Failed to create bank account"));
              }
            }}
          >
            <TextField label="Nickname" value={nickname} onChange={setNickname} required />
            <TextField label="Bank name" value={bankName} onChange={setBankName} required />
            <TextField label="Account number" value={accountNumber} onChange={setAccountNumber} />
            <TextField label="IFSC" value={ifscCode} onChange={setIfscCode} />
            <SelectField
              label="Bank ledger"
              value={ledgerId}
              onChange={setLedgerId}
              options={[
                { value: "", label: "Optional ledger" },
                ...ledgers.map((ledger) => ({
                  value: ledger.id,
                  label: `${ledger.name ?? ledger.account_name ?? ledger.id}`,
                })),
              ]}
            />
            <div className="flex items-end">
              <PrimaryButton type="submit" disabled={createBankAccount.isPending}>
                {createBankAccount.isPending ? "Saving…" : "Add bank account"}
              </PrimaryButton>
            </div>
          </form>

          <div className="mt-5 space-y-2 text-sm">
            {bankAccounts.map((account) => (
              <div key={account.id} className="rounded-xl border bg-[var(--surface-muted)] px-4 py-3">
                <div className="font-medium">{account.nickname}</div>
                <div className="text-[var(--muted)]">
                  {account.bankName} {account.accountNumberLast4 ? `• ${account.accountNumberLast4}` : ""}
                </div>
              </div>
            ))}
          </div>
        </WorkspacePanel>

        <WorkspacePanel title="Statement import" subtitle="Paste CSV content with columns like date, description, reference, debit, credit, balance.">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Bank account"
              value={statementBankAccountId}
              onChange={setStatementBankAccountId}
              options={[
                { value: "", label: "Select bank account" },
                ...bankAccounts.map((account) => ({
                  value: account.id,
                  label: `${account.nickname}${account.accountNumberLast4 ? ` • ${account.accountNumberLast4}` : ""}`,
                })),
              ]}
            />
            <TextField label="Source filename" value={statementFilename} onChange={setStatementFilename} />
            <label className="block space-y-2 md:col-span-2">
              <span className="text-[13px] font-semibold text-[var(--muted-strong)]">CSV content</span>
              <textarea
                className="min-h-48 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm shadow-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                value={statementContent}
                onChange={(e) => setStatementContent(e.target.value)}
                placeholder={"date,description,reference,debit,credit,balance\n2026-03-01,NEFT RECEIPT,UTR123,0,1250,45000"}
              />
            </label>
            <div className="md:col-span-2">
              <PrimaryButton
                type="button"
                disabled={importStatement.isPending || !statementBankAccountId || !statementContent.trim()}
                onClick={async () => {
                  try {
                    await importStatement.mutateAsync({
                      bank_account_id: statementBankAccountId,
                      source_filename: statementFilename || undefined,
                      csv_content: statementContent,
                    });
                    setStatementContent("");
                    toast.success("Statement imported");
                  } catch (err: unknown) {
                    toast.error(getErrorMessage(err, "Failed to import statement"));
                  }
                }}
              >
                {importStatement.isPending ? "Importing…" : "Import statement"}
              </PrimaryButton>
            </div>
          </div>
        </WorkspacePanel>
      </div>

      {bankAccountsQuery.isLoading || bankLinesQuery.isLoading ? <LoadingBlock label="Loading banking workspace…" /> : null}
      {bankAccountsQuery.isError ? <InlineError message={getErrorMessage(bankAccountsQuery.error, "Failed to load bank accounts")} /> : null}
      {bankLinesQuery.isError ? <InlineError message={getErrorMessage(bankLinesQuery.error, "Failed to load bank statement lines")} /> : null}

      <WorkspacePanel title="Recent imports" subtitle="Imported statement batches stay visible for validation and audit.">
        {imports.length === 0 ? <EmptyState title="No statement imports yet" hint="Import the first CSV statement to start reconciliation." /> : null}
        {imports.length > 0 ? (
          <div className="space-y-2 text-sm">
            {imports.map((entry) => (
              <div key={entry.id} className="rounded-xl border bg-[var(--surface-muted)] px-4 py-3">
                <div className="font-medium">{entry.sourceFilename ?? entry.source_filename ?? "Manual import"}</div>
                <div className="text-[var(--muted)]">
                  {String(entry.lineCount ?? entry.line_count ?? 0)} lines
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </WorkspacePanel>

      {lines.length === 0 ? <EmptyState title="No statement lines to reconcile" hint="Import a statement or change the bank account filter." /> : null}

      {lines.length > 0 ? (
        <DataTableShell>
          <DataTable>
            <DataThead>
              <tr>
                <DataTh>Date</DataTh>
                <DataTh>Description</DataTh>
                <DataTh>Status</DataTh>
                <DataTh>Amount</DataTh>
                <DataTh>Suggested payment</DataTh>
                <DataTh>Actions</DataTh>
              </tr>
            </DataThead>
            <tbody>
              {lines.map((line) => {
                const candidate = line.candidates?.[0];
                return (
                  <DataTr key={line.id}>
                    <DataTd>{String(line.txnDate ?? line.txn_date ?? "—")}</DataTd>
                    <DataTd>{line.description}</DataTd>
                    <DataTd>{line.status}</DataTd>
                    <DataTd>{Number(line.amount ?? 0).toFixed(2)}</DataTd>
                    <DataTd>
                      {candidate ? `${candidate.method} • ${candidate.invoice?.invoiceNumber ?? candidate.invoice?.invoice_number ?? candidate.id.slice(0, 8)}` : "No match"}
                    </DataTd>
                    <DataTd>
                      <div className="flex gap-2">
                        {candidate && line.status !== "matched" ? (
                          <PrimaryButton
                            type="button"
                            size="sm"
                            disabled={matchLine.isPending}
                            onClick={async () => {
                              try {
                                await matchLine.mutateAsync({
                                  statement_line_id: line.id,
                                  payment_id: candidate.id,
                                });
                                toast.success("Statement line matched");
                              } catch (err: unknown) {
                                toast.error(getErrorMessage(err, "Failed to match statement line"));
                              }
                            }}
                          >
                            Match
                          </PrimaryButton>
                        ) : null}
                        {line.status === "matched" ? (
                          <PrimaryButton
                            type="button"
                            size="sm"
                            disabled={unmatchLine.isPending}
                            onClick={async () => {
                              try {
                                await unmatchLine.mutateAsync({ statement_line_id: line.id });
                                toast.success("Statement line unmatched");
                              } catch (err: unknown) {
                                toast.error(getErrorMessage(err, "Failed to unmatch statement line"));
                              }
                            }}
                          >
                            Unmatch
                          </PrimaryButton>
                        ) : null}
                      </div>
                    </DataTd>
                  </DataTr>
                );
              })}
            </tbody>
          </DataTable>
        </DataTableShell>
      ) : null}
    </div>
  );
}
