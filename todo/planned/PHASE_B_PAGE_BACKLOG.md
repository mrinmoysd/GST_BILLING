# Phase B Page Backlog

**Date**: 2026-03-18
**Phase**: B — Design System and UI Modernization
**Status**: Completed on 2026-03-18

This file breaks Phase B into page-group implementation units.

Execution note:
- B-01 through B-12 were implemented as a combined modernization sweep across shared primitives, shell, list/detail pages, builders, reporting surfaces, settings, inventory, and admin pages.

---

## B-01 — Global design tokens and CSS foundation

Scope:

- Expand `apps/web/src/app/globals.css`
- Add semantic colors
- Add surface/background rules
- Add typography defaults
- Add focus ring standards
- Add reusable spacing/container utility conventions

Acceptance:

- The app no longer relies on only `--background` and `--foreground`
- Core surfaces, borders, text colors, and focus states feel intentional

## B-02 — Shared UI component consolidation

Scope:

- Decide canonical component layer
- Standardize button, input, label, card, table, dialog, badge, tabs, skeleton, toast usage
- Reduce drift between `lib/ui/*` and `components/ui/*`

Acceptance:

- New pages use one clear component direction
- Common list/detail/form patterns have reusable primitives

## B-03 — App shell redesign

Scope:

- Modernize `company-header`
- Modernize `company-nav`
- Improve company layout
- Add breadcrumbs
- Remove low-value path debug line
- Improve mobile sheet nav

Acceptance:

- Shell feels production-grade on desktop and mobile
- Navigation hierarchy is clearer

## B-04 — Dashboard redesign

Scope:

- Redesign dashboard layout
- Replace placeholder cards
- Add quick actions and recent activity layout
- Improve KPI presentation

Acceptance:

- Dashboard no longer reads as placeholder UI

## B-05 — Canonical list-page rollout

Target pages:

- customers
- suppliers
- products
- categories
- invoices
- purchases
- reports lists where applicable
- admin companies/subscriptions/support tickets

Scope:

- Standard page header
- Standard filter row
- Standard table presentation
- Standard empty/loading/error patterns
- Better row actions

Acceptance:

- List pages share consistent composition and interaction model

## B-06 — Canonical detail-page rollout

Target pages:

- customer detail
- supplier detail
- product detail
- invoice detail
- purchase detail
- journal detail

Scope:

- Rework detail headers
- Add section cards
- Normalize action placement
- Improve metadata presentation

Acceptance:

- Detail pages feel related and intentional, not bespoke

## B-07 — Invoice builder redesign

Scope:

- Rebuild invoice create page layout
- Improve line-item editing
- Add totals summary panel
- Improve issue/payment/PDF interaction visibility

Acceptance:

- Invoice create is the strongest workflow in the app visually and operationally

## B-08 — Purchase builder redesign

Scope:

- Improve purchase create page
- Better supplier/items sections
- Better bill upload treatment
- Better totals and actions layout

Acceptance:

- Purchase create flow matches invoice quality closely

## B-09 — Inventory and payments UX polish

Scope:

- Improve inventory page visual structure
- Improve payment sections in invoice/purchase detail
- Prepare visual model for future dedicated payments page

Acceptance:

- Inventory and payments no longer feel secondary or underdesigned

## B-10 — Accounting and reports UX polish

Scope:

- Improve trial balance, P&L, balance sheet, cash book, bank book layouts
- Improve reports hub and report pages
- Remove JSON-like fallback feel where possible

Acceptance:

- Accounting and reports read like finance product screens

## B-11 — Settings and admin polish

Scope:

- Improve settings pages structure
- Improve admin pages tables and hierarchy
- Better empty states and sectioning

Acceptance:

- Settings and admin areas meet the same visual standard as main app pages

## B-12 — Responsive and accessibility pass

Scope:

- Test and refine mobile/tablet behavior
- Improve keyboard navigation and focus handling
- Improve screen-reader-friendly labels and state messaging

Acceptance:

- Main workflows are usable beyond ideal desktop conditions

---

## Recommended implementation order

1. B-01
2. B-02
3. B-03
4. B-04
5. B-05
6. B-06
7. B-07
8. B-08
9. B-10
10. B-11
11. B-09
12. B-12
