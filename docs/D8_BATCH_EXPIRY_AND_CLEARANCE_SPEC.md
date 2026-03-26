# D8 Batch, Expiry, and Clearance Specification

**Date**: 2026-03-26  
**Purpose**: Define the implementation-ready scope for batch-aware inventory, expiry-date control, near-expiry visibility, and stock-clearance workflows.  
**Implementation status**: Planned

Source:

- [MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md)
- [MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)
- [D3_WAREHOUSES_AND_TRANSFERS_IMPLEMENTATION_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D3_WAREHOUSES_AND_TRANSFERS_IMPLEMENTATION_SPEC.md)
- [DOMAIN_MODEL.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/DOMAIN_MODEL.md)
- [LLD.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/LLD.md)
- [DB_SCHEMA.sql](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/DB_SCHEMA.sql)
- [API_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/API_SPEC.md)

Relevant current-state note:

- the legacy SQL spec already contains an optional `product_batches` table, but the current shipped product does not yet implement batch/expiry as a first-class workflow across warehouse stock, purchases, sales, transfers, returns, and reporting

---

## D8 goal

Add a distributor-grade batch and expiry inventory layer that lets the product:

- receive stock by batch with expiry tracking
- maintain warehouse-wise batch balances
- allocate sales against the correct batch
- warn or block expired and near-expiry issues
- surface near-expiry and clearance opportunities
- preserve traceability for returns, reversals, and stock adjustments

D8 should close one of the largest remaining gaps versus distributor software used by FMCG, pharma-adjacent, and batch-sensitive stock businesses.

---

## Why D8 matters

For many distributors, stock is not just:

- product
- quantity
- warehouse

It is:

- product
- batch
- expiry
- warehouse
- sellability state

Without D8, the product can still handle generic stock, but it will feel too light in demos for businesses that expect:

- expiry tracking
- batch selection
- near-expiry action lists
- clearance selling
- traceability in returns

---

## Scope

Included in D8:

- product-level batch policy
- batch master records
- warehouse-wise batch balances
- purchase receive with batch creation or batch selection
- invoice issue with batch allocation
- credit-note restock with batch handling
- purchase return with batch-aware reversal
- stock transfer with batch-aware movement
- stock adjustment with batch-aware correction
- near-expiry and expired stock reporting
- stock clearance tagging and price-action hooks
- FEFO allocation strategy for expiry-sensitive products
- manual batch selection override when allowed
- batch movement history and auditability

Included operating outputs:

- batch register
- near-expiry workspace
- expired-stock workspace
- clearance action list
- warehouse batch stock report

Not included in D8:

- full pharma regulatory workflows
- MRP printing and retail label compliance logic
- manufacturing lot genealogy
- serial-number tracking
- cold-chain compliance workflow
- principal claim settlement for expiry loss

Planned result after D8:

- the system can manage batch-sensitive stock as an operationally real inventory system rather than only a quantity ledger

---

## Business outcomes

After D8, the product should let a business:

- receive the same product under multiple batches
- keep separate quantities for each batch per warehouse
- sell oldest-valid stock first
- avoid issuing expired stock
- quickly find near-expiry stock
- move near-expiry stock into clearance actions
- trace which batch was sold or returned

---

## Design principles

1. Product stock summary remains useful.
   Product-level stock should still exist for fast dashboards, but batch and warehouse-batch balances become the operational truth where enabled.

2. Batch-aware behavior should be opt-in by product.
   Not every business or product requires batch tracking.

3. Expiry-sensitive issue logic should default to FEFO.
   First-expiring valid stock should be allocated first unless an operator override is allowed.

4. Historical traceability matters.
   Once a purchase, invoice, transfer, or return is posted, the batch allocation must be preserved.

5. Warehouse and batch must work together.
   Batch quantity without warehouse context is not enough for distributor operations.

6. Near-expiry is an action problem, not only a report.
   D8 should produce worklists, not just balances.

---

## Terms and concepts

### Batch-tracked product

A product for which stock must be received, moved, sold, and reported by batch.

### Batch

A company-scoped and product-scoped stock identity that may hold:

- batch number
- manufacturing date
- expiry date
- notes

### Warehouse batch stock

The available quantity of one product batch in one warehouse.

### FEFO

First-expiring, first-out.

This is the default issue strategy for expiry-sensitive products.

### Near-expiry

Stock that is still sellable but is close enough to expiry that it should be surfaced for action.

### Expired stock

Stock whose expiry date is before the effective transaction date or current reporting date.

