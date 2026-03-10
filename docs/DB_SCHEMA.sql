-- GST Billing SaaS - Core Postgres Schema
-- Generated: 2026-03-05
-- Notes: UUID primary keys, numeric for money, company_id for tenancy

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- companies (tenants)
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  gstin varchar(15),
  pan varchar(10),
  business_type varchar(32) NOT NULL,
  address jsonb,
  state varchar(100),
  state_code varchar(5),
  contact jsonb,
  bank_details jsonb,
  invoice_settings jsonb,
  logo_url text,
  timezone varchar(64) DEFAULT 'Asia/Kolkata',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_companies_gstin ON companies(gstin);

-- users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  password_hash text,
  role varchar(32) NOT NULL,
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, email)
);
CREATE INDEX idx_users_company ON users(company_id);

-- customers
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  gstin varchar(15),
  mobile varchar(20),
  email text,
  billing_address jsonb,
  shipping_address jsonb,
  customer_group varchar(64),
  credit_limit numeric(14,2) DEFAULT 0,
  outstanding numeric(14,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_customers_company_name ON customers(company_id, lower(name));

-- suppliers
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  gstin varchar(15),
  contact jsonb,
  billing_address jsonb,
  created_at timestamptz DEFAULT now()
);

-- categories
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES categories(id),
  created_at timestamptz DEFAULT now()
);

-- products
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  sku varchar(64),
  name text NOT NULL,
  hsn_code varchar(20),
  unit varchar(32),
  gst_percent numeric(5,2) DEFAULT 0,
  purchase_price numeric(14,2) DEFAULT 0,
  selling_price numeric(14,2) DEFAULT 0,
  stock_qty numeric(18,3) DEFAULT 0,
  barcode varchar(128),
  category_id uuid REFERENCES categories(id),
  extra jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_products_company_sku ON products(company_id, sku);
CREATE INDEX idx_products_barcode ON products(company_id, barcode);

-- product_batches (optional batch tracking)
CREATE TABLE product_batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  batch_no varchar(64),
  expiry_date date,
  qty numeric(18,3) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- invoice series (for atomic invoice numbering)
CREATE TABLE invoice_series (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name varchar(64) NOT NULL,
  prefix varchar(32),
  next_number bigint DEFAULT 1,
  padding int DEFAULT 4,
  format varchar(128) DEFAULT '{prefix}/{FY}/{seq}',
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_invoice_series_company ON invoice_series(company_id);

-- invoices
CREATE TABLE invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  invoice_type varchar(32) NOT NULL,
  invoice_number text NOT NULL,
  series_id uuid REFERENCES invoice_series(id),
  date date NOT NULL,
  due_date date,
  customer_id uuid REFERENCES customers(id),
  billing_address jsonb,
  shipping_address jsonb,
  sub_total numeric(18,2) NOT NULL,
  discount numeric(18,2) DEFAULT 0,
  taxable_value numeric(18,2) DEFAULT 0,
  cgst numeric(18,2) DEFAULT 0,
  sgst numeric(18,2) DEFAULT 0,
  igst numeric(18,2) DEFAULT 0,
  cess numeric(18,2) DEFAULT 0,
  round_off numeric(18,2) DEFAULT 0,
  total numeric(18,2) NOT NULL,
  status varchar(32) DEFAULT 'draft',
  notes text,
  pdf_url text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, invoice_number)
);
CREATE INDEX idx_invoices_company_date ON invoices(company_id, date);

-- invoice_items
CREATE TABLE invoice_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  description text,
  hsn_code varchar(20),
  quantity numeric(18,3) DEFAULT 1,
  unit_price numeric(18,2),
  discount numeric(18,2) DEFAULT 0,
  taxable_value numeric(18,2),
  gst_percent numeric(5,2),
  gst_type varchar(16),
  cgst_amount numeric(18,2) DEFAULT 0,
  sgst_amount numeric(18,2) DEFAULT 0,
  igst_amount numeric(18,2) DEFAULT 0,
  total numeric(18,2)
);

-- purchases
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id),
  bill_number text,
  date date NOT NULL,
  sub_total numeric(18,2) NOT NULL,
  cgst numeric(18,2) DEFAULT 0,
  sgst numeric(18,2) DEFAULT 0,
  igst numeric(18,2) DEFAULT 0,
  total numeric(18,2) NOT NULL,
  status varchar(32) DEFAULT 'received',
  created_at timestamptz DEFAULT now()
);

-- purchase_items
CREATE TABLE purchase_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id uuid REFERENCES purchases(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  batch_id uuid REFERENCES product_batches(id),
  quantity numeric(18,3),
  unit_price numeric(18,2),
  gst_percent numeric(5,2),
  total numeric(18,2)
);

-- payments
CREATE TABLE payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES invoices(id),
  purchase_id uuid REFERENCES purchases(id),
  amount numeric(18,2) NOT NULL,
  method varchar(32),
  reference text,
  payment_date timestamptz DEFAULT now(),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- stock_movements
CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  change_qty numeric(18,3) NOT NULL,
  balance_qty numeric(18,3) NOT NULL,
  source_type varchar(32),
  source_id uuid,
  note text,
  created_at timestamptz DEFAULT now()
);

