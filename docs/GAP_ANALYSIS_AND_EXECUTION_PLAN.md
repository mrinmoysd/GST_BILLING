# GST Billing Application Gap Analysis and Execution Plan

**Date**: 2026-03-18
**Purpose**: Single planning document for the remaining work required to build the GST Billing application to the planned product scope, including backend, frontend, compliance, platform hardening, and UI/UX modernization.

---

## 1. Executive summary

The current system is a broad MVP, not an empty scaffold. It already includes:

- Tenant-scoped auth/session handling
- Customers, suppliers, products, categories
- Invoices, purchases, stock adjustments, stock movement tracking
- Payments
- Basic accounting screens and APIs
- Basic reports and a minimal GSTR1-like export
- Settings and super-admin surfaces

The main remaining work is not basic CRUD. The remaining work is in the areas that turn the product from a working MVP into a production-grade GST billing platform:

- GST computation and compliance exports
- Automated accounting posting and financial correctness
- Onboarding and company setup completeness
- Full RBAC and permissions
- Returns, credit notes, and lifecycle completeness
- Real billing, notifications, and file-storage integrations
- POS and printing
- UI/UX modernization and route consistency
- Test coverage, documentation parity, and operational hardening

This document lists all major gaps and groups them into practical execution phases.

---

## 2. Current-state assessment

### 2.1 What is already implemented

- Core API and DB-backed modules across auth, masters, sales, purchases, inventory, reports, accounting, settings, files, billing, admin
- Next.js frontend with company-scoped routes and working CRUD flows for most core modules
- Async PDF regeneration job flow with polling endpoint
- Basic export persistence for GSTR1-like CSV
- Accounting ledgers, journals, trial balance, P&L, balance sheet, cash book, bank book
- Settings pages for company, users, invoice series, notifications, subscription

### 2.2 What is materially incomplete

- GST engine and compliance-grade reports
- Financial posting automation and accounting rule enforcement
- Product-grade invoice and purchase UX
- POS workflows
- Onboarding and company creation flow
- Full permissions model
- Production integrations for billing, notifications, and storage
- Consistent modern design system and pixel-level polish

### 2.3 Documentation drift

There is material drift between docs and implementation.

- Some docs still describe features as blocked even though they now exist
- Some canonical route docs no longer match the actual frontend route structure
- Some roadmap/planned items have partial implementation but are still documented as future work

Before or alongside the next major delivery cycle, documentation should be realigned so planning is based on current truth.

---

## 3. Complete gap inventory

## 3.1 Product and domain gaps

### A. Company onboarding and tenant setup

Missing or incomplete:

- Public company creation flow
- Onboarding wizard
- GSTIN verification flow
- Initial company setup guidance
- Invoice settings setup during onboarding
- Logo upload during onboarding
- First-user/company bootstrap path
- Reset-password and logout route parity on frontend
- Deep-link-safe auth redirect behavior

Required outcome:

- A new tenant can self-serve from signup to a usable company dashboard without manual DB seeding or admin intervention.

### B. RBAC and permissions

Missing or incomplete:

- Create/update custom roles
- Permission inventory and assignment
- User-to-role assignment endpoint and UI
- Feature-level permission gating in frontend
- Permission-aware navigation
- Fine-grained guards beyond owner/admin/staff string roles
- Audit of permission failures and admin role changes

Required outcome:

- The product supports production-grade company access control for owners, admins, accountants, billing staff, sales staff, and read-only users.

### C. Sales lifecycle completeness

Missing or incomplete:

- Credit notes
- Sales returns
- Invoice send/share workflows
- Audit timeline for invoices
- More explicit draft lifecycle management
- Better stock-rule messaging
- Series and numbering UX tied into invoice flow
- Full invoice state machine support in frontend

Required outcome:

- The sales module covers the realistic lifecycle of GST invoicing, corrections, settlement, and document distribution.

### D. Purchase lifecycle completeness

Missing or incomplete:

- Purchase returns
- Better bill upload workflow and preview
- Supplier payable lifecycle clarity
- Purchase-specific payment journey polish
- Draft vs receive vs cancel transitions surfaced clearly in UI