### Clearance action

A deliberate sales or operations action to reduce near-expiry stock through:

- targeted pricing
- warehouse transfer
- priority sales push
- return to supplier where supported operationally

---

## D8 feature set

## 1. Product batch policy

Each product should support:

- batch tracking on/off
- expiry tracking on/off
- near-expiry threshold in days
- issue strategy
- allow manual batch override on sales

Suggested issue strategies:

- `fefo`
- `fifo`
- `manual`

Recommended first release rule:

- if expiry tracking is on, default to `fefo`
- if only batch tracking is on, default to `fifo`

## 2. Batch master

The system should maintain a reusable batch record for each:

- company
- product
- batch number

Each record should include:

- batch number
- product
- expiry date
- manufacturing date optional
- metadata and notes

## 3. Warehouse batch balances

The system should maintain batch quantity per warehouse.

This enables:

- same batch in multiple warehouses
- transfer by batch
- near-expiry by warehouse

## 4. Batch-aware purchase receiving

Receiving stock should allow:

- creating a new batch
- receiving into an existing batch if policy allows
- capturing expiry date
- capturing manufacturing date optional

## 5. Batch-aware sales issue

Issuing stock should:

- auto-allocate sellable stock from eligible batches
- prefer FEFO for expiry-tracked products
- prevent expired stock issue by default
- optionally warn instead of block if business policy allows

## 6. Batch-aware returns

The system should preserve batch identity during:

- credit-note restock
- purchase return
- invoice cancellation
- purchase cancellation

## 7. Near-expiry and expired stock workspaces

The system should show:

- near-expiry stock by warehouse
- expired stock by warehouse
- recommended actions

## 8. Stock clearance workflow

The system should support:

- tagging selected batch stock into a clearance program
- recording operator notes and action type
- linking clearance context to future pricing and reports

Pricing logic itself belongs to D7, but D8 must expose the inventory side of clearance.

---

## Phase breakdown inside D8

### D8.1 Batch foundations

Deliver:

- product batch policy fields
- batch master
- warehouse batch stock
- batch-aware purchase receive

### D8.2 Sales and movement allocation

Deliver:

- batch allocation engine
- invoice issue by batch
- transfer by batch
- adjustment by batch
- return and reversal handling

### D8.3 Near-expiry and expired stock visibility

Deliver:

- near-expiry reports
- expired stock reports
- batch register
- warehouse batch workspace

### D8.4 Clearance actions and operator tooling

Deliver:

- clearance action records
- clearance list
- action statuses
- D7 integration hook for clearance-linked pricing later

---

## Business rules

## 1. Product policy rules

If `is_batch_tracked = false`:

- D8 behavior is not required for that product
- current quantity-only flow continues

If `is_batch_tracked = true` and `is_expiry_tracked = false`:

- batch selection is required where stock is issued or adjusted
- expiry-specific warnings are skipped

If `is_expiry_tracked = true`:

- batch tracking must also be true
- expiry date is required on received batch rows

## 2. Batch identity rules

Recommended uniqueness:

- `(company_id, product_id, batch_number)`

Optional later extension:

- allow same batch number with different manufacturing dates if business needs it

First release should keep batch identity simple and strict.

## 3. Purchase receive rules

For a batch-tracked product:

- batch allocation details must be provided before receive completes
- received quantity must equal the total of batch allocations for that line

If a purchase line omits batch allocations for a batch-tracked product:

- receive should be blocked

## 4. Sales issue rules

For a batch-tracked product:

- invoice issue should allocate batch quantities before stock is decremented

Allocation behavior:

- choose eligible warehouse batch rows with quantity > 0
- exclude expired rows by default
- sort by:
  - earliest expiry date for FEFO
  - then oldest creation date

If total sellable batch stock is insufficient:

- block issue if negative stock is not allowed
- otherwise preserve explicit audit of negative or unallocated behavior if later permitted

## 5. Expired-stock rule

Default behavior:

- expired stock cannot be issued in quotations, sales orders, or invoices

Allowed exception:

- admin-configured warn-only mode may permit visibility but not final issue in the first release

Recommended first release:

- hard block expired issue

## 6. Near-expiry rule

Near-expiry stock:

- remains sellable
- should show warning or action badge
- should appear in near-expiry reports if:
  - `expiry_date - reference_date <= near_expiry_threshold_days`
  - and quantity > 0

Reference date:

- transaction date for issue checks
- current date or report date for workspace reporting

## 7. Transfer rules

For batch-tracked products:

