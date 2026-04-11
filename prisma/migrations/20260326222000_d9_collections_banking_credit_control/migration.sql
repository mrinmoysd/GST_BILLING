ALTER TABLE "customers"
ADD COLUMN "credit_limit" DECIMAL(65,30),
ADD COLUMN "credit_days" INTEGER,
ADD COLUMN "credit_control_mode" VARCHAR(16) NOT NULL DEFAULT 'warn',
ADD COLUMN "credit_warning_percent" DECIMAL(65,30) NOT NULL DEFAULT 80,
ADD COLUMN "credit_block_percent" DECIMAL(65,30) NOT NULL DEFAULT 100,
ADD COLUMN "credit_hold" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "credit_hold_reason" TEXT,
ADD COLUMN "credit_override_until" TIMESTAMPTZ(6),
ADD COLUMN "credit_override_reason" TEXT;

ALTER TABLE "payments"
ADD COLUMN "bank_account_id" UUID,
ADD COLUMN "instrument_type" VARCHAR(32),
ADD COLUMN "instrument_status" VARCHAR(32) NOT NULL DEFAULT 'cleared',
ADD COLUMN "instrument_number" VARCHAR(128),
ADD COLUMN "instrument_date" DATE,
ADD COLUMN "deposit_date" DATE,
ADD COLUMN "clearance_date" DATE,
ADD COLUMN "bounce_date" DATE,
ADD COLUMN "notes" TEXT,
ADD COLUMN "reconciled_at" TIMESTAMPTZ(6);

CREATE TABLE "company_bank_accounts" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "ledger_id" UUID,
  "nickname" VARCHAR(120) NOT NULL,
  "bank_name" VARCHAR(120) NOT NULL,
  "branch_name" VARCHAR(120),
  "account_holder_name" VARCHAR(160),
  "account_number_masked" VARCHAR(64),
  "account_number_last4" VARCHAR(4),
  "ifsc_code" VARCHAR(16),
  "upi_handle" VARCHAR(120),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "company_bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "collection_tasks" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "invoice_id" UUID,
  "assigned_to_user_id" UUID,
  "salesperson_user_id" UUID,
  "status" VARCHAR(32) NOT NULL DEFAULT 'open',
  "priority" VARCHAR(16) NOT NULL DEFAULT 'normal',
  "channel" VARCHAR(32),
  "due_date" DATE,
  "next_action_date" DATE,
  "promise_to_pay_date" DATE,
  "promise_to_pay_amount" DECIMAL(65,30),
  "outcome" VARCHAR(32),
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "collection_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bank_statement_imports" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "bank_account_id" UUID NOT NULL,
  "source_filename" VARCHAR(255),
  "status" VARCHAR(32) NOT NULL DEFAULT 'imported',
  "line_count" INTEGER NOT NULL DEFAULT 0,
  "imported_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bank_statement_imports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bank_statement_lines" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "import_id" UUID NOT NULL,
  "bank_account_id" UUID NOT NULL,
  "txn_date" DATE NOT NULL,
  "description" TEXT NOT NULL,
  "reference" VARCHAR(128),
  "debit" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "credit" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "direction" VARCHAR(16) NOT NULL,
  "closing_balance" DECIMAL(65,30),
  "status" VARCHAR(32) NOT NULL DEFAULT 'unmatched',
  "matched_payment_id" UUID,
  "matched_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bank_statement_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bank_reconciliation_events" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "payment_id" UUID,
  "statement_line_id" UUID,
  "action" VARCHAR(32) NOT NULL,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "bank_reconciliation_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payments_bank_account_id_idx"
ON "payments"("bank_account_id");

CREATE INDEX "payments_company_id_instrument_status_idx"
ON "payments"("company_id", "instrument_status");

CREATE INDEX "company_bank_accounts_company_id_idx"
ON "company_bank_accounts"("company_id");

CREATE INDEX "company_bank_accounts_ledger_id_idx"
ON "company_bank_accounts"("ledger_id");

CREATE INDEX "company_bank_accounts_company_id_is_active_idx"
ON "company_bank_accounts"("company_id", "is_active");

CREATE INDEX "collection_tasks_company_id_idx"
ON "collection_tasks"("company_id");

CREATE INDEX "collection_tasks_company_id_status_idx"
ON "collection_tasks"("company_id", "status");

