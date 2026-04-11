ALTER TABLE "subscription_plans"
ADD COLUMN "is_public" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "display_order" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN "trial_days" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN "allow_add_ons" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "subscriptions"
ADD COLUMN "trial_started_at" TIMESTAMPTZ(6),
ADD COLUMN "trial_ends_at" TIMESTAMPTZ(6);

CREATE TABLE "company_entitlements" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "subscription_id" UUID,
    "plan_code" VARCHAR(64),
    "status" VARCHAR(32) NOT NULL DEFAULT 'inactive',
    "effective_limits" JSONB,
    "overrides" JSONB,
    "billing_period_start" DATE,
    "billing_period_end" DATE,
    "trial_started_at" TIMESTAMPTZ(6),
    "trial_ends_at" TIMESTAMPTZ(6),
    "trial_status" VARCHAR(32) NOT NULL DEFAULT 'not_applicable',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_entitlements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "company_entitlements_company_id_key" ON "company_entitlements"("company_id");
CREATE INDEX "company_entitlements_subscription_id_idx" ON "company_entitlements"("subscription_id");
CREATE INDEX "company_entitlements_status_idx" ON "company_entitlements"("status");
CREATE INDEX "company_entitlements_trial_status_idx" ON "company_entitlements"("trial_status");

ALTER TABLE "company_entitlements"
ADD CONSTRAINT "company_entitlements_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_entitlements"
ADD CONSTRAINT "company_entitlements_subscription_id_fkey"
FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