- transfer request or dispatch must specify batch allocations
- source warehouse batch quantity decreases on dispatch
- destination warehouse batch quantity increases on receive
- product-level total stock does not change

## 8. Stock adjustment rules

For batch-tracked products:

- adjustment must specify batch where existing stock is corrected
- positive adjustment may:
  - add quantity to an existing batch
  - or create a new batch if allowed by policy

Adjustment reasons should be captured:

- shortage
- damage
- found stock
- expiry write-off
- reconciliation correction

## 9. Return rules

### Invoice cancellation

- reverse the exact original batch allocations whenever possible

### Credit note with restock

- if restocking specific lines from an invoice, restore the same batch allocations sold on that line where traceability exists

### Purchase return

- reduce the same batch and warehouse stock that came from the received purchase allocation where possible

## 10. Historical safety

Batch allocations stored on:

- purchase items
- invoice items
- credit-note items
- stock transfer items

must remain immutable once the transaction is posted.

## 11. Summary stock consistency

For a batch-tracked product:

- `products.stock` should equal the sum of all warehouse batch quantities across active warehouses
- `warehouse_stocks.quantity` should equal the sum of batch rows for that warehouse and product

The system should maintain these as consistency invariants.

## 12. Sellability status

Each warehouse batch row should derive sellability as:

- `sellable`
- `near_expiry`
- `expired`
- `quarantined`
- `clearance`

Recommended first release:

- derive status dynamically from expiry and explicit flags

---

## Data model

This section defines recommended schema additions. It is a product-definition spec, not the final migration script.

## 1. Product extensions

Suggested additions to `products`:

- `is_batch_tracked` boolean default false
- `is_expiry_tracked` boolean default false
- `near_expiry_threshold_days` integer nullable
- `batch_issue_strategy` varchar(16) default `fifo`
- `allow_manual_batch_override` boolean default true

## 2. `product_batches`

Purpose:

- canonical batch identity for a product

Suggested fields:

- `id`
- `company_id`
- `product_id`
- `batch_number`
- `manufacturing_date` nullable
- `expiry_date` nullable
- `metadata` jsonb nullable
- `created_by_user_id` nullable
- `created_at`
- `updated_at`

Recommended indexes:

- unique `(company_id, product_id, batch_number)`
- `(company_id, product_id, expiry_date)`

## 3. `warehouse_batch_stocks`

Purpose:

- per-warehouse quantity for each batch

Suggested fields:

- `id`
- `company_id`
- `warehouse_id`
- `product_id`
- `product_batch_id`
- `quantity`
- `reserved_quantity` default 0
- `quarantined_quantity` default 0
- `clearance_flag` boolean default false
- `clearance_program_id` nullable
- `updated_at`

Recommended indexes:

- unique `(warehouse_id, product_batch_id)`
- `(company_id, warehouse_id, product_id)`
- `(company_id, product_batch_id)`

## 4. `inventory_adjustment_reasons`

Purpose:

- structured reason catalog for batch-aware adjustments

Suggested fields:

- `id`
- `company_id`
- `code`
- `name`
- `effect_type`
- `is_active`
- `created_at`

Suggested `effect_type` values:

- `loss`
- `gain`
- `neutral`

## 5. `stock_clearance_programs`

Purpose:

- operational grouping for near-expiry sell-through or write-down actions

Suggested fields:

- `id`
- `company_id`
- `name`
- `code`
- `status`
- `starts_on`
- `ends_on` nullable
- `notes` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

Suggested `status` values:

- `draft`
- `active`
- `closed`
- `cancelled`

## 6. `near_expiry_actions`

Purpose:

- track operator action against near-expiry batch stock

Suggested fields:

- `id`
- `company_id`
- `warehouse_batch_stock_id`
- `action_type`
- `status`
- `notes` nullable
- `created_by_user_id`
- `created_at`
- `updated_at`

Suggested `action_type` values:

- `clearance_push`
- `transfer`
- `return_to_supplier`
- `write_off_review`
- `priority_sell`

Suggested `status` values:

- `open`
- `in_progress`
- `resolved`
- `cancelled`

## 7. Purchase item extensions

Recommended for `purchase_items`:

- remove the old single `batch_id` assumption as the only strategy for multi-batch receiving
- support allocation rows instead

Add new table:

### `purchase_item_batches`

Suggested fields:

- `id`
- `company_id`
- `purchase_item_id`
- `warehouse_id`
- `product_batch_id`
- `quantity`
- `created_at`

## 8. Invoice item extensions

Add table:

