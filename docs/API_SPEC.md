API Specification - GST Billing SaaS
=================================

Auth
- All APIs under `/api` require Authorization: `Bearer <access_token>` except public onboarding endpoints.
- Tokens: JWT access token (short TTL) + refresh token endpoint.

Response Envelope
- Success: { "data": <any>, "meta"?: {...} }
- Error: { "error": { "code": "STRING_CODE", "message": "Human readable", "details"?: {} } }

Common query params
- pagination: `?page=1&limit=20`
- search: `?q=term`
- date range: `?from=YYYY-MM-DD&to=YYYY-MM-DD`

Auth Endpoints
- POST /api/auth/login
  - Body: { email, password }
  - 200: { data: { access_token, refresh_token, user, company } }

- POST /api/auth/refresh
  - Body: { refresh_token }
  - 200: { data: { access_token } }

Company / Onboarding
- POST /api/companies
  - Body: { name, gstin, pan, business_type, address, state, bank_details, invoice_settings }
  - 201: { data: company }

- POST /api/companies/:id/verify-gstin
  - Body: {}
  - 202: { data: { status: 'verification_started' } }

Users
- GET /api/companies/:cid/users?page=&limit=
  - 200: { data: [users], meta }
- GET /api/companies/:cid/users/salespeople
  - 200: { ok: true, data: [active assignable salespeople] }
- POST /api/companies/:cid/users
  - Body: { email, name, role }
  - 201: { data: user }

Customers
- GET /api/companies/:cid/customers?page=&limit=&q=
  - 200: { data: [customers], meta }
- POST /api/companies/:cid/customers
  - Body: { name, gstin, mobile, email, billing_address, shipping_address, salesperson_user_id? }
  - 201: { data: customer }

Products
- GET /api/companies/:cid/products?page=&limit=&q=&category=&low_stock_only=
  - 200: { data: [products], meta }
- POST /api/companies/:cid/products
  - Body: { sku, name, hsn_code, unit, gst_percent, purchase_price, selling_price, stock_qty, barcode, category_id }
  - 201: { data: product }

Invoices
- POST /api/companies/:cid/invoices
  - Body: {
      invoice_type, date, due_date, customer_id, items: [ { product_id, description?, quantity, unit_price, discount? } ], discounts?, notes?, series?
    }
  - Validations: product existence, stock (if enforced), customer existence
  - 201: { data: invoice }

- GET /api/companies/:cid/invoices/:id
  - 200: { data: invoice }

- POST /api/companies/:cid/invoices/:id/payments
  - Body: { amount, method, reference, payment_date? }
  - 201: { data: payment }

- POST /api/companies/:cid/invoices/:id/send
  - Body: { email?, whatsapp_number?, message? }
  - 202: { data: { status: 'queued' } }

Purchases
- POST /api/companies/:cid/purchases
  - Body: { supplier_id, bill_number, date, items: [ { product_id, batch_id?, quantity, unit_price, gst_percent } ], notes }
  - 201: { data: purchase }

Distributor V2
- GET /api/companies/:cid/quotations?page=&limit=&q=&status=&customer_id=&from=&to=
- POST /api/companies/:cid/quotations
  - Body accepts optional `salesperson_user_id`
- GET /api/companies/:cid/quotations/:quotationId
- PATCH /api/companies/:cid/quotations/:quotationId
  - Body accepts optional `salesperson_user_id`
- POST /api/companies/:cid/quotations/:quotationId/send
- POST /api/companies/:cid/quotations/:quotationId/approve
- POST /api/companies/:cid/quotations/:quotationId/expire
- POST /api/companies/:cid/quotations/:quotationId/cancel
- POST /api/companies/:cid/quotations/:quotationId/convert-to-invoice
  - Converts a quotation into a draft invoice and stores `quotation_id` on the invoice
- POST /api/companies/:cid/quotations/:quotationId/convert-to-sales-order
- GET /api/companies/:cid/sales-orders?page=&limit=&q=&status=&from=&to=
- POST /api/companies/:cid/sales-orders
  - Body accepts optional `salesperson_user_id`
- GET /api/companies/:cid/sales-orders/:salesOrderId
- PATCH /api/companies/:cid/sales-orders/:salesOrderId
  - Body accepts optional `salesperson_user_id`
- POST /api/companies/:cid/sales-orders/:salesOrderId/confirm
- POST /api/companies/:cid/sales-orders/:salesOrderId/cancel
- POST /api/companies/:cid/sales-orders/:salesOrderId/convert-to-invoice
  - Converts full or partial remaining order quantity into a draft invoice and updates order fulfillment
