# Phase B UI Modernization Spec

**Date**: 2026-03-18
**Phase**: B — Design System and UI Modernization
**Status**: Completed on 2026-03-18
**Purpose**: Convert the high-level redesign intent into an execution-ready frontend modernization spec.

This document is the canonical design and implementation spec for Phase B.

Execution result:
- The shared visual system, shell, canonical page patterns, and broad page-surface rollout were implemented in the frontend during Phase B.
- Any remaining frontend work should build on the Phase B foundation rather than reopen the design-system baseline.

Related:
- `docs/GAP_ANALYSIS_AND_EXECUTION_PLAN.md`
- `docs/UI_UX_REDESIGN.md`
- `todo/planned/PHASE_B_DESIGN_SYSTEM_UI_MODERNIZATION.md`
- `todo/planned/PHASE_B_PAGE_BACKLOG.md`

---

## 1. Phase B objective

Build a modern, pixel-consistent, reusable frontend foundation that:

- unifies the visual language of the app
- improves information density and usability
- reduces one-off UI patterns
- makes later phase work faster and more consistent

Phase B is not just “make pages prettier.”

It should deliver:

- a design system
- a stronger app shell
- standardized list/detail/form/report patterns
- clear implementation rules for all future frontend work

---

## 2. Current UI assessment

Current strengths:

- The app already has a functioning company shell
- Some `components/ui/*` primitives already exist
- There is an early `datatable` abstraction
- Shared page-state helpers already exist

Current weaknesses:

- `globals.css` is almost empty and does not define a product visual system
- The shell is structurally fine but visually basic
- `lib/ui/*` wrappers are minimal and inconsistent with newer `components/ui/*`
- Lists, forms, and detail pages use inconsistent spacing and hierarchy
- Some pages still feel like MVP scaffolds rather than product surfaces
- The visual language is neutral but not intentional

---

## 3. Design principles

### A. Professional and calm

The product is used for billing, accounting, inventory, and compliance work.
The UI should feel:

- stable
- precise
- efficient
- trustworthy

### B. Dense but readable

This is not a marketing site.
The application should support operational density without becoming visually noisy.

### C. Pixel discipline

Spacing, alignment, control sizes, card layout, and table structure should follow strict standards.

### D. Shared patterns first

Every new page should use reusable patterns before custom layout.

### E. Modern but not trendy

Avoid generic startup-dashboard visuals, overuse of gradients, or decorative clutter.
Aim for a polished business product.

---

## 4. Visual system

## 4.1 Color direction

Recommended palette direction:

- App background: warm-neutral gray, not flat white
- Surface: white
- Elevated surface: slightly brighter white with stronger shadow/border separation
- Border: soft neutral with visible contrast
- Primary action: deep blue or blue-teal
- Accent/supporting action: slate
- Success: green
- Warning: amber
- Danger: red
- Info: steel blue

Recommended semantic tokens:

- `--bg-app`
- `--bg-surface`
- `--bg-surface-muted`
- `--bg-surface-elevated`
- `--fg-default`
- `--fg-muted`
- `--fg-subtle`
- `--border-default`
- `--border-strong`
- `--accent-primary`
- `--accent-primary-hover`
- `--accent-success`
- `--accent-warning`
- `--accent-danger`

## 4.2 Typography

Direction:

- Use a refined sans stack with strong legibility
- Clear hierarchy between page title, section title, card title, helper text, table metadata
- Monospace only for IDs, codes, invoice numbers, and technical values

Recommended hierarchy:

- Page title: `text-2xl` / semibold
- Section title: `text-base` to `text-lg` / semibold
- Card title: `text-sm` to `text-base` / semibold
- Body text: `text-sm`
- Secondary text: `text-sm text-muted`
- Meta labels: `text-xs uppercase tracking`

## 4.3 Spacing and sizing

Use an 8px grid.

Canonical spacing:

- Page padding desktop: 24px to 32px
- Page padding mobile: 16px
- Section gap: 24px
- Card padding: 20px to 24px
- Form field gap: 16px
- Table cell vertical padding: 10px to 14px depending on density
- Header action gap: 8px to 12px

Canonical radii:

- Surface cards: 16px
- Inputs/buttons: 10px to 12px
- Pills/badges: fully rounded or 9999px

---

## 5. Layout system

## 5.1 App shell

Target shell improvements:

- Sidebar becomes more structured and polished
- Sidebar includes visual grouping and better active state
- Top bar becomes a true application header with:
  - breadcrumbs
  - company context
  - user/session menu
  - optional contextual actions
- Mobile uses a proper sheet-based navigation flow

Shell rules:

- Sidebar width: 280px to 300px
- Main content should use a constrained page container, not full-bleed by default
- Header should remain sticky
- Route path debug text should be removed or converted into breadcrumbs

## 5.2 Page container rules

Define canonical page widths:

- Standard operational pages: 1280px max
- Forms/detail pages: 960px to 1120px max
- Reports: 1360px max where needed
- Admin pages: 1360px max where table density is helpful

