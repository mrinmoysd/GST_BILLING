-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "allow_negative_stock" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6),
ADD COLUMN     "reorder_level" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "deleted_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "change_qty" DECIMAL(65,30) NOT NULL,
    "balance_qty" DECIMAL(65,30) NOT NULL,
    "source_type" VARCHAR(32),
    "source_id" UUID,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stock_movements_company_id_idx" ON "stock_movements"("company_id");

-- CreateIndex
CREATE INDEX "stock_movements_product_id_idx" ON "stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "stock_movements_company_id_created_at_idx" ON "stock_movements"("company_id", "created_at");

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
