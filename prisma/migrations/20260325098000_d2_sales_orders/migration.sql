CREATE TABLE "sales_orders" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "quotation_id" UUID,
  "order_number" VARCHAR(64),
  "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
  "order_date" DATE,
  "expected_dispatch_date" DATE,
  "notes" TEXT,
  "sub_total" DECIMAL NOT NULL DEFAULT 0,
  "tax_total" DECIMAL NOT NULL DEFAULT 0,
  "total" DECIMAL NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "sales_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_order_items" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "sales_order_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity_ordered" DECIMAL NOT NULL,
  "quantity_fulfilled" DECIMAL NOT NULL DEFAULT 0,
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

  CONSTRAINT "sales_order_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "invoices"
ADD COLUMN "sales_order_id" UUID;

ALTER TABLE "invoice_items"
ADD COLUMN "sales_order_item_id" UUID;

CREATE INDEX "sales_orders_company_id_idx"
ON "sales_orders"("company_id");

CREATE INDEX "sales_orders_company_id_status_idx"
ON "sales_orders"("company_id", "status");

CREATE INDEX "sales_orders_company_id_order_date_idx"
ON "sales_orders"("company_id", "order_date");

CREATE INDEX "sales_orders_customer_id_idx"
ON "sales_orders"("customer_id");

CREATE INDEX "sales_orders_quotation_id_idx"
ON "sales_orders"("quotation_id");

CREATE INDEX "sales_order_items_company_id_idx"
ON "sales_order_items"("company_id");

CREATE INDEX "sales_order_items_sales_order_id_idx"
ON "sales_order_items"("sales_order_id");

CREATE INDEX "sales_order_items_product_id_idx"
ON "sales_order_items"("product_id");

CREATE INDEX "invoices_sales_order_id_idx"
ON "invoices"("sales_order_id");

CREATE INDEX "invoice_items_sales_order_item_id_idx"
ON "invoice_items"("sales_order_item_id");

ALTER TABLE "sales_orders"
ADD CONSTRAINT "sales_orders_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_orders"
ADD CONSTRAINT "sales_orders_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sales_orders"
ADD CONSTRAINT "sales_orders_quotation_id_fkey"
FOREIGN KEY ("quotation_id") REFERENCES "quotations"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_order_items"
ADD CONSTRAINT "sales_order_items_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_order_items"
ADD CONSTRAINT "sales_order_items_sales_order_id_fkey"
FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_order_items"
ADD CONSTRAINT "sales_order_items_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_sales_order_id_fkey"
FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoice_items"
ADD CONSTRAINT "invoice_items_sales_order_item_id_fkey"
FOREIGN KEY ("sales_order_item_id") REFERENCES "sales_order_items"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
