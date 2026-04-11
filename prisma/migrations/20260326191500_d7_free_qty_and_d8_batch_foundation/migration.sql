ALTER TABLE "quotation_items"
ADD COLUMN "free_quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "total_quantity" DECIMAL(65,30) NOT NULL DEFAULT 0;

UPDATE "quotation_items"
SET "total_quantity" = "quantity" + "free_quantity"
WHERE "total_quantity" = 0;

ALTER TABLE "sales_order_items"
ADD COLUMN "free_quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "total_quantity" DECIMAL(65,30) NOT NULL DEFAULT 0;

UPDATE "sales_order_items"
SET "total_quantity" = "quantity_ordered" + "free_quantity"
WHERE "total_quantity" = 0;

ALTER TABLE "invoice_items"
ADD COLUMN "free_quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "total_quantity" DECIMAL(65,30) NOT NULL DEFAULT 0;

UPDATE "invoice_items"
SET "total_quantity" = "quantity" + "free_quantity"
WHERE "total_quantity" = 0;

ALTER TABLE "products"
ADD COLUMN "batch_tracking_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "expiry_tracking_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "batch_issue_policy" VARCHAR(16) NOT NULL DEFAULT 'NONE',
ADD COLUMN "near_expiry_days" INTEGER DEFAULT 0;

CREATE TABLE "product_batches" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "batch_number" VARCHAR(120) NOT NULL,
  "expiry_date" DATE,
  "manufacturing_date" DATE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "warehouse_batch_stocks" (
  "warehouse_id" UUID NOT NULL,
  "product_batch_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "reserved_quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "warehouse_batch_stocks_pkey" PRIMARY KEY ("warehouse_id", "product_batch_id")
);

CREATE TABLE "purchase_item_batches" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "purchase_item_id" UUID NOT NULL,
  "product_batch_id" UUID,
  "batch_number" VARCHAR(120) NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL,
  "expiry_date" DATE,
  "manufacturing_date" DATE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "purchase_item_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_item_batch_allocations" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "invoice_item_id" UUID NOT NULL,
  "product_batch_id" UUID NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "invoice_item_batch_allocations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "product_batches_company_id_product_id_batch_number_key"
ON "product_batches"("company_id", "product_id", "batch_number");

CREATE INDEX "product_batches_company_id_idx"
ON "product_batches"("company_id");

CREATE INDEX "product_batches_product_id_idx"
ON "product_batches"("product_id");

CREATE INDEX "product_batches_company_id_expiry_date_idx"
ON "product_batches"("company_id", "expiry_date");

CREATE INDEX "warehouse_batch_stocks_company_id_idx"
ON "warehouse_batch_stocks"("company_id");

CREATE INDEX "warehouse_batch_stocks_product_batch_id_idx"
ON "warehouse_batch_stocks"("product_batch_id");

CREATE INDEX "purchase_item_batches_company_id_idx"
ON "purchase_item_batches"("company_id");

CREATE INDEX "purchase_item_batches_purchase_item_id_idx"
ON "purchase_item_batches"("purchase_item_id");

CREATE INDEX "purchase_item_batches_product_batch_id_idx"
ON "purchase_item_batches"("product_batch_id");

CREATE INDEX "invoice_item_batch_allocations_company_id_idx"
ON "invoice_item_batch_allocations"("company_id");

CREATE INDEX "invoice_item_batch_allocations_invoice_item_id_idx"
ON "invoice_item_batch_allocations"("invoice_item_id");

CREATE INDEX "invoice_item_batch_allocations_product_batch_id_idx"
ON "invoice_item_batch_allocations"("product_batch_id");

ALTER TABLE "product_batches"
ADD CONSTRAINT "product_batches_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_batches"
ADD CONSTRAINT "product_batches_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "warehouse_batch_stocks"
ADD CONSTRAINT "warehouse_batch_stocks_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "warehouse_batch_stocks"
ADD CONSTRAINT "warehouse_batch_stocks_product_batch_id_fkey"
FOREIGN KEY ("product_batch_id") REFERENCES "product_batches"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "warehouse_batch_stocks"
ADD CONSTRAINT "warehouse_batch_stocks_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_item_batches"
ADD CONSTRAINT "purchase_item_batches_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_item_batches"
ADD CONSTRAINT "purchase_item_batches_purchase_item_id_fkey"
FOREIGN KEY ("purchase_item_id") REFERENCES "purchase_items"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "purchase_item_batches"
ADD CONSTRAINT "purchase_item_batches_product_batch_id_fkey"
FOREIGN KEY ("product_batch_id") REFERENCES "product_batches"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoice_item_batch_allocations"
ADD CONSTRAINT "invoice_item_batch_allocations_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoice_item_batch_allocations"
ADD CONSTRAINT "invoice_item_batch_allocations_invoice_item_id_fkey"
FOREIGN KEY ("invoice_item_id") REFERENCES "invoice_items"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoice_item_batch_allocations"
ADD CONSTRAINT "invoice_item_batch_allocations_product_batch_id_fkey"
FOREIGN KEY ("product_batch_id") REFERENCES "product_batches"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