- GET /api/companies/:cid/warehouses?page=&limit=&q=&active_only=
- POST /api/companies/:cid/warehouses
- PATCH /api/companies/:cid/warehouses/:warehouseId
- GET /api/companies/:cid/warehouses/:warehouseId/stock?page=&limit=&q=
- GET /api/companies/:cid/stock-transfers?page=&limit=&status=
- GET /api/companies/:cid/stock-transfers/:transferId
- POST /api/companies/:cid/stock-transfers
- POST /api/companies/:cid/stock-transfers/:transferId/dispatch
- POST /api/companies/:cid/stock-transfers/:transferId/receive
- POST /api/companies/:cid/stock-transfers/:transferId/cancel

Reports
- GET /api/companies/:cid/reports/gstr1?from=&to=&format=json|excel
  - 200: { data: <file url / json> }

- GET /api/companies/:cid/reports/stock?valuation_method=FIFO
  - 200: { data: [ { product_id, stock_qty, valuation } ] }

Errors
- 400 BAD_REQUEST: input validation
- 401 UNAUTHORIZED: missing/invalid token
- 403 FORBIDDEN: insufficient permissions
- 404 NOT_FOUND: resource
- 409 CONFLICT: duplicate invoice number or concurrency
- 422 UNPROCESSABLE_ENTITY: business rule violation (eg: INSUFFICIENT_STOCK)

Pagination meta
- { total, page, limit }

Notes
- Use standard OpenAPI (Swagger) doc generator from controllers.
- Protect all endpoints by tenant scoping: Controllers must ensure company_id in path matches user's company_id or the user has super-admin rights.

-------------------------------
Extended API Coverage (Build-ready)
-------------------------------

Conventions
- All endpoints are tenant-scoped via `:cid` unless marked as SUPER-ADMIN.
- Use `Idempotency-Key` header for create operations (invoice, payment, purchase, credit note).
- Use `If-Match` with entity `etag` for optimistic concurrency on updates (optional but recommended).

Companies
- GET /api/companies/:id
- PATCH /api/companies/:id
- POST /api/companies/:cid/logo (multipart) -> stores in `files` table
- GET /api/companies/:cid/invoice-series
- POST /api/companies/:cid/invoice-series
- PATCH /api/companies/:cid/invoice-series/:seriesId

RBAC
- GET /api/companies/:cid/roles
- POST /api/companies/:cid/roles
- PATCH /api/companies/:cid/roles/:roleId
- GET /api/companies/:cid/permissions
- POST /api/companies/:cid/users/:userId/role { role_id }

Suppliers
- GET /api/companies/:cid/suppliers?page=&limit=&q=
- POST /api/companies/:cid/suppliers
- GET /api/companies/:cid/suppliers/:id
- PATCH /api/companies/:cid/suppliers/:id
- DELETE /api/companies/:cid/suppliers/:id
- GET /api/companies/:cid/suppliers/:id/ledger?from=&to=

Customers (extended)
- GET /api/companies/:cid/customers/:id
- PATCH /api/companies/:cid/customers/:id
- DELETE /api/companies/:cid/customers/:id
- GET /api/companies/:cid/customers/:id/ledger?from=&to=

Products & Inventory
- PATCH /api/companies/:cid/products/:id
- DELETE /api/companies/:cid/products/:id
- POST /api/companies/:cid/products/:id/stock-adjustment
  - Body: { change_qty, reason, warehouse_id?, effective_at? }
  - Writes `stock_movements` with source_type=manual

- GET /api/companies/:cid/stock-movements?product_id=&warehouse_id=&from=&to=&page=&limit=
- GET /api/companies/:cid/inventory/low-stock?threshold=

Invoices (full lifecycle)
- GET /api/companies/:cid/invoices?page=&limit=&q=&status=&from=&to=
- POST /api/companies/:cid/invoices
  - Body accepts optional `warehouse_id` and `salesperson_user_id`
- PATCH /api/companies/:cid/invoices/:id
  - Allowed only when status=draft (configurable)
- POST /api/companies/:cid/invoices/:id/issue
  - Transition: draft -> issued
- POST /api/companies/:cid/invoices/:id/cancel
  - Transition: issued -> cancelled (reverses stock/journals)
- POST /api/companies/:cid/invoices/:id/pdf/regenerate
- GET /api/companies/:cid/invoices/:id/pdf (redirect/signed url)

Jobs (async)
- GET /api/companies/:cid/jobs/:jobId

Credit notes / Sales returns
- POST /api/companies/:cid/invoices/:id/credit-notes
  - Body: { date, reason, items:[{product_id, quantity, unit_price?}], adjust_stock: true|false }
- GET /api/companies/:cid/adjustments?type=credit_note|sales_return&from=&to=