### `invoice_item_batches`

Purpose:

- preserve exact issue allocation by batch

Suggested fields:

- `id`
- `company_id`
- `invoice_item_id`
- `warehouse_id`
- `product_batch_id`
- `quantity`
- `created_at`

## 9. Credit note item extensions

Add table:

### `credit_note_item_batches`

Suggested fields:

- `id`
- `company_id`
- `credit_note_item_id`
- `warehouse_id`
- `product_batch_id`
- `quantity`
- `created_at`

## 10. Stock transfer item extensions

Add table:

### `stock_transfer_item_batches`

Suggested fields:

- `id`
- `company_id`
- `stock_transfer_item_id`
- `product_batch_id`
- `quantity`
- `created_at`

## 11. Stock movement extensions

Suggested additions to `stock_movements`:

- `product_batch_id` nullable
- `warehouse_balance_qty` nullable
- `batch_balance_qty` nullable

Purpose:

- make movement history explainable at product, warehouse, and batch levels

---

## API contract

All endpoints are company-scoped.

## Product batch policy

### Update product batch policy

- `PATCH /api/companies/:cid/products/:productId`

Extended body:

- `is_batch_tracked?`
- `is_expiry_tracked?`
- `near_expiry_threshold_days?`
- `batch_issue_strategy?`
- `allow_manual_batch_override?`

## Product batches

### List product batches

- `GET /api/companies/:cid/products/:productId/batches?page=&limit=&q=&warehouse_id=&status=`

### Create product batch

- `POST /api/companies/:cid/products/:productId/batches`

Body:

- `batch_number`
- `manufacturing_date?`
- `expiry_date?`
- `notes?`

### Update product batch

- `PATCH /api/companies/:cid/products/:productId/batches/:batchId`

Allowed:

- notes
- manufacturing date
- expiry date if not locked by policy and no downstream issued stock conflicts

## Warehouse batch stock

### List warehouse batch balances

- `GET /api/companies/:cid/warehouses/:warehouseId/batch-stock?page=&limit=&q=&status=&product_id=`

### Get one warehouse batch row

- `GET /api/companies/:cid/warehouses/:warehouseId/batch-stock/:rowId`

## Purchase receive preview

### Preview batch receive requirements

- `POST /api/companies/:cid/purchases/:purchaseId/receive-preview`

Purpose:

- tell the UI which items require batch allocations before receiving

## Purchase receive with batch allocations

### Receive purchase

- `POST /api/companies/:cid/purchases/:purchaseId/receive`

Extended body:

- `items`: array of:
  - `purchase_item_id`
  - `batch_allocations`: array of:
    - `batch_id?`
    - `batch_number?`
    - `manufacturing_date?`
    - `expiry_date?`
    - `quantity`

For non-batch-tracked products:

- batch allocations may be omitted

## Invoice issue preview

### Preview batch allocation

- `POST /api/companies/:cid/invoices/:invoiceId/issue-preview`

Purpose:

- show the operator the proposed FEFO/FIFO allocation before final issue

Response:

- line allocations
- near-expiry warnings
- expired-stock blocks
- insufficient batch stock blocks

## Invoice issue with batch allocations

### Issue invoice

- `POST /api/companies/:cid/invoices/:invoiceId/issue`

Extended body:

- `batch_allocations?`: array of:
  - `invoice_item_id`
  - `allocations`: array of:
    - `product_batch_id`
    - `quantity`

Behavior:

- if no allocations are supplied and product policy allows automatic allocation, backend resolves automatically
- if manual allocation is required, request is blocked until allocations are supplied

## Batch-aware stock adjustments

### Apply stock adjustment

- `POST /api/companies/:cid/products/:productId/stock-adjustment`

Extended body:

- `warehouse_id`
- `product_batch_id?`
- `batch_number?` for positive-create path
- `expiry_date?`
- `change_qty`
- `reason_code`
- `note?`

## Batch-aware transfers

### Create transfer

- `POST /api/companies/:cid/stock-transfers`

Extended item body:

- `product_id`
- `quantity`
- `batch_allocations?`: array of:
  - `product_batch_id`
  - `quantity`

### Dispatch transfer

- `POST /api/companies/:cid/stock-transfers/:transferId/dispatch`

### Receive transfer

- `POST /api/companies/:cid/stock-transfers/:transferId/receive`

Batch behavior:

- dispatched quantities come off source warehouse batch stock
- received quantities land into destination warehouse batch stock against same batch identity

## Near-expiry and expired stock

### Near-expiry report

