# UI Visual Rebuild Plan

**Date**: 2026-03-28  
**Status**: UI-1, UI-2, UI-3, UI-4, and UI-5 implemented at code/build level  
**Purpose**: Define the next frontend phase after the UX architecture rollout, focused on visual system quality, theme architecture, light/dark support, and safe UI modernization without product regression.

Related:

- [AUTHENTICATED_SURFACE_VISUAL_AND_INTERACTION_THESIS.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/AUTHENTICATED_SURFACE_VISUAL_AND_INTERACTION_THESIS.md)
- [UX_EXECUTION_DECISION_SHEET.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/UX_EXECUTION_DECISION_SHEET.md)
- [UX_DESIGN_IMPLEMENTATION_BACKLOG.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/UX_DESIGN_IMPLEMENTATION_BACKLOG.md)
- [PHASE_B_UI_MODERNIZATION_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/PHASE_B_UI_MODERNIZATION_SPEC.md)

Primary implementation references:

- `apps/web/src/app/globals.css`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/providers.tsx`
- `apps/web/src/components/app/company-header.tsx`
- `apps/web/src/components/app/company-nav.tsx`
- `apps/web/src/lib/ui/page-header.tsx`
- `apps/web/src/lib/ui/workspace.tsx`
- `apps/web/src/lib/ui/queue.tsx`
- `apps/web/src/lib/ui/detail.tsx`
- `apps/web/src/lib/ui/composer.tsx`
- `apps/web/src/components/ui/button.tsx`
- `apps/web/src/components/ui/card.tsx`
- `apps/web/src/components/ui/badge.tsx`
- `apps/web/src/components/ui/dropdown-menu.tsx`

---

## 1. Current Judgment

The product UX architecture is now materially in place:

- workflow-led shell exists
- queue, detail, and composer patterns exist
- the app no longer behaves like unrelated screens

But the visual system is not yet at production quality for a serious distributor workspace.

The current UI problems are now mostly visual-system problems, not route-architecture problems.

### 1.1 Main visual issues

- there is no real theme engine yet; the app is effectively hardcoded to one light theme
- dark mode does not exist
- the current palette is inconsistent:
  - blue primary token
  - warm beige backgrounds
  - orange-tinted selected states
  - many hardcoded `rgba(...)` values
- too many surfaces use almost the same white panel treatment
- the app still depends too much on rounded bordered containers for hierarchy
- public surface and authenticated surface do not yet feel like one product family
- several low-level primitives still use raw white/neutral styling instead of semantic tokens

### 1.2 Main code-level issues

- `globals.css` defines only one root token set
- `providers.tsx` has no theme provider
- many files use hardcoded colors directly instead of semantic variables
- selected-row states often use warm orange overlays that do not align with `--accent`
- some primitives still use raw `white`, `neutral`, or direct color utilities
- there is no explicit semantic separation between:
  - shell surfaces
  - panel surfaces
  - data planes
  - overlays
  - state colors

---

## 2. Frontend Thesis

This plan follows the `frontend-skill` framing and treats the signed-in app as a premium operator surface, not a generic dashboard theme swap.

### 2.1 Visual thesis

Create a low-glare operations interface with mineral neutrals, restrained contrast, one disciplined accent, and sharper state hierarchy so the product feels premium, calm, and fast under heavy daily use.

### 2.2 Content plan

For the signed-in app, the “content” is the operating surface itself:

1. shell and workspace identity
2. filters, commands, and context
3. dense data and action surfaces
4. exception, confirmation, and completion states

### 2.3 Interaction thesis

Use motion sparingly but intentionally:

- soft shell and page-enter transitions that make the app feel composed, not animated
- subtle selection and inspector transitions so row focus feels precise
- theme transitions that are fast, stable, and do not flash or reflow

---

## 3. Visual Direction

### 3.1 Product position

Do not copy Marg visually.

Do not lean into consumer-SaaS softness either.

The right visual position is:

- more modern than Marg
- more serious than startup admin templates
- denser than the public site
- cleaner than raw enterprise software

### 3.2 Design language

The signed-in app should feel like:

- an operations desk
- a finance-friendly control surface
- an environment where tables and states matter more than decoration

This means:

- deeper shell contrast
- calmer panels
- stronger type hierarchy
- fewer decorative gradients in work surfaces
- clearer separation between navigation chrome and data chrome

---

## 4. Theme Architecture

This is the most important technical foundation.

## 4.1 Goal

Introduce a semantic theme system with:

- light mode
- dark mode
- persistent user preference
- support for future brand or tenant themes without rewriting components

## 4.2 Required implementation model

Use theme attributes at the document root:

- `html[data-theme="light"]`
- `html[data-theme="dark"]`

Keep raw palette tokens and semantic tokens separate.

### Raw palette tokens

Examples:

- `--stone-0`
- `--stone-50`
- `--stone-100`
- `--slate-900`
- `--ink-950`
- `--ocean-500`
- `--ocean-600`
- `--amber-500`
- `--red-500`
- `--green-500`

### Semantic tokens

These are what components must consume:

- `--background`
- `--background-muted`
- `--surface`
- `--surface-muted`
- `--surface-elevated`
- `--surface-strong`
- `--foreground`
- `--foreground-muted`
- `--foreground-subtle`
- `--border`
- `--border-strong`
- `--accent`
- `--accent-hover`
- `--accent-soft`
- `--success`
- `--warning`
- `--danger`
- `--info`
- `--focus-ring`
- `--shadow-soft`
- `--shadow-medium`
- `--shadow-overlay`
- `--overlay`

## 4.3 Theme provider

Add a real theme provider at app level.

Recommended path:

- use `next-themes`

Fallback path:

- custom `ThemeProvider` using localStorage and `data-theme`

The provider must support:

- `system`
- `light`
- `dark`

and prevent first-paint flashing.

## 4.4 Color-scheme handling

Set browser-native form and scrollbar behavior with:

- `color-scheme: light`
- `color-scheme: dark`

mapped to the active theme.

## 4.5 Theme switch placement

Add theme controls in:

- tenant header user menu
- admin header user menu

Do not place theme switching as a primary workflow action.

---

## 5. Color Strategy

## 5.1 Recommendation

Move away from the current blue-plus-beige-plus-orange inconsistency.

Use one core accent family for action and active states.

Recommended working direction:

- shell: deep graphite / midnight neutral
- app background: soft mineral neutral
- surfaces: cool off-white in light theme, layered charcoal in dark theme
- primary accent: ocean blue or blue-teal
- warning: amber
- danger: brick red
- success: evergreen

## 5.2 Hard rule

Selected states, active tabs, active queue rows, and focus styles must use the same accent family.

Current problem:

- active/selected states often use warm orange overlays such as `rgba(180,104,44,...)`
- this competes with the main blue accent

Required fix:

- remove accent inconsistency
- map all interactive active states to the semantic accent system

## 5.3 Light mode target feeling

- bright but not white-hot
- low glare
- paper-like surfaces with crisp text
- shells and headers slightly cooler than content surfaces

## 5.4 Dark mode target feeling

- graphite, not pure black
- strong contrast for data and tables
- lower saturation than consumer dark themes
- active surfaces readable without neon glow

---

## 6. Typography Strategy

## 6.1 Judgment

The current `Manrope + Cormorant Garamond` pairing is visually interesting, but it is not ideal as the default product UI system for a heavy operations app.

Recommendation:

- keep the expressive serif only where brand/editorial emphasis is useful
- move the signed-in app to a more disciplined product hierarchy

Options:

1. keep `Manrope` for UI and reduce serif usage sharply
2. move to a more operational display strategy later if needed

Immediate rule:

- product shell, queues, forms, inspectors, and tables should be sans-first
- serif should not dominate operational headings

## 6.2 Type hierarchy

Standardize:

- shell label
- page title
- section title
- panel title
- table label
- field label
- metadata label
- numeric emphasis

Numeric content should feel especially intentional for:

- amounts
- balances
- dues
- quantities
- KPI values

---

## 7. Surface System

Use a stricter 4-layer visual model.

### Layer 1: Shell

- sidebar
- top header
- sub-workflow strip

Visual role:

- anchor navigation and context

### Layer 2: Section

- workflow band
- filter region
- page context strip

Visual role:

- organize a route into meaningful operating zones

### Layer 3: Panel

- inspector
- summary block
- secondary contextual card
- composer rail

Visual role:

- focused context or action

### Layer 4: Data plane

- tables
- ledgers
- line items
- reports
- logs

Visual role:

- primary work surface

### Hard rule

Not everything should look like Layer 3.

That is one of the main current problems.

---

## 8. Shared Primitive Rework

The visual refresh should start from primitives, not pages.

## 8.1 Must-redesign primitives

- `Button`
- `Badge`
- `Input`
- `Textarea`
- `Select`
- `Card`
- `Dialog`
- `DropdownMenu`
- `Table / datatable`
- `Tabs`
- `Toast`
- `EmptyState`
- `InlineError`
- `LoadingBlock`

## 8.2 Special attention items

### Buttons

Need:

- stronger primary presence
- cleaner secondary buttons
- tertiary/ghost buttons that do not disappear
- consistent focus ring across themes

### Tables

Need:

- better row density options
- cleaner selection state
- consistent sticky header treatment where useful
- improved hover/selected balance

### Cards / panels

Need:

- fewer default shadows
- clearer use cases
- a flatter panel style for data-heavy surfaces
- strong variant separation between:
  - quiet panel
  - elevated panel
  - strong panel

### Dropdowns / dialogs

Need:

- themed surfaces
- overlay tokens
- dark mode compatibility
- stronger edge definition

---

## 9. Shell Rebuild Scope

The workflow shell should remain structurally intact, but visually upgraded.

## 9.1 Tenant shell

Improve:

- sidebar depth and material quality
- active workflow emphasis
- header contrast and spacing
- command/search launcher presence
- workflow strip readability

Do not change:

- route architecture
- permission logic
- navigation structure itself

## 9.2 Admin shell

Bring admin into the same visual family, but keep a slightly sharper governance tone.

---

## 10. Page Family Rollout

The UI rebuild should follow the same page family logic as the UX work.

## Phase UI-1: Theme foundation

Status:

- completed at code/build level on 2026-03-28

Files first:

- `apps/web/src/app/globals.css`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/providers.tsx`

