-- D12 field sales and route operations

CREATE TABLE "sales_territories" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "code" VARCHAR(32) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "status" VARCHAR(32) NOT NULL DEFAULT 'active',
  "manager_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sales_territories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_routes" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "territory_id" UUID,
  "code" VARCHAR(32) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "status" VARCHAR(32) NOT NULL DEFAULT 'active',
  "default_warehouse_id" UUID,
  "manager_user_id" UUID,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sales_routes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_beats" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "territory_id" UUID,
  "route_id" UUID NOT NULL,
  "code" VARCHAR(32) NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "day_of_week" VARCHAR(16),
  "sequence_no" INTEGER,
  "status" VARCHAR(32) NOT NULL DEFAULT 'active',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sales_beats_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_sales_coverages" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "salesperson_user_id" UUID NOT NULL,
  "territory_id" UUID,
  "route_id" UUID,
  "beat_id" UUID,
  "visit_frequency" VARCHAR(32),
  "preferred_visit_day" VARCHAR(16),
  "priority" VARCHAR(16),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "effective_from" DATE,
  "effective_to" DATE,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "customer_sales_coverages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "salesperson_route_assignments" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "salesperson_user_id" UUID NOT NULL,
  "territory_id" UUID,
  "route_id" UUID,
  "beat_id" UUID,
  "is_primary" BOOLEAN NOT NULL DEFAULT false,
  "effective_from" DATE,
  "effective_to" DATE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "salesperson_route_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_visit_plans" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "visit_date" DATE NOT NULL,
  "salesperson_user_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "territory_id" UUID,
  "route_id" UUID,
  "beat_id" UUID,
  "plan_source" VARCHAR(32) NOT NULL DEFAULT 'generated',
  "priority" VARCHAR(16),
  "sequence_no" INTEGER,
  "status" VARCHAR(32) NOT NULL DEFAULT 'planned',
  "generated_by_user_id" UUID,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sales_visit_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_visits" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "visit_plan_id" UUID,
  "salesperson_user_id" UUID NOT NULL,
  "customer_id" UUID NOT NULL,
  "territory_id" UUID,
  "route_id" UUID,
  "beat_id" UUID,
  "visit_date" DATE NOT NULL,
  "check_in_at" TIMESTAMPTZ(6),
  "check_out_at" TIMESTAMPTZ(6),
  "check_in_latitude" DECIMAL,
  "check_in_longitude" DECIMAL,
  "check_out_latitude" DECIMAL,
  "check_out_longitude" DECIMAL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'planned',
  "primary_outcome" VARCHAR(64),
  "productive_flag" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "next_follow_up_date" DATE,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sales_visits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_visit_outcomes" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "visit_id" UUID NOT NULL,
  "outcome_type" VARCHAR(64) NOT NULL,
  "reference_type" VARCHAR(32),
  "reference_id" UUID,
  "amount" DECIMAL,
  "remarks" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sales_visit_outcomes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rep_daily_reports" (
  "id" UUID NOT NULL,
  "company_id" UUID NOT NULL,
  "salesperson_user_id" UUID NOT NULL,
  "report_date" DATE NOT NULL,
  "planned_visits_count" INTEGER NOT NULL DEFAULT 0,
  "completed_visits_count" INTEGER NOT NULL DEFAULT 0,
  "missed_visits_count" INTEGER NOT NULL DEFAULT 0,
  "productive_visits_count" INTEGER NOT NULL DEFAULT 0,
  "quotations_count" INTEGER NOT NULL DEFAULT 0,
  "sales_orders_count" INTEGER NOT NULL DEFAULT 0,
  "sales_order_value" DECIMAL NOT NULL DEFAULT 0,
  "collection_updates_count" INTEGER NOT NULL DEFAULT 0,
  "closing_notes" TEXT,
  "issues" JSONB,
  "status" VARCHAR(32) NOT NULL DEFAULT 'draft',
  "submitted_at" TIMESTAMPTZ(6),
  "reviewed_by_user_id" UUID,
  "reviewed_at" TIMESTAMPTZ(6),
  "review_notes" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "rep_daily_reports_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "quotations"
  ADD COLUMN "captured_by_user_id" UUID,
  ADD COLUMN "sales_visit_id" UUID,
  ADD COLUMN "territory_id" UUID,
  ADD COLUMN "route_id" UUID,
  ADD COLUMN "beat_id" UUID,
  ADD COLUMN "source_channel" VARCHAR(32);

ALTER TABLE "sales_orders"
  ADD COLUMN "captured_by_user_id" UUID,
  ADD COLUMN "sales_visit_id" UUID,
  ADD COLUMN "territory_id" UUID,
  ADD COLUMN "route_id" UUID,
  ADD COLUMN "beat_id" UUID,
  ADD COLUMN "source_channel" VARCHAR(32);

ALTER TABLE "collection_tasks"
  ADD COLUMN "sales_visit_id" UUID;

CREATE UNIQUE INDEX "sales_territories_company_id_code_key" ON "sales_territories"("company_id", "code");
CREATE INDEX "sales_territories_company_id_idx" ON "sales_territories"("company_id");
CREATE INDEX "sales_territories_manager_user_id_idx" ON "sales_territories"("manager_user_id");
CREATE INDEX "sales_territories_company_id_status_idx" ON "sales_territories"("company_id", "status");

