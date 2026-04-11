CREATE TABLE "warehouses" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "code" VARCHAR(32) NOT NULL,
  "location_label" VARCHAR(160),
  "is_default" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "warehouse_stocks" (
  "warehouse_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "quantity" DECIMAL NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "warehouse_stocks_pkey" PRIMARY KEY ("warehouse_id","product_id")
);

CREATE TABLE "stock_transfers" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "from_warehouse_id" UUID NOT NULL,
  "to_warehouse_id" UUID NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'requested',
  "transfer_number" VARCHAR(64) NOT NULL,
  "transfer_date" DATE NOT NULL,
  "notes" TEXT,
  "dispatched_at" TIMESTAMPTZ(6),
  "received_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "stock_transfers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stock_transfer_items" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "stock_transfer_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity" DECIMAL NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "stock_transfer_items_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "stock_movements"
ADD COLUMN "warehouse_id" UUID;

ALTER TABLE "purchases"
ADD COLUMN "warehouse_id" UUID;

ALTER TABLE "invoices"
ADD COLUMN "warehouse_id" UUID;

CREATE UNIQUE INDEX "warehouses_company_id_code_key"
ON "warehouses"("company_id", "code");

CREATE INDEX "warehouses_company_id_idx"
ON "warehouses"("company_id");

CREATE INDEX "warehouse_stocks_company_id_idx"
ON "warehouse_stocks"("company_id");

CREATE INDEX "stock_transfers_company_id_idx"
ON "stock_transfers"("company_id");

CREATE INDEX "stock_transfers_company_id_status_idx"
ON "stock_transfers"("company_id", "status");

CREATE INDEX "stock_transfers_from_warehouse_id_idx"
ON "stock_transfers"("from_warehouse_id");

CREATE INDEX "stock_transfers_to_warehouse_id_idx"
ON "stock_transfers"("to_warehouse_id");

CREATE INDEX "stock_transfer_items_company_id_idx"
ON "stock_transfer_items"("company_id");

CREATE INDEX "stock_transfer_items_stock_transfer_id_idx"
ON "stock_transfer_items"("stock_transfer_id");

CREATE INDEX "stock_transfer_items_product_id_idx"
ON "stock_transfer_items"("product_id");

CREATE INDEX "stock_movements_warehouse_id_idx"
ON "stock_movements"("warehouse_id");

CREATE INDEX "purchases_warehouse_id_idx"
ON "purchases"("warehouse_id");

CREATE INDEX "invoices_warehouse_id_idx"
ON "invoices"("warehouse_id");

ALTER TABLE "warehouses"
ADD CONSTRAINT "warehouses_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "warehouse_stocks"
ADD CONSTRAINT "warehouse_stocks_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "warehouse_stocks"
ADD CONSTRAINT "warehouse_stocks_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "warehouse_stocks"
ADD CONSTRAINT "warehouse_stocks_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_transfers"
ADD CONSTRAINT "stock_transfers_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_transfers"
ADD CONSTRAINT "stock_transfers_from_warehouse_id_fkey"
FOREIGN KEY ("from_warehouse_id") REFERENCES "warehouses"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_transfers"
ADD CONSTRAINT "stock_transfers_to_warehouse_id_fkey"
FOREIGN KEY ("to_warehouse_id") REFERENCES "warehouses"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_transfer_items"
ADD CONSTRAINT "stock_transfer_items_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_transfer_items"
ADD CONSTRAINT "stock_transfer_items_stock_transfer_id_fkey"
FOREIGN KEY ("stock_transfer_id") REFERENCES "stock_transfers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_transfer_items"
ADD CONSTRAINT "stock_transfer_items_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "stock_movements"
ADD CONSTRAINT "stock_movements_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "purchases"
ADD CONSTRAINT "purchases_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
