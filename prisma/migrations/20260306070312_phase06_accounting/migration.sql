-- CreateTable
CREATE TABLE "ledgers" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "account_code" VARCHAR(64) NOT NULL,
    "account_name" VARCHAR(200) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledgers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journals" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "narration" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_lines" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "journal_id" UUID NOT NULL,
    "debit_ledger_id" UUID,
    "credit_ledger_id" UUID,
    "amount" DECIMAL(65,30) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journal_lines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ledgers_company_id_idx" ON "ledgers"("company_id");

-- CreateIndex
CREATE INDEX "ledgers_company_id_type_idx" ON "ledgers"("company_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ledgers_company_id_account_code_key" ON "ledgers"("company_id", "account_code");

-- CreateIndex
CREATE INDEX "journals_company_id_idx" ON "journals"("company_id");

-- CreateIndex
CREATE INDEX "journals_company_id_date_idx" ON "journals"("company_id", "date");

-- CreateIndex
CREATE INDEX "journal_lines_company_id_idx" ON "journal_lines"("company_id");

-- CreateIndex
CREATE INDEX "journal_lines_company_id_journal_id_idx" ON "journal_lines"("company_id", "journal_id");

-- CreateIndex
CREATE INDEX "journal_lines_debit_ledger_id_idx" ON "journal_lines"("debit_ledger_id");

-- CreateIndex
CREATE INDEX "journal_lines_credit_ledger_id_idx" ON "journal_lines"("credit_ledger_id");

-- AddForeignKey
ALTER TABLE "ledgers" ADD CONSTRAINT "ledgers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journals" ADD CONSTRAINT "journals_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_debit_ledger_id_fkey" FOREIGN KEY ("debit_ledger_id") REFERENCES "ledgers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_lines" ADD CONSTRAINT "journal_lines_credit_ledger_id_fkey" FOREIGN KEY ("credit_ledger_id") REFERENCES "ledgers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
