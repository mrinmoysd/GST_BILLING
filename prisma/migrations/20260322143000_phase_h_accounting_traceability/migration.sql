ALTER TABLE "journals"
ADD COLUMN "source_type" VARCHAR(64),
ADD COLUMN "source_id" VARCHAR(128),
ADD COLUMN "is_system_generated" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "journals_company_id_source_type_idx"
ON "journals"("company_id", "source_type");

CREATE UNIQUE INDEX "journals_company_id_source_type_source_id_key"
ON "journals"("company_id", "source_type", "source_id");