CREATE INDEX "collection_tasks_customer_id_idx"
ON "collection_tasks"("customer_id");

CREATE INDEX "collection_tasks_invoice_id_idx"
ON "collection_tasks"("invoice_id");

CREATE INDEX "collection_tasks_assigned_to_user_id_idx"
ON "collection_tasks"("assigned_to_user_id");

CREATE INDEX "collection_tasks_salesperson_user_id_idx"
ON "collection_tasks"("salesperson_user_id");

CREATE INDEX "bank_statement_imports_company_id_idx"
ON "bank_statement_imports"("company_id");

CREATE INDEX "bank_statement_imports_bank_account_id_idx"
ON "bank_statement_imports"("bank_account_id");

CREATE UNIQUE INDEX "bank_statement_lines_matched_payment_id_key"
ON "bank_statement_lines"("matched_payment_id");

CREATE INDEX "bank_statement_lines_company_id_idx"
ON "bank_statement_lines"("company_id");

CREATE INDEX "bank_statement_lines_import_id_idx"
ON "bank_statement_lines"("import_id");

CREATE INDEX "bank_statement_lines_bank_account_id_idx"
ON "bank_statement_lines"("bank_account_id");

CREATE INDEX "bank_statement_lines_company_id_status_idx"
ON "bank_statement_lines"("company_id", "status");

CREATE INDEX "bank_statement_lines_company_id_txn_date_idx"
ON "bank_statement_lines"("company_id", "txn_date");

CREATE INDEX "bank_reconciliation_events_company_id_idx"
ON "bank_reconciliation_events"("company_id");

CREATE INDEX "bank_reconciliation_events_payment_id_idx"
ON "bank_reconciliation_events"("payment_id");

CREATE INDEX "bank_reconciliation_events_statement_line_id_idx"
ON "bank_reconciliation_events"("statement_line_id");

CREATE INDEX "bank_reconciliation_events_company_id_created_at_idx"
ON "bank_reconciliation_events"("company_id", "created_at");

ALTER TABLE "payments"
ADD CONSTRAINT "payments_bank_account_id_fkey"
FOREIGN KEY ("bank_account_id") REFERENCES "company_bank_accounts"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "company_bank_accounts"
ADD CONSTRAINT "company_bank_accounts_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_bank_accounts"
ADD CONSTRAINT "company_bank_accounts_ledger_id_fkey"
FOREIGN KEY ("ledger_id") REFERENCES "ledgers"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "collection_tasks"
ADD CONSTRAINT "collection_tasks_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_tasks"
ADD CONSTRAINT "collection_tasks_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collection_tasks"
ADD CONSTRAINT "collection_tasks_invoice_id_fkey"
FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "collection_tasks"
ADD CONSTRAINT "collection_tasks_assigned_to_user_id_fkey"
FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "collection_tasks"
ADD CONSTRAINT "collection_tasks_salesperson_user_id_fkey"
FOREIGN KEY ("salesperson_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bank_statement_imports"
ADD CONSTRAINT "bank_statement_imports_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bank_statement_imports"
ADD CONSTRAINT "bank_statement_imports_bank_account_id_fkey"
FOREIGN KEY ("bank_account_id") REFERENCES "company_bank_accounts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bank_statement_lines"
ADD CONSTRAINT "bank_statement_lines_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bank_statement_lines"
ADD CONSTRAINT "bank_statement_lines_import_id_fkey"
FOREIGN KEY ("import_id") REFERENCES "bank_statement_imports"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bank_statement_lines"
ADD CONSTRAINT "bank_statement_lines_bank_account_id_fkey"
FOREIGN KEY ("bank_account_id") REFERENCES "company_bank_accounts"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bank_statement_lines"
ADD CONSTRAINT "bank_statement_lines_matched_payment_id_fkey"
FOREIGN KEY ("matched_payment_id") REFERENCES "payments"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bank_reconciliation_events"
ADD CONSTRAINT "bank_reconciliation_events_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bank_reconciliation_events"
ADD CONSTRAINT "bank_reconciliation_events_payment_id_fkey"
FOREIGN KEY ("payment_id") REFERENCES "payments"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "bank_reconciliation_events"
ADD CONSTRAINT "bank_reconciliation_events_statement_line_id_fkey"
FOREIGN KEY ("statement_line_id") REFERENCES "bank_statement_lines"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
