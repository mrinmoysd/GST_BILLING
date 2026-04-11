CREATE TABLE "commercial_schemes" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "code" VARCHAR(64) NOT NULL,
  "name" VARCHAR(200) NOT NULL,
  "scheme_type" VARCHAR(64) NOT NULL,
  "document_type" VARCHAR(32),
  "customer_id" UUID,
  "pricing_tier" VARCHAR(64),
  "product_id" UUID,
  "min_quantity" DECIMAL(65,30),
  "min_amount" DECIMAL(65,30),
  "percent_discount" DECIMAL(65,30),
  "flat_discount_amount" DECIMAL(65,30),
  "free_quantity" DECIMAL(65,30),
  "priority" INTEGER NOT NULL DEFAULT 0,
  "is_exclusive" BOOLEAN NOT NULL DEFAULT false,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "starts_at" DATE,
  "ends_at" DATE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "commercial_schemes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "commercial_audit_logs" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "actor_user_id" UUID,
  "document_type" VARCHAR(32) NOT NULL,
  "document_id" UUID NOT NULL,
  "document_line_id" UUID,
  "customer_id" UUID,
  "product_id" UUID,
  "pricing_source" VARCHAR(64),
  "action" VARCHAR(64) NOT NULL,
  "override_reason" TEXT,
  "warnings" JSONB,
  "snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "commercial_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "commercial_schemes_company_id_code_key"
ON "commercial_schemes"("company_id", "code");

CREATE INDEX "commercial_schemes_company_id_idx"
ON "commercial_schemes"("company_id");

CREATE INDEX "commercial_schemes_company_id_is_active_idx"
ON "commercial_schemes"("company_id", "is_active");

CREATE INDEX "commercial_schemes_company_id_pricing_tier_idx"
ON "commercial_schemes"("company_id", "pricing_tier");

CREATE INDEX "commercial_schemes_customer_id_idx"
ON "commercial_schemes"("customer_id");

CREATE INDEX "commercial_schemes_product_id_idx"
ON "commercial_schemes"("product_id");

CREATE INDEX "commercial_audit_logs_company_id_idx"
ON "commercial_audit_logs"("company_id");

CREATE INDEX "commercial_audit_logs_company_id_document_type_created_at_idx"
ON "commercial_audit_logs"("company_id", "document_type", "created_at");

CREATE INDEX "commercial_audit_logs_company_id_action_created_at_idx"
ON "commercial_audit_logs"("company_id", "action", "created_at");

CREATE INDEX "commercial_audit_logs_actor_user_id_idx"
ON "commercial_audit_logs"("actor_user_id");

CREATE INDEX "commercial_audit_logs_customer_id_idx"
ON "commercial_audit_logs"("customer_id");

CREATE INDEX "commercial_audit_logs_product_id_idx"
ON "commercial_audit_logs"("product_id");

ALTER TABLE "commercial_schemes"
ADD CONSTRAINT "commercial_schemes_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commercial_schemes"
ADD CONSTRAINT "commercial_schemes_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commercial_schemes"
ADD CONSTRAINT "commercial_schemes_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "commercial_audit_logs"
ADD CONSTRAINT "commercial_audit_logs_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "commercial_audit_logs"
ADD CONSTRAINT "commercial_audit_logs_actor_user_id_fkey"
FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "commercial_audit_logs"
ADD CONSTRAINT "commercial_audit_logs_customer_id_fkey"
FOREIGN KEY ("customer_id") REFERENCES "customers"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "commercial_audit_logs"
ADD CONSTRAINT "commercial_audit_logs_product_id_fkey"
FOREIGN KEY ("product_id") REFERENCES "products"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
