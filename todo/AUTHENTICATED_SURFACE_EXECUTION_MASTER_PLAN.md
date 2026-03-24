# Authenticated Surface Execution Master Plan

Source thesis:

- `docs/AUTHENTICATED_SURFACE_VISUAL_AND_INTERACTION_THESIS.md`

## Goal

Turn the signed-in GST Billing product into a more coherent operating environment by applying a shared visual and interaction grammar across tenant and admin routes.

This work should preserve the current architecture:

- separate tenant and admin shells
- permission-aware navigation
- current route and data contracts
- existing design tokens and shared primitives

The focus is hierarchy, archetypes, density, and interaction clarity.

## Phase A1

### Shared foundations and overview archetype

Scope:

- define shared authenticated overview primitives
- establish shared route bands:
  - hero/header band
  - KPI band
  - section band
  - panel treatment
- apply them to:
  - tenant dashboard
  - admin dashboard

Acceptance criteria:

- both dashboards read as overview/control pages immediately
- tenant and admin feel related but not identical
- shared primitives are reusable for later phases

## Phase A2

### Operational list archetype

Scope:

- invoices
- purchases
- payments
- customers
- suppliers
- products
- admin companies
- admin subscriptions

Acceptance criteria:

- action/filter rail is standardized
- data plane is primary
- totals and state are easy to scan

## Phase A3

### Detail and lifecycle archetype

Scope:

- invoice detail
- purchase detail
- admin company detail
- customer and supplier detail routes

Acceptance criteria:

- summary strip at top
- next actions are obvious
- lifecycle/history is clearly separated from action areas

## Phase A4

### Configuration archetype

Scope:

- settings hub
- company settings
- users
- roles
- notifications
- subscription

Acceptance criteria:

- form-led composition replaces generic route hub treatment
- save, test, and result feedback is more consistent

## Phase A5

### Finance and compliance densification

Scope:

- journals
- trial balance
- profit and loss
- balance sheet
- cash book
- bank book
- GST compliance center
- dense reports and admin analytics tables

Acceptance criteria:

- calmer, denser financial presentation
- stronger totals anchoring
- less decorative panel usage

## Phase A6

### Shell refinement

Scope:

- tenant shell grouping and identity polish
- admin shell grouping and privileged-action emphasis
- stronger consistency between shell, route title, breadcrumbs, and section bands

Acceptance criteria:

- shells feel like the same product family
- admin still feels more governed and operational
- route identity is clearer

## Recommended Order

1. A1 shared foundations and overview archetype
2. A2 operational list archetype
3. A3 detail and lifecycle archetype
4. A4 configuration archetype
5. A5 finance and compliance densification
6. A6 shell refinement

## Current Status

- A1: Completed
- A2: Completed
- A3: Completed
- A4: Completed
- A5: Completed
- A6: Completed
