# Authenticated Surface Visual And Interaction Thesis

## Purpose

This document defines the visual thesis and interaction thesis for the signed-in GST Billing product surface. It is grounded in the current implementation of the tenant workspace and admin workspace, not a greenfield redesign.

The goal is not to replace the current architecture. The goal is to sharpen it into a more coherent operating environment so the signed-in product feels like a serious control surface rather than a collection of improved pages.

Primary implementation references:

- `apps/web/src/app/(app)/c/[companyId]/layout.tsx`
- `apps/web/src/components/app/company-header.tsx`
- `apps/web/src/components/app/company-nav.tsx`
- `apps/web/src/app/(app)/c/[companyId]/dashboard/page.tsx`
- `apps/web/src/app/(app)/c/[companyId]/reports/page.tsx`
- `apps/web/src/app/(app)/c/[companyId]/settings/page.tsx`
- `apps/web/src/app/admin/layout.tsx`
- `apps/web/src/components/admin/admin-nav.tsx`

---

## Current Truth

The authenticated product already has a credible structural base:

- a tenant shell with sticky header, left navigation, sheet navigation on mobile, and permission-aware route visibility
- a separate admin shell with its own navigation, governance grouping, and guarded session flow
- stronger cards, stats, filters, tables, and headers than the original MVP
- meaningful route hubs for dashboard, reports, settings, accounting, and admin

The remaining weakness is not raw completeness. The weakness is visual and interaction cohesion.

Current patterns still lean too heavily on:

- stacked cards for almost every route
- generic route hubs that feel similar even when the jobs are different
- local page-level composition instead of a clear page archetype system
- weak distinction between:
  - overview pages
  - dense operational pages
  - detail pages
  - configuration pages
  - compliance pages

So the signed-in app is functional, but it still reads as a set of polished screens rather than one operating environment with a strong internal grammar.

---

## Visual Thesis

### Core idea

The authenticated product should feel like an operations desk, not a marketing site and not a generic SaaS dashboard.

The visual language should communicate:

- disciplined control
- readable financial seriousness
- workflow momentum
- audit-friendly clarity

The right reference frame is:

- finance terminal restraint
- operations-room organization
- editorial emphasis where hierarchy matters

Not:

- playful startup dashboard
- card grid as default layout
- over-animated productivity UI

### Visual position

The signed-in product should be:

- denser than the public site
- calmer than a typical admin template
- more tactile than raw enterprise software

This means:

- tighter spacing rhythm
- fewer decorative containers
- stronger use of sectional hierarchy
- more dependence on alignment, typography, and surface contrast than on boxed cards everywhere

### Surface model

The signed-in app should use a 4-layer surface model consistently:

1. `Shell`
   - app frame, sidebar, top header, breadcrumbs, workspace identity
2. `Section`
   - route bands such as KPI strip, filter rail, action band, data region
3. `Panel`
   - focused contained units such as detail summary, totals box, quick actions, lifecycle feed
4. `Data plane`
   - tables, ledgers, journals, report matrices, GST sections

Current issue:
- too many things are rendered as `Panel`

Desired correction:
- overview pages can use more panels
- operational/data-heavy pages should expose more `Data plane` and fewer nested cards

---

## Interaction Thesis

### Core idea

The product should behave like a guided operating surface where users move between:

- orient
- act
- verify
- continue

Every important route should make those four steps obvious.

### Interaction priorities

1. Orientation first
   - user should understand where they are immediately
   - company/admin context, breadcrumbs, route title, and state should work together

2. Actions near the top
   - primary task actions should not hide below data
   - invoice issue, payment record, adjustment create, lock period, create role, suspend company should live in a predictable action band

3. Verification next to action
   - after action, the consequence should be visible nearby
   - lifecycle event, updated totals, changed balance, new row, or status badge should confirm the result

4. Dense data should stay readable
   - reports, books, ledgers, journal lists, usage views, and admin tables should privilege legibility over ornament

### State model

Each authenticated route should consistently expose these states:

- loading
- empty
- ready
- partial failure
- locked or restricted

The current app handles many of these, but not with one consistent visual grammar.

Desired consistent cues:

- loading: restrained skeleton or loading block
- empty: route-specific empty explanation plus a primary next action
- partial failure: inline alert without collapsing the whole page
- restricted: clear permission or period-lock banner instead of silent absence

---

## Page Archetypes

The signed-in app should be treated as five page archetypes.

### 1. Workspace Overview

Examples:

- tenant dashboard
- admin dashboard

Job:

- summarize the current operating picture
- route the user into action

Visual behavior:

- strong top KPI band
- one dominant summary panel
- one attention panel
- one recent activity strip

Avoid:

- turning overview pages into generic card carpets

### 2. Operational List Pages

Examples:

- invoices
- purchases
- customers
- suppliers
- products
- payments
- companies
- subscriptions

Job:

- scan
- filter
- choose next action

Visual behavior:

- compact top action/filter rail
- table-first layout
- totals and status chips above or beside the table
- row actions visible but not noisy

Avoid:

- oversized cards above already-dense data
- truncation without overflow strategy

### 3. Detail And Lifecycle Pages

Examples:

- invoice detail
- purchase detail
- company detail in admin

Job:

- inspect one record deeply
- take context-aware actions
- verify lifecycle history

Visual behavior:

- summary band at top
- primary action rail under summary
- detail blocks grouped by job:
  - commercial
  - financial
  - documents/files
  - lifecycle/audit

Avoid:

- mixing action forms and history feeds without sectional separation

### 4. Configuration Pages

Examples:

- settings company
- users
- roles
- notifications
- subscription

Job:

- define policy and defaults

Visual behavior:

- form-led layout
- explanatory side copy only where it reduces error
- explicit save/test/result feedback

Avoid:

- treating configuration like a data table if the primary job is form completion

### 5. Compliance And Finance Pages

Examples:

- GST compliance center
- trial balance
- P&L
- balance sheet
- cash book
- bank book
- journals

Job:

- review correctness
- compare totals
- export or file

Visual behavior:

- denser typography
- stronger totals framing
- calmer color use
- fewer decorative surfaces
- wider tables with better scroll discipline

Avoid:

- dashboard styling on statement pages

---

## Tenant Workspace Thesis

### What should define the tenant experience

The tenant workspace should feel like:

- one company’s operating room
- not a set of modules

That means the shell should constantly reinforce:

- company identity
- operational continuity
- the current route’s place in the workflow

### Tenant shell direction

Current strengths:

- sidebar exists and is permission-aware
- sticky header exists
- breadcrumbs exist

Needed refinement direction:

- stronger distinction between navigation and content plane
- more compact, more premium sidebar density
- route-level action band below header on dense pages
- better visual grouping of workflow families:
  - masters
  - sales
  - purchases
  - payments
  - inventory
  - accounting
  - reports
  - settings

### Tenant interaction rules

- creating or editing something should always make the next operational step obvious
- invoice and purchase flows should always show:
  - current state
  - available next actions
  - financial effect
  - lifecycle confirmation
- reports should never feel like raw payload viewers again

---

## Admin Workspace Thesis

### What should define the admin experience

The admin workspace should feel like:

- platform control
- not tenant workflow reuse

It should carry more governance weight, more observation, and more consequence.

### Admin shell direction

Current strengths:

- dedicated shell exists
- grouped navigation exists
- governance routes exist

Needed refinement direction:

- more explicit distinction between:
  - control
  - operations
  - governance
- stronger operator identity framing
- more visible system health and priority surfaces
- less tenant-like styling on admin detail pages

### Admin interaction rules

- admin actions should be visibly privileged
- destructive or governance-changing actions should feel different from tenant-side routine edits
- audit consequences should appear quickly after action

---

## Typography And Density Rules

### Typography

Use the current display-plus-sans pairing with more discipline:

- display only for:
  - page titles
  - major KPI callouts
  - statement totals
  - section-opening moments
- sans for:
  - tables
  - filters
  - forms
  - secondary labels

### Density

The signed-in app should run on three densities:

- `Comfortable`
  - dashboard, settings hubs, admin hubs
- `Standard`
  - most lists and detail pages
- `Dense`
  - books, reports, ledgers, journals, admin analytics

Right now too many pages sit somewhere between comfortable and standard.
The finance/compliance pages should deliberately move denser.

---

## Color And Motion Rules

### Color

Authenticated pages should use accent color sparingly:

- action emphasis
- active navigation
- positive operational signal

Finance/compliance pages should mostly rely on:

- neutral surfaces
- strong typography
- restrained semantic color

### Motion

Motion should be nearly invisible in the signed-in app.

Allowed:

- subtle route-load fade
- controlled hover response
- menu/sheet transitions
- toast entrance

Avoid:

- decorative page choreography
- marketing-style reveal sequencing inside the app

---

## Component Direction

### Needs to become more canonical

1. `PageHeader`
   - should define the top band for most routes
2. `Action rail`
   - should become a clearer shared pattern
3. `Filter bar`
   - should become standardized across list pages
4. `Data table shell`
   - should handle horizontal overflow, sticky headers, truncation, and alignment consistently
5. `Detail summary strip`
   - should become the default top pattern for invoice/purchase/admin detail pages
6. `Status messaging`
   - toast for action feedback
   - inline alert for route/system issues

### Should be reduced

- decorative cards where a section band would do
- repeated mini-explanatory cards on operational routes
- overuse of badges as decoration rather than state

---

## Route-Specific Direction

### Dashboard

- keep bold, but simplify the number of competing surfaces
- treat it as command center, not a marketing page inside the app

### Invoices and purchases

- top summary strip
- next action rail
- line-item/data plane
- payments and lifecycle as separate, disciplined blocks

### Reports and accounting

- denser and calmer
- stronger totals anchoring
- more table-led, less card-led

### Settings

- policy-focused
- form-led
- stronger save/result feedback discipline

### Admin detail pages

- visibly operational
- stronger risk cues for suspension, reactivation, plan overrides, internal-user actions

---

## What Is Already Right

These existing implementation choices should be preserved:

- separate tenant and admin shells
- permission-aware navigation
- sticky headers
- breadcrumb support
- role-aware product posture
- report normalization and compliance surfaces
- stronger public/auth typography system that can inform the signed-in app

This thesis is not asking for a reset. It is asking for a clearer internal grammar on top of a now-solid foundation.

---

## Recommended Next Execution Order

1. Define authenticated page archetypes in code
   - overview
   - list
   - detail
   - configuration
   - compliance/finance

2. Standardize shared route bands
   - page header
   - action rail
   - filter rail
   - detail summary strip

3. Densify finance and compliance pages
   - books
   - reports
   - journals
   - ledgers

4. Tighten tenant shell hierarchy
   - sidebar grouping
   - header clarity
   - route identity consistency

5. Tighten admin shell hierarchy
   - privileged-action cues
   - platform health emphasis
   - governance visibility

6. Run a route-by-route visual consistency pass on the highest-frequency pages

---

## Success Criteria

The authenticated surface is succeeding when:

- users can tell what kind of page they are on immediately
- primary actions are obvious without hunting
- dense financial pages feel trustworthy rather than crowded
- admin routes feel like platform operations, not tenant pages with different data
- the product reads as one operating environment from login through daily work

