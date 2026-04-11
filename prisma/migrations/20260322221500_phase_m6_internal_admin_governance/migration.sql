CREATE TABLE "internal_admin_audit_logs" (
  "id" UUID NOT NULL,
  "actor_user_id" UUID,
  "actor_email" VARCHAR(255),
  "admin_role" VARCHAR(64),
  "action" VARCHAR(128) NOT NULL,
  "target_type" VARCHAR(64) NOT NULL,
  "target_id" VARCHAR(128),
  "company_id" UUID,
  "summary" TEXT NOT NULL,
  "metadata" JSONB,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "internal_admin_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "internal_admin_audit_logs_created_at_idx"
ON "internal_admin_audit_logs"("created_at");

CREATE INDEX "internal_admin_audit_logs_action_idx"
ON "internal_admin_audit_logs"("action");

CREATE INDEX "internal_admin_audit_logs_company_id_created_at_idx"
ON "internal_admin_audit_logs"("company_id", "created_at");

CREATE INDEX "internal_admin_audit_logs_actor_user_id_created_at_idx"
ON "internal_admin_audit_logs"("actor_user_id", "created_at");

ALTER TABLE "internal_admin_audit_logs"
ADD CONSTRAINT "internal_admin_audit_logs_actor_user_id_fkey"
FOREIGN KEY ("actor_user_id") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "internal_admin_audit_logs"
ADD CONSTRAINT "internal_admin_audit_logs_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