Deliver:

- semantic token architecture
- light/dark themes
- theme provider
- theme switcher
- base motion timings

## Phase UI-2: Primitive system

Status:

- completed at code/build level on 2026-03-28
- expanded the light-theme accent system with a warm secondary palette
- migrated shared primitives and selected legacy workflow pages off raw white/neutral styling

Files first:

- `apps/web/src/components/ui/*`
- `apps/web/src/lib/ui/*`

Deliver:

- consistent components across themes
- no raw white/neutral primitives
- no old accent mismatch

## Phase UI-3: Shell and chrome

Status:

- completed at code/build level on 2026-03-28
- strengthened tenant workflow rail identity, active-lane visibility, and top-header hierarchy
- upgraded admin shell chrome so platform operations reads as a distinct internal surface
- validated on real tenant and admin routes after build

Files first:

- `apps/web/src/components/app/company-header.tsx`
- `apps/web/src/components/app/company-nav.tsx`
- admin shell equivalents

Deliver:

- stronger shell identity
- cleaner top chrome
- better workflow emphasis

## Phase UI-4: Core tenant surfaces

Status:

- completed at code/build level on 2026-03-28
- upgraded the shared queue/table/detail/form surface language used by the core tenant routes
- visually refreshed dashboard, invoice list/detail, collections, banking, dispatch, customer detail, and product detail
- validated with `lint`, `build`, and targeted browser walkthroughs on seeded tenant routes

