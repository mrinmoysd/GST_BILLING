-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "external_code" VARCHAR(64),
ADD COLUMN     "migration_source_ref" VARCHAR(128);

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "migration_source_ref" VARCHAR(128);

-- AlterTable
ALTER TABLE "ledgers" ADD COLUMN     "external_code" VARCHAR(64),
ADD COLUMN     "migration_source_ref" VARCHAR(128);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "external_code" VARCHAR(64),
ADD COLUMN     "migration_source_ref" VARCHAR(128);

-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "migration_source_ref" VARCHAR(128);

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "external_code" VARCHAR(64),
ADD COLUMN     "migration_source_ref" VARCHAR(128);

-- AlterTable
ALTER TABLE "warehouses" ADD COLUMN     "external_code" VARCHAR(64);

-- CreateTable
CREATE TABLE "migration_projects" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "source_system" VARCHAR(120),
    "go_live_date" DATE,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "checklist" JSONB,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "migration_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_profiles" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "source_format" VARCHAR(32) NOT NULL,
    "column_mappings" JSONB NOT NULL,
    "options" JSONB,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_jobs" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "migration_project_id" UUID,
    "import_profile_id" UUID,
    "entity_type" VARCHAR(64) NOT NULL,
    "source_format" VARCHAR(32) NOT NULL,
    "mode" VARCHAR(32) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'uploaded',
    "file_name" VARCHAR(255),
    "source_digest" VARCHAR(64),
    "summary" JSONB,
    "created_by_user_id" UUID,
    "committed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_job_rows" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "import_job_id" UUID NOT NULL,
    "row_number" INTEGER NOT NULL,
    "raw_payload_json" JSONB NOT NULL,
    "normalized_payload_json" JSONB,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "warning_codes_json" JSONB,
    "error_codes_json" JSONB,
    "result_entity_type" VARCHAR(64),
    "result_entity_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "import_job_rows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_templates" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "template_type" VARCHAR(64) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "published_version_id" UUID,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "print_template_versions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "print_template_id" UUID NOT NULL,
    "version_no" INTEGER NOT NULL,
    "schema_version" VARCHAR(32) NOT NULL,
    "layout_json" JSONB NOT NULL,
    "sample_options_json" JSONB,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "print_template_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_definitions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "code" VARCHAR(64) NOT NULL,
    "label" VARCHAR(160) NOT NULL,
    "field_type" VARCHAR(32) NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_searchable" BOOLEAN NOT NULL DEFAULT false,
    "is_printable" BOOLEAN NOT NULL DEFAULT false,
    "is_exportable" BOOLEAN NOT NULL DEFAULT false,
    "default_value_json" JSONB,
    "validation_json" JSONB,
    "options_json" JSONB,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_field_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "custom_field_values" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "definition_id" UUID NOT NULL,
    "entity_type" VARCHAR(64) NOT NULL,
    "entity_id" UUID NOT NULL,
    "value_json" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "custom_field_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_webhook_endpoints" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "url" TEXT NOT NULL,
    "secret_hash" VARCHAR(64) NOT NULL,
    "subscribed_events" JSONB NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "last_success_at" TIMESTAMPTZ(6),
    "last_failure_at" TIMESTAMPTZ(6),
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbound_webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbound_webhook_deliveries" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "endpoint_id" UUID NOT NULL,
    "event_type" VARCHAR(64) NOT NULL,
    "event_key" VARCHAR(128) NOT NULL,
    "request_headers_json" JSONB NOT NULL,
    "request_body_json" JSONB NOT NULL,
    "response_status" INTEGER,
    "response_body_excerpt" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 1,
    "next_retry_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbound_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "integration_api_keys" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "key_prefix" VARCHAR(24) NOT NULL,
    "secret_hash" VARCHAR(64) NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'active',
    "last_used_at" TIMESTAMPTZ(6),
    "created_by_user_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "migration_projects_company_id_idx" ON "migration_projects"("company_id");

-- CreateIndex
CREATE INDEX "migration_projects_company_id_status_idx" ON "migration_projects"("company_id", "status");

-- CreateIndex
CREATE INDEX "import_profiles_company_id_idx" ON "import_profiles"("company_id");

-- CreateIndex
CREATE INDEX "import_profiles_company_id_entity_type_idx" ON "import_profiles"("company_id", "entity_type");

-- CreateIndex
CREATE INDEX "import_jobs_company_id_idx" ON "import_jobs"("company_id");

-- CreateIndex
CREATE INDEX "import_jobs_migration_project_id_idx" ON "import_jobs"("migration_project_id");

-- CreateIndex
CREATE INDEX "import_jobs_import_profile_id_idx" ON "import_jobs"("import_profile_id");

-- CreateIndex
CREATE INDEX "import_jobs_company_id_entity_type_idx" ON "import_jobs"("company_id", "entity_type");

-- CreateIndex
CREATE INDEX "import_jobs_company_id_status_idx" ON "import_jobs"("company_id", "status");

