# D1 Quotations Implementation Specification

**Date**: 2026-03-25  
**Purpose**: Define the implementation-ready scope for distributor V2 Phase D1.
**Implementation status**: Completed on 2026-03-25

Source:

- [V2_DISTRIBUTOR_EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/V2_DISTRIBUTOR_EXECUTION_MASTER_PLAN.md)
- [V2_DISTRIBUTOR_USER_STORIES.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_USER_STORIES.md)
- [V2_DISTRIBUTOR_SCHEMA_CHANGE_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_SCHEMA_CHANGE_SPEC.md)
- [V2_DISTRIBUTOR_USER_FLOW_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_USER_FLOW_SPEC.md)

---

## D1 goal

Add a quotation / estimate workflow that lets users:

- create quotations before invoicing
- track quotation status
- convert quotations into invoices
- preserve pricing, tax, and customer context during conversion

D1 should create a commercially credible pre-invoice workflow without yet introducing sales orders.

---

## Scope

Included:

- quotation entity
- quotation item entity
- quotation numbering
- quotation list page
- quotation detail page
- quotation create / edit page
- status changes
- quotation to invoice conversion
- quotation PDF / print support if it can reuse the current document pipeline cleanly

Not included in D1:

- quotation to sales order conversion
- salesperson assignment
- warehouse awareness
- approval workflow
- public customer acceptance portal

Implemented result:

- quotation entity and item storage shipped
- quotation numbering shipped with `QTN-{n}` pattern
- quotation list, create, and detail routes shipped
- status transitions shipped: `send`, `approve`, `expire`, `cancel`
- quotation to invoice draft conversion shipped
- source traceability shipped via `invoices.quotation_id`
- backend workflow e2e coverage shipped
- quotation PDF / print intentionally deferred

---

## Business rules

## Quotation statuses

Canonical statuses:

- `draft`
- `sent`
- `approved`
- `expired`
- `converted`
- `canceled`

## Editable states

Allowed:

- `draft`
- `sent`

Not allowed:

- `approved`
- `expired`
- `converted`
- `canceled`

## Conversion rules

Allowed conversion:

- quotation → invoice

Conversion behavior:

- customer is copied
- items are copied
- product references are preserved
- tax rates and computed amounts are copied as document values
- quotation status becomes `converted`
- converted invoice stores `quotation_id`

## Validity rules

- `valid_until` is optional but recommended
- if current date is beyond `valid_until`, quotation may be marked `expired`
- auto-expiry job is not required in D1; manual or read-time status handling is acceptable

---

## Data model

## New tables

### `quotations`

Suggested fields:

- `id`
- `company_id`
- `customer_id`
- `quote_number`
- `status`
- `quote_date`
- `valid_until`
- `sub_total`
- `tax_total`
- `discount_total`
- `grand_total`
- `notes`
- `terms_and_conditions` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

Indexes:

- `(company_id, quote_number)` unique
- `(company_id, status, quote_date)`
- `(company_id, customer_id, quote_date)`

### `quotation_items`

Suggested fields:

- `id`
- `quotation_id`
- `product_id`
- `description`
- `hsn_code`
- `quantity`
- `unit_price`
- `discount_amount`
- `tax_rate`
- `taxable_value`
- `cgst_amount`
- `sgst_amount`
- `igst_amount`
- `cess_amount`
- `line_total`

## Existing tables to extend

### `invoices`

Add:

- `quotation_id` nullable

Purpose:

- preserve source traceability from quote to invoice

---

## API contract

Tenant-scoped endpoints:

### List quotations

- `GET /api/companies/:cid/quotations?page=&limit=&q=&status=&customer_id=&from=&to=`

Response:

- paginated list

### Create quotation

- `POST /api/companies/:cid/quotations`

Body:

- customer id
- quote date
- valid until
- notes
- item list

### Get quotation detail

- `GET /api/companies/:cid/quotations/:quotationId`

### Update quotation

- `PATCH /api/companies/:cid/quotations/:quotationId`

Allowed only for editable statuses.

### Status actions

- `POST /api/companies/:cid/quotations/:quotationId/send`
- `POST /api/companies/:cid/quotations/:quotationId/approve`
- `POST /api/companies/:cid/quotations/:quotationId/expire`
- `POST /api/companies/:cid/quotations/:quotationId/cancel`

### Convert quotation to invoice

- `POST /api/companies/:cid/quotations/:quotationId/convert-to-invoice`

Body:

- invoice date
- due date optional
- notes override optional

Response:

- created invoice payload

### Quotation PDF

Optional in D1 if low-cost to support:

- `GET /api/companies/:cid/quotations/:quotationId/pdf`
- `POST /api/companies/:cid/quotations/:quotationId/pdf/regenerate`

---

## Frontend route map

Recommended routes:

- `/c/[companyId]/sales/quotations`
- `/c/[companyId]/sales/quotations/new`
- `/c/[companyId]/sales/quotations/[quotationId]`

Recommended UI actions:

- create quotation
- edit quotation
- send quotation
- approve quotation
- expire quotation
- cancel quotation
- convert to invoice
- print / PDF

Recommended navigation placement:

- under `Sales`
- near `Invoices`

---

## Permission model

Recommended permissions:

- `sales.quotations.view`
- `sales.quotations.create`
- `sales.quotations.update`
- `sales.quotations.convert`

Mapping guidance:

- owner/admin: all
- billing operator: all except maybe cancel depending on policy
- salesperson: create/view/update for assigned or visible records if that model comes later

D1 does not require a new RBAC architecture, only new permission keys.

---

## Service design

Recommended backend modules:

- `quotations` module in API
- `quotations.service.ts`
- `quotations.controller.ts`
- DTOs for create, update, and conversion

Recommended reuse:

- tax calculation logic from invoice flow
- customer/product validation patterns from invoice creation
- PDF pipeline only if abstraction reuse is low-friction

---

## Reporting and analytics impact

Not required in D1:

- quotation analytics dashboard
- conversion funnel reports

Minimum D1 reporting:

- quotation count by status via list filters
- source traceability from quotation to invoice detail

---

## UX principles for D1

- quotation pages should visually sit between invoice and sales-order complexity
- list page should follow the existing authenticated list archetype
- detail page should follow the existing detail/lifecycle archetype
- conversion action must be obvious and guarded against duplicate conversion

---

## Validation rules

Required:

- customer must exist
- at least one item
- quantity must be positive
- unit price must be non-negative
- product must belong to company when referenced

Business validations:

- converted quotations cannot be converted twice
- canceled quotations cannot be converted
- expired quotations cannot be edited unless explicitly reopened, which is out of scope for D1

---

## Testing requirements

API:

- create quotation
- update quotation in editable states
- reject update in locked states
- convert quotation to invoice
- reject duplicate conversion
- list / filter by status

Web:

- create quotation
- open quotation detail
- convert to invoice
- invoice detail reflects quotation source

Manual QA:

- quote number generation
- pricing/tax carry-over
- status changes
- converted invoice correctness

---

## D1 done definition

D1 is complete when:

- quotations can be created and listed
- quotations have usable detail pages
- quotation status flow is implemented
- quotation converts cleanly into invoice
- invoice stores source quotation reference
- API and web validation pass for the D1 flow

---

## Immediate next implementation step

After this spec, the next technical step should be:

1. draft Prisma schema and migration plan for `quotations` and `quotation_items`
2. implement API module and conversion service
3. build web routes and hooks
4. add D1 integration coverage