Coverage:

1. dashboard
2. invoices
3. collections
4. banking
5. dispatch
6. customer detail
7. product detail

Goal:

- visually consistent but still dense
- no page-specific logic regressions

## Phase UI-5: Remaining tenant surfaces

Status:

- completed at code/build level on 2026-03-28
- fixed the light-mode tenant sidebar background application so the left rail no longer renders washed out from gradient tokens being applied as flat background color utilities
- upgraded the remaining tenant route families to the new visual system:
  - orders
  - quotations
  - purchases
  - inventory family
  - suppliers
  - reports hub
  - settings family
  - field sales family
  - accounting specialist views
- validated with `npm --workspace apps/web run lint`
- validated with `npm --workspace apps/web run build`
- targeted signed-in browser validation remains dependent on a local app stack with Postgres and Redis available; in this environment the web app runs, but tenant login cannot complete because `localhost:5432` and `localhost:6379` are unavailable

Coverage:

Roll through:

- orders
- quotations
- purchases
- inventory
- suppliers
- reports
- settings
- field sales
- accounting specialist views

Result:

- remaining tenant pages now inherit the same theme-aware surface language, light-mode secondary palette, and higher-contrast chrome established in UI-1 through UI-4
- shell/sidebar contrast is corrected at the layout layer instead of being patched page by page

