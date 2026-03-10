Testing Strategy & Quality Gates
================================

CI Gates
- Lint (ESLint + Prettier)
- Typecheck (TypeScript)
- Unit tests (Jest) — run fast, mocks for DB
- Integration tests — use a test Postgres/Redis (docker) for critical flows
- E2E tests (Playwright/Cypress) for UI flows

Minimum checks for PR
- Lint: PASS
- Unit tests: PASS
- Integration smoke: create invoice -> generate PDF -> record payment

Test categories
- Unit tests: TaxEngine, InvoiceNumberService, Tax calculations, rounding
- Integration tests: Invoicing flow (DB transaction), Payment flow, Stock decrements
- E2E: Login, Create customer, Create product, Create invoice, Download PDF, Record payment

Sample unit test cases
- TaxEngine: intra-state vs inter-state tax splits
- InvoiceNumberService: concurrent reserve -> unique numbering
- StockService: concurrent sales should not allow negative stock when disallowed

Test data & fixtures
- Use factory pattern and transactional tests (rollback after test) or test DB snapshots.

Local test run (example)
```bash
npm ci
npm run test:unit
npm run test:int
```

Coverage targets
- Critical modules >= 80%

Monitoring tests
- Add synthetic monitors for uptime and key APIs (login, create invoice) via external monitor.