- `GET /api/companies/:cid/inventory/near-expiry?as_of=&days=&warehouse_id=&product_id=&page=&limit=`

### Expired stock report

- `GET /api/companies/:cid/inventory/expired-stock?as_of=&warehouse_id=&product_id=&page=&limit=`

### Batch register

- `GET /api/companies/:cid/inventory/batch-register?product_id=&warehouse_id=&batch_id=&from=&to=&page=&limit=`

## Clearance actions

### List clearance programs

- `GET /api/companies/:cid/inventory/clearance-programs?page=&limit=&status=`

### Create clearance program

- `POST /api/companies/:cid/inventory/clearance-programs`

### Update clearance program

- `PATCH /api/companies/:cid/inventory/clearance-programs/:programId`

### Attach warehouse batch stock to clearance

- `POST /api/companies/:cid/inventory/clearance-programs/:programId/lines`

Body:

- `warehouse_batch_stock_ids`

### Near-expiry actions

- `POST /api/companies/:cid/inventory/near-expiry-actions`
- `PATCH /api/companies/:cid/inventory/near-expiry-actions/:actionId`

---

## Preview response shape

Suggested invoice issue preview shape:

```json
{
  "data": {
    "invoice_id": "uuid",
    "warehouse_id": "uuid",
    "lines": [
      {
        "invoice_item_id": "uuid",
        "product_id": "uuid",
        "requested_quantity": "12",
        "strategy": "fefo",
        "allocations": [
          {
            "product_batch_id": "uuid-1",
            "batch_number": "B240101",
            "expiry_date": "2026-04-10",
            "status": "near_expiry",
            "quantity": "7"
          },
          {
            "product_batch_id": "uuid-2",
            "batch_number": "B240115",
            "expiry_date": "2026-05-05",
            "status": "sellable",
            "quantity": "5"
          }
        ],
        "warnings": [
          {
            "code": "NEAR_EXPIRY_BATCH_ALLOCATED",
            "message": "Part of the issue is coming from near-expiry stock."
          }
        ],
        "blocks": []
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

- `/c/[companyId]/inventory/batches`
- `/c/[companyId]/inventory/near-expiry`
- `/c/[companyId]/inventory/expired`
- `/c/[companyId]/inventory/clearance`
- `/c/[companyId]/inventory/clearance/[programId]`

Current-route extensions:

- `/c/[companyId]/masters/products/[productId]`
- `/c/[companyId]/purchases/[purchaseId]`
- `/c/[companyId]/sales/invoices/[invoiceId]`
- `/c/[companyId]/inventory/movements`
- `/c/[companyId]/inventory/transfers`
- `/c/[companyId]/inventory/adjustments`
- `/c/[companyId]/inventory/warehouses`

## Screen requirements

### 1. Product inventory policy section

Show:

- batch tracking toggle
- expiry tracking toggle
- near-expiry threshold
- issue strategy
- manual override policy

### 2. Purchase receive batch allocator

Needs:

- line-by-line allocation table
- add/select batch
- capture expiry date
- quantity validation
- total allocated vs line quantity check

### 3. Invoice issue batch preview

Needs:

- auto-allocation preview
- batch numbers and expiry dates
- warnings for near-expiry usage
- hard block for expired allocations
- manual override if allowed

### 4. Batch register workspace

Show:

- batch number
- product
- warehouse
- received quantity
- current quantity
- expiry date
- sellability state
- movement drilldown

### 5. Near-expiry workspace

Show:

- warehouse
- batch
- product
- days to expiry
- available quantity
- suggested action

Primary actions:

- mark for clearance
- create transfer action
- create write-off review

### 6. Expired stock workspace

Show:

- expired quantity
- warehouse
- batch
- product
- recommended next action

### 7. Clearance program workspace

Show:

- selected warehouse batch lines
- action status
- notes
- commercial follow-up link for D7 integration later

---

## UX behavior in transactions

## Purchase receive

When a purchase contains batch-tracked products:

1. operator opens receive action
2. UI checks which items require batch details
3. operator assigns one or more batch rows per line
4. UI validates:
   - quantity sum matches line quantity
   - expiry date present if required
5. receive action stays blocked until valid

## Invoice issue

When an invoice contains batch-tracked products:

1. UI requests issue preview
2. backend returns proposed allocations
3. operator reviews warnings and blocks
4. if manual override is allowed, operator can swap allocations
5. final issue stores exact batch allocations

## Transfer dispatch

For batch-tracked products:

- transfer row should show batch allocations explicitly
- source batch stock must be visible before dispatch

## Stock adjustment

For batch-tracked products:

- operator must choose a batch for negative adjustment
- operator may create a new batch for positive adjustment if policy allows

---

## Reporting requirements

## 1. Near-expiry report

Show:

- product
- batch number
- warehouse
- available quantity
- expiry date
- days to expiry
- sellability state

## 2. Expired stock report

Show:

- product
- batch number
- warehouse
- expired quantity
- expiry date
- write-off / action status

## 3. Batch register

Show:

- opening
- receipts
- issues
- returns
- transfers
- adjustments
- closing quantity

## 4. Warehouse batch stock report

Show:

- warehouse
- product
- batch
- available quantity
- reserved quantity
- quarantined quantity
- clearance flag

## 5. Clearance action report

Show:

- program
- batch lines included
- quantity targeted
- quantity sold later if D7 integration is added
- unresolved actions

---

## Permissions

Suggested new permissions:

- `inventory.batches.view`
- `inventory.batches.manage`
- `inventory.batch_issue.override`
- `inventory.near_expiry.view`
- `inventory.expired_stock.view`
- `inventory.clearance.manage`
- `inventory.adjustments.batch_manage`
- `inventory.transfers.batch_manage`

Suggested role usage:

- owner/admin: full access
- warehouse operator: receive, transfer, adjustment, view near-expiry
- billing operator: batch preview and allowed issue override only if permitted
- salesperson: view only where needed

---

## Validation and test plan

## Unit tests

Need unit coverage for:

- FEFO selection
- FIFO selection
- expired-stock block
- near-expiry detection
- allocation split across multiple batches
- consistency update of product stock, warehouse stock, and warehouse batch stock

## Integration tests

Need integration or e2e coverage for:

- receive purchase into multiple batches
- issue invoice from FEFO stock
- block issue when only expired stock remains
- transfer batch stock between warehouses
- restock returned quantity into original batches
- adjust batch stock with reason code
- near-expiry report accuracy

## Browser tests

Need Playwright coverage for:

- purchase receive batch allocation
- invoice issue preview with warnings
- near-expiry workspace filters
- clearance action creation

## Seed scenarios

Recommended seed cases:

1. one batch-tracked product with two batches and different expiry dates
2. one warehouse with near-expiry quantity
3. one expired batch that should block issue
4. one transfer moving selected batch quantity
5. one invoice using FEFO across two batches

---

## Migration and rollout strategy

## Initial rollout

For first rollout:

- keep batch tracking optional per product
- do not force all existing products into D8

## Existing products

Default values:

- `is_batch_tracked = false`
- `is_expiry_tracked = false`

## Existing stock

Recommended practical rule:

- for products newly moved into batch tracking, require an opening batch allocation process before batch-aware issue can begin

This opening allocation should:

- create one or more opening batches
- assign quantities by warehouse
- write opening batch movement records

## Existing purchases and invoices

Historical documents without batch allocations remain valid historical records.

D8 should not require backfilling old documents before rollout.

---

## Risks and implementation notes

1. Batch logic can introduce stock drift if summary and detailed balances are updated separately.
   All product, warehouse, and warehouse-batch stock updates must remain transactional.

2. Free-form manual batch edits can create traceability confusion.
   Keep manual overrides explicit and audited.

3. Returns are tricky.
   Exact original-batch restoration should be preferred wherever traceability exists.

4. FEFO can become expensive if queries are not indexed well.
   Add proper batch and expiry indexes early.

5. D7 and D8 should integrate later.
   Clearance actions created in D8 should be able to influence pricing or schemes through D7 without duplicating data.

---

## Acceptance criteria

D8 is complete when:

- products can be configured for batch and expiry tracking
- purchases can be received into one or more batches
- invoices can allocate valid stock by batch
- expired stock cannot be issued
- near-expiry stock is visible in dedicated reports and workspaces
- transfers and adjustments preserve batch identity
- summary stock and batch stock remain consistent
- batch-aware tests protect the critical flows

---

## Suggested implementation order

1. product batch policy fields
2. batch and warehouse-batch schema
3. purchase receive batch allocation
4. invoice issue batch allocation engine
5. transfer and adjustment support
6. near-expiry and expired reports
7. clearance actions and UI polish

---

## Out-of-scope follow-up after D8

Once D8 is stable, later phases can extend into:

- supplier expiry return claims
- MRP and retail label workflows
- serial-number tracking
- quarantine and QA release workflow
- batch-cost valuation improvements

