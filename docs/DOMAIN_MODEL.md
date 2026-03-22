# Domain Model

**Date**: 2026-03-22  
**Purpose**: Describe the current end-to-end domain model of the solution based on the implemented code and schema.

This is not an aspirational model. It reflects the current repository state.

---

## System overview

The product is a multi-tenant GST billing and business operations system with these major bounded domains:

- identity and access
- company setup and tenant configuration
- masters
- inventory
- sales
- purchases
- GST and reporting
- accounting
- platform services
- admin / internal operations
- public website

The technical tenant boundary is `companyId` across most business entities.

---

## 1. Identity and access domain

### Core entities

- `User`
- `Session`
- `Role`
- `Permission`
- `UserRole`
- `RolePermission`

### Responsibilities

- tenant authentication
- internal admin authentication
- refresh-token session lifecycle
- tenant role and permission assignment
- internal admin role-based access to `/admin/*`

### Current model notes

- tenant RBAC uses company-scoped roles and permissions
- internal admin roles currently reuse `User.role`
- sessions may be tenant-bound or global admin-bound

---

## 2. Company domain

### Core entity

- `Company`

### Responsibilities

- tenant identity
- GST/business profile
- settings root for:
  - invoice settings
  - GST verification metadata
  - admin lifecycle metadata
  - onboarding-related defaults

### Key relationships

- one company has many users, customers, suppliers, products, invoices, purchases, journals, files, subscriptions, usage meters, and export jobs

---

## 3. Masters domain

### Core entities

- `Category`
- `Customer`
- `Supplier`
- `Product`

### Responsibilities

- reusable business master data
- GST identity on counterparties
- product price, cost, stock, and tax defaults

### Key relationships

- products belong to companies and optionally categories
- customers connect to invoices and customer ledgers
- suppliers connect to purchases and supplier ledgers

---

## 4. Inventory domain

### Core entities

- `StockMovement`
- `Product`

### Responsibilities

- stock increase/decrease tracking
- inventory adjustment tracking
- low-stock evaluation
- stock implications from:
  - purchases
  - purchase returns
  - invoices
  - sales returns
  - manual adjustments

### Current model notes

- stock is movement-based
- product also carries summary attributes such as reorder level and cost price

---

## 5. Sales domain

### Core entities

- `InvoiceSeries`
- `Invoice`
- `InvoiceItem`
- `Payment`
- `DocumentCreditNote`
- `DocumentCreditNoteItem`
- `DocumentShare`
- `DocumentLifecycleEvent`
- `IdempotencyKey`

### Responsibilities

- invoice numbering
- invoice draft/issue/cancel lifecycle
- line-item taxation and totals
- payment tracking
- credit notes
- sales returns
- share/send history
- PDF/export job integration

### Key relationships

- invoice belongs to company, customer, and invoice series
- invoice has many items, payments, lifecycle events, shares, and credit notes

### Current lifecycle states

- draft
- issued
- canceled
- plus linked lifecycle events for returns/credit/payment/share actions

---

## 6. Purchases domain

### Core entities

- `Purchase`
- `PurchaseItem`
- `PurchaseReturn`
- `PurchaseReturnItem`

### Responsibilities

- purchase draft/receive/cancel lifecycle
- stock intake
- supplier payable tracking
- bill attachment support
- purchase returns

### Key relationships

- purchase belongs to company and supplier
- purchase has many items and return records

---

## 7. GST domain

### Core responsibilities

- GST context persistence on invoices/purchases
- customer/supplier GST identity usage
- CGST/SGST/IGST split computation
- GSTR-1 and GSTR-3B summaries
- HSN summary
- ITC summary
- export job generation

### Current implementation shape

- GST is not a single standalone entity model
- it is distributed across:
  - invoice and purchase tax fields
  - counterparty GST metadata
  - GST service/report computation
  - export jobs

---

## 8. Accounting domain

### Core entities

- `Ledger`
- `Journal`
- `JournalLine`

### Responsibilities

- chart-of-accounts structure
- auto-posting from business transactions
- accounting books and statements
- trial balance
- profit & loss
- balance sheet
- cash/bank books
- period lock support