Required outcome:

- The purchases module can support normal procurement and inventory replenishment workflows end to end.

### E. Inventory and costing

Missing or incomplete:

- Inventory valuation methods (FIFO, weighted average, LIFO decision)
- Batch/lot handling if required
- Better stock policy controls
- Reorder workflows and alerts
- Inventory-adjustment accounting hooks
- Rich inventory reporting
- Separate stock report, movement ledger, and adjustment flows in UI

Required outcome:

- Inventory numbers are not just operationally useful but financially reconcilable.

### F. GST engine and compliance

Missing or incomplete:

- Deterministic tax engine with CGST/SGST/IGST split
- Place-of-supply logic
- Storage of tax breakup at line level
- HSN summary
- GSTR-3B
- ITC reporting
- Credit/debit note return sections
- Exempt/nil-rated/non-GST classification support
- Portal-aligned JSON schemas
- Excel export formats
- Unified GST export pipeline
- Reconciliation warnings and audit snapshots

Required outcome:

- GST reporting becomes compliant, reproducible, and explainable, not just operationally approximate.

### G. Accounting correctness and automation

Missing or incomplete:

- Accounting rulebook enforcement in code
- Default chart of accounts strategy
- Posting rules per transaction type
- Auto-journal creation from invoices
- Auto-journal creation from purchases
- Auto-journal creation from payments
- Auto reversals for cancellations and returns
- Period close and locking behavior
- Rounding and precision policy enforcement
- Better drilldowns from reports to source documents

Required outcome:

- The accounting module must become the financial system of record rather than a disconnected manual journal feature.

### H. Notifications and communication

Missing or incomplete:

- Real provider integration for email/SMS/WhatsApp
- Delivery status tracking
- Outbox retry strategy
- User-facing invoice send flow
- Notification previews and template testing polish
- Notification event triggers from business actions

Required outcome:

- Users can reliably send business documents and alerts from the product.

### I. Billing, subscriptions, and platform controls

Missing or incomplete:

- Real Stripe/Razorpay checkout session creation
- Provider portal/manage-subscription links
- Entitlement updates on webhook processing
- Usage metering maturity
- Subscription limits enforcement
- Better admin usage dashboards

Required outcome:

- SaaS billing is production-capable and tied to actual product entitlements.

### J. Files and storage

Missing or incomplete:

- Storage abstraction maturity
- S3/MinIO-backed file drivers
- Signed URLs where required
- Better file metadata and auditability
- Preview support for uploaded bills and generated documents
- Consistent file lifecycle handling

Required outcome:

- Files become durable, secure, and environment-agnostic.

### K. POS and printing

Missing or incomplete:

- POS routes and flows
- Fast barcode-first billing UI
- Thermal/browser print templates
- Receipt view
- Session/counter logic if needed
- Offline decision implementation if required later

Required outcome:

- Retail billing mode is usable and fast enough for checkout scenarios.

---

## 3.2 Frontend and UI/UX gaps

### A. Design-system maturity

Missing or incomplete:

- Unified visual language across pages
- Full standardization on modern UI primitives
- Consistent spacing, type scale, surface system, and state styling
- Shared table, filter-bar, dialog, toast, tabs, and skeleton patterns
- Status badge system
- Empty-state system
- Destructive action confirmation system

Required outcome:

- The UI should feel like one product, not a set of working screens built incrementally.

### B. Route and information-architecture drift

Missing or incomplete:

- Alignment between documented route map and actual frontend routes
- Consistent, intuitive grouping of business areas
- Dedicated GST hub
- Dedicated payments page
- Dedicated inventory sub-routes
- Dedicated roles page
- Onboarding route group
- POS route group

Required outcome:

- The navigation model should match user mental models and the docs should match the application.

### C. Dashboard quality

Missing or incomplete:

- Real KPI data wiring
- Recent activity feed
- Quick actions with contextual guidance
- Better information density
- Cross-linking into high-value workflows

Required outcome:

- Dashboard must become an operational command center, not a placeholder landing page.

### D. Transaction UX quality

Missing or incomplete:

