# D11 E-Invoice and E-Way Bill Specification

**Date**: 2026-03-26  
**Purpose**: Define the implementation-ready scope for operational e-invoice and e-way bill workflows on top of the current GST and invoice foundation.  
**Implementation status**: Implemented for the internal product flow with `sandbox_local`; live provider-backed IRP and EWB integration is still pending

Source:

- [MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md)
- [MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)
- [GST_PORTAL_MAPPINGS.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/GST_PORTAL_MAPPINGS.md)
- [API_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/API_SPEC.md)
- [D10_DISPATCH_DELIVERY_AND_CHALLAN_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D10_DISPATCH_DELIVERY_AND_CHALLAN_SPEC.md)

Official reference inputs used for product-definition:

- [E-Invoice API Details of all 6 IRPs](https://tutorial.gst.gov.in/downloads/news/e-invoice_api_integration_guide_irps.pdf)
- [Glossary on e-Invoicing](https://tutorial.gst.gov.in/downloads/news/pamphlet_e_invoicing_glossary_updated_17_08_2023_approved_final.pdf)
- [GSTR-1 auto-population from e-invoice](https://tutorial.gst.gov.in/userguide/returns/GSTR_1.htm)
- [E-Way Bill API Interface manual](https://docs.ewaybillgst.gov.in/Documents/EWB_API.pdf)
- [GST welcome kit e-way bill section](https://tutorial.gst.gov.in/downloads/news/welcome_kit_for_new_taxpyers.pdf)
- [FAQ on e-invoice JSON download](https://tutorial.gst.gov.in/downloads/news/e-invoice_json_download_functionality.pdf)

This spec uses those sources as operational guidance only. Exact provider integration details and production onboarding steps must still be validated against the selected IRP / EWB integration route at implementation time.

---

## D11 goal

Add a real operational GST-compliance workflow for:

- e-invoice generation
- IRN and QR storage
- e-invoice cancellation
- e-way bill generation
- vehicle / transport detail updates
- e-way bill cancellation
- status sync and auditability

D11 should move the product from "can compute GST reports and exports" to "can execute day-to-day GST transport and invoice compliance workflows from the product."

---

## Why D11 matters

For many Indian distributors, GST readiness is not only:

- GSTR reports
- export files

It is also:

- IRN generation
- QR persistence
- e-way bill creation
- vehicle updates
- cancellation windows
- confidence that invoice and compliance states match

Without D11, the product remains stronger as a reporting and bookkeeping system than as a full daily compliance operations system.

---

## Scope

Included in D11:

- e-invoice eligibility evaluation
- e-invoice payload generation from issued invoice
- IRN generation through selected integration path
- signed JSON and signed QR metadata storage
- invoice-level e-invoice status panel
- e-invoice cancellation flow
- e-way bill eligibility evaluation
- e-way bill generation from invoice or challan/invoice context
- vehicle and transporter update workflow
- e-way bill cancellation flow
- sync and status refresh
- compliance audit trail
- operator exception workspace

Included operating outputs:

- invoice compliance panel
- GST compliance jobs and event history
- exception queue for failed generation or sync
- delivered / invoiced / e-invoiced / e-way-billed visibility

Not included in D11:

- direct filing of GSTR returns
- legal interpretation engine for every edge case
- every IRP-specific proprietary feature
- transporter marketplace integrations
- full document OCR and compliance auto-correction

Planned result after D11:

- invoice and dispatch operations gain a first-class compliance layer that operators can trust and support teams can debug

---

## Business outcomes

After D11, the product should let a business:

- determine whether an invoice needs e-invoice and/or e-way bill
- generate IRN and retain signed artifacts
- generate e-way bill and later update vehicle details if needed
- cancel IRN or EWB when business rules permit
- see whether a document is pending, succeeded, failed, cancelled, or out of sync

---

## Design principles

1. Compliance should attach to business documents, not live separately.
   The primary operator surface should be invoice and challan detail.

2. External-provider state must be stored explicitly.
   Never rely on “we probably generated it” without stored identifiers and timestamps.

3. Generation should be idempotent.
   Retry-safe behavior is mandatory for IRN and EWB operations.

4. Auditability matters as much as success.
   Every request, response summary, cancellation, and sync event must be traceable.

5. Operational status must be visible to non-technical staff.
   Users need simple states like pending, generated, failed, cancelled, and blocked.

6. Integration route should be abstracted.
   The product should allow one integration strategy while keeping the internal model provider-neutral.

---

## Terms and concepts

### E-invoice

A GST invoice reported to an Invoice Registration Portal (IRP), which returns:

- IRN
- signed invoice data
- QR payload / signed QR details

### IRN

Invoice Reference Number generated by the IRP.

### Signed JSON

The returned e-invoice payload or signed representation received from the IRP.

### QR metadata

The invoice verification details used for QR rendering and validation.

### E-way bill

The electronic movement document used for goods transport.

### EWB / EBN

E-way bill number returned by the EWB system.

### Compliance exception

Any document that should have been generated, updated, cancelled, or synced but failed or is incomplete.

---

## D11 feature set

## 1. Eligibility evaluation

The system should evaluate, at minimum:

- whether invoice is in the right status
- whether company GST profile is complete enough
- whether customer / place-of-supply data is sufficient
- whether invoice type is supported
- whether document already has active IRN or EWB

Optional later logic:

- turnover-based enablement rules
- transaction-type exclusions

## 2. E-invoice generation

The system should support:

- generate IRN for eligible invoice
- store IRN and acknowledgement details
- store signed response summary
- store QR metadata for PDF/print

## 3. E-invoice cancellation

The system should support:

- cancel active IRN for eligible invoice
- store cancellation reason and timestamp
- update invoice compliance status

## 4. E-way bill generation

The system should support:

- generate EWB from invoice context
- optionally generate using challan/invoice-linked dispatch context later
- capture transporter and vehicle fields
- store EWB number and validity data

## 5. Vehicle / transporter updates

The system should support:

- update vehicle number
- update transport document details where required by the integration route

## 6. E-way bill cancellation

The system should support:

- cancel active EWB where business rules permit
- store cancellation metadata

## 7. Sync and audit

The system should support:

- refresh status
- fetch latest remote state summary
- store event history

## 8. Exception handling

The system should support:

- failed generation queue
- validation-error display
- retry action
- operator note and support/debug context

---

## Phase breakdown inside D11

### D11.1 Internal compliance model

Deliver:

- e-invoice and e-way bill entities
- compliance status model
- invoice detail compliance panel

### D11.2 E-invoice operations

Deliver:

- eligibility check
- IRN generate
- IRN cancel
- QR and signed artifact storage

### D11.3 E-way bill operations

Deliver:

- EWB generate
- vehicle update
- EWB cancel

### D11.4 Sync, retries, and exception tooling

Deliver:

- compliance event log
- retry workflow
- support-facing exception explorer

---

## Business rules

## 1. Document eligibility baseline

Recommended first release:

- only `issued` invoices can move into e-invoice and e-way bill generation
- draft or cancelled invoices are not eligible

## 2. One active IRN per invoice

If an invoice already has an active IRN:

- do not generate a second one
- instead surface current status and allow sync or cancel actions

## 3. One active EWB per invoice movement context

If an active EWB exists for the invoice movement:

- do not create another active EWB without explicit replacement logic

## 4. Generation order

Recommended first release:

1. issue invoice
2. generate e-invoice if applicable
3. generate e-way bill if applicable and data is sufficient

Reason:

- this fits the current invoice-first stock/accounting model
- it aligns well with GST auto-population behavior into GSTR-1

## 5. Stored artifact rule

After successful e-invoice generation, the product should store:

- IRN
- acknowledgement number
- acknowledgement date/time
- signed response summary or signed JSON file reference
- QR data or QR image reference

## 6. Cancellation rule

Cancellation actions should:

- only be allowed when current remote state permits it
- require reason input
- update local compliance status
- create lifecycle and compliance event records

The exact cancellation window can vary by integration path and policy; implementation should validate against the active provider rules at runtime instead of hard-coding assumptions that may change.

## 7. Retry rule

If a generation call fails:

- keep the document in a failed or pending state
- store error summary
- allow safe retry

## 8. Idempotency rule

Compliance operations must use:

- idempotency key or equivalent request fingerprint
- duplicate-submission protection

## 9. Data completeness rule

Generation should be blocked if required document fields are missing, such as:

- company GSTIN or state context
- customer GSTIN where relevant
- place of supply where required
- transporter / vehicle fields for EWB where required

## 10. GSTR relationship rule

The product should treat e-invoice data as related to GST reporting state:

- e-invoice details may later be used for reconciliation with GSTR-1 views
- D11 does not replace current GST report builders, but it should prepare the foundation for reconciliation views

## 11. Vehicle update rule

For e-way bill operations:

- vehicle update should be a dedicated action
- old and new vehicle details must be traceable

## 12. Local invoice immutability

After active IRN generation:

- invoice business fields that would invalidate the IRN should not be silently editable

Recommended first release:

- block structural invoice edits after e-invoice success
- require cancellation and re-generation workflow instead

---

## Data model

This section defines recommended schema additions. It is a product-definition spec, not the final migration script.

## 1. `e_invoices`

Purpose:

- store operational e-invoice state for invoices

Suggested fields:

- `id`
- `company_id`
- `invoice_id`
- `provider_code`
- `status`
- `irn`
- `ack_number` nullable
- `ack_date` nullable
- `signed_json_file_id` nullable
- `signed_qr_file_id` nullable
- `qr_payload` jsonb nullable
- `remote_reference_id` nullable
- `cancelled_at` nullable
- `cancel_reason` nullable
- `last_synced_at` nullable
- `created_at`
- `updated_at`

Suggested `status` values:

- `not_required`
- `pending`
- `generated`
- `failed`
- `cancel_pending`
- `cancelled`
- `sync_error`

## 2. `e_invoice_events`

Purpose:

- audit all e-invoice operations

Suggested fields:

- `id`
- `company_id`
- `invoice_id`
- `e_invoice_id` nullable
- `event_type`
- `status`
- `request_summary` jsonb nullable
- `response_summary` jsonb nullable
- `error_code` nullable
- `error_message` nullable
- `actor_user_id` nullable
- `created_at`

Suggested `event_type` values:

- `generate_requested`
- `generate_succeeded`
- `generate_failed`
- `cancel_requested`
- `cancel_succeeded`
- `cancel_failed`
- `sync_requested`
- `sync_succeeded`
- `sync_failed`

## 3. `e_way_bills`

Purpose:

- store operational e-way bill state

Suggested fields:

- `id`
- `company_id`
- `invoice_id` nullable
- `delivery_challan_id` nullable
- `provider_code`
- `status`
- `ewb_number`
- `ewb_date` nullable
- `valid_upto` nullable
- `vehicle_number` nullable
- `transporter_name` nullable
- `transport_doc_number` nullable
- `transport_doc_date` nullable
- `cancelled_at` nullable
- `cancel_reason` nullable
- `last_synced_at` nullable
- `created_at`
- `updated_at`

Suggested `status` values:

- `not_required`
- `pending`
- `generated`
- `failed`
- `updated`
- `cancel_pending`
- `cancelled`
- `sync_error`

## 4. `e_way_bill_events`

Purpose:

- audit all EWB operations

Suggested fields:

- `id`
- `company_id`
- `invoice_id` nullable
- `delivery_challan_id` nullable
- `e_way_bill_id` nullable
- `event_type`
- `status`
- `request_summary` jsonb nullable
- `response_summary` jsonb nullable
- `error_code` nullable
- `error_message` nullable
- `actor_user_id` nullable
- `created_at`

Suggested `event_type` values:

- `generate_requested`
- `generate_succeeded`
- `generate_failed`
- `vehicle_update_requested`
- `vehicle_update_succeeded`
- `vehicle_update_failed`
- `cancel_requested`
- `cancel_succeeded`
- `cancel_failed`
- `sync_requested`
- `sync_succeeded`
- `sync_failed`

## 5. Invoice extensions

Suggested additions to `invoices`:

- `compliance_lock` boolean default false

Purpose:

- signal that structural edits should be blocked after active e-invoice success

## 6. Company GST integration config

Recommended location:

- `companies.invoice_settings` or a dedicated integration config model later

Required logical fields:

- provider route / integration mode
- enable e-invoice
- enable e-way bill
- environment
- api credentials reference

Credentials themselves should not be stored in plaintext in business tables.

---

## API contract

All endpoints are company-scoped.

## Eligibility

### Check invoice compliance eligibility

- `GET /api/companies/:cid/invoices/:invoiceId/compliance/eligibility`

Response should indicate:

- e-invoice applicable?
- e-way bill applicable?
- current blockers
- current active statuses

## E-invoice operations

### Generate e-invoice

- `POST /api/companies/:cid/invoices/:invoiceId/e-invoice/generate`

### Cancel e-invoice

- `POST /api/companies/:cid/invoices/:invoiceId/e-invoice/cancel`

Body:

- `reason`

### Sync e-invoice status

- `POST /api/companies/:cid/invoices/:invoiceId/e-invoice/sync`

### Get e-invoice detail

- `GET /api/companies/:cid/invoices/:invoiceId/e-invoice`

## E-way bill operations

### Generate EWB

- `POST /api/companies/:cid/invoices/:invoiceId/e-way-bill/generate`

Body may include:

- `vehicle_number?`
- `transporter_name?`
- `transport_doc_number?`
- `transport_doc_date?`
- `dispatch_from?` optional if not derivable
- `ship_to?` optional if not derivable

### Update EWB vehicle

- `POST /api/companies/:cid/invoices/:invoiceId/e-way-bill/update-vehicle`

Body:

- `vehicle_number`
- `reason?`

### Cancel EWB

- `POST /api/companies/:cid/invoices/:invoiceId/e-way-bill/cancel`

Body:

- `reason`

### Sync EWB status

- `POST /api/companies/:cid/invoices/:invoiceId/e-way-bill/sync`

### Get EWB detail

- `GET /api/companies/:cid/invoices/:invoiceId/e-way-bill`

## Compliance events

### Get invoice compliance events

- `GET /api/companies/:cid/invoices/:invoiceId/compliance/events?page=&limit=`

## Compliance exceptions

### List exception queue

- `GET /api/companies/:cid/gst/compliance/exceptions?page=&limit=&type=&status=&from=&to=`

Types:

- `e_invoice`
- `e_way_bill`

---

## Response shape suggestions

### Eligibility response

Suggested shape:

```json
{
  "data": {
    "invoice_id": "uuid",
    "e_invoice": {
      "applicable": true,
      "status": "pending",
      "blocks": []
    },
    "e_way_bill": {
      "applicable": true,
      "status": "pending",
      "blocks": [
        {
          "code": "MISSING_VEHICLE_DETAILS",
          "message": "Vehicle or transporter details are required to generate the e-way bill."
        }
      ]
    }
  }
}
```

### E-invoice detail response

Suggested fields:

- `status`
- `irn`
- `ack_number`
- `ack_date`
- `last_synced_at`
- `signed_json_download_url?`
- `signed_qr_download_url?`

### E-way bill detail response

Suggested fields:

- `status`
- `ewb_number`
- `ewb_date`
- `valid_upto`
- `vehicle_number`
- `transporter_name`
- `transport_doc_number`
- `last_synced_at`

---

## Frontend routes and screens

Recommended route additions:

- no mandatory new top-level route is required in first release
- exception and admin/compliance routes may be added later:
  - `/c/[companyId]/gst/compliance/exceptions`

Current-route extensions:

- `/c/[companyId]/sales/invoices/[invoiceId]`
- `/c/[companyId]/reports/gst/gstr1`
- admin or support-facing observability routes later if needed

## Screen requirements

### 1. Invoice compliance panel

Invoice detail should show:

- e-invoice applicability
- e-invoice status
- IRN and acknowledgement details if available
- e-way bill applicability
- EWB number and validity if available
- primary actions:
  - generate e-invoice
  - cancel e-invoice
  - generate e-way bill
  - update vehicle
  - cancel e-way bill
  - sync status

### 2. Compliance event timeline

Invoice detail should show:

- request time
- success/failure
- error message summary
- actor if manual action triggered

### 3. GST exception workspace

Show:

- failed generation items
- pending sync items
- missing-data blockers
- retry action

### 4. GST report reconciliation hooks

GSTR workspace should later be able to show:

- e-invoiced volume
- non-e-invoiced volume
- exceptions affecting return confidence

Recommended first release:

- keep this light and mostly summary-level

---

## UX behavior in invoice workflow

## Issue invoice

After invoice issue:

- show compliance readiness state
- do not auto-fire external generation in the very first release unless the team intentionally wants background automation

Recommended first release:

- operator-triggered generation with clear feedback

## Generate e-invoice

When operator clicks generate:

1. run local eligibility validation
2. create compliance event row
3. call provider integration
4. persist result and update invoice panel
5. if successful, set compliance lock

## Generate e-way bill

When operator clicks generate:

1. validate required transport context
2. generate against invoice context
3. persist EWB identifiers and validity

## Cancel workflows

When operator cancels IRN or EWB:

- require reason
- record event
- update local status only after provider confirms success or returns accepted cancellation response

---

## Reporting requirements

## 1. Compliance exception report

Show:

- invoice number
- customer
- document date
- compliance type
- current status
- last error
- retryability

## 2. E-invoice generation summary

Show:

- generated count
- failed count
- cancelled count
- pending count

## 3. E-way bill activity summary

Show:

- generated count
- updated vehicle count
- cancelled count
- expiring-soon validity count later if useful

---

## Permissions

Suggested new permissions:

- `gst.e_invoice.view`
- `gst.e_invoice.generate`
- `gst.e_invoice.cancel`
- `gst.e_invoice.sync`
- `gst.e_way_bill.view`
- `gst.e_way_bill.generate`
- `gst.e_way_bill.update_vehicle`
- `gst.e_way_bill.cancel`
- `gst.e_way_bill.sync`
- `gst.compliance_exceptions.view`

Suggested role usage:

- owner/admin: full access
- billing operator: invoice compliance actions
- warehouse/dispatch operator: EWB vehicle update where appropriate
- accountant: view and exception review

---

## Validation and test plan

## Unit tests

Need unit coverage for:

- eligibility evaluation
- payload normalization
- duplicate generation guard
- cancellation-state transitions

## Integration tests

Need integration or e2e coverage for:

- generate e-invoice success path
- generate e-invoice failure path
- cancel e-invoice
- generate e-way bill
- update vehicle
- cancel e-way bill
- sync status after remote success/failure

## Browser tests

Need Playwright coverage for:

- invoice detail compliance panel actions
- exception list filtering and retry trigger

## Seed / sandbox scenarios

Recommended validation cases:

1. eligible invoice with successful IRN generation
2. invoice blocked for missing GST/compliance data
3. active IRN then cancellation
4. EWB generation with transporter/vehicle details
5. vehicle update after generation

---

## Migration and rollout strategy

## Initial rollout

First release should:

- keep all D11 actions explicit and operator-triggered
- avoid hidden automatic generation until the live provider path is proven

## Existing invoices

Historical invoices without e-invoice or EWB records remain valid historical documents.

No mandatory backfill is required.

## Existing GST module

D11 must not break:

- current GSTR summaries
- current GST export jobs

It should extend the GST surface, not replace it.

## Provider strategy

Implementation should choose one production route first:

- direct IRP / EWB integration where allowed
- or GSP/ASP/provider-mediated route

The internal model should remain provider-neutral either way.

---

## Risks and implementation notes

1. Compliance rules and portal behavior can change.
   Avoid baking volatile provider-specific assumptions into the core domain model.

2. Cancellation windows and validation rules may vary or evolve.
   Runtime validation and provider-config-aware behavior are safer than hard-coded rules.

3. External failures are normal.
   Retry, audit, and operator messaging matter as much as the happy path.

4. Automatic generation can create confusion if failures are silent.
   Start with explicit operator actions before background automation.

5. Invoice immutability after IRN generation needs careful UX.
   Blocking edits is safer than silent divergence.

---

## Acceptance criteria

D11 is complete when:

- eligible invoices can generate and store e-invoice data
- active e-invoices can be cancelled with audit trail
- eligible invoices can generate and manage e-way bills
- vehicle updates and cancellations are supported
- invoice detail shows compliance state clearly
- exception and retry flows exist
- current GST reporting and invoice lifecycle remain intact

---

## Suggested implementation order

1. internal compliance schema and event logs
2. invoice-detail compliance panel
3. e-invoice generate/cancel/sync
4. e-way bill generate/update/cancel/sync
5. exception workspace and support tooling

---

## Out-of-scope follow-up after D11

Once D11 is stable, later phases can extend into:

- background automatic generation
- challan-driven EWB flows
- deeper GSTR reconciliation against e-invoice state
- multi-provider failover strategy
