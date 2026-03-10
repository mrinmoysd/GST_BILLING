# Accounting Rules (COA + posting + rounding)

**Status**: Draft (spec addendum)

This document locks the accounting rules used by the platform.

## 1) Money precision & rounding policy (MVP lock)

- Storage:
  - Money amounts: `numeric(18,2)`
  - Quantity: `numeric(18,3)`
  - Tax percent: `numeric(5,2)`
- Rounding:
  - Compute taxes **per line item**, round to 2 decimals.
  - Sum rounded lines to invoice totals.
  - `round_off` is the difference required to reach the final payable amount.

## 2) Default Chart of Accounts (COA)

Minimum ledgers required per company (created at onboarding):

### Assets
- CASH
- BANK
- ACCOUNTS_RECEIVABLE
- INVENTORY
- INPUT_CGST
- INPUT_SGST
- INPUT_IGST

### Liabilities
- ACCOUNTS_PAYABLE
- OUTPUT_CGST
- OUTPUT_SGST
- OUTPUT_IGST

### Income
- SALES

### Expenses
- PURCHASES (if using periodic inventory)
- STOCK_ADJUSTMENT_LOSS
- STOCK_ADJUSTMENT_GAIN

## 3) Posting rules (double-entry)

All postings must satisfy: **sum(debit) == sum(credit)**.

### 3.1 Invoice Issue (draft → issued)

- Debit: ACCOUNTS_RECEIVABLE = invoice.total
- Credit: SALES = invoice.taxable_value
- Credit: OUTPUT_* taxes (CGST/SGST/IGST) = invoice taxes

### 3.2 Invoice Cancel

Reverse the original journal:
- Debit: SALES and OUTPUT_* taxes
- Credit: ACCOUNTS_RECEIVABLE

### 3.3 Payment Received (against invoice)

- Debit: CASH or BANK = payment.amount
- Credit: ACCOUNTS_RECEIVABLE = payment.amount

### 3.4 Purchase Received

If using perpetual inventory (recommended):
- Debit: INVENTORY = purchase.sub_total
- Debit: INPUT_* taxes = purchase input taxes
- Credit: ACCOUNTS_PAYABLE = purchase.total

### 3.5 Payment Made (against purchase)

- Debit: ACCOUNTS_PAYABLE = payment.amount
- Credit: CASH/BANK = payment.amount

### 3.6 Credit Note / Sales Return

- Debit: SALES (or SALES_RETURNS if you add it) = taxable reduction
- Debit: OUTPUT_* taxes = tax reduction
- Credit: ACCOUNTS_RECEIVABLE (or CASH/BANK if refunded) = total reduction

### 3.7 Purchase Return

- Credit: INVENTORY = returned taxable value
- Credit: INPUT_* = reversed ITC
- Debit: ACCOUNTS_PAYABLE = reduced payable

### 3.8 Manual Stock Adjustment

If enabled with accounting:
- For stock decrease:
  - Credit: INVENTORY
  - Debit: STOCK_ADJUSTMENT_LOSS
- For stock increase:
  - Debit: INVENTORY
  - Credit: STOCK_ADJUSTMENT_GAIN

## 4) Period close / locking

MVP policy:
- Allow posting into open periods only.
- Once a month is closed, prevent edits that affect journals/stock.

Implementation notes:
- In Phase 01/02 you can defer actual locking to an admin flag.
- In Phase 06 enforce it strictly.

## 5) Reconciliation & invariants

- Invoice totals must equal:
  - sum(line.taxable_value) + sum(line.taxes) + round_off - discounts
- Payments must not exceed invoice.total (unless configured to allow advances).

## 6) Open decisions (should be locked before Phase 06)

- Periodic vs perpetual inventory accounting
- Separate ledger for SALES_RETURNS
- Treatment of discounts (contra-income vs expense)
