ALTER TABLE "customers"
ADD COLUMN "salesperson_user_id" UUID;

ALTER TABLE "quotations"
ADD COLUMN "salesperson_user_id" UUID;

ALTER TABLE "sales_orders"
ADD COLUMN "salesperson_user_id" UUID;

ALTER TABLE "invoices"
ADD COLUMN "salesperson_user_id" UUID;

ALTER TABLE "payments"
ADD COLUMN "salesperson_user_id" UUID;

CREATE INDEX "customers_salesperson_user_id_idx"
ON "customers"("salesperson_user_id");

CREATE INDEX "quotations_salesperson_user_id_idx"
ON "quotations"("salesperson_user_id");

CREATE INDEX "sales_orders_salesperson_user_id_idx"
ON "sales_orders"("salesperson_user_id");

CREATE INDEX "invoices_salesperson_user_id_idx"
ON "invoices"("salesperson_user_id");

CREATE INDEX "payments_salesperson_user_id_idx"
ON "payments"("salesperson_user_id");

ALTER TABLE "customers"
ADD CONSTRAINT "customers_salesperson_user_id_fkey"
FOREIGN KEY ("salesperson_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quotations"
ADD CONSTRAINT "quotations_salesperson_user_id_fkey"
FOREIGN KEY ("salesperson_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_orders"
ADD CONSTRAINT "sales_orders_salesperson_user_id_fkey"
FOREIGN KEY ("salesperson_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoices"
ADD CONSTRAINT "invoices_salesperson_user_id_fkey"
FOREIGN KEY ("salesperson_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payments"
ADD CONSTRAINT "payments_salesperson_user_id_fkey"
FOREIGN KEY ("salesperson_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
