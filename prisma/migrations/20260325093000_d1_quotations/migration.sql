CREATE TABLE "quotations" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "quote_number" VARCHAR(64),
  "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
  "issue_date" DATE,
  "expiry_date" DATE,
  "notes" TEXT,
  "sub_total" DECIMAL NOT NULL DEFAULT 0,
  "tax_total" DECIMAL NOT NULL DEFAULT 0,
  "total" DECIMAL NOT NULL DEFAULT 0,
  "converted_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "quotations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quotation_items" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "quotation_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity" DECIMAL NOT NULL,
  "unit_price" DECIMAL NOT NULL,
  "discount" DECIMAL NOT NULL DEFAULT 0,
  "hsn_code" VARCHAR(32),
  "tax_rate" DECIMAL,
  "taxable_value" DECIMAL NOT NULL DEFAULT 0,
  "cgst_amount" DECIMAL NOT NULL DEFAULT 0,
  "sgst_amount" DECIMAL NOT NULL DEFAULT 0,
  "igst_amount" DECIMAL NOT NULL DEFAULT 0,
  "cess_amount" DECIMAL NOT NULL DEFAULT 0,
  "line_sub_total" DECIMAL NOT NULL DEFAULT 0,
  "line_tax_total" DECIMAL NOT NULL DEFAULT 0,
  "line_total" DECIMAL NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "quotation_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "invoices"
ADD COLUMN "quotation_id" UUID;

CREATE INDEX "quotations_company_id_idx"
ON "quotations"("company_id");

CREATE INDEX "quotations_company_id_status_idx"
ON "quotations"("company_id", "status");

CREATE INDEX "quotations_company_id_issue_date_idx"
ON "quotations"("company_id", "issue_date");

CREATE INDEX "quotations_customer_id_idx"
ON "quotations"("customer_id");

CREATE INDEX "quotation_items_company_id_idx"
ON "quotation_items"("company_id");

CREATE INDEX "quotation_items_quotation_id_idx"
ON "quotation_items"("quotation_id");

CREATE INDEX "quotation_items_product_id_idx"
ON "quotation_items"("product_id");

CREATE INDEX "invoices_quotation_id_idx"
ON "invoices"("quotation_id");

ALTER TABLE "quotations"
ADD CONSTRAINT "quotations_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quotations"
ADD CONSTRAINT "quotations_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "quotation_items"
ADD CONSTRAINT "quotation_items_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quotation_items"
ADD CONSTRAINT "quotation_items_quotation_id_fkey"
FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "quotation_items"
ADD CONSTRAINT "quotation_items_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_quotation_id_fkey"
FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