-- CreateIndex
CREATE INDEX "import_job_rows_company_id_idx" ON "import_job_rows"("company_id");

-- CreateIndex
CREATE INDEX "import_job_rows_import_job_id_idx" ON "import_job_rows"("import_job_id");

-- CreateIndex
CREATE INDEX "import_job_rows_import_job_id_status_idx" ON "import_job_rows"("import_job_id", "status");

-- CreateIndex
CREATE INDEX "print_templates_company_id_idx" ON "print_templates"("company_id");

-- CreateIndex
CREATE INDEX "print_templates_company_id_template_type_idx" ON "print_templates"("company_id", "template_type");

-- CreateIndex
CREATE INDEX "print_template_versions_company_id_idx" ON "print_template_versions"("company_id");

-- CreateIndex
CREATE INDEX "print_template_versions_print_template_id_idx" ON "print_template_versions"("print_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "print_template_versions_print_template_id_version_no_key" ON "print_template_versions"("print_template_id", "version_no");

-- CreateIndex
CREATE INDEX "custom_field_definitions_company_id_idx" ON "custom_field_definitions"("company_id");

-- CreateIndex
CREATE INDEX "custom_field_definitions_company_id_entity_type_idx" ON "custom_field_definitions"("company_id", "entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_definitions_company_id_entity_type_code_key" ON "custom_field_definitions"("company_id", "entity_type", "code");

-- CreateIndex
CREATE INDEX "custom_field_values_company_id_idx" ON "custom_field_values"("company_id");

-- CreateIndex
CREATE INDEX "custom_field_values_company_id_entity_type_entity_id_idx" ON "custom_field_values"("company_id", "entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "custom_field_values_definition_id_entity_id_key" ON "custom_field_values"("definition_id", "entity_id");

-- CreateIndex
CREATE INDEX "outbound_webhook_endpoints_company_id_idx" ON "outbound_webhook_endpoints"("company_id");

-- CreateIndex
CREATE INDEX "outbound_webhook_endpoints_company_id_status_idx" ON "outbound_webhook_endpoints"("company_id", "status");

-- CreateIndex
CREATE INDEX "outbound_webhook_deliveries_company_id_idx" ON "outbound_webhook_deliveries"("company_id");

-- CreateIndex
CREATE INDEX "outbound_webhook_deliveries_endpoint_id_idx" ON "outbound_webhook_deliveries"("endpoint_id");

-- CreateIndex
CREATE INDEX "outbound_webhook_deliveries_company_id_status_idx" ON "outbound_webhook_deliveries"("company_id", "status");

-- CreateIndex
CREATE INDEX "integration_api_keys_company_id_idx" ON "integration_api_keys"("company_id");

-- CreateIndex
CREATE INDEX "integration_api_keys_company_id_status_idx" ON "integration_api_keys"("company_id", "status");

-- CreateIndex
CREATE INDEX "customers_company_id_external_code_idx" ON "customers"("company_id", "external_code");

-- CreateIndex
CREATE INDEX "ledgers_company_id_external_code_idx" ON "ledgers"("company_id", "external_code");

-- CreateIndex
CREATE INDEX "products_company_id_external_code_idx" ON "products"("company_id", "external_code");

-- CreateIndex
CREATE INDEX "suppliers_company_id_external_code_idx" ON "suppliers"("company_id", "external_code");

-- CreateIndex
CREATE INDEX "warehouses_company_id_external_code_idx" ON "warehouses"("company_id", "external_code");

-- AddForeignKey
ALTER TABLE "migration_projects" ADD CONSTRAINT "migration_projects_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_profiles" ADD CONSTRAINT "import_profiles_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_migration_project_id_fkey" FOREIGN KEY ("migration_project_id") REFERENCES "migration_projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_import_profile_id_fkey" FOREIGN KEY ("import_profile_id") REFERENCES "import_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_rows" ADD CONSTRAINT "import_job_rows_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "import_job_rows" ADD CONSTRAINT "import_job_rows_import_job_id_fkey" FOREIGN KEY ("import_job_id") REFERENCES "import_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_templates" ADD CONSTRAINT "print_templates_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_template_versions" ADD CONSTRAINT "print_template_versions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "print_template_versions" ADD CONSTRAINT "print_template_versions_print_template_id_fkey" FOREIGN KEY ("print_template_id") REFERENCES "print_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_definitions" ADD CONSTRAINT "custom_field_definitions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "custom_field_values" ADD CONSTRAINT "custom_field_values_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "custom_field_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_webhook_endpoints" ADD CONSTRAINT "outbound_webhook_endpoints_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_webhook_deliveries" ADD CONSTRAINT "outbound_webhook_deliveries_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbound_webhook_deliveries" ADD CONSTRAINT "outbound_webhook_deliveries_endpoint_id_fkey" FOREIGN KEY ("endpoint_id") REFERENCES "outbound_webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "integration_api_keys" ADD CONSTRAINT "integration_api_keys_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
