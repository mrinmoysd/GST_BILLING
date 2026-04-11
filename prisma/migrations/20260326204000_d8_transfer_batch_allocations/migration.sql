CREATE TABLE "stock_transfer_item_batch_allocations" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "stock_transfer_item_id" UUID NOT NULL,
  "product_batch_id" UUID NOT NULL,
  "quantity" DECIMAL(65,30) NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "stock_transfer_item_batch_allocations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "stock_transfer_item_batch_allocations_company_id_idx"
ON "stock_transfer_item_batch_allocations"("company_id");

CREATE INDEX "stock_transfer_item_batch_allocations_stock_transfer_item_id_idx"
ON "stock_transfer_item_batch_allocations"("stock_transfer_item_id");

CREATE INDEX "stock_transfer_item_batch_allocations_product_batch_id_idx"
ON "stock_transfer_item_batch_allocations"("product_batch_id");

ALTER TABLE "stock_transfer_item_batch_allocations"
ADD CONSTRAINT "stock_transfer_item_batch_allocations_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_transfer_item_batch_allocations"
ADD CONSTRAINT "stock_transfer_item_batch_allocations_stock_transfer_item_id_fkey"
FOREIGN KEY ("stock_transfer_item_id") REFERENCES "stock_transfer_items"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stock_transfer_item_batch_allocations"
ADD CONSTRAINT "stock_transfer_item_batch_allocations_product_batch_id_fkey"
FOREIGN KEY ("product_batch_id") REFERENCES "product_batches"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
