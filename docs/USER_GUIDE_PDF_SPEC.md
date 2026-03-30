# End-to-End User Guide PDF Specification

**Date**: 2026-03-29  
**Purpose**: Define the scope, structure, content model, screenshot plan, and export pipeline for a complete user-facing PDF guide for GST Billing.  
**Status**: Approved draft specification for authoring and PDF generation

Sources:

- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)
- [WORKFLOW_CENTERED_POWER_USER_WIREFRAME_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/WORKFLOW_CENTERED_POWER_USER_WIREFRAME_SPEC.md)
- [RBAC_VALIDATION_AUDIT_2026-03-29.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/RBAC_VALIDATION_AUDIT_2026-03-29.md)
- current route inventory in `apps/web/src/app`
- current API and feature specifications across D1-D14

---

## 1. Objective

Create a complete, user-friendly PDF manual that helps a real operator learn and use the product end to end.

The guide must:

1. explain what the product does in plain language
2. walk users through the major workflows in the order they are likely to need them
3. cover the current implemented feature set, not an ideal future version
4. include visual support through screenshots or guided image placeholders
5. be exportable repeatedly as the product evolves

The PDF is not meant to be:

- a technical architecture document
- an API reference
- a developer onboarding manual
- a raw feature dump without workflow context

---

## 2. Primary Audience

### Primary readers

- business owners
- accountants
- billing operators
- inventory operators
- warehouse and dispatch staff
- sales coordinators
- collections and finance users
- internal rollout and onboarding staff

### Secondary readers

- implementation partners
- support staff
- QA reviewers validating business workflows

### Reading style to optimize for

- practical
- sequential
- non-technical
- screenshot-assisted
- easy to skim, but deep enough to execute workflows correctly

---

## 3. Product Coverage

The PDF must cover the currently shipped product surface:

1. Public site and entry paths
2. Onboarding and authentication
3. Company workspace basics
4. Dashboard and workflow navigation
5. Masters
   - customers
   - suppliers
   - products
   - categories
6. Sales
   - quotations
   - sales orders
   - dispatch
   - challans
   - invoices
   - payments
   - credit notes
   - sales returns
7. Purchases
   - purchase drafts
   - receiving
   - payments
   - returns
8. Inventory
   - warehouses
   - transfers
   - adjustments
   - movements
   - batches and expiry
9. Collections and banking
10. GST and compliance
    - GST reports
    - e-invoice / e-way bill current workflow
11. Accounting
12. POS
13. Field sales
14. Reports
15. Settings and controls
    - company
    - invoice series
    - pricing
    - users
    - roles
    - notifications
    - print templates
    - custom fields
    - integrations
    - migrations
    - subscription
16. Internal admin surface
    - only as an appendix for internal operators

---

## 4. Content Strategy

The guide should be organized by job-to-be-done, not by database entity.

### Core content model per chapter

Each chapter should use this pattern:

1. What this area is for
2. When to use it
3. Before you begin
4. Main screen orientation
5. Step-by-step workflow
6. Important fields and decisions
7. Common mistakes to avoid
8. Related reports or follow-up actions
9. Screenshot references

### Tone requirements

- plain English
- procedural, not academic
- short explanations before step lists
- explain business intent, not just buttons
- do not expose internal implementation jargon unless needed

---

## 5. Output Artifacts

The documentation pipeline should produce these artifacts:

1. `docs/USER_GUIDE_PDF_SPEC.md`
   - scope and editorial specification
2. `docs/user-guide/GST_BILLING_USER_GUIDE_SOURCE.md`
   - the main manuscript source
3. `docs/user-guide/GST_BILLING_USER_GUIDE_SCREENSHOT_MANIFEST.md`
   - the planned screenshot set, route, role, and data prerequisites
4. `scripts/generate-user-guide-pdf.mjs`
   - repeatable draft PDF generator
5. `docs/user-guide/output/GST_Billing_User_Guide_Draft.pdf`
   - generated draft output

---

## 6. Tutorial Structure

The tutorial PDF should use the following chapter sequence.

### Front matter

1. Cover page
2. Who this guide is for
3. How to read the guide
4. Product map
5. Role map

### Main chapters

1. Getting started
2. Public entry, onboarding, and login
3. Understanding the workspace
4. Company setup basics
5. Customer, supplier, product, and category masters
6. Quotations and sales orders
7. Dispatch, challans, and invoice issue
8. Payments, credit notes, and sales returns
9. Purchase intake and supplier settlement
10. Inventory operations and warehouses
11. Batch and expiry workflows
12. Collections, credit control, and banking
13. GST and compliance workflows
14. Accounting and books
15. POS billing
16. Field sales and route operations
17. Reports and review surfaces
18. Settings, governance, and operator controls
19. Internal admin appendix
20. Troubleshooting and common questions

### End matter

1. Glossary
2. Go-live checklist
3. Support routing

---

## 7. Screenshot Strategy

The PDF should include images in a structured way.

### Screenshot types

1. Overview screenshots
   - full page or major workspace
2. Workflow screenshots
   - key form or queue states
3. Detail screenshots
   - important sub-tabs, inspectors, or right rails
4. Callout screenshots
   - critical actions, warnings, or status areas

### Screenshot rules

1. Use seeded demo data, not empty pages
2. Prefer realistic but non-sensitive values
3. Use the modern workflow-centered UI
4. Capture desktop layouts first
5. Use consistent browser width and theme for the final set
6. Include both light and dark examples only when it adds value
7. Avoid screenshots of obviously placeholder legal copy unless the chapter is about the public site

### Screenshot status phases

1. Draft phase
   - placeholders allowed
2. Review phase
   - top workflows replaced with real screenshots
3. Final phase
   - all key chapters contain production screenshots

---

## 8. PDF Generation Approach

Because the repo does not currently contain a markdown-to-PDF toolchain, the first implementation should use a lightweight scripted PDF generator.

### Generation requirements

1. Read the manuscript markdown file
2. Render headings, paragraphs, bullets, and simple image references
3. Embed real images when present
4. Render a styled placeholder panel when an image is referenced but not yet captured
5. Produce a readable draft PDF without manual formatting steps

### First-pass scope

The first pass does not need:

- perfect typography
- live table of contents links
- advanced image annotation
- print-press layout fidelity

It does need:

- repeatability
- readable chapter structure
- clear headings
- basic page numbering
- image placeholder support

---

## 9. Acceptance Criteria

The user-guide effort is complete when:

1. every major implemented product area has a chapter
2. each chapter explains intent, usage, and step-by-step flow
3. the manuscript is exportable to PDF from the repo
4. the draft PDF can be reviewed without extra tooling setup
5. the screenshot manifest exists and is actionable
6. the guide reflects current product behavior, not old assumptions

---

## 10. Known Constraints

1. Some screenshots are not yet captured in the repository
2. A few features are validation-pending in staging, so the guide should describe current available flows without overpromising future behavior
3. D11 live provider-backed compliance setup should be described carefully as a current controlled workflow, not as a fully automatic live-integrated path
4. Internal admin workflows should be separated clearly from tenant-user workflows

---

## 11. Recommended Execution Order

1. Approve the chapter structure
2. Author the full manuscript draft
3. Create the screenshot manifest
4. Generate the first review PDF
5. Replace top-priority placeholders with real screenshots
6. Iterate the PDF for release quality

---

## 12. Current Decision

Proceed with:

- a comprehensive manuscript source in markdown
- a screenshot manifest for every major chapter
- a repeatable PDF generator that can produce a draft immediately

This gives the project a real user-guide pipeline now, while still allowing staged improvement from placeholder visuals to final screenshots.