### Source-linked accounting

Accounting is integrated with business events such as:

- invoice issue
- invoice payment
- credit note / sales return
- purchase receive
- purchase payment
- purchase return

### Current model notes

- journals include traceability back to source documents
- product cost price participates in inventory/COGS logic

---

## 9. Reporting domain

### Report families

- business reports
  - sales summary
  - purchases summary
  - outstanding
  - top products
  - profit snapshot
- GST reports
  - GSTR-1
  - GSTR-3B
  - HSN
  - ITC
- accounting reports
  - trial balance
  - profit & loss
  - balance sheet

### Responsibilities

- read-only aggregation across operational domains
- normalized report contracts for the web UI
- export workflows via `ExportJob`

---

## 10. Platform services domain

### Core entities

- `File`
- `NotificationTemplate`
- `NotificationOutbox`
- `SubscriptionPlan`
- `Subscription`
- `UsageMeter`
- `WebhookEvent`
- `ExportJob`
- `SupportTicket`

### Responsibilities

- file storage abstraction
- notification delivery queue
- SaaS subscription state
- usage metering
- provider webhook persistence
- export job orchestration
- inbound support tickets

### Current model notes

- subscriptions are company-scoped
- usage meters are time-windowed by key
- webhook events may optionally point to a company

---

## 11. Admin / internal operations domain

### Core entities

- `InternalAdminAuditLog`
- `User` as internal admin identity when `companyId` is `null`

### Responsibilities

- internal admin authentication
- admin dashboard and operator surfaces
- company lifecycle operations
- subscription operations
- support operations
- queue/platform observability
- internal admin management
- privileged action auditing

### Current model notes

- internal admin users currently reuse the shared `users` table
- internal admin audit logs are now stored in a dedicated table

---

## 12. Public website domain

### Responsibilities

- product marketing
- pricing/features communication
- demo/help/contact/security pages
- legal/public information

### Current implementation notes

- public pages are route-driven and content-oriented
- they are not a separate backend domain model

---

## Cross-domain relationships

## Tenant boundary

- `Company` is the anchor entity for nearly all operational data

## Commercial flow

1. company configures customers, suppliers, products, invoice series
2. sales and purchases create operational transactions
3. inventory is updated from operational flows
4. GST outputs are derived from those transactions
5. accounting journals are auto-posted from those transactions
6. reports read from operational + accounting + GST data

## Platform flow

1. company subscribes to a plan
2. usage is metered
3. billing providers emit webhook events
4. admin monitors company health, subscriptions, queues, support, and audit logs

---

## Entity map by business area

## Tenant core

- Company
- User
- Session

## Access control

- Role
- Permission
- UserRole
- RolePermission

## Masters

- Category
- Customer
- Supplier
- Product

## Operations

- InvoiceSeries
- Invoice
- InvoiceItem
- Payment
- Purchase
- PurchaseItem
- PurchaseReturn
- PurchaseReturnItem
- StockMovement

## Sales lifecycle extensions

- DocumentCreditNote
- DocumentCreditNoteItem
- DocumentShare
- DocumentLifecycleEvent
- IdempotencyKey

## Accounting

- Ledger
- Journal
- JournalLine

## Platform

- File
- NotificationTemplate
- NotificationOutbox
- SubscriptionPlan
- Subscription
- UsageMeter
- WebhookEvent
- ExportJob
- SupportTicket

## Admin governance

- AdminAuditLog
- InternalAdminAuditLog

---

## Current structural limitations

- internal admin roles do not yet have their own dedicated internal RBAC tables
- GST is service-centric and report-centric rather than represented as a single domain aggregate
- some settings and lifecycle metadata are still stored inside JSON configuration blobs on `Company`
- business analytics history is summary/query-driven rather than event-stream driven

---

## Conclusion

The current domain model is centered on `Company` as tenant root, with operational transaction domains for sales, purchases, inventory, GST, and accounting layered on top, and a platform/admin layer for SaaS operations, subscriptions, support, files, notifications, and governance.

This model is already broad enough to run the product end to end. Future evolution should focus on:

- stronger internal admin governance
- richer analytics/event history
- safer operator remediation tooling

