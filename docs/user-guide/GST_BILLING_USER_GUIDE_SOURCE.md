# GST Billing User Guide

**Version**: Draft 1  
**Date**: 2026-03-29  
**Audience**: owners, operators, finance users, warehouse users, sales users, support teams, and rollout staff

![GST Billing public landing page](./assets/public-landing.png)

---

## 1. How To Use This Guide

This guide explains the product in the same order a real team is likely to learn it:

1. get into the product
2. understand the workspace
3. set up the business basics
4. operate daily workflows
5. review finance, GST, stock, and controls

If you are new to the product, read chapters 1 through 5 first.  
If you already have access and only need operational help, jump to the workflow chapter you need.

---

## 2. What GST Billing Does

GST Billing is a workflow-centered business operations product for Indian businesses. It combines:

- billing
- purchases
- inventory
- GST reporting
- accounting
- collections
- POS
- field sales
- settings and controls
- internal admin operations

Instead of using separate tools for invoicing, stock, tax reporting, books, and operator control, the product keeps those workflows inside one workspace.

---

## 3. Product Map

The product is best understood in these workflow bands:

1. Order to Cash
2. Purchase to Stock
3. Collections and Banking
4. GST and Compliance
5. Accounting and Books
6. POS
7. Field Sales
8. Reports
9. Settings and Governance

![GST Billing feature map page](./assets/public-features.png)

---

## 4. Public Entry, Onboarding, And Login

### 4.1 Public site

The public site explains the product, pricing, security posture, help routes, and contact paths.

Use the public routes when you want to:

- understand the product before using it
- review pricing
- review security and trust posture
- request a guided demo
- contact the team

### 4.2 Create a company

Use the onboarding route to create the first workspace.

Steps:

1. open the onboarding page
2. enter the company and owner details
3. confirm the initial company setup data
4. submit the onboarding form
5. enter the new tenant workspace

Important notes:

- the first user is typically the owner
- this creates the company context used by the rest of the app
- after onboarding, the owner can manage users, roles, and settings

### 4.3 Login

Use the login page when the company already exists and the user already has access.

Steps:

1. open the login page
2. enter email and password
3. sign in
4. continue into the company workspace

### 4.4 Password recovery

Use the forgot-password flow when a user can no longer access the account.

Steps:

1. open the forgot-password page
2. enter the account email
3. request the reset link
4. open the reset route
5. set a new password
6. sign in again

![Forgot-password recovery page](./assets/auth-forgot-password.png)

![GST Billing onboarding page](./assets/public-onboarding.png)

![GST Billing login page](./assets/auth-login.png)

---

## 5. Understanding The Workspace

After login, the user lands inside a company-scoped workspace.

The workspace includes:

- the company shell
- workflow navigation
- page headers
- queue pages
- detail pages with tabs
- create forms with step-aware layout
- reports and settings

### 5.1 Left workflow rail

The left rail is the main way to move across major work areas.

Typical workflow groups include:

- Dashboard
- Sales
- Inventory
- Payments
- Reports
- Accounting
- Masters
- Settings

### 5.2 Top header

The header provides:

- company context
- page title and local workflow context
- search
- quick create
- profile controls

### 5.3 Page patterns

The product uses three main page patterns:

1. Queue pages
   For lists, monitoring, status review, and action selection.
2. Detail pages
   For one record with segmented tabs like overview, financials, activity, and settings.
3. Create / edit pages
   For controlled entry and update workflows.

---

## 6. Company Setup Basics

Before daily use, review the company setup.

### 6.1 Company profile

The company settings area usually contains:

- company name
- GSTIN and state details
- address details
- commercial defaults
- compliance settings

### 6.2 Users and roles

The owner or authorized admin should:

1. create users
2. assign roles
3. verify what each user can access

Use roles to separate access for:

- billing
- accounting
- collections
- warehouse staff
- field sales
- supervisors

### 6.3 Invoice series and numbering

Set up the invoice series before issuing live documents.

Check:

- numbering prefix
- default series
- workflow usage

### 6.4 Pricing and commercial settings

Use pricing settings to manage:

- base pricing behavior
- price lists
- special rates
- commercial controls
- pricing override behavior

---

## 7. Masters

Masters are the foundational records used by daily workflows.

### 7.1 Customers

Customers are used for:

- quotations
- sales orders
- invoices
- collections
- ledgers
- credit control
- field-sales coverage

Typical customer data includes:

- name
- contact details
- billing and shipping address
- GSTIN
- state
- credit policy
- salesperson assignment

Typical customer workflow:

1. open Customers
2. create a customer
3. enter profile and credit data
4. save
5. review the customer detail tabs
6. use the customer in sales workflows

### 7.2 Suppliers

Suppliers are used for:

- purchases
- supplier payments
- supplier ledgers
- returns

Typical supplier workflow:

1. open Suppliers
2. create a supplier
3. save the business details and GST details
4. use the supplier in purchase flows

### 7.3 Products

Products are used for:

- invoices
- quotations
- sales orders
- purchases
- stock
- pricing
- reports
- batch and expiry control