Payments
- GET /api/companies/:cid/payments?from=&to=&method=&page=&limit=
- POST /api/companies/:cid/payments
  - Body: { invoice_id?, purchase_id?, amount, method, reference, payment_date? }

Purchases
- GET /api/companies/:cid/purchases?page=&limit=&q=&from=&to=
- POST /api/companies/:cid/purchases
  - Body accepts optional `warehouse_id`
- GET /api/companies/:cid/purchases/:id
- PATCH /api/companies/:cid/purchases/:id
- POST /api/companies/:cid/purchases/:id/cancel
- POST /api/companies/:cid/purchases/:id/returns
  - Body: { date, reason, items:[{product_id, quantity}], adjust_stock: true }
- POST /api/companies/:cid/purchases/:id/bill-upload (multipart)

Reports (business)
- GET /api/companies/:cid/reports/sales-summary?from=&to=&group_by=day|month
- GET /api/companies/:cid/reports/purchase-summary?from=&to=&group_by=day|month
- GET /api/companies/:cid/reports/distributor/sales-by-salesperson?from=&to=
- GET /api/companies/:cid/reports/distributor/collections-by-salesperson?from=&to=
- GET /api/companies/:cid/reports/distributor/outstanding-by-salesperson?as_of=
- GET /api/companies/:cid/reports/distributor/outstanding-by-customer?as_of=
- GET /api/companies/:cid/reports/distributor/stock-by-warehouse
- GET /api/companies/:cid/reports/distributor/product-movement?from=&to=&limit=
- GET /api/companies/:cid/reports/distributor/dashboard?from=&to=&as_of=
- GET /api/companies/:cid/reports/customer-outstanding?as_of=
- GET /api/companies/:cid/reports/vendor-outstanding?as_of=
- GET /api/companies/:cid/reports/top-products?from=&to=&limit=10
- GET /api/companies/:cid/reports/profit?from=&to=

GST Reports (compliance)

Implemented (Phase 05 MVP)
- POST /api/companies/:cid/exports/gstr1
  - Body: { from, to }
  - Response: persisted export job (CSV written to local storage)
- GET /api/companies/:cid/exports/:jobId
- GET /api/companies/:cid/exports/:jobId/download

Planned (not implemented yet)
- GET /api/companies/:cid/gst/gstr1?from=&to=&format=json|excel
- GET /api/companies/:cid/gst/gstr3b?from=&to=&format=json|excel
- GET /api/companies/:cid/gst/hsn-summary?from=&to=&format=json|excel
- GET /api/companies/:cid/gst/itc?from=&to=&format=json|excel
- POST /api/companies/:cid/gst/export
  - Body: { report: 'gstr1'|'gstr3b'|'hsn'|'itc', from, to, format }
  - 202: queued, returns export job id

See: `todo/planned/PHASE_05_1_GST_ENGINE_FULL_REQUIREMENTS.md`

Accounting
- GET /api/companies/:cid/ledgers
- POST /api/companies/:cid/ledgers
- GET /api/companies/:cid/journals?from=&to=&page=&limit=
- GET /api/companies/:cid/reports/trial-balance?as_of=
- GET /api/companies/:cid/reports/profit-loss?from=&to=
- GET /api/companies/:cid/reports/balance-sheet?as_of=
- GET /api/companies/:cid/books/cash?from=&to=
- GET /api/companies/:cid/books/bank?from=&to=

See also:
- `docs/D1_QUOTATIONS_IMPLEMENTATION_SPEC.md`

Notifications
- GET /api/companies/:cid/notification-templates
- POST /api/companies/:cid/notification-templates
- PATCH /api/companies/:cid/notification-templates/:id
- POST /api/companies/:cid/notifications/test
  - Body: { template_code, channel, to_address, sample_payload }

Files
- POST /api/companies/:cid/files/sign-upload
  - Body: { type, mime_type, size_bytes }
  - Response: { upload_url, file_id }
- GET /api/companies/:cid/files/:id (signed URL)

SaaS Billing
- GET /api/companies/:cid/subscription
- POST /api/companies/:cid/subscription/checkout
- POST /api/billing/webhooks/razorpay (public webhook)
- POST /api/billing/webhooks/stripe (public webhook)

SUPER-ADMIN
- GET /api/admin/companies?page=&limit=&q=
- GET /api/admin/subscriptions?page=&limit=&status=
- GET /api/admin/usage?from=&to=
- GET /api/admin/support-tickets

Admin (ops)
- GET /api/admin/queues/metrics
- PATCH /api/admin/support-tickets/:id

Webhook security
- Verify provider signatures. Store all webhook payloads in `webhook_events` to support retries and support audits.