CREATE UNIQUE INDEX "sales_routes_company_id_code_key" ON "sales_routes"("company_id", "code");
CREATE INDEX "sales_routes_company_id_idx" ON "sales_routes"("company_id");
CREATE INDEX "sales_routes_territory_id_idx" ON "sales_routes"("territory_id");
CREATE INDEX "sales_routes_default_warehouse_id_idx" ON "sales_routes"("default_warehouse_id");
CREATE INDEX "sales_routes_manager_user_id_idx" ON "sales_routes"("manager_user_id");
CREATE INDEX "sales_routes_company_id_status_idx" ON "sales_routes"("company_id", "status");

CREATE UNIQUE INDEX "sales_beats_company_id_code_key" ON "sales_beats"("company_id", "code");
CREATE INDEX "sales_beats_company_id_idx" ON "sales_beats"("company_id");
CREATE INDEX "sales_beats_territory_id_idx" ON "sales_beats"("territory_id");
CREATE INDEX "sales_beats_route_id_idx" ON "sales_beats"("route_id");
CREATE INDEX "sales_beats_company_id_status_idx" ON "sales_beats"("company_id", "status");

CREATE INDEX "customer_sales_coverages_company_id_idx" ON "customer_sales_coverages"("company_id");
CREATE INDEX "customer_sales_coverages_customer_id_idx" ON "customer_sales_coverages"("customer_id");
CREATE INDEX "customer_sales_coverages_salesperson_user_id_idx" ON "customer_sales_coverages"("salesperson_user_id");
CREATE INDEX "customer_sales_coverages_route_id_idx" ON "customer_sales_coverages"("route_id");
CREATE INDEX "customer_sales_coverages_beat_id_idx" ON "customer_sales_coverages"("beat_id");
CREATE INDEX "customer_sales_coverages_company_id_is_active_idx" ON "customer_sales_coverages"("company_id", "is_active");

CREATE INDEX "salesperson_route_assignments_company_id_idx" ON "salesperson_route_assignments"("company_id");
CREATE INDEX "salesperson_route_assignments_salesperson_user_id_idx" ON "salesperson_route_assignments"("salesperson_user_id");
CREATE INDEX "salesperson_route_assignments_route_id_idx" ON "salesperson_route_assignments"("route_id");
CREATE INDEX "salesperson_route_assignments_beat_id_idx" ON "salesperson_route_assignments"("beat_id");

CREATE UNIQUE INDEX "sales_visit_plans_company_id_visit_date_salesperson_user_id_customer_i_key"
  ON "sales_visit_plans"("company_id", "visit_date", "salesperson_user_id", "customer_id");
CREATE INDEX "sales_visit_plans_company_id_idx" ON "sales_visit_plans"("company_id");
CREATE INDEX "sales_visit_plans_salesperson_user_id_idx" ON "sales_visit_plans"("salesperson_user_id");
CREATE INDEX "sales_visit_plans_customer_id_idx" ON "sales_visit_plans"("customer_id");
CREATE INDEX "sales_visit_plans_route_id_idx" ON "sales_visit_plans"("route_id");
CREATE INDEX "sales_visit_plans_beat_id_idx" ON "sales_visit_plans"("beat_id");
CREATE INDEX "sales_visit_plans_company_id_visit_date_status_idx" ON "sales_visit_plans"("company_id", "visit_date", "status");

CREATE UNIQUE INDEX "sales_visits_visit_plan_id_key" ON "sales_visits"("visit_plan_id");
CREATE INDEX "sales_visits_company_id_idx" ON "sales_visits"("company_id");
CREATE INDEX "sales_visits_salesperson_user_id_idx" ON "sales_visits"("salesperson_user_id");
CREATE INDEX "sales_visits_customer_id_idx" ON "sales_visits"("customer_id");
CREATE INDEX "sales_visits_route_id_idx" ON "sales_visits"("route_id");
CREATE INDEX "sales_visits_beat_id_idx" ON "sales_visits"("beat_id");
CREATE INDEX "sales_visits_company_id_visit_date_status_idx" ON "sales_visits"("company_id", "visit_date", "status");

CREATE INDEX "sales_visit_outcomes_company_id_idx" ON "sales_visit_outcomes"("company_id");
CREATE INDEX "sales_visit_outcomes_visit_id_idx" ON "sales_visit_outcomes"("visit_id");
CREATE INDEX "sales_visit_outcomes_company_id_outcome_type_idx" ON "sales_visit_outcomes"("company_id", "outcome_type");

CREATE UNIQUE INDEX "rep_daily_reports_company_id_salesperson_user_id_report_date_key"
  ON "rep_daily_reports"("company_id", "salesperson_user_id", "report_date");
