CREATE TABLE "einvoice_documents" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "provider" VARCHAR(64) NOT NULL DEFAULT 'sandbox_local',
  "status" VARCHAR(32) NOT NULL DEFAULT 'not_started',
  "eligibility_status" VARCHAR(32),
  "eligibility_reasons" JSONB,
  "irn" VARCHAR(128),
  "ack_no" VARCHAR(64),
  "ack_date" TIMESTAMPTZ(6),
  "signed_invoice_json" JSONB,
  "signed_qr_payload" TEXT,
  "request_payload" JSONB,
  "response_payload" JSONB,
  "cancellation_reason" TEXT,
  "cancelled_at" TIMESTAMPTZ(6),
  "last_synced_at" TIMESTAMPTZ(6),
  "last_error" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "einvoice_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "eway_bill_documents" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "provider" VARCHAR(64) NOT NULL DEFAULT 'sandbox_local',
  "status" VARCHAR(32) NOT NULL DEFAULT 'not_started',
  "eligibility_status" VARCHAR(32),
  "eligibility_reasons" JSONB,
  "eway_bill_number" VARCHAR(64),
  "transport_mode" VARCHAR(32),
  "transporter_name" TEXT,
  "transporter_id" VARCHAR(64),
  "vehicle_number" VARCHAR(64),
  "distance_km" INTEGER,
  "transport_document_number" VARCHAR(64),
  "transport_document_date" DATE,
  "valid_from" TIMESTAMPTZ(6),
  "valid_until" TIMESTAMPTZ(6),
  "request_payload" JSONB,
  "response_payload" JSONB,
  "cancellation_reason" TEXT,
  "cancelled_at" TIMESTAMPTZ(6),
  "last_synced_at" TIMESTAMPTZ(6),
  "last_error" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "eway_bill_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_compliance_events" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "invoice_id" UUID NOT NULL,
  "einvoice_document_id" UUID,
  "eway_bill_document_id" UUID,
  "event_type" VARCHAR(64) NOT NULL,
  "status" VARCHAR(24) NOT NULL DEFAULT 'info',
  "summary" TEXT NOT NULL,
  "request_payload" JSONB,
  "response_payload" JSONB,
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoice_compliance_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "einvoice_documents_invoice_id_key"
ON "einvoice_documents"("invoice_id");

CREATE UNIQUE INDEX "eway_bill_documents_invoice_id_key"
ON "eway_bill_documents"("invoice_id");

CREATE INDEX "einvoice_documents_company_id_idx"
ON "einvoice_documents"("company_id");

CREATE INDEX "einvoice_documents_company_id_status_idx"
ON "einvoice_documents"("company_id", "status");

CREATE INDEX "eway_bill_documents_company_id_idx"
ON "eway_bill_documents"("company_id");

CREATE INDEX "eway_bill_documents_company_id_status_idx"
ON "eway_bill_documents"("company_id", "status");

CREATE INDEX "invoice_compliance_events_company_id_idx"
ON "invoice_compliance_events"("company_id");

CREATE INDEX "invoice_compliance_events_invoice_id_idx"
ON "invoice_compliance_events"("invoice_id");

CREATE INDEX "invoice_compliance_events_company_id_created_at_idx"
ON "invoice_compliance_events"("company_id", "created_at");

ALTER TABLE "einvoice_documents"
ADD CONSTRAINT "einvoice_documents_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "einvoice_documents"
ADD CONSTRAINT "einvoice_documents_invoice_id_fkey"
FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "eway_bill_documents"
ADD CONSTRAINT "eway_bill_documents_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "eway_bill_documents"
ADD CONSTRAINT "eway_bill_documents_invoice_id_fkey"
FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoice_compliance_events"
ADD CONSTRAINT "invoice_compliance_events_company_id_fkey"
FOREIGN KEY ("company_id") REFERENCES "companies"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoice_compliance_events"
ADD CONSTRAINT "invoice_compliance_events_invoice_id_fkey"
FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "invoice_compliance_events"
ADD CONSTRAINT "invoice_compliance_events_einvoice_document_id_fkey"
FOREIGN KEY ("einvoice_document_id") REFERENCES "einvoice_documents"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "invoice_compliance_events"
ADD CONSTRAINT "invoice_compliance_events_eway_bill_document_id_fkey"
FOREIGN KEY ("eway_bill_document_id") REFERENCES "eway_bill_documents"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
