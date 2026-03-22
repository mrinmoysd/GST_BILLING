# Phase F — Sales and Purchase Lifecycle Completion

**Date**: 2026-03-22

## Summary
- Goal: Close the remaining business-document lifecycle gaps so the application can handle realistic operational scenarios.
- Outcome: Added persisted corrective document models, invoice sharing logs, lifecycle event history, and the matching invoice/purchase frontend flows.

## Scope delivered
- [x] Added credit note support
- [x] Added sales return support via restocking credit notes
- [x] Added purchase return support
- [x] Added invoice send/share logging flow
- [x] Added persisted lifecycle history for invoice and purchase actions
- [x] Added better reversal transparency on invoice and purchase detail screens

## What changed
### Code
- Added Prisma models and migration for:
  - `document_credit_notes`
  - `document_credit_note_items`
  - `purchase_returns`
  - `purchase_return_items`
  - `document_shares`
  - `document_lifecycle_events`
- Added invoice endpoints for credit notes and share logging
- Added purchase endpoint for purchase returns
- Extended invoice and purchase services to include linked corrective documents and lifecycle events
- Added lifecycle event writes for issue, cancel, receive, payments, bill upload, credit notes, returns, and shares
- Upgraded invoice and purchase detail pages to expose the new flows and history

### Database / migrations
- Added migration:
  - `prisma/migrations/20260322090000_phase_f_document_lifecycle/migration.sql`

### API contract
- Added `POST /api/companies/:companyId/invoices/:invoiceId/credit-notes`
- Added `POST /api/companies/:companyId/invoices/:invoiceId/share`
- Added `POST /api/companies/:companyId/purchases/:purchaseId/returns`
- Expanded invoice detail payload with credit notes, shares, and lifecycle events
- Expanded purchase detail payload with purchase returns and lifecycle events

### UI
- Invoice detail now supports:
  - credit note creation
  - sales return creation
  - share logging
  - lifecycle history
- Purchase detail now supports:
  - purchase return creation
  - lifecycle history

## Quality gates
- Build: PASS (`npx next build --webpack`, `npm run build`)
- Lint/Typecheck: PASS (`npm run lint`, `npm run typecheck`)
- Prisma client generation: PASS (`npm run prisma:generate`)
- Unit tests: NOT RUN
- E2E/Smoke: NOT RUN

## Risks / known gaps
- Credit notes and purchase returns currently affect workflow state and inventory, but accounting automation is still deferred to Phase H
- Share flow is lifecycle logging only; real delivery providers and delivery-status tracking remain Phase I work
- Net outstanding calculations after credits/returns are surfaced in the detail UI, but deeper GST/accounting treatment still depends on later phases

## Next phase
- Phase G — GST engine and compliance exports