## Phase UI-6: Public and auth alignment

Goal:

- align marketing, onboarding, auth, and admin more tightly with the signed-in visual system
- keep public surface more expressive than product surface

---

## 11. No-Regression Rules

This work must not become a visual rewrite that destabilizes the app.

## 11.1 What must stay stable

- routing
- API contracts
- permissions
- page information architecture
- current F1-F5 / P0-P3 UX architecture
- existing workflows and button behavior

## 11.2 Safe implementation rule

Prefer:

- semantic token migration
- shared primitive upgrades
- CSS class migration
- isolated visual component refactors

Avoid:

- combining logic refactors with visual refactors in the same change
- rewriting page behavior while restyling
- changing data loading patterns during visual work

## 11.3 Validation rule

Each UI phase must be validated with:

- `npm --workspace apps/web run lint`
- `npm --workspace apps/web run build`
- targeted browser walkthroughs

For core pages also run:

- login
- dashboard
- invoice list
- invoice detail
- invoice create
- collections
- customer detail

## 11.4 Visual regression strategy

Use page family snapshots for:

- shell
- queue page
- detail page
- composer page
- settings page

Capture both:

- light mode
- dark mode

---

## 12. Current File Audit Summary

These issues were confirmed in the current implementation:

- `globals.css` is single-theme only
- `providers.tsx` has no theme provider
- `dropdown-menu.tsx` still uses hardcoded white and neutral tokens
- many queue/detail/composer/workspace components use hardcoded `rgba(...)` backgrounds
- selected row states frequently use warm orange overlays unrelated to the main accent
- headers and panels reuse similar white translucent treatments too often

This means the rebuild should start from token discipline first, not page cosmetics first.

---

## 13. Recommended Execution Order

1. Theme engine and semantic tokens
2. Primitive cleanup
3. Shell visual upgrade
4. Queue/detail/composer visual cleanup
5. Core page family rollout
6. Dark mode QA
7. Public/auth/admin alignment

---

## 14. Decision

The UI should be rebuilt, but in a controlled system-first way.

The correct strategy is:

- do not restart UX architecture work
- do not jump page by page with ad hoc styling
- establish theme architecture first
- migrate primitives second
- restyle shells and page families third

This is the safest path to materially improve the perceived quality of the product without causing regressions in a now-large operational app.
