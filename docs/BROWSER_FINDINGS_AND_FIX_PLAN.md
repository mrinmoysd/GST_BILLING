# Browser Findings And Fix Plan

**Date**: 2026-03-23  
**Validation basis**: Live browser investigation against local web `http://localhost:3001` and API `http://localhost:4000`  
**Related log**: [BROWSER_E2E_VALIDATION_LOG_2026-03-23.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/BROWSER_E2E_VALIDATION_LOG_2026-03-23.md)

## Purpose

This document converts the latest browser-reproduced defects into a concrete implementation checklist. It is intended to be the working baseline for the next repair pass.

The issues below were reproduced live in the browser and, where needed, correlated with the current frontend/backend implementation. No code changes are represented by this document alone.

---

## Summary

The reported problems cluster into five buckets:

1. frontend API response-shape mismatches
2. missing or incomplete product form fields
3. real request/contract failures on product update
4. UI system gaps for toast, selectors, date inputs, and wide tables
5. data-label mapping issues in accounting forms

The highest-value first pass is to fix response-shape handling, because that likely resolves:

- invoices list
- purchases list
- invoice payment rendering
- company settings display
- custom roles list display

## Architectural finding

The current frontend API layer has an important inconsistency:

- `apiClient` is typed as if every response is an `ApiEnvelope<T>`
- in practice, some endpoints return plain paginated payloads like `{ data, page, limit, total }`
- some settings endpoints return raw controller payloads like `{ ok: true, data: ... }`
- some detail endpoints return `{ data: entity }`

That means the correct UI binding depends on the specific endpoint family, not just the client type annotation.

This mismatch was the direct cause of several Wave 1 defects. Future fixes should prefer one of these directions:

1. normalize the API client contract globally
2. or normalize per-hook return shapes so page components do not need to guess payload nesting

Until that is done, each affected hook/page must be checked against the real runtime payload.

---

## Reproduced Findings

### BF-001 Invoices list renders empty despite successful API response

**Severity**: High  
**Area**: Sales  
**Route**: `/c/{companyId}/sales/invoices`

**Observed**

- UI shows `0 total` and `No invoices`
- network request to `/api/companies/{companyId}/invoices?page=1&limit=20` returns `200`

**Likely root cause**

- frontend reads the invoices query result using the wrong nesting shape

**Likely files**

- [sales/invoices/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/invoices/page.tsx)
- [billing/hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/billing/hooks.ts)

---

### BF-002 Product edit fails with `400`

**Severity**: High  
**Area**: Masters  
**Route**: `/c/{companyId}/masters/products/{productId}`

**Observed**

- changing product fields and clicking `Save changes` returns `Request failed (400)`

**Likely root cause**

- product update payload does not fully match backend DTO/service expectations
- possible mismatch around `costPrice`, `taxRate`, `categoryId`, or legacy alias handling

**Likely files**

