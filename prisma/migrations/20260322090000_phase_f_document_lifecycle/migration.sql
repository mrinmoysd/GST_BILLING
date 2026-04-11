-- CreateTable
CREATE TABLE "document_credit_notes" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "kind" VARCHAR(32) NOT NULL DEFAULT 'credit_note',
    "status" VARCHAR(32) NOT NULL DEFAULT 'created',
    "note_number" VARCHAR(64) NOT NULL,
    "note_date" DATE NOT NULL,
    "notes" TEXT,
    "restock" BOOLEAN NOT NULL DEFAULT false,
    "sub_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_credit_note_items" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "credit_note_id" UUID NOT NULL,
    "invoice_item_id" UUID,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit_price" DECIMAL(65,30) NOT NULL,
    "tax_rate" DECIMAL(65,30),
    "line_sub_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "line_tax_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_credit_note_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_returns" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "purchase_id" UUID NOT NULL,
    "return_number" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'created',
    "return_date" DATE NOT NULL,
    "notes" TEXT,
    "sub_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_return_items" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "purchase_return_id" UUID NOT NULL,
    "purchase_item_id" UUID,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit_cost" DECIMAL(65,30) NOT NULL,
    "tax_rate" DECIMAL(65,30),
    "line_sub_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "line_tax_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_shares" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "invoice_id" UUID NOT NULL,
    "channel" VARCHAR(32) NOT NULL,
    "recipient" VARCHAR(255) NOT NULL,
    "message" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'logged',
    "sent_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_lifecycle_events" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "invoice_id" UUID,
    "purchase_id" UUID,
    "event_type" VARCHAR(64) NOT NULL,
    "summary" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_credit_notes_company_id_idx" ON "document_credit_notes"("company_id");
CREATE INDEX "document_credit_notes_company_id_invoice_id_idx" ON "document_credit_notes"("company_id", "invoice_id");
CREATE INDEX "document_credit_notes_company_id_kind_idx" ON "document_credit_notes"("company_id", "kind");
CREATE INDEX "document_credit_note_items_company_id_idx" ON "document_credit_note_items"("company_id");
CREATE INDEX "document_credit_note_items_credit_note_id_idx" ON "document_credit_note_items"("credit_note_id");
CREATE INDEX "document_credit_note_items_product_id_idx" ON "document_credit_note_items"("product_id");
CREATE INDEX "purchase_returns_company_id_idx" ON "purchase_returns"("company_id");
CREATE INDEX "purchase_returns_company_id_purchase_id_idx" ON "purchase_returns"("company_id", "purchase_id");
CREATE INDEX "purchase_return_items_company_id_idx" ON "purchase_return_items"("company_id");
CREATE INDEX "purchase_return_items_purchase_return_id_idx" ON "purchase_return_items"("purchase_return_id");
CREATE INDEX "purchase_return_items_product_id_idx" ON "purchase_return_items"("product_id");
CREATE INDEX "document_shares_company_id_idx" ON "document_shares"("company_id");
CREATE INDEX "document_shares_company_id_invoice_id_idx" ON "document_shares"("company_id", "invoice_id");
CREATE INDEX "document_lifecycle_events_company_id_idx" ON "document_lifecycle_events"("company_id");
CREATE INDEX "document_lifecycle_events_company_id_invoice_id_idx" ON "document_lifecycle_events"("company_id", "invoice_id");
CREATE INDEX "document_lifecycle_events_company_id_purchase_id_idx" ON "document_lifecycle_events"("company_id", "purchase_id");

-- AddForeignKey
ALTER TABLE "document_credit_notes" ADD CONSTRAINT "document_credit_notes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_credit_notes" ADD CONSTRAINT "document_credit_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_credit_note_items" ADD CONSTRAINT "document_credit_note_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_credit_note_items" ADD CONSTRAINT "document_credit_note_items_credit_note_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "document_credit_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_credit_note_items" ADD CONSTRAINT "document_credit_note_items_invoice_item_id_fkey" FOREIGN KEY ("invoice_item_id") REFERENCES "invoice_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "document_credit_note_items" ADD CONSTRAINT "document_credit_note_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_returns" ADD CONSTRAINT "purchase_returns_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_purchase_return_id_fkey" FOREIGN KEY ("purchase_return_id") REFERENCES "purchase_returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_purchase_item_id_fkey" FOREIGN KEY ("purchase_item_id") REFERENCES "purchase_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "purchase_return_items" ADD CONSTRAINT "purchase_return_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_shares" ADD CONSTRAINT "document_shares_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_lifecycle_events" ADD CONSTRAINT "document_lifecycle_events_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_lifecycle_events" ADD CONSTRAINT "document_lifecycle_events_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "document_lifecycle_events" ADD CONSTRAINT "document_lifecycle_events_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
