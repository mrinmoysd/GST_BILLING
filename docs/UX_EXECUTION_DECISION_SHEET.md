# UX Execution Decision Sheet

**Date**: 2026-03-27  
**Purpose**: Convert the workflow-centered + power-user wireframe direction into a stricter decision framework for implementation, review, and design governance.  
**Decision status**: Approved with required modifications

Sources:

- [WORKFLOW_CENTERED_POWER_USER_WIREFRAME_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/WORKFLOW_CENTERED_POWER_USER_WIREFRAME_SPEC.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)
- [MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md)
- [Marg ERP comparison chart](https://download.margcompusoft.com/pdf/comparison-chart-margERP9.pdf)
- [Marg eOrder app](https://margcompusoft.com/eorder_salesman_order_app.html)
- [Marg eOwner app](https://margcompusoft.com/eowner_owner_order_app.html)

---

## 1. Final Decision

The proposed UX direction is **the correct base direction** for this product.

That means the following are approved:

- workflow-centered primary navigation
- power-user operational workspaces
- segmented tabs for entity and document detail pages
- right-rail or inspector-based secondary context
- reduced card usage and stronger table or queue emphasis

However, the plan is **not approved as a rigid universal rule**.

It must be implemented with distribution-software guardrails, because this product serves users who value:

- speed
- repeat operations
- low-friction exception handling
- immediate visibility into dues, stock, dispatch, and compliance

So the actual final decision is:

**Approved with required modifications before implementation.**

---

## 2. Executive Judgment

If we copied Marg UX directly:

- we would inherit density and task-immediacy
- but we would also inherit fragmentation, inconsistent experience layers, and a desktop-era interaction model

If we followed the wireframe spec without adjustment:

- we would gain structure and clarity
- but we could accidentally over-simplify high-frequency operational work

The correct product direction is:

- modern SaaS shell
- workflow-led organization
- dense operational queues
- tabbed detail workspaces
- explicit exception-first design
- persona-aware expansion later

This is stronger than Marg as a product system, but only if speed and operator immediacy are protected.

---

## 3. Approved As-Is

These parts of the plan are correct and should be kept.

## 3.1 Workflow-centered primary navigation

Approved:

- Dashboard
- Order to Cash
- Purchase to Stock
- Collections
- Field Sales
- GST & Compliance
- Accounting
- Reports
- Masters
- Settings

Why:

- this matches how a distributor thinks about daily work better than a flat module list
- it connects cross-module processes like order -> dispatch -> invoice -> collection
- it gives the product a stronger operating-system feel than Marg’s more fragmented ecosystem

## 3.2 Shared page archetypes

Approved:

- workflow overview
- queue + inspector
- detail with segmented tabs
- composer / create screen
- explorer / report surface
- settings studio

Why:

- this gives the app a repeatable design language
- current UX inconsistency is one of the biggest product feel problems

## 3.3 Segmented detail tabs

Approved for:

- customer detail
- supplier detail
- product detail
- quotation detail
- sales order detail
- invoice detail
- purchase detail
- challan detail
- journal detail

Why:

- current long detail pages are too mixed and too vertical
- operators need cleaner layers such as `Overview`, `Transactions`, `Operations`, `History`, and `Settings`

## 3.4 Reduced card dependency

Approved:

- use layout, dividers, columns, and dense tables before reaching for cards

Why:

- the current product risks looking like a generalized SaaS admin tool
- wholesale/distribution software should feel more like a workspace than a dashboard collage

---

## 4. Must Change Before Implementation

These are not optional.

If ignored, the redesign will become clean-looking but weaker than Marg in real use.

## 4.1 Do not force tabs onto high-frequency queue screens

Decision:

- queue screens must remain queue-first
- tabs may filter the queue
- tabs must not replace the main operational view

Affected pages:

- invoices list
- dispatch
- collections
- banking
- transfers
- batches
- field today

Reason:

- high-frequency work needs glanceable lists, bulk actions, and inspector context
- users should not click through layered tabs just to see the next urgent row

Rule:

- detail pages are tab-heavy
- queue pages are segment-heavy

## 4.2 Add command velocity to the shell

Decision:

- the redesign must include:
  - global search
  - quick create
  - recent items
  - saved views
  - row-level quick actions

Reason:

- Marg’s product strength is not beauty; it is task immediacy
- if the redesign makes the product look cleaner but adds friction, users will prefer the older-feeling but faster tool

## 4.3 Design exceptions as first-class entry points

Decision:

- every major workflow needs a visible exception path

Examples:

- blocked credit
- overdue collections
- bounced instruments
- pending dispatch
- near expiry stock
- failed e-invoice / e-way bill
- unreconciled bank lines

Reason:

- distributor operations are driven by exception queues, not only by clean happy-path flows

## 4.4 Preserve noun discoverability inside workflows

Decision:

- workflow navigation is primary
- but document nouns must remain obvious inside each workflow

Reason:

- many operator users still think in:
  - invoice
  - order
  - ledger
  - stock
  - payment
  - report

If those nouns become hidden inside abstract flow names, usability will drop.

## 4.5 Separate create flows from detail maintenance

Decision:

- create screens should become step-based composers
- detail screens should not remain giant edit forms

Reason:

- new record creation and later maintenance are different mental jobs
- the product currently mixes them too often

---

## 5. Marg-Inspired Additions Required

These are the practical UX behaviors we should consciously retain or reinterpret from Marg-style distribution software.

## 5.1 Shortcut-driven behavior

Need to add:

- keyboard shortcuts for creation, save, search, and queue focus
- recent items or recently viewed records
- quick document switcher

Why:

- the Marg comparison sheet explicitly emphasizes shortcuts and recently viewed reports
- these are not cosmetic details; they are power-user accelerators

## 5.2 Queue presets and operational saved views

Need to add:

- saved queue filters
- “mine”
- “due today”
- “blocked”
- “ready to dispatch”
- “pending compliance”

Why:

- operators should not rebuild their working view every time

## 5.3 Strong status language on rows

Need to add:

- row-level state chips with real operational meaning
- due-state emphasis
- progress states
- exception badges

Why:

- Marg’s UX often surfaces operational status directly even when the visual design is old
- the modern redesign must not hide status inside secondary text

## 5.4 Persona-aware future surfaces

Need to plan later:

- owner summary surface
- field-sales mobile-first surface
- retailer/self-order surface

Why:

- Marg separates actor types better than one unified tenant app does today
- not every user should live inside the same density model

## 5.5 Dense inspector patterns

Need to add:

- side inspector for selected row
- inline linked-record context
- quick action stack in the inspector

Why:

- this is the modern equivalent of getting fast desktop-style context without opening many windows

---

## 6. Page-Level Approval Matrix

| Page family | Decision | Notes |
|---|---|---|
| Dashboard | Approve with modification | must focus on risks, bottlenecks, and action queues, not KPI decoration |
| Quotations | Approve | queue + inspector + tabbed detail is correct |
| Orders | Approve | fulfillment and dispatch progress must dominate rows |
| Dispatch | Approve with modification | must stay queue-first and exception-heavy |
| Invoices | Approve with modification | list remains operational queue; detail becomes tabbed |
| Purchases | Approve | same pattern as order-to-cash with stock emphasis |
| Inventory overview | Approve | should become operational stock control center |
| Batches | Approve with modification | near-expiry and clearance need high-visibility exception lanes |
| Collections | Strong approve | this area benefits the most from queue + inspector |
| Banking | Strong approve | split-view reconciliation UX is better than stacked forms |
| Field sales | Approve with modification | desktop and mobile density must differ |
| GST/compliance | Approve | exception-driven queue is correct |
| Accounting | Approve with modification | avoid over-stylizing classic accounting views |
| Reports | Approve | report explorer model is correct |
| Customer detail | Strong approve | tabs are necessary here |
| Product detail | Strong approve | tabs are necessary here |
| Settings | Approve | studio model is correct |
| Admin | Approve | same system, slightly more platform-operator tone |
| Public marketing | Approve separately | should not borrow tenant app density |

---

## 7. Non-Negotiable UX Rules For This Product

1. No long all-in-one detail pages.

2. No dashboard-card mosaics for operational modules.

3. No hidden exception handling.

4. No workflow page without obvious primary action.

5. No table redesign that reduces scan speed.

6. No tab system that forces extra clicks on frequent queue work.

7. No premium visual treatment that weakens data hierarchy.

8. No design system purity over operator speed.

---

## 8. The Correct Hybrid Model

This is the final recommended pattern:

### Primary shell

- workflow-centered

### Queue pages

- power-user
- dense table
- sticky filters
- right inspector

### Detail pages

- segmented tabs
- context strip
- activity rail

### Create pages

- step-based composer
- live summary rail

### Reports

- explorer surface

### Mobile / field use

- simplified queue and action flows
- not full desktop density

---

## 9. Final Recommendation To Product

Proceed with this redesign direction.

Do **not** redesign by copying Marg visually.

Do **not** redesign by making the app only minimal and airy.

Do this instead:

- keep the workflow-centered shell
- keep the tabbed detail model
- keep the queue + inspector model
- add operator accelerators and exception-first behavior inspired by Marg

That combination is the strongest path for:

- wholesale users
- distributor back-office teams
- dispatch operators
- collection teams
- owners who need modern clarity without losing speed

---

## 10. Next Implementation Decision

If this sheet is accepted, the redesign should move in this order:

1. shell and navigation
2. invoices queue + detail
3. collections queue + banking
4. dispatch queue
5. customer and product detail tabs
6. inventory and batch exception surfaces

That sequence will prove the model on the highest-value workflows first.