-- ledgers & journal entries (basic accounting)
CREATE TABLE ledgers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  account_code varchar(64) NOT NULL,
  account_name text NOT NULL,
  type varchar(32) NOT NULL,
  balance numeric(18,2) DEFAULT 0,
  extra jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE journal_entries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  ref_type varchar(64),
  ref_id uuid,
  date date NOT NULL,
  narration text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE journal_lines (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id uuid REFERENCES journal_entries(id) ON DELETE CASCADE,
  ledger_id uuid REFERENCES ledgers(id),
  debit numeric(18,2) DEFAULT 0,
  credit numeric(18,2) DEFAULT 0
);

-- subscriptions (SaaS)
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  plan varchar(64),
  status varchar(32),
  started_at timestamptz,
  expires_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- logs and audit
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid,
  user_id uuid,
  action varchar(128),
  object_type varchar(64),
  object_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

-- search indexes & helpers
CREATE INDEX idx_products_search ON products USING GIN (to_tsvector('english', coalesce(name,''))); 
CREATE INDEX idx_customers_search ON customers USING GIN (to_tsvector('english', coalesce(name,'')));

-- =========================================================
-- Extended tables required for production SaaS completeness
-- =========================================================

-- RBAC permissions (fine-grained)
CREATE TABLE permissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(128) NOT NULL UNIQUE, -- e.g. invoice.create
  description text
);

CREATE TABLE roles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  name varchar(64) NOT NULL,
  is_system boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, name)
);

CREATE TABLE role_permissions (
  role_id uuid REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY(role_id, permission_id)
);

ALTER TABLE users ADD COLUMN role_id uuid;
ALTER TABLE users ADD CONSTRAINT fk_users_role_id FOREIGN KEY (role_id) REFERENCES roles(id);

-- File uploads (logos, invoice PDFs, supplier bills)
CREATE TABLE files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  owner_user_id uuid REFERENCES users(id),
  type varchar(64) NOT NULL, -- company_logo|invoice_pdf|purchase_bill|export
  storage varchar(32) DEFAULT 's3',
  bucket text,
  key text,
  url text,
  mime_type text,
  size_bytes bigint,
  checksum_sha256 text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_files_company_type ON files(company_id, type);

-- Notifications
CREATE TABLE notification_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  code varchar(64) NOT NULL, -- payment_reminder|low_stock|invoice_shared
  channel varchar(16) NOT NULL, -- email|whatsapp|sms|inapp
  subject text,
  body text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, code, channel)
);

CREATE TABLE notification_outbox (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  template_id uuid REFERENCES notification_templates(id),
  channel varchar(16) NOT NULL,
  to_address text,
  payload jsonb,
  status varchar(32) DEFAULT 'queued', -- queued|sent|failed
  attempts int DEFAULT 0,
  last_error text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_notification_outbox_status ON notification_outbox(status, scheduled_at);

-- Subscription: usage metering + webhooks
CREATE TABLE subscription_plans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  code varchar(64) NOT NULL UNIQUE, -- free|starter|business|enterprise
  name text NOT NULL,
  price_inr numeric(18,2) DEFAULT 0,
  billing_interval varchar(16) DEFAULT 'month', -- month|year
  limits jsonb, -- { invoices_per_month: 50, products: 100 }
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ADD COLUMN plan_id uuid;
ALTER TABLE subscriptions ADD CONSTRAINT fk_subscriptions_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans(id);
ALTER TABLE subscriptions ADD COLUMN provider varchar(32); -- razorpay|stripe
ALTER TABLE subscriptions ADD COLUMN provider_subscription_id text;

CREATE TABLE usage_meters (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  key varchar(64) NOT NULL, -- invoices_created|products_count|storage_bytes
  value numeric(18,2) DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(company_id, period_start, period_end, key)
);

CREATE TABLE webhook_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider varchar(32) NOT NULL,
  event_type varchar(128) NOT NULL,
  provider_event_id text,
  company_id uuid,
  payload jsonb NOT NULL,
  signature text,
  received_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  status varchar(32) DEFAULT 'received',
  error text
);
CREATE INDEX idx_webhook_events_provider_event ON webhook_events(provider, event_type);

-- Invoice adjustments: returns / credit notes
CREATE TABLE invoice_adjustments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE CASCADE,
  type varchar(32) NOT NULL, -- credit_note|sales_return
  original_invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  adjustment_number text NOT NULL,
  date date NOT NULL,
  customer_id uuid REFERENCES customers(id),
  reason text,
  sub_total numeric(18,2) NOT NULL,
  cgst numeric(18,2) DEFAULT 0,
  sgst numeric(18,2) DEFAULT 0,
  igst numeric(18,2) DEFAULT 0,
  total numeric(18,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, adjustment_number)
);

CREATE TABLE invoice_adjustment_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  adjustment_id uuid REFERENCES invoice_adjustments(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  quantity numeric(18,3) DEFAULT 1,
  unit_price numeric(18,2),
  gst_percent numeric(5,2),
  total numeric(18,2)
);

-- Support tickets (admin panel)
CREATE TABLE support_tickets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  subject text NOT NULL,
  description text,
  priority varchar(16) DEFAULT 'normal', -- low|normal|high|urgent
  status varchar(16) DEFAULT 'open', -- open|in_progress|resolved|closed
  last_reply_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- final note: consider Postgres RLS policy scripts for strong tenant isolation
