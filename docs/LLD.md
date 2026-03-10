Low-Level Design (LLD) and Service Flows
=======================================

Overview
- Architecture: API server (NestJS), Workers (BullMQ), Frontend (Next.js), DB (Postgres), Cache (Redis), Storage (S3).
- Modules: Auth, Company, Users, Customers, Suppliers, Products, Inventory, Invoicing, Purchases, Payments, Accounting, Reports, Notifications, Admin, Billing.

Hard-spec addenda (canonical)
- GST portal export mappings (versioned): `GST_PORTAL_MAPPINGS.md`
- Accounting rulebook (COA, posting rules, rounding): `ACCOUNTING_RULES.md`
- POS/printing/offline decisions: `POS_PRINTING.md`

Module responsibilities
- Auth: JWT, refresh tokens, password hashing, MFA, session management.
- Company: onboarding, GSTIN verification, invoice settings, series management.
- Products: CRUD, barcode, HSN, stock snapshot, search index.
- Inventory: stock movements, batch handling, valuation methods (FIFO, WeightedAvg, LIFO).
- Invoicing: invoice creation, validation, tax calculation, invoice numbering, PDF generation, sending.
- Accounting: ledger accounts, journal entries, trial balance, P&L.
- Reports: GSTR exporters, HSN summary, tax liability, stock reports.
- Notifications: email/whatsapp/sms queueing and templates.

Services & Utilities
- TaxEngine
  - Input: company state_code, customer state_code, line taxable_value, gst_percent
  - Output: { gst_type, cgst, sgst, igst }

- InvoiceNumberService
  - uses invoice_series row for company; increments next_number atomically in DB transaction

- StockService
  - adjustStock(productId, delta, sourceType, sourceId)
  - write stock_movements and update products.stock_qty

- LedgerService
  - createJournal(refType, refId, date, narration, lines[{ledger_id,debit,credit}])

Sequence: Create Invoice (happy path)
1. Client sends POST /companies/:cid/invoices with invoice payload.
2. API Controller authenticates user and checks permissions.
3. Controller calls InvoicingService.createInvoice(payload, user).
4. InvoicingService:
   a. Start DB transaction.
   b. Validate customer, products exist and belong to company.
   c. For each item: compute taxable_value = qty * unit_price - discount.
   d. Call TaxEngine to compute cgst/sgst/igst per-line.
   e. Sum totals: sub_total, taxes, total before round.
   f. InvoiceNumberService reserves invoice_number (increment series atomically).
   g. Persist invoice and invoice_items rows.
   h. Call StockService to decrement stock (if sales affects stock) and create stock_movements.
   i. Call LedgerService to create journal entries: 
      - Debit Accounts Receivable, Credit Sales (and Credit Tax Payable)
   j. Commit transaction.
5. Emit event invoice.created to event bus.
6. Worker consumes event:
   - Generate PDF (Puppeteer) with company template -> upload to S3 -> update invoice.pdf_url.
   - Send email/WhatsApp if requested.

Sequence: Record Payment
1. POST /companies/:cid/invoices/:id/payments
2. Controller validates amount and invoice status.
3. PaymentService starts transaction, creates payment row.
4. Update invoice outstanding or status to paid if fully settled.
5. LedgerService: Debit Bank/Cash ledger; Credit Accounts Receivable.
6. Emit event payment.received for notifications and reconciliation.

Concurrency & Transactions
- Use DB transactions for invoice create + stock + journals + invoice_number increment.
- For heavy concurrency on invoice_number, use SELECT FOR UPDATE on invoice_series row or a DB sequence per company.

Idempotency
- Provide an Idempotency-Key header for create operations to avoid double invoices on retry. Store recent idempotency keys per company.

Error handling
- Return structured errors with codes. Example: { code: 'INSUFFICIENT_STOCK', message: 'Product X has only 2 qty' }

Extensibility
- Add new modules (e.g., AI OCR) as independent services that consume events (invoice.image_uploaded) and write draft invoices for user review.

