# D7 Pricing and Scheme Engine Specification

**Date**: 2026-03-26  
**Purpose**: Define the implementation-ready scope for distributor pricing control, party special rates, discount governance, and scheme automation.  
**Implementation status**: Implemented at code/build level; live staging validation and dedicated browser/integration coverage are still pending

Source:

- [MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md)
- [MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)
- [DOMAIN_MODEL.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/DOMAIN_MODEL.md)
- [API_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/API_SPEC.md)

Marg feature reference used for product-definition input:

- [Marg comparison chart](https://download.margcompusoft.com/pdf/comparison-chart-margERP9.pdf)
- [Marg general discount guide](https://care.margcompusoft.com/margerp/rate-and-discount-master/175297/utils/messages)
- [Marg area-wise price list guide](https://care.margcompusoft.com/margerp/rate-and-discount-master/3823/1/how-to-set-area-wise-item-price-list-in-marg-software)
- [Marg party-wise special discount guide](https://care.margcompusoft.com/margerp/rate-and-discount-master/38821/1/How-to-set-item-party)
- [Marg maximum discount guide](https://care.margcompusoft.com/margerp/rate-and-discount-master/37816/1/messages)
- [Marg eOrder page](https://margcompusoft.com/eorder_salesman_order_app.html)

---

## D7 goal

Add a distributor-grade pricing and scheme engine that lets the product:

- resolve the correct selling rate automatically for a customer and item
- apply party-wise, group-wise, route-wise, and time-bound commercial rules
- support scheme-driven selling instead of manual rate editing
- enforce operator discount controls
- capture an auditable pricing decision for quotations, sales orders, and invoices

D7 should remove the current dependence on manual line discounts and make the product commercially credible against distributor software in live demos.

---

## Why D7 matters

For many distributors, the product is judged less by generic invoicing and more by whether it can handle:

- party special rates
- area or channel pricing
- scheme-based sales
- max discount control
- rate auto-pick during billing
- traceability of why a price was used

Without D7, the product remains operationally useful but commercially weak for serious distribution selling.

---

## Scope

Included in D7:

- customer and customer-group commercial classification
- price lists
- party special rates
- route / beat / territory-aware pricing hooks
- discount ceilings and margin guardrails
- automatic rate resolution engine
- automatic scheme evaluation engine
- quotation, sales-order, and invoice pricing preview
- pricing decision snapshot on business documents
- commercial override audit trail
- commercial reports for scheme and discount usage

Included scheme patterns in D7:

- fixed price
- fixed amount off
- percentage discount
- slab discount by quantity
- slab discount by amount
- free quantity
- product-specific promotion
- customer-segment promotion
- date-bound promotion

Not included in D7:

- supplier rebate claims settlement
- trade claim accounting against principals
- AI-driven dynamic pricing
- demand forecasting
- secondary sales scheme settlement with retailer proof
- gamified sales-target campaigns
- fully mobile-first field-sales UX

Planned result after D7:

- operators can stop maintaining many commercial exceptions outside the system
- quote/order/invoice screens auto-resolve commercial values from saved rules
- every manual commercial deviation is visible and auditable

---

## Business outcomes

After D7, the system should let a business:

- give one customer a special item price
- give one customer group a standard discount
- give one route or territory a local rate list
- run a date-bound scheme for selected products
- stop operators from exceeding allowed discount or margin loss
- preserve the exact commercial snapshot used on a quotation, order, or invoice
- report scheme usage and discount leakage later

---

## Design principles

1. Pricing must be deterministic.
   The same input should always produce the same base rate and scheme output.

2. Historical documents must not mutate.
   Once a quotation, order, or invoice line stores a commercial snapshot, later master changes must not alter that document.

3. Base-rate resolution and scheme resolution are separate.
   First determine the base rate.
   Then apply eligible schemes and discount policies.

4. Override must be explicit.
   If an operator changes the resolved commercial outcome, that must be stored with actor, reason, and before/after values.

5. Simplicity first.
   D7 should cover the most common trade patterns cleanly before attempting every exotic combination.

6. Rules must be explainable in the UI.
   Operators should see why the selected rate was applied.

---

## Terms and concepts

### Base rate

The starting unit selling price before scheme rewards or manual overrides.

### Commercial context

The full set of inputs that affect pricing for a line:

- company
- customer
- customer group
- route / beat / territory
- product
- product category / brand
- document type
- document date
- quantity
- operator role

### Pricing resolution

The process of selecting the winning base rate based on rule precedence.

### Scheme resolution

The process of evaluating eligible promotions and applying allowed reward outcomes.

### Guardrail

A configurable rule that prevents or warns against commercial outcomes such as:

- discount above allowed threshold
- margin below minimum threshold
- scheme stacking not allowed

### Commercial snapshot

The stored record of:

- source rule used
- resolved base rate
- applied schemes
- final line price
- override details

---

## D7 feature set

## 1. Customer commercial classification

The system should support:

- customer group
- customer channel
- route
- beat
- territory
- pricing tier
- discount eligibility flag
- credit class

This enables rules like:

- all stockists in Route A get one list
- modern trade customers get another list
- selected VIP customers get special party rates

## 2. Price lists

The system should support reusable price lists that can target:

- all customers
- customer group
- customer channel
- route
- beat
- territory
- one specific customer

Each price list can hold:

- fixed item rate
- fixed rate by pack if pack support exists later
- effective date range
- priority
- active / inactive state

## 3. Party special rates

The system should support customer-specific item pricing overrides.

Typical cases:

- party-specific rate
- party-specific percent discount
- party-specific fixed discount amount
- customer-specific blocked item or no-discount behavior if needed later

## 4. Discount policies

The system should support:

- max line discount %
- max document discount %
- min margin %
- allowed override roles
- warn-only vs block behavior

## 5. Scheme engine

The system should support:

- item-level scheme
- document-level scheme
- quantity slab scheme
- amount slab scheme
- free quantity scheme
- discount scheme
- date-bound promotion
- customer-segment scheme
- product-category scheme

## 6. Commercial preview and explanation

The system should show:

- resolved rate
- source of rate
- eligible scheme list
- applied scheme result
- override warning or block

## 7. Commercial auditability

The system should store:

- rule source
- user override
- reason
- timestamp

## 8. Commercial reporting

The system should report:

- discount usage
- scheme usage
- override frequency
- margin-at-risk
- price list coverage

---

## Phase breakdown inside D7

### D7.1 Price lists and party special rates

Deliver:

- customer classification
- price lists
- party special rates
- base-rate resolver
- pricing preview on quotation, order, and invoice forms

### D7.2 Discount guardrails and commercial audit

Deliver:

- max discount policy
- min margin policy
- override reason capture
- commercial audit log

### D7.3 Scheme engine

Deliver:

- quantity and amount slab schemes
- free quantity schemes
- date-bound promotions
- customer-segment and product-targeted schemes

### D7.4 Reporting and operator tooling

Deliver:

- scheme usage reports
- discount leakage reports
- override audit explorer
- price-list and commercial rule management polish

---

## Business rules

## 1. Base-rate precedence

When the system resolves the base unit rate for a document line, it should use this precedence from highest to lowest:

1. manual locked rate from source document, if preserving source commercial commitment
2. customer-item special fixed rate
3. customer-item special discount rule applied on product default rate
4. customer price list rule
5. customer-group / customer-channel price list rule
6. route / beat / territory price list rule
7. global active price list rule
8. product selling price default

If two active rules exist at the same precedence level:

- higher `priority` wins
- if priority matches, the more specific rule wins
- if specificity matches, the newest active rule wins

## 2. Source-document pricing preservation

### Quotation -> Sales order

Default behavior:

- preserve quotation-resolved pricing and scheme snapshot

Optional future behavior:

- allow reprice on conversion with explicit user choice

### Sales order -> Invoice

Default behavior:

- preserve order pricing for fulfilled quantity

Allowed exception:

- if policy says "reprice on invoice date", operator must see a warning and the system must store both old and new commercial context

## 3. Scheme evaluation order

After resolving the base rate:

1. gather all eligible schemes for the document context
2. discard inactive, expired, or inapplicable schemes
3. split schemes into:
   - exclusive schemes
   - stackable schemes
4. if an exclusive scheme is eligible, pick the highest-priority exclusive scheme
5. if no exclusive scheme wins, apply stackable schemes in configured evaluation order
6. run discount and margin guardrails after scheme application

## 4. Free quantity handling

For free-quantity schemes:

- billed quantity and free quantity must be stored separately
- stock should reduce for total delivered quantity
- revenue should only apply to billed quantity
- scheme attribution should explain the free quantity source

Recommended line model:

- `billed_quantity`
- `free_quantity`
- `total_quantity`

Where current document-line models cannot support this immediately, D7.3 may store free quantity in a commercial-snapshot payload first and schedule a later document-line normalization patch.

## 5. Discount guardrail behavior

If a line breaches commercial policy:

- `warn` policy:
  - allow save
  - show visible warning
  - require reason if override is manual

- `block` policy:
  - prevent save or issue action
  - require either:
    - a lower discount
    - a different eligible rate
    - or an approval flow in a later slice

## 6. Margin guardrail behavior

Margin should be evaluated against:

- cost price
- or a future weighted/latest cost if costing improves later

Margin guardrail should support:

- warn if margin < threshold
- block if margin < threshold

## 7. Retroactive safety

Changes to:

- price lists
- party special rates
- schemes
- discount policies

must not retroactively alter:

- saved quotations
- saved sales orders
- saved invoices

## 8. Deactivation rules

Inactive commercial rules:

- must not apply to new documents
- should remain visible in historical audit view

## 9. Date rules

Commercial rules should evaluate using the document date, not only current timestamp.

That allows:

- backdated entry
- future-dated quotation or order
- end-of-month scheme closing logic

## 10. Multi-company isolation

All price, scheme, and policy records must remain company-scoped.

---

## Data model

This section defines the recommended schema additions. It is a product-definition spec, not the final migration script.

## 1. `customer_groups`

Purpose:

- reusable commercial segmentation

Suggested fields:

- `id`
- `company_id`
- `name`
- `code`
- `description` nullable
- `created_at`
- `updated_at`

## 2. `customer_channels`

Purpose:

- separate route/channel-style commercial segmentation from groups

Suggested fields:

- `id`
- `company_id`
- `name`
- `code`
- `description` nullable
- `created_at`
- `updated_at`

## 3. Customer extensions

Suggested additions to `customers`:

- `customer_group_id` nullable
- `customer_channel_id` nullable
- `route_id` nullable
- `beat_id` nullable
- `territory_id` nullable
- `pricing_tier` nullable
- `payment_terms_days` nullable
- `discount_eligible` boolean default true

## 4. `routes`

Purpose:

- commercial and operating geography hook for pricing and later field-sales flows

Suggested fields:

- `id`
- `company_id`
- `name`
- `code`
- `territory_id` nullable
- `created_at`
- `updated_at`

## 5. `beats`

Purpose:

- sub-route segmentation

Suggested fields:

- `id`
- `company_id`
- `route_id`
- `name`
- `code`
- `created_at`
- `updated_at`

## 6. `territories`

Purpose:

- broader sales area grouping

Suggested fields:

- `id`
- `company_id`
- `name`
- `code`
- `created_at`
- `updated_at`

## 7. `price_lists`

Purpose:

- reusable base-rate definition sets

Suggested fields:

- `id`
- `company_id`
- `name`
- `code`
- `status`
- `scope_type`
- `scope_id` nullable
- `effective_from`
- `effective_to` nullable
- `priority` integer default 100
- `notes` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

Suggested `scope_type` values:

- `global`
- `customer`
- `customer_group`
- `customer_channel`
- `route`
- `beat`
- `territory`

Suggested `status` values:

- `draft`
- `active`
- `inactive`

## 8. `price_list_items`

Purpose:

- item-level rate rules under a price list

Suggested fields:

- `id`
- `price_list_id`
- `product_id`
- `min_quantity` nullable
- `max_quantity` nullable
- `base_rate`
- `rate_type`
- `discount_percent` nullable
- `discount_amount` nullable
- `notes` nullable
- `created_at`
- `updated_at`

Suggested `rate_type` values:

- `fixed_rate`
- `discount_percent`
- `discount_amount`

## 9. `party_special_rates`

Purpose:

- customer-specific commercial override without forcing a full dedicated price list

Suggested fields:

- `id`
- `company_id`
- `customer_id`
- `product_id`
- `rate_type`
- `fixed_rate` nullable
- `discount_percent` nullable
- `discount_amount` nullable
- `effective_from`
- `effective_to` nullable
- `priority` integer default 10
- `notes` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

## 10. `discount_policies`

Purpose:

- guardrails for operator-entered or rule-driven discount outcomes

Suggested fields:

- `id`
- `company_id`
- `name`
- `scope_type`
- `scope_id` nullable
- `applies_to_document_type`
- `max_line_discount_percent` nullable
- `max_document_discount_percent` nullable
- `min_margin_percent` nullable
- `mode`
- `allowed_override_role_codes` jsonb nullable
- `created_at`
- `updated_at`

Suggested `scope_type` values:

- `global`
- `customer`
- `customer_group`
- `customer_channel`
- `route`
- `territory`
- `product`
- `category`

Suggested `applies_to_document_type` values:

- `quotation`
- `sales_order`
- `invoice`
- `all`

Suggested `mode` values:

- `warn`
- `block`

## 11. `commercial_schemes`

Purpose:

- named trade promotions

Suggested fields:

- `id`
- `company_id`
- `name`
- `code`
- `status`
- `scheme_type`
- `stack_mode`
- `priority`
- `effective_from`
- `effective_to` nullable
- `description` nullable
- `notes` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

Suggested `status` values:

- `draft`
- `active`
- `inactive`

Suggested `scheme_type` values:

- `item_discount_percent`
- `item_discount_amount`
- `document_discount_percent`
- `document_discount_amount`
- `quantity_slab_discount`
- `amount_slab_discount`
- `free_quantity`

Suggested `stack_mode` values:

- `exclusive`
- `stackable`

## 12. `commercial_scheme_targets`

Purpose:

- define who and what a scheme applies to

Suggested fields:

- `id`
- `scheme_id`
- `target_type`
- `target_id`
- `created_at`

Suggested `target_type` values:

- `customer`
- `customer_group`
- `customer_channel`
- `route`
- `territory`
- `product`
- `category`

## 13. `commercial_scheme_rules`

Purpose:

- store qualifying thresholds and reward outcomes

Suggested fields:

- `id`
- `scheme_id`
- `min_quantity` nullable
- `max_quantity` nullable
- `min_amount` nullable
- `max_amount` nullable
- `reward_discount_percent` nullable
- `reward_discount_amount` nullable
- `reward_fixed_rate` nullable
- `reward_free_quantity` nullable
- `reward_product_id` nullable
- `created_at`
- `updated_at`

## 14. `commercial_override_logs`

Purpose:

- audit commercial deviations

Suggested fields:

- `id`
- `company_id`
- `document_type`
- `document_id`
- `document_line_id` nullable
- `actor_user_id`
- `override_type`
- `reason`
- `before_snapshot` jsonb
- `after_snapshot` jsonb
- `created_at`

## 15. Commercial snapshot storage on document lines

Recommended additions on:

- `quotation_items`
- `sales_order_items`
- `invoice_items`

Suggested fields:

- `base_rate_source_type` nullable
- `base_rate_source_id` nullable
- `resolved_base_rate` nullable
- `applied_scheme_summary` jsonb nullable
- `commercial_snapshot` jsonb nullable

If schema minimization is preferred for the first pass, only `commercial_snapshot` may be added initially, with normalized fields introduced later.

---

## API contract

All endpoints are company-scoped.

## Customer commercial segmentation

### List customer groups

- `GET /api/companies/:cid/customer-groups?page=&limit=&q=`

### Create customer group

- `POST /api/companies/:cid/customer-groups`

### Update customer group

- `PATCH /api/companies/:cid/customer-groups/:groupId`

### List customer channels

- `GET /api/companies/:cid/customer-channels?page=&limit=&q=`

### Create customer channel

- `POST /api/companies/:cid/customer-channels`

### Update customer channel

- `PATCH /api/companies/:cid/customer-channels/:channelId`

### Routes / beats / territories

- `GET /api/companies/:cid/routes`
- `POST /api/companies/:cid/routes`
- `PATCH /api/companies/:cid/routes/:routeId`
- `GET /api/companies/:cid/beats`
- `POST /api/companies/:cid/beats`
- `PATCH /api/companies/:cid/beats/:beatId`
- `GET /api/companies/:cid/territories`
- `POST /api/companies/:cid/territories`
- `PATCH /api/companies/:cid/territories/:territoryId`

### Customer update extension

- `PATCH /api/companies/:cid/customers/:customerId`

Extended body fields:

- `customer_group_id?`
- `customer_channel_id?`
- `route_id?`
- `beat_id?`
- `territory_id?`
- `pricing_tier?`
- `payment_terms_days?`
- `discount_eligible?`

## Price lists

### List price lists

- `GET /api/companies/:cid/price-lists?page=&limit=&q=&status=&scope_type=&scope_id=`

### Create price list

- `POST /api/companies/:cid/price-lists`

Body:

- `name`
- `code`
- `scope_type`
- `scope_id?`
- `effective_from`
- `effective_to?`
- `priority?`
- `notes?`

### Update price list

- `PATCH /api/companies/:cid/price-lists/:priceListId`

### Activate / deactivate price list

- `POST /api/companies/:cid/price-lists/:priceListId/activate`
- `POST /api/companies/:cid/price-lists/:priceListId/deactivate`

### List price list items

- `GET /api/companies/:cid/price-lists/:priceListId/items?page=&limit=&q=`

### Bulk upsert price list items

- `POST /api/companies/:cid/price-lists/:priceListId/items:bulk-upsert`

Body:

- array of `product_id`, `min_quantity?`, `max_quantity?`, `rate_type`, `base_rate?`, `discount_percent?`, `discount_amount?`

### Delete one price list item

- `DELETE /api/companies/:cid/price-lists/:priceListId/items/:itemId`

## Party special rates

### List party special rates

- `GET /api/companies/:cid/customers/:customerId/party-special-rates?page=&limit=&q=`

### Create party special rate

- `POST /api/companies/:cid/customers/:customerId/party-special-rates`

### Update party special rate

- `PATCH /api/companies/:cid/customers/:customerId/party-special-rates/:rateId`

### Delete party special rate

- `DELETE /api/companies/:cid/customers/:customerId/party-special-rates/:rateId`

## Discount policies

### List discount policies

- `GET /api/companies/:cid/discount-policies?page=&limit=&scope_type=&scope_id=&document_type=`

### Create discount policy

- `POST /api/companies/:cid/discount-policies`

### Update discount policy

- `PATCH /api/companies/:cid/discount-policies/:policyId`

## Schemes

### List schemes

- `GET /api/companies/:cid/commercial-schemes?page=&limit=&q=&status=&scheme_type=`

### Create scheme

- `POST /api/companies/:cid/commercial-schemes`

### Update scheme

- `PATCH /api/companies/:cid/commercial-schemes/:schemeId`

### Activate / deactivate scheme

- `POST /api/companies/:cid/commercial-schemes/:schemeId/activate`
- `POST /api/companies/:cid/commercial-schemes/:schemeId/deactivate`

### Manage scheme targets

- `POST /api/companies/:cid/commercial-schemes/:schemeId/targets:bulk-upsert`

### Manage scheme rules

- `POST /api/companies/:cid/commercial-schemes/:schemeId/rules:bulk-upsert`

## Pricing preview / resolution

### Resolve commercial preview

- `POST /api/companies/:cid/commercial/preview`

Purpose:

- dry-run the full commercial decision without saving a document

Body:

- `document_type`: `quotation | sales_order | invoice`
- `document_date`
- `customer_id`
- `route_id?`
- `beat_id?`
- `territory_id?`
- `items`: array of:
  - `product_id`
  - `quantity`
  - `unit_price_override?`
  - `requested_discount_percent?`
  - `requested_discount_amount?`

Response:

- resolved line-by-line commercial result
- warnings
- blocks
- scheme breakdown
- final totals

### Resolve one line

- `POST /api/companies/:cid/commercial/resolve-line`

Purpose:

- power item-row pricing updates in the frontend

## Commercial audit

### View override log

- `GET /api/companies/:cid/commercial/override-logs?page=&limit=&from=&to=&actor_user_id=&document_type=`

---

## Preview response shape

Suggested response shape:

```json
{
  "data": {
    "document_type": "invoice",
    "document_date": "2026-03-26",
    "customer_id": "uuid",
    "lines": [
      {
        "product_id": "uuid",
        "quantity": "10",
        "base_rate_source": {
          "type": "party_special_rate",
          "id": "uuid",
          "label": "Customer special fixed rate"
        },
        "resolved_base_rate": "120.00",
        "eligible_schemes": [
          {
            "scheme_id": "uuid",
            "name": "Summer stock push",
            "type": "quantity_slab_discount",
            "applied": true,
            "effect": {
              "discount_percent": "3.00"
            }
          }
        ],
        "final_unit_rate": "116.40",
        "line_discount_total": "36.00",
        "free_quantity": "0",
        "warnings": [],
        "blocks": [],
        "commercial_snapshot": {
          "base_rate_source_type": "party_special_rate",
          "resolved_base_rate": "120.00",
          "applied_scheme_ids": ["uuid"]
        }
      }
    ],
    "warnings": [],
    "blocks": []
  }
}
```

---

## Frontend routes and screens

Recommended route additions:

- `/c/[companyId]/settings/commercial`
- `/c/[companyId]/settings/commercial/price-lists`
- `/c/[companyId]/settings/commercial/price-lists/[priceListId]`
- `/c/[companyId]/settings/commercial/schemes`
- `/c/[companyId]/settings/commercial/schemes/[schemeId]`
- `/c/[companyId]/settings/commercial/discount-policies`
- `/c/[companyId]/reports/commercial/discounts`
- `/c/[companyId]/reports/commercial/schemes`
- `/c/[companyId]/reports/commercial/overrides`

Current-route extensions:

- `/c/[companyId]/masters/customers/[customerId]`
- `/c/[companyId]/sales/quotations/new`
- `/c/[companyId]/sales/orders/new`
- `/c/[companyId]/sales/invoices/new`
- quotation, order, and invoice detail screens

## Screen requirements

### 1. Commercial settings landing page

Show:

- active price lists
- active schemes
- active discount policies
- quick metrics
- last changed commercial rules

### 2. Price list workspace

Needs:

- create and edit price list
- choose scope
- bulk add products
- search/filter products
- set fixed or discount-based rule
- activate/deactivate list

### 3. Party special rate workspace

Needs:

- customer-specific commercial tab
- searchable product grid
- rate, discount %, discount amount edit
- effective date controls

### 4. Scheme workspace

Needs:

- scheme header
- target definition
- rule and reward grid
- stack mode
- validity period
- active/inactive control

### 5. Discount policy workspace

Needs:

- define policy scope
- choose document types
- set max discount and min margin
- choose warn or block mode

### 6. Quote / order / invoice commercial drawer

Needs:

- line-level commercial explanation
- source-rate label
- scheme application summary
- warning or block messages
- override reason capture if user edits commercial outcome

---

## UX behavior in transaction forms

## Item selection

When an operator selects a product:

1. call commercial preview for the row
2. resolve base rate
3. evaluate schemes
4. show final line commercial values
5. display explanation tag such as:
   - `Party rate`
   - `Route list`
   - `Scheme applied`
   - `Manual override`

## Customer change

When customer changes:

- all uncommitted lines must be repriced
- visible warning should explain that customer context changed commercial resolution

## Quantity change

When quantity changes:

- the line should be repriced because slab schemes may change

## Manual price edit

When operator edits unit price or discount:

- rerun guardrails
- require reason if the change diverges from resolved commercial outcome

## Save behavior

On save:

- persist the commercial snapshot per line
- persist override log if needed
- preserve document totals from resolved final values

---

## Reporting requirements

## 1. Discount usage report

Show:

- by period
- by user
- by customer
- by product
- by customer group

Metrics:

- gross discount amount
- average discount %
- documents with override

## 2. Scheme usage report

Show:

- scheme name
- date range
- target customer class
- product impact
- billed quantity
- free quantity
- discount amount generated

## 3. Margin-at-risk report

Show:

- transactions below margin threshold
- user
- customer
- product
- final realized rate

## 4. Commercial override audit report

Show:

- actor
- document
- product
- resolved value
- overridden value
- reason

## 5. Price list coverage report

Show:

- how many active products are covered by each list
- missing products by channel or customer group

---

## Permissions

Suggested new permissions:

- `commercial.price_lists.view`
- `commercial.price_lists.manage`
- `commercial.party_rates.view`
- `commercial.party_rates.manage`
- `commercial.schemes.view`
- `commercial.schemes.manage`
- `commercial.discount_policies.view`
- `commercial.discount_policies.manage`
- `commercial.override.within_limit`
- `commercial.override.above_limit`
- `commercial.reports.view`
- `commercial.audit.view`

Suggested role usage:

- owner/admin: full access
- billing operator: view and use commercial rules, limited override
- salesperson: preview resolved commercials, no rule editing
- accountant: audit/report view if desired

---

## Validation and test plan

## Unit tests

The pricing engine needs unit coverage for:

- precedence resolution
- tie-breaking by priority and specificity
- scheme stacking
- exclusive scheme selection
- date-range validity
- quantity-slab logic
- amount-slab logic
- free-quantity reward calculation
- max discount guardrail
- min margin guardrail

## Integration tests

Need integration or e2e coverage for:

- create price list and use it in quotation
- create party special rate and use it in invoice
- apply scheme based on quantity slab
- apply route-scoped pricing
- block invoice issue when guardrail is violated
- preserve commercial snapshot on document conversion
- ensure historical documents do not change after rule edits

## Browser tests

Need Playwright coverage for:

- commercial settings CRUD
- price list line bulk edit
- scheme create/edit
- invoice form showing resolved commercial explanation
- override reason capture
- commercial reports loading

## Seed scenarios

Recommended seed cases:

1. one customer with exact party special rate
2. one customer group with group list
3. one route with route list
4. one quantity slab scheme
5. one free quantity scheme
6. one strict discount policy

---

## Migration and rollout strategy

## Initial rollout

For first rollout:

- keep `products.selling_price` as default fallback
- let companies adopt pricing rules gradually
- do not force schemes or price lists immediately

## Existing documents

No backfill is required for older documents beyond optional null commercial snapshot values.

## Existing customers

All current customers can default to:

- no customer group
- no route
- no territory
- discount eligible = true

## Existing products

All current products continue to use:

- current selling price

until a stronger commercial rule exists.

---

## Risks and implementation notes

1. Over-complex rule combinations can make billing slow.
   Keep the first engine simple and optimize later.

2. Scheme stacking can become hard to explain.
   Prefer explicit stack policy and visible explanation.

3. Free quantity impacts stock and revenue differently.
   Be careful to avoid inventory or accounting drift.

4. Margin calculation depends on costing quality.
   D7 should start with current cost price and document the limitation.

5. The preview engine will be called often by the UI.
   Cache or optimize lookups for product-heavy invoices.

---

## Acceptance criteria

D7 is complete when:

- operators can configure price lists and party special rates
- the system auto-resolves base rates for quote, order, and invoice flows
- schemes can be configured and applied automatically
- max discount and min margin guardrails work
- manual commercial overrides are audited
- document lines preserve historical commercial snapshots
- commercial reports exist for discount, scheme, and override visibility
- unit, integration, and browser coverage protect the core engine

---

## Suggested implementation order

1. customer commercial classification tables and fields
2. price lists and party special rates
3. pricing resolution service
4. pricing preview API
5. quote/order/invoice UI integration
6. discount policies and override logs
7. scheme engine
8. commercial reports

---

## Out-of-scope follow-up after D7

Once D7 is stable, later phases can extend into:

- supplier rebate and claim management
- sales target campaigns
- retailer-specific secondary-sales incentives
- mobile commercial approvals
- AI-assisted pricing suggestions
