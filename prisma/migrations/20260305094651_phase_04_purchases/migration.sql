-- CreateTable
CREATE TABLE "purchases" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "supplier_id" UUID NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'draft',
    "purchase_date" DATE,
    "notes" TEXT,
    "sub_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "bill_url" TEXT,
    "bill_original_name" VARCHAR(255),
    "received_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_items" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "purchase_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "unit_cost" DECIMAL(65,30) NOT NULL,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(65,30),
    "line_sub_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "line_tax_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "line_total" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "purchases_company_id_idx" ON "purchases"("company_id");

-- CreateIndex
CREATE INDEX "purchases_company_id_status_idx" ON "purchases"("company_id", "status");

-- CreateIndex
CREATE INDEX "purchases_company_id_purchase_date_idx" ON "purchases"("company_id", "purchase_date");

-- CreateIndex
CREATE INDEX "purchase_items_company_id_idx" ON "purchase_items"("company_id");

-- CreateIndex
CREATE INDEX "purchase_items_purchase_id_idx" ON "purchase_items"("purchase_id");

-- CreateIndex
CREATE INDEX "purchase_items_product_id_idx" ON "purchase_items"("product_id");

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_items" ADD CONSTRAINT "purchase_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
