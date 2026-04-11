CREATE TABLE "admin_audit_logs" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "actor_user_id" UUID,
  "actor_email" VARCHAR(255),
  "action" VARCHAR(128) NOT NULL,
  "target_type" VARCHAR(64) NOT NULL,
  "target_id" VARCHAR(128),
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_audit_logs_company_id_idx"
ON "admin_audit_logs"("company_id");

CREATE INDEX "admin_audit_logs_company_id_created_at_idx"
ON "admin_audit_logs"("company_id", "created_at");

ALTER TABLE "admin_audit_logs"
ADD CONSTRAINT "admin_audit_logs_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