- [products/[productId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/products/[productId]/page.tsx)
- [masters/hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/masters/hooks.ts)
- [products.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/products/products.service.ts)
- [update-product.dto.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/products/dto/update-product.dto.ts)

---

### BF-003 Product create form does not expose category selection

**Severity**: Medium  
**Area**: Masters  
**Route**: `/c/{companyId}/masters/products/new`

**Observed**

- create form has no category field

**Likely root cause**

- category support is missing from the form UI

**Likely files**

- [products/new/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/masters/products/new/page.tsx)
- [masters/hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/masters/hooks.ts)

---

### BF-004 Success and error feedback is inconsistent and not global

**Severity**: Medium  
**Area**: Cross-cutting UX

**Observed**

- product edit failure is shown as a local inline error block
- role create success is shown as page-local success text
- no consistent global success/error toast pattern is visible

**Likely root cause**

- pages are using ad hoc local state messages rather than a shared notification mechanism

**Likely files**

- multiple page-level forms
- shared toast infra and page-local mutation handlers

---

### BF-005 Ledger names are blank in accounting dropdowns

**Severity**: High  
**Area**: Accounting  
**Route**: `/c/{companyId}/accounting/journals`

**Observed**

- ledger dropdown options render blank labels

**Likely root cause**

- combobox/select items are mapped to the wrong label field

**Likely files**

- [accounting/journals/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/journals/page.tsx)
- accounting hooks or ledger option mapping helpers

---

### BF-006 Date fields use plain textboxes instead of date pickers

**Severity**: Medium  
**Area**: Cross-cutting UX

**Observed**

- date inputs across accounting, invoices, and purchases are plain textboxes with placeholder-style labels

**Likely root cause**

- no shared date picker component has been rolled out to these forms

**Examples reproduced**

- accounting journals
- invoice detail payment and credit note forms
- purchases create form

---

### BF-007 Dropdowns use basic/native selectors instead of proper select UI

**Severity**: Medium  
**Area**: Cross-cutting UX

**Observed**

- many forms use native select/combobox controls

**Likely root cause**

- design-system select component has not been adopted consistently

**Examples reproduced**

- accounting journals
- invoice detail actions
- purchases create form

---

### BF-008 Invoice payment section does not show recorded payments

**Severity**: High  
**Area**: Sales  
**Route**: `/c/{companyId}/sales/invoices/{invoiceId}`

**Observed**

- invoice is marked paid
- lifecycle history shows payment recorded
- payments table remains empty

**Likely root cause**

- payment list parsing uses wrong response nesting before filtering by `invoiceId`

**Likely files**

- [sales/invoices/[invoiceId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/invoices/[invoiceId]/page.tsx)
- [billing/hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/billing/hooks.ts)

---

### BF-009 Wide table handling is weak

**Severity**: Medium  
**Area**: Cross-cutting UX

**Observed**

- many list/report/admin screens rely on raw tables with weak handling for wide datasets
- truncation and cramped rendering risk is high when more columns are present

**Likely root cause**

- shared data-table pattern is not enforcing a robust overflow and column-width strategy

---

### BF-010 Purchases list renders empty despite expected data

**Severity**: High  
**Area**: Purchases  
**Route**: `/c/{companyId}/purchases`

**Observed**

- UI shows `0 total` and `No purchases`
- create page loads successfully

**Likely root cause**

- same response-shape parsing issue as invoices list

**Likely files**

- [purchases/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/purchases/page.tsx)
- [billing/hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/billing/hooks.ts)

---

### BF-011 Company settings incorrectly shows `Company not found`

**Severity**: High  
**Area**: Settings  
**Route**: `/c/{companyId}/settings/company`

**Observed**

- page shell loads
- content resolves to `Company not found`

**Likely root cause**

- component expects `company.data?.data.data` while hook returns a shallower shape

**Likely files**

- [settings/company/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/company/page.tsx)
- [settings/companyHooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/settings/companyHooks.ts)

---

### BF-012 Custom roles are created but still not shown in the list

**Severity**: High  
**Area**: Settings  
**Route**: `/c/{companyId}/settings/roles`

**Observed**

- custom role creation reports success
- list still shows `0 custom roles`

**Likely root cause**

- component expects a deeper response nesting than the roles hook returns

**Likely files**

- [settings/roles/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/roles/page.tsx)
- [settings/usersHooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/settings/usersHooks.ts)

---

## Fix Order

### Wave 1: Response-shape and rendering correctness

Fix first:

1. `BF-001` invoices list
2. `BF-010` purchases list
3. `BF-008` invoice payment section
4. `BF-011` company settings
5. `BF-012` custom roles list

**Reason**

- these are likely the same category of defect
- they affect core workflow visibility
- they are likely low-risk, high-return fixes

**Status**

- Completed on 2026-03-23 for:
  - `BF-001`
  - `BF-008`
  - `BF-010`
  - `BF-011`
  - `BF-012`

---

### Wave 2: Product form correctness

Fix next:

1. `BF-002` product update `400`
2. `BF-003` add category selector to product create
3. add category selector to product edit if also missing in implementation

**Reason**

- product maintenance is core master data
- broken product update blocks normal operations

**Status**

- Completed on 2026-03-23 for:
  - `BF-002`
  - `BF-003`

**Implementation notes**

- product update failure was caused by backend DTO validation rejecting fields that the UI already used under `forbidNonWhitelisted`
- the backend now accepts the current master-data shape for GST rate and reorder level
- product create and edit now both expose category selection

---

### Wave 3: Accounting form correctness

Fix next:

1. `BF-005` ledger label mapping

**Reason**

- this is a functional defect on a financial workflow

**Status**

- Completed on 2026-03-23 for:
  - `BF-005`

**Implementation notes**

- the accounting ledger API returns `account_name`
- the shared ledger hook now normalizes that into a `name` field so journal and ledger screens render readable labels consistently

---

### Wave 4: Shared UX system improvements

Implement next:

1. `BF-004` global toast pattern
2. `BF-006` date picker rollout
3. `BF-007` proper selector rollout
4. `BF-009` wide table/grid improvements

**Reason**

- these are broader design-system changes and should be done deliberately after the blocking correctness fixes

**Status**

- Completed on 2026-03-23 for:
  - `BF-004`
  - `BF-006`
  - `BF-007`
  - `BF-009`

**Implementation notes**

- success and error handling was standardized around the already-mounted global `sonner` toaster instead of continuing with page-local success text and `window.alert`
- shared `DateField` and `SelectField` primitives were rolled out to the main affected workflow pages so date and selector behavior is now consistent with the current form architecture
- the shared table shell now enforces horizontal overflow, and the purchases draft line-items table now has an explicit minimum width so dense columns remain usable instead of collapsing
- browser validation confirmed:
  - toast feedback appears after payment recording and notification template creation
  - payment, invoice-detail, purchase-create, and notification-settings screens now use the shared selector/date control pattern
  - wide payment and purchase tables remain operable after the overflow handling changes

---

## Validation Checklist After Each Fix Wave

### After Wave 1

- invoices list shows seeded or newly created invoices
- purchases list shows seeded or newly created purchases
- invoice detail payment table shows recorded payment rows
- company settings renders company data instead of empty state
- custom roles list updates after role creation

### After Wave 2

- product update succeeds without `400`
- product create includes category selector
- created product stores selected category
- product edit also preserves or updates category correctly

### After Wave 3

- accounting journal dropdowns show readable ledger labels
- journal create/edit uses correct ledger selection and remains functional

### After Wave 4

- key create/update forms show consistent success/error toasts
- date fields use a proper date picker or date input component consistently
- core dropdowns use shared selector UI
- wide list/report tables are horizontally usable without unreadable truncation

---

## Architectural Guardrails For The Fix Pass

- do not introduce one-off response parsing per page if a shared hook normalization layer can solve it
- prefer fixing hook return normalization where multiple screens depend on the same payload shape
- keep backend contract changes minimal unless the product-update `400` proves to be a real API issue
- for shared UX primitives, prefer existing shared component paths over page-local custom widgets
- retest each fixed issue in the browser before moving to the next wave

---

## Recommended Next Step

Start with Wave 1 and fix the response-shape/rendering defects in the following implementation order:

1. [billing/hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/billing/hooks.ts)
2. [sales/invoices/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/invoices/page.tsx)
3. [purchases/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/purchases/page.tsx)
4. [sales/invoices/[invoiceId]/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/sales/invoices/[invoiceId]/page.tsx)
5. [settings/company/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/company/page.tsx)
6. [settings/roles/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/settings/roles/page.tsx)
