# D13 Import, Migration, and Customization Specification

**Date**: 2026-03-26  
**Purpose**: Define the implementation-ready scope for guided data migration, opening imports, custom print templates, controlled custom fields, and integration hooks that reduce switching friction from legacy desktop systems.  
**Implementation status**: Planned

Source:

- [MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md)
- [MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)
- [API_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/API_SPEC.md)
- [ACCOUNTING_RULES.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/ACCOUNTING_RULES.md)
- [D7_PRICING_AND_SCHEME_ENGINE_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D7_PRICING_AND_SCHEME_ENGINE_SPEC.md)
- [D8_BATCH_EXPIRY_AND_CLEARANCE_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D8_BATCH_EXPIRY_AND_CLEARANCE_SPEC.md)
- [D9_COLLECTIONS_BANKING_AND_CREDIT_CONTROL_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D9_COLLECTIONS_BANKING_AND_CREDIT_CONTROL_SPEC.md)
- [D10_DISPATCH_DELIVERY_AND_CHALLAN_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D10_DISPATCH_DELIVERY_AND_CHALLAN_SPEC.md)
- [D12_FIELD_SALES_AND_ROUTE_OPERATIONS_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D12_FIELD_SALES_AND_ROUTE_OPERATIONS_SPEC.md)

External product-definition references:

