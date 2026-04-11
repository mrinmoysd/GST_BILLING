-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "purchase_id" UUID;

-- CreateIndex
CREATE INDEX "payments_purchase_id_idx" ON "payments"("purchase_id");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE SET NULL ON UPDATE CASCADE;