- Better invoice builder
- Better purchase entry flow
- Inline calculations and breakdowns
- Better payment flows
- Better PDF and job status UX
- More polished detail pages with tabs/sections/audit

Required outcome:

- Core workflows must be fast, forgiving, and visually trustworthy.

### E. Reporting UX quality

Missing or incomplete:

- Structured reports instead of raw JSON-style fallbacks
- Better cards, tables, summaries, charts
- Drilldowns
- Export affordances
- Printable layouts

Required outcome:

- Reports must feel decision-ready and accountant-friendly.

### F. Mobile and responsive behavior

Missing or incomplete:

- Better app-shell behavior on tablet/mobile
- Responsive tables and filter bars
- Sheet/drawer patterns for smaller screens
- Mobile-safe forms and dialogs

Required outcome:

- App remains usable outside desktop-only assumptions.

### G. Accessibility and usability

Missing or incomplete:

- Stronger keyboard navigation
- Better focus states and focus management
- Better labels and validation feedback
- Live announcements for async operations
- Better contrast consistency

Required outcome:

- App reaches a solid accessibility baseline and feels polished.

### H. Pixel-perfect visual polish

Missing or incomplete:

- Consistent 8px spacing rhythm
- Proper visual hierarchy for titles, metadata, and actions
- Table density tuning
- Form width discipline
- Button hierarchy and action grouping
- Better use of whitespace, contrast, and card sections
- More intentional page compositions

Required outcome:

- Screens feel modern, premium, and deliberate rather than functional-only.

---

## 3.3 Engineering and quality gaps

### A. Testing

Missing or incomplete:

- More API e2e coverage for accounting, settings, notifications, billing, files, admin
- Frontend e2e coverage for products, invoices, purchases, reports, settings, admin
- Golden tests for GST outputs
- Edge-case tests for tax and stock behavior
- Contract tests for idempotency and async jobs

### B. Observability and operations

Missing or incomplete:

- Better job monitoring
- Better error reporting and tracing
- Retry visibility for jobs/outbox/webhooks
- Support/admin diagnostics for async failures

### C. Data and schema parity

Missing or incomplete:

- Final decision and enforcement around SQL vs Prisma canonical schema parity
- Schema drift tracking
- Migration discipline for future phases

### D. Documentation hygiene

Missing or incomplete:

- Update stale deferred docs
- Realign route map with implementation or vice versa
- Update status/completion docs to reflect actual truth
- Publish a canonical “current product state” summary

---

## 4. Modern UI/UX enhancement plan

This section focuses specifically on design modernization and pixel-perfect execution.

## 4.1 Design goals

The application should feel:

- Modern and premium
- Precise and trustworthy
- Fast for finance-heavy workflows
- Calm, dense, and professional
- Consistent across CRUD, reports, and configuration

It should avoid:

- Generic placeholder dashboards
- Mismatched spacing and inconsistent cards
- Raw HTML-feeling forms
- JSON-looking report screens
- Dense tables without hierarchy
- Overly flat, colorless surfaces

## 4.2 Visual direction

Recommended design direction:

- Light-first professional workspace
- Warm-neutral canvas with layered surfaces
- High-contrast typography
- Restrained accent color for primary actions only
- Rich but subtle status colors for success, warning, pending, error
- Rounded surfaces with disciplined radius
- Strong alignment and rhythm

Recommended core tokens:

- Background: soft neutral, not pure white everywhere
- Primary surface: white
- Secondary surface: slightly tinted neutral
- Border: light but visible
- Accent: deep blue or teal, not purple
- Success: green
- Warning: amber
- Danger: red
- Info: slate-blue

Typography direction:

- Use a more intentional font stack than a default system-only feel
- Strong title weight and clear section hierarchy
- Compact readable body text
- Monospace only for codes, ids, and document numbers

## 4.3 Pixel-perfect standards

Define and enforce:

- 8px spacing grid
- Canonical page max width and padding values
- Reusable page header structure
- Canonical card header/body/footer spacing
- Canonical table row height
- Canonical filter-bar layout
- Canonical detail-page two-column and stacked responsive patterns
- Consistent empty-state composition
- Badge sizing and color rules
- Primary/secondary/destructive button placement rules

