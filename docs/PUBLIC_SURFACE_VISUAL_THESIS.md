# Public Surface Visual Thesis

**Date**: 2026-03-24  
**Scope**: `/`, `/login`, `/reset-password`, `/security`, `/pricing`, `/privacy`, `/help`, `/features`, `/demo`, `/contact`, `/admin/login`  
**Basis**: Current implementation review of the public shell and page-level routes in `apps/web/src/app`

## Why This Exists

The current public/auth surface is structurally complete, but visually it is still too component-led:

- hero sections are boxed instead of poster-like
- the home page still reads like a product summary page rather than a category-defining front door
- many supporting pages rely on repeated card grids instead of stronger composition
- auth pages are functional but not art-directed
- admin login looks like a variant of tenant login rather than a deliberately separate internal surface

This document establishes the visual thesis and page-level direction needed to redesign the entire public surface coherently.

---

## Master Direction

### Visual Thesis

**Build the public surface like a disciplined operations brand: warm editorial light, paper-and-ink contrast, dense financial seriousness, and one cinematic data-led visual anchor per page.**

### Content Plan

Across the public site, default to:

1. Hero: brand, promise, action, one dominant visual
2. Support: one proof or capability frame
3. Detail: workflow depth, credibility, or operational structure
4. Final CTA: start, talk, request, or sign in

### Interaction Thesis

Use three recurring motion ideas:

1. **Poster reveal**: headline, CTA, and visual plane enter in staggered sequence
2. **Section drift**: scroll introduces subtle translate and opacity shifts to give the layout depth
3. **Quiet precision**: hover and focus states feel crisp and mechanical, not playful

---

## Current Implementation Diagnosis

### What Is Working

- route coverage exists
- shared public shell exists
- the pages already have a clean information architecture
- color and spacing are reasonably controlled

### What Is Missing

- no single strong image-led or composition-led brand world
- too many rounded cards doing the work of layout
- first viewport is not memorable enough
- supporting pages are too similar to one another
- auth pages do not feel premium or intentional
- public and internal surfaces do not feel like parts of one designed system

---

## Shared Art Direction Rules

### Mood

- financial, calm, exact
- not startup-playful
- not dark by default
- not gradient-led by default

### Palette

- base: parchment, chalk, ink, slate
- accent: deep mineral blue
- secondary accent: restrained brass only where commercial emphasis is needed

### Typography

- display face: high-contrast editorial serif or sharp grotesk with authority
- interface face: restrained grotesk for labels and UI
- no more than two type families

### Imagery

- use real operational imagery or data-led environmental compositions
- avoid fake dashboard mockups floating in cards
- avoid generic SaaS gradients as hero substitutes
- each page needs one dominant visual plane, not many small decorations

### Layout

- full-bleed hero by default for branded pages
- constrain the text column, not the entire hero
- reduce card usage sharply
- use bands, columns, image planes, dividers, and statement typography before cards

### Motion

- staggered hero reveal
- parallax or slow section drift on scroll
- strong but restrained hover/focus transitions on links, CTAs, and navigation

---

## Global Surface System

### Header

The public header should feel lighter and more editorial:

- transparent or near-transparent over the hero at first paint
- becomes a frosted strip only after scroll
- stronger brand lockup
- fewer pill-like nav treatments

### Footer

The footer should become more publication-like:

- stronger hierarchy between brand, links, and legal
- less like a grid of equal columns
- more like a closing editorial plate

### CTA Language

Use a tighter CTA system:

- `Create company`
- `Book demo`
- `View pricing`
- `Talk to us`
- `Go to workspace login`
- `Go to admin login`

Avoid long mixed CTA phrasing.

---

## Page Directions

## 1. Home Page

### Page Thesis

**The home page should feel like a category-defining operations poster, not a feature brochure.**

### Current Weakness

- boxed hero
- too many card components
- no dominant visual idea
- proof and features read like a controlled summary, not a brand statement

### Visual Direction

- full-bleed hero with a warm operational backdrop: printed invoices, ledger textures, stock labels, stamped paperwork, terminal-like transaction fragments
- brand mark and product name must dominate before the headline
- one narrow copy column anchored to the calm side of the composition
- one dense supporting proof strip below the fold, not four equal cards

### Content Structure

1. Hero: brand, promise, primary CTA, secondary CTA
2. One structural proof section: “Billing, GST, stock, accounting”
3. Workflow section: show the control loop
4. Final CTA

### Motion

- hero typography reveal
- subtle background drift tied to scroll
- CTA hover with slight lift and contrast snap

---

## 2. Login Page

### Page Thesis

**Tenant login should feel like entering a controlled workspace, not filling a generic form.**

### Visual Direction

- split composition without a boxed card
- left side: calm brand panel with one operational statement
- right side: sign-in form on a quiet surface
- use stronger vertical rhythm, less border-heavy framing

### Content Plan

1. Brand / context
2. Login form
3. Recovery and onboarding links

### Motion

- form panel soft slide on enter
- focused field glow and label tightening

---

## 3. Reset Password Page

### Page Thesis

