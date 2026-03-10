Examples: API payloads and sample responses
=========================================

Create Invoice - Request
POST /api/companies/:cid/invoices
Body:
{
  "invoice_type": "tax_invoice",
  "date": "2026-03-05",
  "customer_id": "c5f8a8b0-...",
  "items": [
    { "product_id": "p-111", "quantity": 2, "unit_price": 499.00 }
  ],
  "discount": 0,
  "notes": "Thank you"
}

Response 201:
{
  "data": {
    "id": "inv-111",
    "invoice_number": "INV/2026-27/0001",
    "sub_total": 998.00,
    "cgst": 44.91,
    "sgst": 44.91,
    "total": 1087.82,
    "status": "issued",
    "pdf_url": "https://s3.../invoices/inv-111.pdf"
  }
}

Error Example - Insufficient stock
HTTP 422
{
  "error": { "code": "INSUFFICIENT_STOCK", "message": "Product 'ABC' has only 1 qty available" }
}

Idempotency
- Clients may pass header `Idempotency-Key: <uuid>` to make create operations idempotent.