## 4.4 Global shell enhancements

Enhancements required:

- Better sidebar with clearer grouping and section labels
- Sticky top bar with breadcrumb and global quick actions
- Mobile sheet nav
- Company switcher slot for future multi-company support
- Consistent header actions placement
- Better page transition polish

## 4.5 Screen-by-screen enhancement goals

### Dashboard

Enhance with:

- Real KPI cards with sparkline-ready layout
- Recent invoices/payments/activity modules
- Low-stock alert module
- Quick actions panel
- Month/period selector if needed

### Masters

Enhance with:

- Better list density and search UX
- Side-panel or well-structured detail view
- Inline stats on detail pages
- Cleaner forms with grouped sections

### Invoice builder

Enhance with:

- Split layout: party/details on top, items table center, totals summary sidebar
- Product search with command palette behavior
- Inline tax and stock visibility
- Sticky summary/actions panel
- Draft autosave and unsaved-change protection
- Better issue flow and success state

### Purchase builder

Enhance with:

- Similar invoice-builder quality
- Supplier-first flow
- Bill upload preview area
- Item entry with faster keyboard flow

### Inventory

Enhance with:

- Dedicated stock report page
- Dedicated movement ledger page
- Adjustment flow with guided modal/page
- Better low-stock alert visualization

### Accounting

Enhance with:

- Financial report layouts with grouped sections and totals
- Drilldown drawers
- Cleaner journals UX
- Better cash/bank book tables with running balances

### Reports and GST

Enhance with:

- Standard report shell
- Consistent filter bars
- Better summary cards
- Proper data tables
- Download/export action cluster
- GST export progress and history panel

### Settings

Enhance with:

- Settings shell with left sub-navigation
- Better forms and helper text
- Stronger permission/admin affordances
- Better empty states for users, templates, invoice series

### Admin

Enhance with:

- Better operational tables
- KPI summaries
- Filter panels
- Consistent list/detail patterns

### POS

Enhance with:

- Full-screen workspace
- High-contrast keyboard-first layout
- Large scan/search input
- Cart and payment panels with clear checkout CTA
- Thermal receipt layout

---

## 5. Execution phases

The phases below are designed to produce a complete product progressively while keeping dependencies practical.

## Phase A — Planning and truth alignment

Goal:

- Make planning artifacts reflect current reality before major new execution.

Items:

- Update stale docs in `docs/` and `todo/`
- Decide canonical route structure
- Decide SQL vs Prisma parity policy
- Lock accounting and rounding decisions
- Lock valuation-method decision
- Lock POS MVP scope

Deliverables:

- Updated roadmap and deferred docs
- Canonical route map
- Current-state implementation summary

## Phase B — Design system and shell modernization

Goal:

- Build the visual and interaction foundation for the rest of the app.

Items:

- Finalize design tokens
- Standardize on shared UI components
- Rebuild app shell
- Add breadcrumb, sheet nav, toasts, skeletons, table system
- Introduce pixel-perfect layout standards

Deliverables:

- Shared design system layer
- Updated shell and 3-5 fully modernized exemplar pages

## Phase C — Onboarding, auth, and company setup

Goal:

- Make tenant creation and setup complete.

Items:

- Company creation API
- Onboarding flow
- GSTIN verification integration or stubbed managed flow
- Reset-password and logout flow parity
- Better auth guard behavior

Deliverables:

- New tenant onboarding end to end

## Phase D — RBAC and settings completeness

Goal:

- Upgrade access control and company administration.

Items:

- Permissions inventory
- Role create/update/assign flows
- Roles frontend
- Permission-aware nav and action gating

Deliverables:

- Production-capable tenant administration model

## Phase E — Core workflow UX overhaul

Goal:

- Make invoices, purchases, payments, inventory, and dashboard product-grade.

Items:

- Dashboard redesign with real metrics
- Invoice builder overhaul
- Purchase builder overhaul
- Better detail pages with tabs/sections
- Dedicated payments page
- Dedicated inventory sub-routes

Deliverables:

- Operationally strong, modern core workflows

## Phase F — Sales and purchase lifecycle completion

Goal:

- Close the remaining business-document lifecycle gaps.

Items:

- Credit notes
- Sales returns
- Purchase returns
- Invoice send/share
- Better audit trails

Deliverables:

- Full billing and procurement lifecycle coverage

## Phase G — GST engine and compliance exports

Goal:

- Move from MVP exports to compliance-grade GST reporting.

Items:

- Tax engine
- Stored tax breakup
- GSTR-1 proper
- GSTR-3B
- HSN summary
- ITC reporting
- Unified GST export pipeline
- Portal JSON/Excel/CSV support
- Snapshotting and reconciliation

Deliverables:

- Production-grade GST reporting subsystem

## Phase H — Accounting integration and correctness

Goal:

- Make accounting automatic and reconcilable.

Items:

- Chart of accounts defaults
- Posting engine
- Auto-journal hooks from invoices/purchases/payments/returns/cancellations
- Period close/locking
- Better reporting drilldowns

Deliverables:

- Accounting becomes tied to business transactions

## Phase I — Platform integrations

Goal:

- Harden external-facing infrastructure pieces.

Items:

- Stripe/Razorpay real checkout
- Webhook processing and entitlements
- Notification provider integrations
- File storage abstraction and S3/MinIO support
- Better async job observability

Deliverables:

- Production-ready platform integrations

## Phase J — POS and print

Goal:

- Deliver retail-mode billing and print flow.

Items:

- POS routes
- Barcode-first UI
- Receipt view
- Browser thermal printing
- Optional later offline design

Deliverables:

- Retail-capable POS MVP

## Phase K — Quality and release hardening

Goal:

- Raise confidence before production scaling.

Items:

- Expand e2e coverage
- Add golden fixtures for GST outputs
- Add regression suite for tax, stock, and posting logic
- Review error handling and observability
- Performance review for lists, reports, and heavy flows

Deliverables:

- Release-quality test and operational baseline

---

## 6. Priority order

If the goal is to maximize product readiness with limited team bandwidth, the recommended order is:

1. Planning truth alignment
2. Design system and shell modernization
3. Core workflow UX overhaul
4. Onboarding and RBAC completeness
5. Sales/purchase lifecycle completion
6. GST engine and compliance exports
7. Accounting integration
8. Platform integrations
9. POS
10. Release hardening

Reasoning:

- The app already has working CRUD breadth, so user experience and architectural correctness should improve before adding more superficial surface area.
- GST and accounting are the biggest business-critical gaps.
- POS should wait until the tax, stock, billing, and print foundations are clear.

---

## 7. Recommended work breakdown structure

For execution tracking, each major phase should be broken into:

- Product scope
- API and DB scope
- Frontend route/screen scope
- UX requirements
- Test requirements
- Risks and dependencies

Suggested tracker categories:

- `product-gap`
- `backend-gap`
- `frontend-gap`
- `design-enhancement`
- `compliance-gap`
- `test-gap`
- `doc-drift`

Suggested ticket metadata:

- phase
- priority
- dependency
- module
- risk
- estimate

---

## 8. Immediate next actions

Recommended next actions from this document:

1. Convert this document into a phased ticket backlog.
2. Update stale docs so they stop conflicting with implementation truth.
3. Finalize the canonical route structure and UI information architecture.
4. Start with Phase B: design system and shell modernization.
5. In parallel, define the detailed technical spec for Phase G: GST engine and exports.

---

## 9. Definition of done for “fully built”

The GST Billing application should be considered fully built only when all of the following are true:

- A new company can onboard without manual intervention
- Core sales and purchase lifecycles are complete, including returns and adjustments
- GST reporting is compliant, reproducible, and exportable in production-grade formats
- Accounting is auto-posted and reconcilable
- Billing, files, notifications, and webhooks are production-integrated
- POS and print flows are implemented if in scope
- Frontend is modern, cohesive, responsive, and polished
- Documentation matches current truth
- Test coverage protects critical business logic and workflows

Until then, the system should be treated as an evolving MVP-plus platform rather than the final application.
