Testing Strategy & Quality Gates
================================

Primary references
- Manual end-to-end checklist: [E2E_MANUAL_TEST_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/E2E_MANUAL_TEST_PLAN.md)
- Local unit/integration spec: [LOCAL_UNIT_AND_INTEGRATION_TESTING_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/LOCAL_UNIT_AND_INTEGRATION_TESTING_SPEC.md)
- Current implementation baseline: [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)

CI Gates
- Lint (ESLint + Prettier)
- Typecheck (TypeScript)
- Unit tests (Jest) — run fast, mocks for DB
- Integration tests — use a test Postgres/Redis (docker) for critical flows
- E2E tests (Playwright/Cypress) for UI flows
- Production build checks for API and web

Minimum checks for PR
- Lint: PASS
- Unit tests: PASS
- Integration smoke: create invoice -> generate PDF -> record payment
- Platform smoke: notifications outbox -> file upload/download -> admin audit visibility
- Web build: `npx next build --webpack`

Test categories
- Unit tests: TaxEngine, InvoiceNumberService, Tax calculations, rounding
- Integration tests: Invoicing flow (DB transaction), Payment flow, Stock decrements
- E2E: Login, Create customer, Create product, Create invoice, Download PDF, Record payment, POS route/receipt
- Reports:
  - API contract tests for sales summary, purchases summary, outstanding, top products, profit snapshot, GST summary, and accounting statements
  - Web smoke for reports hub, business reports, GST compliance center, and accounting report pages
  - Distributor V2 smoke for quotations, sales orders, warehouses, transfers, and distributor analytics

Sample unit test cases
- TaxEngine: intra-state vs inter-state tax splits
- InvoiceNumberService: concurrent reserve -> unique numbering
- StockService: concurrent sales should not allow negative stock when disallowed
- ReportsService: normalized DTOs for business reports
- AccountingService: trial balance totals, P&L sections, balance-sheet integrity summary

Test data & fixtures
- Use factory pattern and transactional tests (rollback after test) or test DB snapshots.

Local test run (example)
```bash
npm ci
npm --workspace apps/api run test
npm --workspace apps/api run test:e2e
npm --workspace apps/web run test:e2e
```

Distributor V2 demo/QA setup
```bash
npm --workspace apps/api run seed:auth
npm --workspace apps/api run seed:distributor
npm --workspace apps/web run test:e2e -- --list tests/distributor-v2.spec.ts
```

Coverage targets
- Critical modules >= 80%
- GST tax-split logic must have deterministic fixture coverage
- Accounting posting logic must have source-linked regression coverage
- Platform integrations must cover billing signature validation, files, notifications, and auditability
- Reporting module must cover empty periods, receivables, GST outputs, and accounting statement contracts

Monitoring tests
- Add synthetic monitors for uptime and key APIs (login, create invoice) via external monitor.

Report performance review
- Business reports should keep query shapes bounded:
  - `sales/outstanding`: paginated with indexed invoice ordering
  - `sales/top-products`: bounded by `limit`
  - GST workspaces: summary-oriented fetches, export jobs for file generation
- For high-volume tenants, validate realistic seeded datasets before release:
  - 10k+ invoices for outstanding and top-products
  - mixed intra-state/inter-state GST rows
  - multi-month journal datasets for accounting statements