## 5.3 Page composition templates

Provide reusable templates:

- List page
- Detail page
- Create/edit form page
- Report page
- Settings page
- Dashboard page

---

## 6. Interaction system

## 6.1 Loading states

Required patterns:

- Skeleton blocks for cards and tables
- Inline spinner/text state for button actions
- Full-page load skeleton for detail pages

Avoid:

- plain “Loading…” text as the default experience

## 6.2 Error handling

Required patterns:

- Inline alert/banner for page-level failures
- Field-level error rendering for forms
- Toasts for action-level failures and successes

## 6.3 Empty states

Each empty state should include:

- direct statement of emptiness
- one-sentence explanation
- one primary CTA where appropriate

## 6.4 Destructive actions

Required:

- confirmation dialog
- resource name in dialog body
- explicit destructive button style

## 6.5 Pending and success feedback

Required:

- optimistic or immediate local feedback where appropriate
- success toast for create/update/delete/issue/receive/export actions

---

## 7. Component system requirements

The shared component layer should standardize:

- `PageShell`
- `PageHeader`
- `Breadcrumbs`
- `SectionCard`
- `FilterBar`
- `DataTable`
- `EmptyState`
- `ErrorBanner`
- `ConfirmDialog`
- `FormField`
- `FieldHint`
- `FieldError`
- `StatCard`
- `StatusBadge`
- `ActionBar`
- `MetricStrip`

Guidance:

- Prefer evolving `components/ui/*` into the canonical layer
- Minimize parallel abstraction layers between `lib/ui/*` and `components/ui/*`
- Avoid leaving two competing button/input systems in place long-term

---

## 8. Route-by-route modernization goals

## 8.1 Dashboard

Target outcome:

- A real operations landing page

Enhancements:

- KPI card strip
- Quick actions
- Recent invoices/payments
- Low-stock module
- Cleaner visual hierarchy and sectioning

## 8.2 Masters

Target outcome:

- Fast, polished CRUD with consistent list/detail patterns

Enhancements:

- Standardized search/filter rows
- Better tables
- Better detail pages with cards
- Better form layouts

## 8.3 Invoices

Target outcome:

- Best-in-class operational experience within the app

Enhancements:

- Strong builder layout
- Product search and row interaction polish
- Tax/totals summary panel
- Better issue/PDF/payment states
- Cleaner detail page sectioning

## 8.4 Purchases

Target outcome:

- Same quality bar as invoices

Enhancements:

- Better line-item table
- Better status and receive actions
- Better bill upload/download block
- Better payment section

## 8.5 Inventory

Target outcome:

- Operational stock visibility that feels intentional

Enhancements:

- Dedicated inventory summary
- stronger low-stock presentation
- clean movement links and thresholds

## 8.6 Accounting

Target outcome:

- Reports and journals feel like a finance product, not debug output

Enhancements:

- cleaner report layouts
- totals hierarchy
- drilldown affordances
- better journals and books density

## 8.7 Reports and GST

Target outcome:

- Decision-ready reports

Enhancements:

- unified filter bars
- metric cards
- tables with strong hierarchy
- export action areas

## 8.8 Settings

Target outcome:

- Settings feel coherent and administrative, not ad hoc

Enhancements:

- settings sub-navigation pattern
- stronger form grouping
- better empty states and helper copy

## 8.9 Admin

Target outcome:

- operational visibility with polished tables

Enhancements:

- proper admin shell later if needed
- stronger tables
- KPI and filter panels

---

## 9. Execution strategy

## 9.1 Recommended implementation order

1. Global tokens and `globals.css`
2. Shared UI component consolidation
3. App shell redesign
4. Dashboard redesign
5. Canonical list page pattern rollout
6. Canonical detail page pattern rollout
7. Invoice and purchase flow redesign
8. Reports/accounting/settings polish

## 9.2 Migration rules

- Do not redesign each page from scratch independently
- Build reusable patterns first, then migrate page groups
- Replace minimal legacy wrappers progressively
- Avoid large one-shot UI rewrites without shared primitives in place

## 9.3 Out of scope for Phase B

- New business-domain features like GST engine or POS logic
- Major backend scope changes unless required to support UI data shape stability
- Full onboarding implementation

---

## 10. Acceptance criteria for Phase B

Phase B should be considered complete when:

- the app shell has been modernized
- a consistent visual system exists in code
- core shared UI patterns are standardized
- dashboard, masters, invoices, purchases, reports, accounting, settings, and admin all follow the same design system direction
- placeholder-feeling screens are eliminated from the main company workflow
- the UI reads as a cohesive product rather than a sequence of iterative MVP pages

---

## 11. Open decisions

These should be decided early in Phase B:

- final accent color direction
- whether to retain Geist or switch to a different primary product font
- whether to fully replace `lib/ui/*` wrappers or keep them as thin facades over `components/ui/*`
- whether admin should gain its own dedicated shell in Phase B or a later phase
