# POS / Printing / Offline (MVP lock)

**Status**: Draft (spec addendum)

## MVP decision (locked)

- **Printing**: Browser print only (no ESC/POS agent in MVP).
- **Offline**: Disabled in MVP.

Rationale: keeps initial build simple and cross-platform.

## Printing formats

### A4 invoice
- Use HTML → PDF (server-side via Puppeteer)
- Include:
  - company header + GSTIN/PAN
  - invoice number + date + place of supply
  - customer details
  - line items table
  - tax breakup
  - totals with round-off
  - QR/UPI (optional)

### Thermal receipt (58/80mm)
- Use a dedicated CSS print stylesheet:
  - fixed width (58mm / 80mm)
  - large fonts for totals
  - condensed table layout
- Trigger via browser print dialog.

## Barcode scanner behavior

- Barcode entry is treated as **keyboard input** ending with `Enter`.
- POS product search field must:
  - keep focus
  - accept rapid keystrokes
  - on `Enter`, attempt exact barcode match first, else fallback to SKU search.

## POS flow constraints

- Fast add-to-cart:
  - scanning barcode adds quantity +1
  - manual override allowed
- Pricing:
  - default from `products.selling_price`
  - allow line discount (permission-gated)

## Offline mode (future phase)

When enabled later:
- Cache product catalog into IndexedDB.
- Queue invoice drafts locally.
- On reconnect:
  - sync in order, using Idempotency-Key
  - resolve conflicts: server is source of truth; if invoice number allocated server-side, local temp numbers must be replaced.

## Open decisions (before Phase 08)

- Do we need cashier shift open/close and cash reconciliation?
- Do we need ESC/POS direct printing (local agent) for Windows?
