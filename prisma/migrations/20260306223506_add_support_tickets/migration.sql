-- CreateTable
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255),
    "name" VARCHAR(255),
    "subject" VARCHAR(255),
    "message" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'open',
    "priority" VARCHAR(32) NOT NULL DEFAULT 'normal',
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "support_tickets_status_created_at_idx" ON "support_tickets"("status", "created_at");
