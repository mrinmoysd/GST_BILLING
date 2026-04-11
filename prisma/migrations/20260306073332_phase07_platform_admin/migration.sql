-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "owner_user_id" UUID,
    "type" VARCHAR(64) NOT NULL,
    "storage" VARCHAR(32) NOT NULL DEFAULT 'local',
    "bucket" TEXT,
    "key" TEXT,
    "url" TEXT,
    "mime_type" TEXT,
    "size_bytes" BIGINT,
    "checksum_sha256" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "channel" VARCHAR(16) NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_outbox" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "template_id" UUID,
    "channel" VARCHAR(16) NOT NULL,
    "to_address" TEXT,
    "payload" JSONB,
    "status" VARCHAR(32) NOT NULL DEFAULT 'queued',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "scheduled_at" TIMESTAMPTZ(6),
    "sent_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" UUID NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "name" TEXT NOT NULL,
    "price_inr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "billing_interval" VARCHAR(16) NOT NULL DEFAULT 'month',
    "limits" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "plan_id" UUID,
    "plan" VARCHAR(64),
    "status" VARCHAR(32),
    "started_at" TIMESTAMPTZ(6),
    "expires_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "provider" VARCHAR(32),
    "provider_subscription_id" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_meters" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "key" VARCHAR(64) NOT NULL,
    "value" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_meters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "provider" VARCHAR(32) NOT NULL,
    "event_type" VARCHAR(128) NOT NULL,
    "provider_event_id" TEXT,
    "company_id" UUID,
    "payload" JSONB NOT NULL,
    "signature" TEXT,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMPTZ(6),
    "status" VARCHAR(32) NOT NULL DEFAULT 'received',
    "error" TEXT,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "files_company_id_idx" ON "files"("company_id");

-- CreateIndex
CREATE INDEX "files_company_id_type_idx" ON "files"("company_id", "type");

-- CreateIndex
CREATE INDEX "notification_templates_company_id_idx" ON "notification_templates"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_company_id_code_channel_key" ON "notification_templates"("company_id", "code", "channel");

-- CreateIndex
CREATE INDEX "notification_outbox_company_id_idx" ON "notification_outbox"("company_id");

-- CreateIndex
CREATE INDEX "notification_outbox_status_scheduled_at_idx" ON "notification_outbox"("status", "scheduled_at");

-- CreateIndex
CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");

-- CreateIndex
CREATE INDEX "subscriptions_company_id_idx" ON "subscriptions"("company_id");

-- CreateIndex
CREATE INDEX "subscriptions_company_id_status_idx" ON "subscriptions"("company_id", "status");

-- CreateIndex
CREATE INDEX "usage_meters_company_id_idx" ON "usage_meters"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "usage_meters_company_id_period_start_period_end_key_key" ON "usage_meters"("company_id", "period_start", "period_end", "key");

-- CreateIndex
CREATE INDEX "webhook_events_provider_event_type_idx" ON "webhook_events"("provider", "event_type");

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_meters" ADD CONSTRAINT "usage_meters_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
