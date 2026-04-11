ALTER TABLE "customers"
ADD COLUMN "pricing_tier" VARCHAR(64);

ALTER TABLE "quotation_items"
ADD COLUMN "pricing_source" VARCHAR(64),
ADD COLUMN "pricing_snapshot" JSONB;

ALTER TABLE "sales_order_items"
ADD COLUMN "pricing_source" VARCHAR(64),
ADD COLUMN "pricing_snapshot" JSONB;

ALTER TABLE "invoice_items"
ADD COLUMN "pricing_source" VARCHAR(64),
ADD COLUMN "pricing_snapshot" JSONB;

CREATE TABLE "price_lists" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "code" VARCHAR(64) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "pricing_tier" VARCHAR(64),
  "priority" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "starts_at" DATE,
  "ends_at" DATE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "price_lists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "price_list_items" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "price_list_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "fixed_price" DECIMAL(65,30),
  "discount_percent" DECIMAL(65,30),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "price_list_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_product_prices" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "product_id" UUID NOT NULL,
  "fixed_price" DECIMAL(65,30),
  "discount_percent" DECIMAL(65,30),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "starts_at" DATE,
  "ends_at" DATE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "customer_product_prices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "price_lists_company_id_code_key"
ON "price_lists"("company_id", "code");

CREATE INDEX "price_lists_company_id_idx"
ON "price_lists"("company_id");

CREATE INDEX "price_lists_company_id_pricing_tier_idx"
ON "price_lists"("company_id", "pricing_tier");

CREATE INDEX "price_lists_company_id_is_active_idx"
ON "price_lists"("company_id", "is_active");

CREATE INDEX "price_list_items_company_id_idx"
ON "price_list_items"("company_id");

CREATE INDEX "price_list_items_price_list_id_idx"
ON "price_list_items"("price_list_id");

CREATE INDEX "price_list_items_product_id_idx"
ON "price_list_items"("product_id");

CREATE UNIQUE INDEX "price_list_items_price_list_id_product_id_key"
ON "price_list_items"("price_list_id", "product_id");

CREATE INDEX "customer_product_prices_company_id_idx"
ON "customer_product_prices"("company_id");

CREATE INDEX "customer_product_prices_customer_id_idx"
ON "customer_product_prices"("customer_id");

CREATE INDEX "customer_product_prices_product_id_idx"
ON "customer_product_prices"("product_id");

CREATE INDEX "customer_product_prices_company_id_is_active_idx"
ON "customer_product_prices"("company_id", "is_active");

CREATE UNIQUE INDEX "customer_product_prices_company_id_customer_id_product_id_key"
ON "customer_product_prices"("company_id", "customer_id", "product_id");

ALTER TABLE "price_lists"
ADD CONSTRAINT "price_lists_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "price_list_items"
ADD CONSTRAINT "price_list_items_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "price_list_items"
ADD CONSTRAINT "price_list_items_price_list_id_fkey"
FOREIGN KEY ("price_list_id") REFERENCES "price_lists"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "price_list_items"
ADD CONSTRAINT "price_list_items_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "customer_product_prices"
ADD CONSTRAINT "customer_product_prices_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_product_prices"
ADD CONSTRAINT "customer_product_prices_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_product_prices"
ADD CONSTRAINT "customer_product_prices_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