Typical product data includes:

- item name
- SKU
- unit
- category
- tax treatment
- pricing
- stock settings
- batch / expiry tracking settings

### 7.4 Categories

Categories help organize the product catalog and reporting.

---

## 8. Quotations And Sales Orders

### 8.1 Quotations

Use quotations when you want to prepare a commercial offer before order commitment.

Steps:

1. open Quotations
2. create a quotation
3. select the customer
4. add products and quantities
5. review pricing and scheme behavior
6. save the quotation
7. share or convert later

### 8.2 Sales orders

Use sales orders when a quotation becomes a committed demand or when you want to record an order directly.

Steps:

1. create a sales order directly or convert a quotation
2. verify customer, items, quantities, and pricing
3. save the order
4. follow fulfillment progress
5. convert the order toward dispatch and invoicing

Important operator checks:

- confirm pricing before issue
- verify stock availability
- confirm warehouse and fulfillment context
- verify salesperson attribution when relevant

![Quotation and order workflow placeholder](./assets/quotation-order-placeholder.png)

---

## 9. Dispatch, Challans, And Invoices

### 9.1 Dispatch

Use the dispatch area to manage order fulfillment readiness.

Common tasks:

- view pending dispatch work
- select orders ready for fulfillment
- review partial fulfillment status

### 9.2 Delivery challans

Challans help manage dispatch and delivery tracking before invoice completion.

Typical challan workflow:

1. create or open the challan from the sales flow
2. verify lines, quantities, warehouse context, and transporter details
3. update packed, dispatched, delivered, or short quantities
4. print the challan if needed
5. use the challan for delivery tracking and invoice linkage

### 9.3 Invoices

Invoices are central to the product. They affect:

- customer receivable
- stock movement
- GST reporting
- accounting
- collections

Typical invoice workflow:

1. open Invoices
2. create an invoice or convert from order
3. select the customer
4. add or confirm line items
5. review warehouse or batch context if applicable
6. check pricing and totals
7. save draft if needed
8. issue the invoice
9. share, print, or review compliance status

### 9.4 Invoice detail

The invoice detail page is where the operator reviews:

- summary
- items
- payments
- compliance
- activity and audit trail

### 9.5 Credit notes and sales returns

Use credit notes or sales returns when a sale needs correction or reversal.

Typical flow:

1. open the original invoice
2. start the return or credit flow
3. confirm lines and quantities
4. confirm commercial and stock impact
5. save the document

---

## 10. Payments, Receivables, And Sales Collections

The sales side of payments is used to record what the customer has actually paid.

Typical payment workflow:

1. open the invoice or payments area
2. select the customer or document
3. choose the payment mode
4. enter the amount and reference
5. save the payment

Use the collections workflows to manage:

- overdue customers
- promises to pay
- payment follow-up
- cheque / PDC handling
- operator tasks

---

## 11. Purchase Intake And Supplier Settlement

Use purchases for supplier-side stock and bill workflows.

### 11.1 Create a purchase

Typical steps:

1. open Purchases
2. create a purchase draft
3. select the supplier
4. add line items
5. enter rates and taxes
6. attach supplier bill if needed
7. receive the purchase when goods arrive

### 11.2 Receive stock

Receiving may include:

- quantity verification
- warehouse selection
- batch and expiry capture
- bill attachment

### 11.3 Purchase payments

Use supplier payment workflows to record settlement against supplier dues.

### 11.4 Purchase returns

Use returns when received goods need to go back to the supplier.

---

## 12. Inventory Operations

Inventory keeps stock tied to the rest of the business workflows.

### 12.1 Inventory overview

Use the inventory overview to monitor:

- stock posture
- warehouse status
- transfer activity
- movement history

### 12.2 Warehouses

Use warehouses when stock is stored or managed in multiple physical locations.

Typical tasks:

- create a warehouse
- set default usage
- review warehouse balances

### 12.3 Transfers

Transfers move stock between warehouses.

Typical transfer flow:

1. create the transfer
2. select source warehouse
3. select destination warehouse
4. add items and quantities
5. dispatch from source
6. receive at destination

### 12.4 Adjustments

Use stock adjustments to correct inventory quantities when needed.

### 12.5 Stock movements

Use the movements view to review how stock changed over time.

---

## 13. Batch, Expiry, And Clearance

For tracked products, the product supports batch-aware inventory control.

Use this area when you need:

- batch capture on purchase receive
- batch visibility by warehouse
- batch allocation on invoice issue
- expiry review

Typical operator checks:

- batch number
- manufacturing or expiry date
- warehouse quantity
- preferred batch usage

---

## 14. Collections, Credit Control, And Banking

This area is for the finance or collections team.

### 14.1 Collections

Collections help teams track:

- overdue amounts
- follow-up tasks
- credit pressure
- promise-to-pay items

### 14.2 Credit control

Customer credit control may include:

- credit limits
- overdue visibility
- hold or override behavior

### 14.3 Banking

Use banking workflows to manage:

- bank accounts
- statement import
- reconciliation
- instrument state

### 14.4 Cheques and PDC

Where used, cheque or PDC flows help teams track instrument lifecycle.

---

## 15. GST And Compliance

GST is not treated as a separate side utility. It is connected to documents and review workflows.

### 15.1 GST reports

The GST reporting area includes workflows for:

- GSTR-1
- GSTR-3B
- HSN summary
- ITC views
- GST exports

### 15.2 Compliance on invoices

For current D11 workflows, the invoice detail can show:

- e-invoice eligibility
- e-invoice status
- e-way bill status
- compliance history

### 15.3 Compliance exception queue

Use the compliance queue to review failures, pending items, or operator actions.

---

## 16. Accounting And Books

Accounting keeps operational records tied to finance outputs.

### 16.1 Ledgers

Use ledgers to review party and account history.

### 16.2 Journals

Use journals to inspect accounting movements and business posting outcomes.

### 16.3 Books

Use books for:

- cash book
- bank book

### 16.4 Financial statements

Use reports for:

- trial balance
- profit and loss
- balance sheet

### 16.5 Period control

If period lock is enabled, use it carefully to control posting windows.

---

## 17. POS Billing

POS is intended for retail billing inside the same operating system.

Use POS when you need:

- quick billing
- receipt generation
- connected stock behavior
- connected accounting and GST impact

Current scope notes:

- browser print is supported
- POS remains connected to standard invoice behavior
- advanced offline or hardware-agent flows are outside the current scope

Typical POS flow:

1. open POS Billing
2. add items
3. confirm quantity and price
4. record settlement
5. issue the bill
6. print the receipt

---

## 18. Field Sales And Route Operations

Field sales supports route and visit operations.

Use this area to manage:

- territories
- routes
- beats
- customer coverage
- visit planning
- visit tracking
- DCR

Typical setup flow:

1. create territory
2. create route
3. create beat
4. assign customer coverage
5. assign route to salesperson

Typical execution flow:

1. open today’s field page
2. review assigned visits
3. open a visit
4. capture outcome or follow-up
5. create a field order if needed
6. submit DCR

---

## 19. Reports

Reports help managers and operators review business health.

Common report groups include:

- sales summary
- purchases summary
- outstanding
- top products
- profit snapshot
- distributor analytics
- sales-team or route reports
- GST reports
- accounting reports

Use reports to answer questions like:

- what is overdue
- what is selling
- what stock is aging
- where the team is blocked
- what the current finance position looks like

---

## 20. Settings And Control

The settings area is where owners and administrators tune the workspace.

### 20.1 Company

Review organization profile and key company settings.

### 20.2 Users

Create and manage users for the company.

### 20.3 Roles

Use roles to define who can access what.

### 20.4 Pricing

Use pricing settings to manage:

- price lists
- scheme rules
- override controls

### 20.5 Notifications

Use notifications to manage templates and delivery behavior.

### 20.6 Invoice series

Use invoice-series settings to control document numbering.

### 20.7 Print templates

Use print templates to control output layouts for documents.

### 20.8 Custom fields

Use custom fields where controlled extension points are needed.

### 20.9 Integrations

Use integrations to manage:

- keys
- webhooks
- related integration controls

### 20.10 Migrations

Use migrations for:

- import projects
- dry runs
- mapping
- commit workflows

### 20.11 Subscription

Use subscription settings to review current plan and billing context.

---

## 21. Internal Admin Appendix

This chapter is only for internal platform operators, not normal tenant users.

Admin workflows include:

- admin login
- admin dashboard
- company operations
- subscription operations
- support tickets
- usage review
- queue review
- internal users
- audit logs

---

## 22. Troubleshooting

### Common issues

1. I cannot log in
   - check email and password
   - use reset-password if needed
   - verify the user still has access

2. I cannot see a page another user can see
   - check the assigned role
   - verify permissions with the owner or admin

3. I created a record but cannot find it
   - check queue filters
   - check status tabs
   - search by number, name, or recent activity

4. I cannot issue a document
   - verify mandatory fields
   - check stock or pricing conditions
   - review credit-control or compliance warnings

5. I do not understand a finance total
   - open the source document
   - review payments and ledger
   - cross-check the related report

---

## 23. Go-Live Checklist

Before going live:

1. confirm company data
2. confirm GST and numbering defaults
3. create users and roles
4. review product catalog
5. review customer and supplier masters
6. confirm pricing and scheme setup
7. confirm warehouses and opening stock
8. test invoice issue
9. test purchase receive
10. test payment recording
11. test report visibility
12. confirm print outputs

---

## 24. Support Routing

Use these support paths depending on the problem:

1. onboarding or rollout issue
2. billing or document workflow issue
3. stock or warehouse issue
4. GST or compliance issue
5. accounting or ledger issue
6. access or role issue
7. admin platform issue

---

## 25. Final Note

This guide is meant to help a business actually operate the product. It should be updated whenever workflows, navigation, permissions, or core product behavior change.

![GST Billing pricing page](./assets/public-pricing.png)
