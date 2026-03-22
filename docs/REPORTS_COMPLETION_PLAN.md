# Reports Completion Plan

## Goal

Finish the reporting module so business, GST, and accounting reports render as product-grade report screens instead of JSON payload viewers or contract-mismatch fallbacks.

## Current assessment

### Business reports

- [sales-summary/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/sales-summary/page.tsx)
  - UI expects `gross_sales`, `net_sales`, `invoices_count`, `average_invoice`
  - API returns `count`, `sub_total`, `tax_total`, `total`, `amount_paid`, `balance_due`
  - Result: page falls back to raw JSON

- [purchases-summary/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/purchases-summary/page.tsx)
  - UI expects `gross_purchases`, `net_purchases`, `purchases_count`, `average_purchase`
  - API returns `count`, `sub_total`, `tax_total`, `total`
  - Result: page falls back to raw JSON

- [outstanding/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/outstanding/page.tsx)
  - API returns full invoice rows with nested customer
  - UI expects normalized rows with `invoice_id`, `customer_name`, `amount_due`
  - Result: screen is fragile and partially mismatched

- [top-products/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/top-products/page.tsx)
  - API already returns a usable normalized list
  - UI still renders JSON payload instead of a leaderboard table

- [profit-snapshot/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/profit-snapshot/page.tsx)
  - UI expects `revenue`, `cogs`, `gross_profit`, `net_profit`
  - API returns `revenue`, `purchases`, `gross_profit_estimate`, `note`
  - Result: page falls back to raw JSON

### GST reports

- [gstr1/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/gst/gstr1/page.tsx)
  - better than the business-report pages
  - still relies on payload preview blocks instead of shaped tables and filing-oriented sections
  - currently one route is multiplexing `GSTR-1`, `GSTR-3B`, `HSN`, and `ITC`

### Accounting reports

- [profit-loss/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/reports/profit-loss/page.tsx)
  - raw JSON fallback remains

- [balance-sheet/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/reports/balance-sheet/page.tsx)
  - raw JSON fallback remains

- [trial-balance/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/reports/trial-balance/page.tsx)
  - structurally closest to complete
  - still needs totals, export hooks, and drilldown affordances

## Root causes

1. Report contracts were never normalized between backend and frontend.
2. Several pages were shipped with intentional JSON fallback blocks and never revisited.
3. The reports API mixes summary-style responses and raw record lists without shared view models.
4. Accounting and GST reports still lack route-by-route presentation rules and acceptance criteria.

## Execution plan

### Phase R1 — Lock report contracts

Status: Completed on 2026-03-22

Owner: API + web together

Deliverables:
- Define canonical response DTOs for every report route
- Stop relying on implicit Prisma row shapes in the frontend
- Update [reports.service.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/api/src/reports/reports.service.ts) and [hooks.ts](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/lib/reports/hooks.ts) to those DTOs

Required contract decisions:
- Sales summary:
  - `gross_sales`
  - `tax_total`
  - `net_sales`
  - `invoices_count`
  - `average_invoice`
  - `amount_paid`
  - `balance_due`
- Purchases summary:
  - `gross_purchases`
  - `tax_total`
  - `net_purchases`
  - `purchases_count`
  - `average_purchase`
- Outstanding:
  - normalized rows with invoice number, customer name, issue date, due date, total, amount paid, amount due, overdue days
- Top products:
  - normalized rows already close to done; lock exact fields and totals
- Profit snapshot:
  - explicitly rename to estimated profitability fields unless true COGS is available

Acceptance:
- no business-report page should need a JSON fallback to function

### Phase R2 — Finish business-report screens

Status: Completed on 2026-03-22

Owner: web

Deliverables:
- Replace JSON fallback blocks with proper report layouts on:
  - [sales-summary/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/sales-summary/page.tsx)
  - [purchases-summary/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/purchases-summary/page.tsx)
  - [top-products/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/top-products/page.tsx)
  - [profit-snapshot/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/reports/profit-snapshot/page.tsx)
- Upgrade outstanding into a proper receivables table with links into invoice detail

UI requirements:
- summary cards
- normalized table/list sections
- empty states
- filter bars
- drilldowns to invoice, purchase, or product pages

Acceptance:
- all business reports are readable without opening dev tools or inspecting raw payloads

### Phase R3 — Finish GST report presentation

Status: Completed on 2026-03-22

Owner: web first, API as needed

Deliverables:
- Keep the unified GST workspace if desired, but replace payload previews with shaped sections:
  - GSTR-1 summary cards + B2B/B2C tables + credit-note table + HSN summary table
  - GSTR-3B outward/ITC/liability blocks
  - HSN table
  - ITC eligibility breakdown table
- Add clearer export history/status presentation for GST export jobs
- Decide whether `gstr1/page.tsx` remains a multiplexer or splits into route-per-report

Acceptance:
- GST screens behave like filing workspaces, not JSON viewers

### Phase R4 — Finish accounting reports

Status: Completed on 2026-03-22

Owner: API + web

Deliverables:
- Normalize accounting report response contracts for:
  - trial balance
  - profit & loss
  - balance sheet
- Replace JSON fallbacks in:
  - [profit-loss/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/reports/profit-loss/page.tsx)
  - [balance-sheet/page.tsx](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/apps/web/src/app/(app)/c/[companyId]/accounting/reports/balance-sheet/page.tsx)
- Add totals and closing-balance treatment in trial balance

Important note:
- because accounting is now auto-posted, these screens should be treated as release-critical finance outputs, not optional polish

Acceptance:
- accounting report pages render shaped statements and totals without JSON blocks

### Phase R5 — Tests, performance, and release readiness

Status: Completed on 2026-03-22

Owner: API + web

Deliverables:
- API tests for every report contract
- frontend tests for report rendering and filter behavior
- add report fixture coverage for:
  - empty periods
  - paid vs unpaid invoices
  - purchases-only periods
  - GST intra-state vs inter-state scenarios
- performance review on large report queries:
  - invoice lists
  - outstanding
  - top products
  - GST report builders

Acceptance:
- reports are protected by regression tests and remain usable at realistic data volume

## Recommended implementation order

1. Normalize backend contracts for sales summary, purchases summary, outstanding, top products, and profit snapshot
2. Update report hooks with typed response models
3. Finish the five business report pages
4. Finish accounting report contracts and pages
5. Replace GST payload preview with shaped GST sections
6. Add report-specific API and UI tests

## Fastest path to visible improvement

If you want the quickest user-facing improvement first, do this order:

1. sales summary
2. purchases summary
3. top products
4. outstanding
5. profit snapshot

That removes most of the current JSON-style report experience with the least backend churn.
