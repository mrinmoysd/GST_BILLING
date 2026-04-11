-- CreateTable
CREATE TABLE "export_jobs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'queued',
    "params" JSONB,
    "result_file_url" TEXT,
    "result_file_name" VARCHAR(255),
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMPTZ(6),
    "finished_at" TIMESTAMPTZ(6),

    CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "export_jobs_company_id_idx" ON "export_jobs"("company_id");

-- CreateIndex
CREATE INDEX "export_jobs_company_id_type_idx" ON "export_jobs"("company_id", "type");

-- CreateIndex
CREATE INDEX "export_jobs_company_id_status_idx" ON "export_jobs"("company_id", "status");

-- AddForeignKey
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
