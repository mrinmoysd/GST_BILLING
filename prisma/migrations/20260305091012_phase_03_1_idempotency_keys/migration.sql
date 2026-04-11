-- CreateTable
CREATE TABLE "idempotency_keys" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "key" VARCHAR(128) NOT NULL,
    "route" VARCHAR(128) NOT NULL,
    "request_hash" VARCHAR(64) NOT NULL,
    "response_code" INTEGER NOT NULL,
    "response_body" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6),

    CONSTRAINT "idempotency_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idempotency_keys_company_id_idx" ON "idempotency_keys"("company_id");

-- CreateIndex
CREATE INDEX "idempotency_keys_company_id_route_idx" ON "idempotency_keys"("company_id", "route");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_keys_company_id_key_route_key" ON "idempotency_keys"("company_id", "key", "route");

-- AddForeignKey
ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
