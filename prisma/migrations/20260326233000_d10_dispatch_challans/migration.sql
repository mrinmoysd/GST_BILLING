ALTER TABLE "invoices"
ADD COLUMN "challan_id" UUID;

CREATE TABLE "delivery_challans" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "sales_order_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "warehouse_id" UUID NOT NULL,
  "challan_number" VARCHAR(64) NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
  "transporter_name" VARCHAR(160),
  "vehicle_number" VARCHAR(64),
  "dispatch_notes" TEXT,
  "delivery_notes" TEXT,
  "challan_date" DATE,
  "picked_at" TIMESTAMPTZ(6),
  "packed_at" TIMESTAMPTZ(6),
  "dispatched_at" TIMESTAMPTZ(6),
  "delivered_at" TIMESTAMPTZ(6),
  "cancelled_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "delivery_challans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_challan_items" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "delivery_challan_id" UUID NOT NULL,
  "sales_order_item_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "quantity_requested" DECIMAL(65,30) NOT NULL,
  "quantity_dispatched" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "quantity_delivered" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "short_supply_quantity" DECIMAL(65,30) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "delivery_challan_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_challan_events" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "delivery_challan_id" UUID NOT NULL,
  "event_type" VARCHAR(64) NOT NULL,
  "summary" TEXT NOT NULL,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "delivery_challan_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invoices_challan_id_key"
ON "invoices"("challan_id");

CREATE UNIQUE INDEX "delivery_challans_company_id_challan_number_key"
ON "delivery_challans"("company_id", "challan_number");

CREATE INDEX "invoices_challan_id_idx"
ON "invoices"("challan_id");

CREATE INDEX "delivery_challans_company_id_idx"
ON "delivery_challans"("company_id");

CREATE INDEX "delivery_challans_sales_order_id_idx"
ON "delivery_challans"("sales_order_id");

CREATE INDEX "delivery_challans_customer_id_idx"
ON "delivery_challans"("customer_id");

CREATE INDEX "delivery_challans_warehouse_id_idx"
ON "delivery_challans"("warehouse_id");

CREATE INDEX "delivery_challans_company_id_status_idx"
ON "delivery_challans"("company_id", "status");

CREATE INDEX "delivery_challan_items_company_id_idx"
ON "delivery_challan_items"("company_id");

CREATE INDEX "delivery_challan_items_delivery_challan_id_idx"
ON "delivery_challan_items"("delivery_challan_id");

CREATE INDEX "delivery_challan_items_sales_order_item_id_idx"
ON "delivery_challan_items"("sales_order_item_id");

CREATE INDEX "delivery_challan_items_product_id_idx"
ON "delivery_challan_items"("product_id");

CREATE INDEX "delivery_challan_events_company_id_idx"
ON "delivery_challan_events"("company_id");

CREATE INDEX "delivery_challan_events_delivery_challan_id_idx"
ON "delivery_challan_events"("delivery_challan_id");

CREATE INDEX "delivery_challan_events_company_id_created_at_idx"
ON "delivery_challan_events"("company_id", "created_at");

ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_challan_id_fkey"
FOREIGN KEY ("challan_id") REFERENCES "delivery_challans"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "delivery_challans"
ADD CONSTRAINT "delivery_challans_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "delivery_challans"
ADD CONSTRAINT "delivery_challans_sales_order_id_fkey"
FOREIGN KEY ("sales_order_id") REFERENCES "sales_orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "delivery_challans"
ADD CONSTRAINT "delivery_challans_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_challans"
ADD CONSTRAINT "delivery_challans_warehouse_id_fkey"
FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_challan_items"
ADD CONSTRAINT "delivery_challan_items_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "delivery_challan_items"
ADD CONSTRAINT "delivery_challan_items_delivery_challan_id_fkey"
FOREIGN KEY ("delivery_challan_id") REFERENCES "delivery_challans"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "delivery_challan_items"
ADD CONSTRAINT "delivery_challan_items_sales_order_item_id_fkey"
FOREIGN KEY ("sales_order_item_id") REFERENCES "sales_order_items"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_challan_items"
ADD CONSTRAINT "delivery_challan_items_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_challan_events"
ADD CONSTRAINT "delivery_challan_events_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "delivery_challan_events"
ADD CONSTRAINT "delivery_challan_events_delivery_challan_id_fkey"
FOREIGN KEY ("delivery_challan_id") REFERENCES "delivery_challans"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