Developer notes
- Keep service boundaries thin; controllers only validate and delegate to services.
- Use class-validator and DTOs for request validation.

---------------------------------
Additional Flows (required for 0→100%)
---------------------------------

Sequence: Purchase Entry (with input tax / ITC)
1. Client POST /companies/:cid/purchases with supplier + item lines.
2. PurchaseService starts DB transaction.
3. Validate supplier exists; products exist.
4. Compute totals + GST for each item (input taxes).
5. Persist purchases + purchase_items.
6. StockService increments stock per item; create stock_movements(source_type=purchase).
7. LedgerService posts:
  - Debit Inventory/COGS accounts (or Inventory Asset)
  - Debit Input GST (CGST/SGST/IGST ITC ledgers)
  - Credit Accounts Payable (supplier) or Cash/Bank if paid
8. Commit. Emit event purchase.created.
9. If bill image uploaded, FileService stores reference in `files`.

Sequence: Purchase Return
1. POST /companies/:cid/purchases/:id/returns
2. PurchaseReturnService: transaction.
3. Validate quantities returned <= received.
4. Decrement stock, write stock_movements(source_type=purchase_return).
5. Create adjustment document (similar structure to invoice_adjustments).
6. LedgerService reverses ITC and adjusts payable.

Sequence: Manual Stock Adjustment
1. POST /companies/:cid/products/:id/stock-adjustment
2. InventoryService validates permissions.
3. Transaction: update products.stock_qty, insert stock_movements(source_type=manual).
4. Ledger posting optional (configurable): stock loss/gain account entries.

Sequence: Cancel Invoice
1. POST /companies/:cid/invoices/:id/cancel
2. Validate business rules: can cancel if unpaid or within allowed window.
3. Transaction:
  - Mark invoice status=cancelled
  - Reverse stock_movements for that invoice (increment stock)
  - Create reversing journal entry lines
4. Emit invoice.cancelled event.

Sequence: Credit Note / Sales Return
1. POST /companies/:cid/invoices/:id/credit-notes
2. Validate quantities <= sold.
3. Transaction:
  - Create invoice_adjustments + items
  - Optionally adjust stock (+)
  - LedgerService: reverse revenue and tax liability proportionally
4. Emit adjustment.created.

GST Reports generation pipeline
- Goal: consistent, auditable exports.
1. Report request endpoint enqueues job with parameters (company_id, from, to, report_type, format).
2. Worker loads invoices/purchases for period.
3. Applies normalization rules:
  - status filter (exclude cancelled)
  - rounding policy (invoice-level)
  - intrastate/interstate logic
4. Builds report model:
  - GSTR-1: outward supplies, B2B/B2C, HSN summary
  - GSTR-3B: tax liability + ITC
5. Renders:
  - JSON mapping for GST portal format (versioned)
  - Excel export
6. Stores file in S3 (`files` table) and notifies user.

Subscriptions + Webhooks
1. Company initiates checkout -> BillingService creates provider session.
2. Provider webhook hits /api/billing/webhooks/*
3. WebhookController validates signature, stores record in `webhook_events`.
4. BillingService processes event idempotently:
  - create/update subscriptions row
  - set company entitlements/limits
5. Emit subscription.changed.

POS (implementation guidance)
- Frontend POS uses a fast search + barcode scan input.
- Optional offline mode:
  - Sync product catalog in IndexedDB
  - Queue invoices locally and retry on reconnect
- Printing:
  - MVP: browser print with thermal-optimized CSS
  - Advanced: ESC/POS via local print agent

Non-functional invariants (must enforce)
- Tenant isolation: every query scopes by company_id.
- Accounting: journal entries must balance (sum(debit)=sum(credit)).
- Idempotency: create endpoints accept Idempotency-Key.
- Stock policy: configurable allow_negative_stock; if false prevent stock < 0.
- Invoice numbering: atomic per series; never reuse numbers.
