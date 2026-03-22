# Public Site Implementation Plan

**Date**: 2026-03-22
**Purpose**: Define the remaining public-facing pages and the implementation order required to turn the current temporary landing/auth entry points into a product-grade website.

## Current state

Implemented public routes:

- `/`
- `/login`
- `/signup` (redirect only)
- `/onboarding`
- `/forgot-password`
- `/reset-password`

Current limitations:

- `/` is a temporary onboarding launcher, not a real landing page
- there is no public navigation or footer
- there is no pricing, features, about, contact, legal, or help surface
- there is no SEO/content strategy
- there is no conversion funnel from marketing pages into onboarding or demo requests

## Goal

Ship a complete public product surface that:

- explains the product clearly
- establishes trust
- converts traffic into onboarding
- supports legal/compliance requirements
- feels visually consistent with the modernized app shell while remaining distinct from the logged-in product UI

## Required public routes

### Core marketing

- `/`
  - primary landing page
- `/features`
  - product capabilities grouped by billing, GST, accounting, inventory, POS, platform
- `/pricing`
  - plans, billing model, FAQs, CTA to onboarding
- `/about`
  - company/product story, positioning, trust cues
- `/contact`
  - contact form, support email, business contact details

### Trust and conversion support

- `/security`
  - security posture, auth model, storage, auditability
- `/help`
  - help center / docs entry route
- `/demo`
  - demo request or guided product tour route

### Legal

- `/privacy`
- `/terms`

## Shared public-site requirements

### Design system

- dedicated public-site shell with top nav and footer
- public typography and layout system distinct from the internal app workspace
- consistent CTA hierarchy
- strong mobile behavior
- polished hero, section rhythm, and visual storytelling

### Content structure

- headline + subheadline clarity
- feature proof points
- trust blocks
- GST/accounting/inventory/POS positioning
- direct CTA paths:
  - create company
  - log in
  - request demo

### SEO / metadata

- page-level titles and descriptions
- OG/Twitter metadata
- sitemap and robots strategy
- structured internal linking between public pages

## Recommended implementation order

1. Public shell:
   - nav
   - footer
   - shared section primitives
2. Landing page:
   - hero
   - feature rails
   - trust and CTA sections
3. Pricing page
4. Features page
5. Privacy and terms
6. Contact and help
7. Demo and about
8. SEO pass and copy refinement

## Acceptance criteria

- the root route looks like a deliberate product website, not an internal launch screen
- all essential public pages exist and are linked from nav/footer
- every public page has a clear CTA into onboarding or login
- public pages are responsive and visually production-grade
- legal pages exist for deployment readiness