CREATE INDEX "rep_daily_reports_company_id_idx" ON "rep_daily_reports"("company_id");
CREATE INDEX "rep_daily_reports_salesperson_user_id_idx" ON "rep_daily_reports"("salesperson_user_id");
CREATE INDEX "rep_daily_reports_reviewed_by_user_id_idx" ON "rep_daily_reports"("reviewed_by_user_id");
CREATE INDEX "rep_daily_reports_company_id_report_date_status_idx" ON "rep_daily_reports"("company_id", "report_date", "status");

CREATE INDEX "quotations_captured_by_user_id_idx" ON "quotations"("captured_by_user_id");
CREATE INDEX "quotations_sales_visit_id_idx" ON "quotations"("sales_visit_id");
CREATE INDEX "quotations_territory_id_idx" ON "quotations"("territory_id");
CREATE INDEX "quotations_route_id_idx" ON "quotations"("route_id");
CREATE INDEX "quotations_beat_id_idx" ON "quotations"("beat_id");

CREATE INDEX "sales_orders_captured_by_user_id_idx" ON "sales_orders"("captured_by_user_id");
CREATE INDEX "sales_orders_sales_visit_id_idx" ON "sales_orders"("sales_visit_id");
CREATE INDEX "sales_orders_territory_id_idx" ON "sales_orders"("territory_id");
CREATE INDEX "sales_orders_route_id_idx" ON "sales_orders"("route_id");
CREATE INDEX "sales_orders_beat_id_idx" ON "sales_orders"("beat_id");

CREATE INDEX "collection_tasks_sales_visit_id_idx" ON "collection_tasks"("sales_visit_id");

ALTER TABLE "sales_territories"
  ADD CONSTRAINT "sales_territories_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_territories_manager_user_id_fkey" FOREIGN KEY ("manager_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_routes"
  ADD CONSTRAINT "sales_routes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_routes_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "sales_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_routes_default_warehouse_id_fkey" FOREIGN KEY ("default_warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_routes_manager_user_id_fkey" FOREIGN KEY ("manager_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_beats"
  ADD CONSTRAINT "sales_beats_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_beats_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "sales_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_beats_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "sales_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_sales_coverages"
  ADD CONSTRAINT "customer_sales_coverages_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "customer_sales_coverages_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "customer_sales_coverages_salesperson_user_id_fkey" FOREIGN KEY ("salesperson_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "customer_sales_coverages_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "sales_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "customer_sales_coverages_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "sales_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "customer_sales_coverages_beat_id_fkey" FOREIGN KEY ("beat_id") REFERENCES "sales_beats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "salesperson_route_assignments"
  ADD CONSTRAINT "salesperson_route_assignments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "salesperson_route_assignments_salesperson_user_id_fkey" FOREIGN KEY ("salesperson_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "salesperson_route_assignments_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "sales_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "salesperson_route_assignments_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "sales_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "salesperson_route_assignments_beat_id_fkey" FOREIGN KEY ("beat_id") REFERENCES "sales_beats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_visit_plans"
  ADD CONSTRAINT "sales_visit_plans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visit_plans_salesperson_user_id_fkey" FOREIGN KEY ("salesperson_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visit_plans_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visit_plans_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "sales_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visit_plans_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "sales_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visit_plans_beat_id_fkey" FOREIGN KEY ("beat_id") REFERENCES "sales_beats"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visit_plans_generated_by_user_id_fkey" FOREIGN KEY ("generated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_visits"
  ADD CONSTRAINT "sales_visits_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visits_visit_plan_id_fkey" FOREIGN KEY ("visit_plan_id") REFERENCES "sales_visit_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visits_salesperson_user_id_fkey" FOREIGN KEY ("salesperson_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visits_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visits_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "sales_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visits_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "sales_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visits_beat_id_fkey" FOREIGN KEY ("beat_id") REFERENCES "sales_beats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_visit_outcomes"
  ADD CONSTRAINT "sales_visit_outcomes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_visit_outcomes_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "sales_visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "rep_daily_reports"
  ADD CONSTRAINT "rep_daily_reports_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "rep_daily_reports_salesperson_user_id_fkey" FOREIGN KEY ("salesperson_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "rep_daily_reports_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "quotations"
  ADD CONSTRAINT "quotations_captured_by_user_id_fkey" FOREIGN KEY ("captured_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "quotations_sales_visit_id_fkey" FOREIGN KEY ("sales_visit_id") REFERENCES "sales_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "quotations_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "sales_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "quotations_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "sales_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "quotations_beat_id_fkey" FOREIGN KEY ("beat_id") REFERENCES "sales_beats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sales_orders"
  ADD CONSTRAINT "sales_orders_captured_by_user_id_fkey" FOREIGN KEY ("captured_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_orders_sales_visit_id_fkey" FOREIGN KEY ("sales_visit_id") REFERENCES "sales_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_orders_territory_id_fkey" FOREIGN KEY ("territory_id") REFERENCES "sales_territories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_orders_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "sales_routes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "sales_orders_beat_id_fkey" FOREIGN KEY ("beat_id") REFERENCES "sales_beats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "collection_tasks"
  ADD CONSTRAINT "collection_tasks_sales_visit_id_fkey" FOREIGN KEY ("sales_visit_id") REFERENCES "sales_visits"("id") ON DELETE SET NULL ON UPDATE CASCADE;