- [Marg key features](https://margcompusoft.com/key_features.html)
- [Marg invoice design help](https://care.margcompusoft.com/marg-book/invoice-design/179394/utils/inffast)
- [Marg opening balance help](https://care.margcompusoft.com/margerp/opening-balances/1856/1/How-to-Feed-Ledger-Opening)
- [Marg ledger import/export help](https://care.margcompusoft.com/margerp/data-import-export/1560/1/How-we-can-export-and)
- [Marg Busy import help](https://care.margcompusoft.com/margerp/data-import-export/4437/1/How-to-import-Data-in)
- [Marg self-defined field printing help](https://care.margcompusoft.com/margerp/self-defined-field/2717/1/Which-command-is-used-to)

Current implementation anchors:

- onboarding already creates a company, owner, and default invoice series
- invoice PDF generation exists, but it is a fixed PDFKit layout
- GST export jobs and file downloads already exist
- notification template CRUD exists as a company-scoped template subsystem
- billing webhook handling exists for subscriptions
- file storage and async job patterns already exist
- no strong end-user import workspace, migration assistant, custom print designer, or controlled custom-field system is visible yet

---

## D13 goal

Reduce switching friction from legacy desktop tools by adding:

- guided imports for key data families
- safe opening migration flows
- configurable print templates without code changes
- controlled custom fields for common business-specific metadata
- basic export and webhook integration hooks

D13 should make it practical for a real distributor to move into the product without spreadsheets, manual re-entry, or one-off engineering work for every onboarding.

---

## Why D13 matters

The product can already run many day-to-day workflows, but migration into the product is still heavy because a business typically needs to bring in:

- customers
- suppliers
- products
- stock position
- ledger balances
- open receivables and payables
- print formats
- a few business-specific fields

Without D13:

- onboarding a serious business remains slow
- data quality depends too much on manual entry
- go-live timelines expand
- every print or custom-data demand risks becoming a custom-code request

For Marg-style parity, D13 is not optional. It is one of the major reasons older desktop systems remain sticky.

---

## Scope

Included in D13:

- migration project workspace
- CSV and Excel import foundation
- reusable column-mapping profiles
- dry-run validation and row-level error reporting
- customers, suppliers, products, ledgers, warehouses, salespeople, and route/beat import templates
- opening stock import
- opening balance and opening outstanding import
- limited transaction import for open sales and open purchase documents
- custom print-template management
- controlled custom field definitions and values
- outbound exports and webhook subscriptions for selected business events

Included operator outputs:

- import job history
- failed-row review
- mapping profile library
- migration readiness checklist
- print-template preview and publish
- custom field catalog
- webhook delivery log

Not included in D13 first release:

- arbitrary ETL scripting UI
- every possible third-party software connector
- full historical ledger reconstruction for many years
- a universal report designer
- a Turing-complete print scripting engine
- bidirectional sync with every external system

Planned result after D13:

- a business can migrate core masters and opening positions with guided tools
- common invoice and document-format demands can be handled from settings
- basic external integration can happen without changing core code

---

## Business outcomes

After D13, the product should let a business:

- migrate masters and balances quickly
- start with accurate stock and dues
- import open documents that still matter operationally
- adapt printed invoice output to customer or market expectations
- add a small number of controlled custom fields for business-specific metadata
- push selected events to external systems through stable hooks

---

## Design principles

1. Migration should be guided, not magical.
   The product should explain what will happen before it writes anything.

2. Dry-run first, commit second.
   Every important import should support preview and validation before data is applied.

3. Imports must reuse normal domain services.
   Imported records should be created through the same validation logic as normal records where practical.

4. Opening migration is not the same as history replay.
   First release should prioritize current-state opening import over full historical reconstruction.

5. Print customization must stay bounded.
   Support flexible layouts and field selection without allowing arbitrary executable code.

6. Custom fields must be typed and controlled.
   Avoid free-form schema chaos that breaks reports, filters, and exports.

7. Auditability matters.
   Every import, publish, and webhook delivery should leave a supportable trail.

8. Safe extensibility beats ad-hoc one-offs.
   The goal is to handle the most common migration and customization demands repeatedly, not create unmaintainable customer forks.

---

## Terms and concepts

### Migration project

A company-scoped workspace that groups import jobs, mapping decisions, and go-live checklist progress.

### Import profile

A saved definition of source type, file format, and column mapping for a particular import.

### Dry-run

A non-committing import preview that validates rows, maps columns, and estimates what would be created or updated.

### Opening import

An import used to establish opening stock, opening balances, or open outstanding documents at go-live time.

### Print template

A configurable document layout used to render invoice, challan, quotation, sales order, receipt, or purchase output.

### Custom field definition

A typed field definition attached to a supported business entity such as customer or product.

### Outbound webhook

A signed event delivery sent from this product to an external endpoint when selected events occur.

---

## D13 capability set

## 1. Migration workspace

The system should support:

- create migration project
- define source software or migration type
- see required import checklist
- track jobs by status
- review unresolved errors

## 2. Import foundation

The system should support:

- CSV upload
- Excel upload
- saved mappings
- field-level validation
- row-level errors and warnings
- dry-run and commit phases
- import summaries

## 3. Master-data imports

The system should support:

- customers
- suppliers
- products
- categories
- ledgers
- warehouses
- salespeople
- route / beat / territory masters later when D12 is enabled

## 4. Opening migration imports

The system should support:

- opening stock by product and warehouse
- batch-wise opening stock when D8 is enabled
- opening customer outstanding
- opening supplier outstanding
- opening ledger balances
- optional opening cheque / PDC register when D9 is enabled

## 5. Open-transaction imports

The system should support:

- open sales invoices
- open purchase bills
- optional sales orders and quotations where migration demands it

Recommended first-release boundary:

- support open documents that still matter operationally and financially
- do not attempt unrestricted import of all historical transactions in first release

## 6. Print-template management

The system should support:

- template library
- draft and published versions
- entity-specific template types
- preview with sample data
- default template selection
- company logo and branded header blocks

## 7. Controlled custom fields

The system should support:

- entity-scoped custom field definitions
- typed inputs
- default values
- required / optional rules
- inclusion in print and export surfaces

## 8. Integration and export hooks

The system should support:

- outbound webhooks for selected business events
- basic API key management for partner integrations
- export feeds or scheduled exports later if needed

---

## Phase breakdown inside D13

### D13.1 Migration foundation

Deliver:

- migration projects
- import jobs
- dry-run engine
- reusable mapping profiles

### D13.2 Master imports

Deliver:

- customer, supplier, product, category, warehouse, and ledger imports
- import templates and downloadable samples

### D13.3 Opening stock and balances

Deliver:

- opening stock import
- customer and supplier opening outstanding import
- ledger opening import

### D13.4 Open-document migration

Deliver:

- open sales invoice import
- open purchase bill import
- optional sales order import where required

### D13.5 Print-template system

Deliver:

- template library
- preview
- publish and default selection

### D13.6 Custom fields and integration hooks

Deliver:

- controlled custom fields
- outbound webhooks
- integration-key basics

---

## Core business rules

## 1. Import modes

Recommended import modes:

- `create_only`
- `upsert_by_key`
- `validate_only`

Rules:

- every import type must define its natural match key
- upsert should be allowed only where the business meaning is clear
- destructive sync or delete-on-missing should not exist in first release

Suggested matching keys:

- customer: GSTIN, mobile, or external code
- supplier: GSTIN or external code
- product: SKU, barcode, or external code
- ledger: code or exact name with explicit confirmation
- warehouse: code

## 2. Dry-run behavior

Dry-run should:

- parse the uploaded file
- validate required columns
- map columns to system fields
- show row-level outcomes:
  - valid
  - warning
  - blocking error
- show what would be created vs updated

Dry-run must not:

- write business entities
- consume invoice numbers
- mutate stock
- create accounting entries

## 3. Commit behavior

Commit should:

- operate only on rows that passed blocking validation
- preserve a row-level audit record
- produce import summary counts
- expose the resulting created or updated entity references

Recommended first-release option:

- support commit of only all valid rows
- optionally allow “commit valid rows, skip invalid rows” after the user confirms

## 4. Opening balance rules

Opening balance imports should support:

- ledger opening values
- customer and supplier bill-wise outstanding
- due date and bill reference where applicable

Rules:

- imported opening balances must align with the configured opening date
- opening dues imported bill-wise should preserve due-date context
- on-account and bill-wise styles must both be supported where the accounting model permits
- opening imports must not double-post if rerun accidentally

Implementation note:

- first release should strongly prefer importing current open positions rather than trying to replay all prior receipts and payments

## 5. Opening stock rules

Opening stock import should support:

- product
- warehouse
- quantity
- optional rate or value
- optional batch and expiry details when D8 is enabled

Rules:

- opening stock should create explicit stock movement records with source type = `opening_import`
- valuation and quantity must reconcile to the imported opening figures
- rerun safety should be controlled by import mode and idempotency policy

## 6. Open document migration rules

Recommended first release:

- import only operationally active documents
- open invoice imports should preserve:
  - document number
  - issue date
  - due date
  - customer
  - line items or summarized amount depending on mode
  - outstanding amount
- open purchase bill imports should preserve:
  - supplier
  - bill number
  - bill date
  - due date
  - outstanding amount

Two supported import styles are recommended:

- `summary_opening_mode`
  - imports financial open documents with simplified line detail
- `full_document_mode`
  - imports document line items when source quality is good enough

First release should prioritize `summary_opening_mode` if implementation speed is important.

## 7. Print-template rules

The print system should support template types such as:

- invoice
- quotation
- sales_order
- delivery_challan
- purchase_bill
- receipt

Rules:

- one company may have multiple templates per type
- one published default template per type
- template preview should work with sample or real document ids
- template publishing should version the layout rather than mutating published content invisibly
- fallback to the system default template must always remain available

## 8. Custom-field rules

First-release supported entity targets:

- customer
- supplier
- product
- sales_order
- invoice

Recommended field types:

- text
- textarea
- number
- date
- boolean
- select_single

Rules:

- each custom field definition belongs to one company and one entity type
- custom fields may be marked searchable, printable, and exportable
- custom fields should not be allowed to alter core accounting logic directly
- custom fields should not replace statutory fields like GSTIN or HSN

## 9. Integration rules

Outbound webhooks should be supported for events such as:

- customer.created
- customer.updated
- sales_order.created
- invoice.issued
- payment.recorded
- purchase.received

Rules:

- deliveries should be signed
- failed deliveries should retry with backoff
- endpoint health and delivery log should be visible to admins
- first release should focus on outbound events, not full bidirectional sync

---

## Suggested data model

## Migration and import entities

### `migration_projects`

Purpose:

- group onboarding and migration work for a company

Suggested fields:

- `id`
- `company_id`
- `name`
- `source_system` nullable
- `go_live_date` nullable
- `status`
- `owner_user_id`
- `notes` nullable
- `created_at`
- `updated_at`

Suggested `status` values:

- `draft`
- `in_progress`
- `ready_for_cutover`
- `completed`

### `import_profiles`

Purpose:

- save reusable import mappings

Suggested fields:

- `id`
- `company_id`
- `migration_project_id` nullable
- `entity_type`
- `source_format`
- `name`
- `match_strategy`
- `mapping_json`
- `options_json` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

### `import_jobs`

Purpose:

- track one upload and processing attempt

Suggested fields:

- `id`
- `company_id`
- `migration_project_id` nullable
- `import_profile_id` nullable
- `entity_type`
- `source_format`
- `mode`
- `status`
- `file_id` nullable
- `started_by_user_id`
- `dry_run_summary_json` nullable
- `commit_summary_json` nullable
- `started_at` nullable
- `completed_at` nullable
- `created_at`
- `updated_at`

Suggested `status` values:

- `uploaded`
- `validating`
- `dry_run_ready`
- `committing`
- `completed`
- `completed_with_errors`
- `failed`

### `import_job_rows`

Purpose:

- row-level validation and result tracking

Suggested fields:

- `id`
- `import_job_id`
- `row_number`
- `raw_payload_json`
- `normalized_payload_json` nullable
- `status`
- `warning_codes_json` nullable
- `error_codes_json` nullable
- `result_entity_type` nullable
- `result_entity_id` nullable
- `created_at`
- `updated_at`

Suggested `status` values:

- `valid`
- `warning`
- `error`
- `committed`
- `skipped`

## Print customization entities

### `print_templates`

Purpose:

- template header entity

Suggested fields:

- `id`
- `company_id`
- `template_type`
- `name`
- `status`
- `is_default`
- `published_version_id` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

### `print_template_versions`

Purpose:

- immutable versioned template bodies

Suggested fields:

- `id`
- `print_template_id`
- `version_no`
- `schema_version`
- `layout_json`
- `sample_options_json` nullable
- `created_by_user_id`
- `created_at`

## Custom-field entities

### `custom_field_definitions`

Purpose:

- define allowed custom fields

Suggested fields:

- `id`
- `company_id`
- `entity_type`
- `code`
- `label`
- `field_type`
- `is_required`
- `is_active`
- `is_searchable`
- `is_printable`
- `is_exportable`
- `default_value_json` nullable
- `validation_json` nullable
- `options_json` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

### `custom_field_values`

Purpose:

- store field values per entity

Suggested fields:

- `id`
- `company_id`
- `definition_id`
- `entity_type`
- `entity_id`
- `value_json`
- `created_at`
- `updated_at`

Recommended unique constraint:

- one value per definition per entity

## Integration entities

### `outbound_webhook_endpoints`

Purpose:

- company-managed event delivery endpoints

Suggested fields:

- `id`
- `company_id`
- `name`
- `url`
- `secret_hash`
- `subscribed_events_json`
- `status`
- `last_success_at` nullable
- `last_failure_at` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

### `outbound_webhook_deliveries`

Purpose:

- delivery log and retry tracking

Suggested fields:

- `id`
- `company_id`
- `endpoint_id`
- `event_type`
- `event_key`
- `request_headers_json`
- `request_body_json`
- `response_status` nullable
- `response_body_excerpt` nullable
- `status`
- `attempt_count`
- `next_retry_at` nullable
- `created_at`
- `updated_at`

Suggested `status` values:

- `pending`
- `delivered`
- `retrying`
- `failed`

### `integration_api_keys`

Purpose:

- simple server-to-server authentication for supported partner use cases

Suggested fields:

- `id`
- `company_id`
- `name`
- `key_prefix`
- `secret_hash`
- `status`
- `last_used_at` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

---

## Suggested changes to existing tables and models

### `customers`

Suggested additions or import-only enrichments:

- `external_code` nullable
- `migration_source_ref` nullable

### `suppliers`

Suggested additions:

- `external_code` nullable
- `migration_source_ref` nullable

### `products`

Suggested additions:

- `external_code` nullable
- `migration_source_ref` nullable

### `ledgers`

Suggested additions:

- `external_code` nullable
- `migration_source_ref` nullable

### `invoices`, `purchases`, `sales_orders`, `payments`

Suggested additions:

- `migration_source_ref` nullable
- `source_channel` values may later include `import`

Implementation note:

- do not make imported records behave differently from normal records after creation
- metadata should exist mainly for traceability and dedupe

---

## API surface target

All routes should follow the current company-scoped API style:

- `/api/companies/:companyId/...`

## Migration projects

- `GET /api/companies/:companyId/migration-projects`
- `POST /api/companies/:companyId/migration-projects`
- `GET /api/companies/:companyId/migration-projects/:projectId`
- `PATCH /api/companies/:companyId/migration-projects/:projectId`

Recommended create body:

```json
{
  "name": "April 2026 go-live",
  "source_system": "Marg ERP9",
  "go_live_date": "2026-04-01",
  "notes": "Move current masters, stock, and open dues only"
}
```

## Template downloads and profiles

- `GET /api/companies/:companyId/imports/templates`
- `GET /api/companies/:companyId/imports/templates/:entityType/download`
- `GET /api/companies/:companyId/import-profiles`
- `POST /api/companies/:companyId/import-profiles`
- `PATCH /api/companies/:companyId/import-profiles/:profileId`

## Import jobs

- `POST /api/companies/:companyId/import-jobs/upload`
- `POST /api/companies/:companyId/import-jobs/:jobId/dry-run`
- `POST /api/companies/:companyId/import-jobs/:jobId/commit`
- `GET /api/companies/:companyId/import-jobs`
- `GET /api/companies/:companyId/import-jobs/:jobId`
- `GET /api/companies/:companyId/import-jobs/:jobId/rows?page=&limit=&status=`

Recommended upload body:

```json
{
  "entity_type": "customers",
  "source_format": "csv",
  "mode": "upsert_by_key",
  "migration_project_id": "mig_001",
  "import_profile_id": "prof_001"
}
```

Recommended dry-run response shape:

```json
{
  "job_id": "imp_001",
  "entity_type": "customers",
  "status": "dry_run_ready",
  "summary": {
    "total_rows": 240,
    "valid_rows": 228,
    "warning_rows": 7,
    "error_rows": 5,
    "would_create": 180,
    "would_update": 48
  },
  "top_errors": [
    {
      "code": "MISSING_NAME",
      "count": 3
    },
    {
      "code": "INVALID_GSTIN",
      "count": 2
    }
  ]
}
```

## Opening stock and balance imports

- `GET /api/companies/:companyId/imports/opening-stock/template`
- `GET /api/companies/:companyId/imports/opening-balances/template`
- `POST /api/companies/:companyId/imports/opening-stock/upload`
- `POST /api/companies/:companyId/imports/opening-balances/upload`

Recommended opening-stock row fields:

- product code or product id
- warehouse code
- quantity
- value or rate
- batch number optional
- expiry date optional

Recommended opening-balance row fields:

- ledger code or entity code
- party type
- bill reference optional
- opening amount
- due date optional
- posting style

## Open document imports

- `GET /api/companies/:companyId/imports/open-sales-invoices/template`
- `GET /api/companies/:companyId/imports/open-purchases/template`
- `POST /api/companies/:companyId/imports/open-sales-invoices/upload`
- `POST /api/companies/:companyId/imports/open-purchases/upload`

Recommended open-invoice import modes:

- `summary_opening_mode`
- `full_document_mode`

## Print templates

- `GET /api/companies/:companyId/print-templates?template_type=invoice`
- `POST /api/companies/:companyId/print-templates`
- `GET /api/companies/:companyId/print-templates/:templateId`
- `POST /api/companies/:companyId/print-templates/:templateId/versions`
- `POST /api/companies/:companyId/print-templates/:templateId/publish`
- `POST /api/companies/:companyId/print-templates/:templateId/set-default`
- `POST /api/companies/:companyId/print-templates/:templateId/preview`

Recommended preview body:

```json
{
  "document_type": "invoice",
  "document_id": "inv_001"
}
```

## Custom fields

- `GET /api/companies/:companyId/custom-fields?entity_type=customer`
- `POST /api/companies/:companyId/custom-fields`
- `PATCH /api/companies/:companyId/custom-fields/:fieldId`
- `GET /api/companies/:companyId/custom-fields/values?entity_type=customer&entity_id=cust_001`
- `POST /api/companies/:companyId/custom-fields/values`

Recommended create body:

```json
{
  "entity_type": "customer",
  "code": "route_license_no",
  "label": "Route license no",
  "field_type": "text",
  "is_required": false,
  "is_printable": true,
  "is_exportable": true
}
```

## Integration hooks

- `GET /api/companies/:companyId/integrations/webhooks`
- `POST /api/companies/:companyId/integrations/webhooks`
- `PATCH /api/companies/:companyId/integrations/webhooks/:endpointId`
- `POST /api/companies/:companyId/integrations/webhooks/:endpointId/test`
- `GET /api/companies/:companyId/integrations/webhooks/:endpointId/deliveries`
- `GET /api/companies/:companyId/integrations/api-keys`
- `POST /api/companies/:companyId/integrations/api-keys`
- `POST /api/companies/:companyId/integrations/api-keys/:keyId/revoke`

---

## Import entity definitions by capability

## 1. Customers

Recommended columns:

- external code
- name
- GSTIN optional
- mobile
- email
- billing address
- shipping address
- credit limit optional
- salesperson code optional
- route code optional when D12 exists
- beat code optional when D12 exists

Validation:

- name required
- GSTIN format if present
- duplicate detection by chosen match key

## 2. Suppliers

Recommended columns:

- external code
- name
- GSTIN optional
- mobile
- email
- address

## 3. Products

Recommended columns:

- external code
- SKU
- barcode optional
- name
- category
- HSN code
- unit
- GST percent
- purchase price optional
- selling price optional
- opening stock optional only in dedicated opening import mode

Validation:

- name required
- unit required
- tax rate valid

## 4. Ledgers

Recommended columns:

- code
- name
- group
- opening balance optional
- bill-wise flag optional

## 5. Opening stock

Recommended columns:

- product key
- warehouse key
- quantity
- rate or total value
- batch optional
- expiry optional

## 6. Opening outstanding

Recommended columns:

- party type
- party key
- bill reference
- bill date optional
- due date optional
- amount
- debit or credit style

## 7. Open sales invoices

Recommended columns:

- invoice number
- customer key
- issue date
- due date
- outstanding amount
- total amount
- salesperson key optional
- route key optional

## 8. Open purchase bills

Recommended columns:

- bill number
- supplier key
- bill date
- due date
- outstanding amount
- total amount

---

## Print-template system design

The print-template system should be layout-driven, not code-driven.

Recommended template model:

- page settings
- header blocks
- company and party sections
- line-item table
- totals section
- footer notes
- optional signature / QR blocks

Recommended supported template tokens:

- company identity fields
- party fields
- document header fields
- line item fields
- tax summary fields
- payment summary fields
- custom fields marked printable
- compliance fields from D11 when available

Recommended first-release editor style:

- structured block editor with limited drag or reorder capability
- field picker
- style options such as font size, alignment, visibility, and widths

Avoid in first release:

- unrestricted pixel-perfect desktop designer
- arbitrary formulas everywhere
- embedded script execution

Recommended render strategy:

- continue to support the existing PDF generation endpoint
- add a template-aware render layer under it
- preserve a safe system default template even if custom templates fail

---

## Custom-field system design

Recommended first-release surfaces:

- customer create and detail
- supplier create and detail
- product create and detail
- sales order create and detail
- invoice detail and print context

Recommended UI behavior:

- show custom field section below core fields
- preserve consistent ordering by admin-defined sequence
- allow filter visibility later for searchable fields

Recommended data-behavior limits:

- no custom field should directly drive stock posting or tax calculation in first release
- custom fields may be used in print, exports, and webhooks
- later commercial-rule linkage can be considered after core data model proves stable

---

## Integration and webhook design

Recommended first-release event payload shape:

```json
{
  "id": "evt_001",
  "type": "invoice.issued",
  "company_id": "cmp_001",
  "occurred_at": "2026-03-26T10:00:00.000Z",
  "data": {
    "invoice_id": "inv_001",
    "invoice_number": "INV-00124",
    "customer_id": "cust_001",
    "total": 12500
  }
}
```

Recommended delivery behavior:

- sign with HMAC
- include event id and delivery timestamp headers
- retry on transient failures
- prevent duplicate delivery confusion with stable event ids

Recommended first-release integration scope:

- outbound only
- admin-managed endpoint list
- delivery log with retry

Possible later additions:

- inbound API for partner pushes
- scheduled export feeds
- connector-specific adapters

---

## Frontend routes and screens

Recommended route additions:

- `/c/[companyId]/settings/migration`
- `/c/[companyId]/settings/migration/projects/[projectId]`
- `/c/[companyId]/settings/migration/imports/[jobId]`
- `/c/[companyId]/settings/print-templates`
- `/c/[companyId]/settings/print-templates/[templateId]`
- `/c/[companyId]/settings/custom-fields`
- `/c/[companyId]/settings/integrations`
- `/c/[companyId]/settings/integrations/webhooks`

Recommended screen set:

### Migration workspace

Should show:

- migration projects
- checklist by category
- latest job statuses
- unresolved errors
- go-live readiness signals

### Import job detail

Should show:

- uploaded file metadata
- mapping summary
- dry-run result
- row errors
- commit button when ready
- created and updated counts

### Print-template editor

Should show:

- template type selector
- draft vs published state
- preview panel
- block list and field picker
- publish and default actions

### Custom-field settings

Should show:

- entity selector
- field definitions table
- type, required, printable, exportable flags
- create and disable actions

### Webhook settings

Should show:

- endpoint list
- subscribed event chips
- last delivery result
- test-send action
- delivery log drill-down

---

## Reports and operator visibility

The system should support at least the following operational reports.

## 1. Import activity

Metrics:

- jobs by status
- rows processed
- validation failure categories
- time to complete migration step

## 2. Migration readiness

Metrics:

- masters imported
- opening balances imported
- print template configured
- unresolved blocking issues

## 3. Print-template usage

Metrics:

- templates by type
- default-template changes
- preview and publish activity

## 4. Integration delivery log

Metrics:

- deliveries attempted
- success rate
- retry queue
- failed endpoints

---

## Permissions model

Recommended new permissions:

- `migration.projects.manage`
- `imports.manage`
- `imports.commit`
- `opening_balances.manage`
- `print_templates.manage`
- `custom_fields.manage`
- `integrations.webhooks.manage`
- `integrations.api_keys.manage`
- `integrations.delivery_logs.view`

Recommended role mapping:

- owner/admin:
  - full permissions
- accountant or implementation lead:
  - migration and import permissions
  - no webhook or API key permissions unless explicitly granted
- sales or operations manager:
  - usually read-only access to migration status
- support or internal admin:
  - super-admin or support access through admin tools later if needed

---

## Validation and testing plan

## Unit tests

Add coverage for:

- column mapping resolution
- match-key dedupe behavior
- dry-run summary generation
- opening-balance normalization
- print-template schema validation
- custom-field type validation
- webhook signing and retry decision logic

## Integration tests

Add API coverage for:

- create migration project
- upload import and run dry-run
- commit valid rows
- import opening balances idempotently
- create and publish print template
- create custom field and save field value
- create webhook endpoint and record delivery attempt

## Browser tests

Add Playwright coverage for:

- create migration project
- run customer import dry-run and review errors
- commit valid import rows
- preview and publish invoice print template
- add custom field to customer and verify it appears
- create webhook endpoint and send test delivery

## Seed scenarios

Create demo data for:

- one migration project from Marg
- one from manual spreadsheet onboarding
- mixed import files with valid, warning, and error rows
- one custom invoice template
- two custom fields on customer and product
- one webhook endpoint with both success and retry examples

---

## Rollout and migration strategy

## 1. Build order

Recommended implementation order:

1. migration projects and import engine
2. customers, suppliers, products, warehouses, and ledgers
3. opening stock and opening balances
4. open documents
5. print templates
6. custom fields
7. webhooks and API keys

## 2. Cutover strategy

Recommended customer onboarding motion:

1. import masters
2. validate counts and duplicates
3. import opening stock
4. import opening dues and balances
5. import active open documents if needed
6. configure print templates
7. smoke-test invoice, purchase, payment, reports, and print
8. go live

## 3. Staging requirement

Because the current product still needs strong staging validation:

- D13 spec and implementation can proceed now
- but production onboarding promises should wait until the import engine is proven against staging data and at least one seeded full migration pass

## 4. Data-protection requirement

Recommended first-release policy:

- store uploaded source files securely
- retain import-row audit trail
- allow project-level archive or cleanup policy
- avoid irreversible destructive merge operations

---

## Risks and failure modes

## 1. Overpromising migration breadth

Risk:

- users may expect full legacy-system parity on day one

Mitigation:

- clearly separate:
  - master import
  - opening import
  - open document import
  - historical archive import

## 2. Dirty source data

Risk:

- duplicates, malformed GSTINs, inconsistent units, and unmatched products may break imports

Mitigation:

- make dry-run, row-level errors, and saved mapping profiles first-class

## 3. Print-template complexity explosion

Risk:

- a fully free-form designer can become a product within the product

Mitigation:

- use a bounded block-based system in first release

## 4. Custom-field sprawl

Risk:

- uncontrolled custom fields can damage reporting consistency

Mitigation:

- typed definitions
- entity limits
- admin-only creation

## 5. Import idempotency mistakes

Risk:

- rerunning imports may double-create stock, balances, or documents

Mitigation:

- store source references
- define match keys clearly
- audit every committed row

## 6. Integration support burden

Risk:

- inbound and outbound integration requests can multiply quickly

Mitigation:

- keep first release outbound-focused with stable event shapes and delivery logs

---

## Acceptance criteria

D13 is complete for first release when:

- a company can create a migration project
- downloadable import templates exist for key entities
- import jobs support upload, dry-run, row-error review, and commit
- customers, suppliers, products, ledgers, warehouses, opening stock, and opening balances can be imported with audit trail
- open invoices and open purchase bills can be migrated in at least one supported mode
- a company can create, preview, publish, and set a default invoice print template
- a company can create controlled custom fields and store values on supported entities
- a company can configure outbound webhooks and review delivery logs
- API and browser tests cover the critical migration and customization flows

---

## Recommended implementation order inside D13

1. migration project and import-job backbone
2. customer, supplier, and product import
3. warehouse and ledger import
4. opening stock and opening outstanding
5. open invoice and purchase import
6. print-template versioning and preview
7. custom-field definitions and values
8. outbound webhooks and API keys

---

## Definition of done

Migration and customization are considered production-credible when:

- a real business can move its core operational data into the product without manual re-entry
- opening stock and dues can be established safely and traceably
- common print-format demands can be handled through settings
- modest business-specific data needs can be handled through controlled custom fields
- external systems can receive stable outbound events without one-off engineering every time
