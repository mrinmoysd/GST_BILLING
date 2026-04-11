-- AlterTable
ALTER TABLE "customers"
ADD COLUMN "gstin" VARCHAR(15),
ADD COLUMN "state_code" VARCHAR(5);

-- AlterTable
ALTER TABLE "suppliers"
ADD COLUMN "gstin" VARCHAR(15),
ADD COLUMN "state_code" VARCHAR(5);

-- AlterTable
ALTER TABLE "invoices"
ADD COLUMN "customer_gstin" VARCHAR(15),
ADD COLUMN "place_of_supply_state_code" VARCHAR(5);

-- AlterTable
ALTER TABLE "purchases"
ADD COLUMN "supplier_gstin" VARCHAR(15),
ADD COLUMN "place_of_supply_state_code" VARCHAR(5);

-- AlterTable
ALTER TABLE "invoice_items"
ADD COLUMN "hsn_code" VARCHAR(32),
ADD COLUMN "taxable_value" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "cgst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "sgst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "igst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "cess_amount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "purchase_items"
ADD COLUMN "hsn_code" VARCHAR(32),
ADD COLUMN "taxable_value" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "cgst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "sgst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "igst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "cess_amount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "document_credit_note_items"
ADD COLUMN "hsn_code" VARCHAR(32),
ADD COLUMN "taxable_value" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "cgst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "sgst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "igst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "cess_amount" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "purchase_return_items"
ADD COLUMN "hsn_code" VARCHAR(32),
ADD COLUMN "taxable_value" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "cgst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "sgst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "igst_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN "cess_amount" DECIMAL(65,30) NOT NULL DEFAULT 0;