**Reset password should feel reassuring and exact, like a secure checkpoint.**

### Visual Direction

- use a single narrow secure-flow column
- very quiet palette
- stronger emphasis on state and next action
- token/recovery context should be readable without noise

### Content Plan

1. Context statement
2. Password form
3. Success handoff

### Motion

- success state transition should feel deliberate, not abrupt

---

## 4. Security Page

### Page Thesis

**Security should feel institutional and credible, not like a marketing FAQ.**

### Current Weakness

- card grid is too generic

### Visual Direction

- one authority-led hero
- then alternating content bands:
  - auth and access
  - auditability and traceability
  - platform integrity
- use diagrams, checklists, and structured statements instead of repeated feature cards

### Content Plan

1. Security posture hero
2. Pillars
3. Controls and governance
4. Contact/security CTA

---

## 5. Pricing Page

### Page Thesis

**Pricing should feel like a commercial framework for operational maturity, not a commodity pricing table.**

### Visual Direction

- emphasize tier progression through scale and spacing, not equal cards
- middle or recommended plan should anchor the composition
- use brass only here for restrained commercial emphasis

### Content Plan

1. Pricing thesis hero
2. Plan structure
3. Fit-by-stage section
4. Conversion CTA

### Motion

- tier emphasis on hover
- subtle section reveal for comparison content

---

## 6. Privacy Page

### Page Thesis

**Privacy should read like a formal document surface with modern clarity.**

### Visual Direction

- not a card
- use a document canvas with strong headings, section dividers, and readable measure
- public legal pages should feel like policy documents, not app screens

### Content Plan

1. Legal heading
2. Policy summary
3. Formal body sections
4. Contact / legal footer note

---

## 7. Help Page

### Page Thesis

**Help should feel like an entry hub into product understanding, not a parking lot of support topics.**

### Visual Direction

- stronger search or routing emphasis in first viewport
- use grouped pathways rather than equal cards
- present product support like an operational navigation surface

### Content Plan

1. Help hero
2. Top support paths
3. Topic groups
4. Escalation CTA

---

## 8. Features Page

### Page Thesis

**Features should tell the operating-system story, not just enumerate modules.**

### Current Weakness

- current page is still a feature-card matrix

### Visual Direction

- use large workflow bands instead of many cards
- sequence the story as:
  - documents
  - stock
  - compliance
  - finance
  - admin
  - POS

### Content Plan

1. Systems-level hero
2. Workflow bands
3. Architecture/proof section
4. CTA

---

## 9. Demo Page

### Page Thesis

**Demo should feel like a guided review path for serious buyers and internal stakeholders.**

### Visual Direction

- more concierge-like than homepage
- calmer surface
- stronger emphasis on “what you will see in the walkthrough”

### Content Plan

1. Demo promise
2. Walkthrough agenda
3. Stakeholder fit
4. Contact CTA

---

## 10. Contact Page

### Page Thesis

**Contact should feel like a routing desk for rollout conversations, not a generic contact form page.**

### Visual Direction

- one strong left-side conversation statement
- right-side action panel
- routing blocks should feel like decision paths, not cards

### Content Plan

1. Contact hero
2. Reason-to-contact routing
3. Direct channels
4. CTA to demo or onboarding

---

## 11. Admin Login Page

### Page Thesis

**Admin login should feel internal, controlled, and separate from the public acquisition surface.**

### Current Weakness

- currently too close to tenant login

### Visual Direction

- darker neutral interior tone than tenant login, but not full dark mode
- more compressed and access-controlled
- internal system feel: operator access, governance, platform control

### Content Plan

1. Internal admin marker
2. Auth form
3. Route back to tenant login

### Motion

- restrained, minimal, more formal than public pages

---

## Shared Implementation Guidance

## Home + Supporting Public Pages

- replace boxed `MarketingHero` usage with a true full-bleed hero composition
- reduce `FeatureCard` dependence across public routes
- create 2-3 reusable public composition primitives:
  - `FullBleedHero`
  - `EditorialBand`
  - `RouteCluster`

## Auth Pages

- create a dedicated auth-shell instead of styling each page independently
- tenant login and reset-password should share structure
- admin login should use a related but distinct internal auth shell

## Legal Pages

- use a document-layout component for privacy and terms

## Content Consistency

- public pages should feel like one narrative system
- auth pages should feel like entry points into that system
- admin login should feel adjacent but intentionally separate

---

## Implementation Order

1. Establish public visual system and hero composition primitives
2. Redesign `/`
3. Redesign auth shell: `/login`, `/reset-password`
4. Redesign `/admin/login`
5. Redesign public marketing/support pages:
   - `/features`
   - `/pricing`
   - `/security`
   - `/help`
   - `/demo`
   - `/contact`
6. Redesign legal pages:
   - `/privacy`
   - `/terms`

---

## Success Criteria

- the home page has a strong first-screen visual anchor
- brand presence is unmistakable in the first viewport
- supporting pages no longer look like variants of the same card grid
- login and admin login feel intentional and distinct
- privacy and legal pages feel document-like, not card-like
- the public site reads as one disciplined premium system

