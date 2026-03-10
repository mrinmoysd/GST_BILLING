# Phase 05.1 — Full GST engine & compliance exports (requirements)

**Status**: Planned

This document expands the Phase 05 “MVP GST export limitations” into a full, implementable requirements set for a production-grade GST computation engine and compliance exports.

It also defines how the API/docs must evolve from the current **MVP GSTR-1-like CSV** export to **portal-aligned JSON/Excel/CSV** exports.

---

## 1) Background: What exists today (Phase 05 MVP)

Current implementation is intentionally minimal:

- **Business reports** exist (sales summary, purchase summary, outstanding invoices, top-products, profit snapshot).
- **CSV export jobs** exist via `ExportJob` persistence and `POST /api/companies/:companyId/exports/gstr1`.
- Export output is a **GSTR-1-like CSV** built from invoices, not a portal-ready schema.

### Known MVP gaps

- No explicit split into **CGST/SGST/IGST** based on POS / intra-vs-inter state.
- No **HSN summary** export.
- No **ITC** computation.
- No **GSTR-3B** summary.
- No credit/debit-note return sections like **CDNR/CDNUR**.
- No “zero-rated / exempt / nil-rated / non-GST” classifications.
- No export formats beyond CSV (no portal JSON, no Excel).

---

## 2) Goals & non-goals

### Goals

- Compute GST consistently and deterministically for invoices/credit notes/purchases.
- Produce compliance reports/exports based on **portal mappings** (`docs/GST_PORTAL_MAPPINGS.md`).
- Support **regeneration** and **auditable snapshots** of what was filed for a given period.
- Keep all computations **tenant-scoped** and reproducible.

### Non-goals (for this phase)

- Direct portal submission APIs / GSTN integration.
- OCR / invoice scanning.
- Full accounting journal generation (separate accounting phase).

---

## 3) Core domain requirements (data)

### 3.1 Company GST configuration

Required company-level fields/config:

- `company.gstin` (15 chars) and **state code**.
- Filing periodicity (monthly/quarterly) and composition scheme (if supported later).
- Tax rounding policy (already referenced by `ACCOUNTING_RULES.md`).

### 3.2 Customer / Supplier tax identity

- Support **GSTIN** optional on customers.
- For B2B classification, GSTIN must be present and valid format.
- Capture customer state / POS state code (shipping state preferred; else billing state).

### 3.3 Product tax attributes

- `hsn_code` (string) (already present in docs) must be used for HSN summary.
- `gst_percent` (rate) must support typical rates plus `0`.
- Future-friendly support for:
  - exempt/nil/non-GST flags (distinct from 0% taxable)
  - cess percent/amount if needed

### 3.4 Transaction tax components (invoice line)

For each invoice item, system must be able to derive:

- `taxable_value`
- `rate`
- `cgst_amount`, `sgst_amount`, `igst_amount`
- `cess_amount` (optional)

Important: this phase should **stop re-deriving** tax at export time from only totals; instead we should export from **stored tax breakdown** or from a deterministic engine + versioned config.

---

## 4) Tax computation rules (engine)

### 4.1 Intra-state vs inter-state

- If **place of supply (POS) state** equals **company state**, apply **CGST+SGST**.
- Else apply **IGST**.

POS derivation priority:
1) invoice shipping address state
2) invoice billing address state
3) customer default state

### 4.2 Taxable value and rounding

- For each line: `taxable_value = quantity * unit_price` (less line discount if added later).
- Tax = taxable_value * rate/100.
- Rounding per `ACCOUNTING_RULES.md`:
  - define rounding mode (half-up/bankers) and where it applies (line vs invoice vs report section).

### 4.3 Special categories (deferred but must be modeled)

Define data model hooks and report classification for:

- exempt supplies
- nil-rated supplies
- non-GST supplies
- zero-rated exports / SEZ supplies
- reverse charge (RCM)

Even if not fully supported immediately, exports must not silently misclassify them.

---

## 5) Compliance report requirements

### 5.1 GSTR-1 (Outward)

Required sections (MVP to full):

- **B2B** invoices: group by `ctin` with invoice list.
- **B2C** invoices: (large/small split may be added): group by POS + rate.
- **CDNR / CDNUR**: credit/debit notes (returns/adjustments) for registered/unregistered.
- **HSN summary** section.

Each exported invoice must include:

- invoice number, date
- customer GSTIN (if any)
- POS state code
- taxable value
- tax breakup
- total invoice value

### 5.2 GSTR-3B (Summary)

- Outward taxable supplies summary (taxable value + IGST/CGST/SGST/cess).
- Separate buckets for exempt/nil/non-GST/zero-rated (later).
- Should reconcile with GSTR-1 totals for same window.

### 5.3 HSN Summary

- Aggregate by HSN + UQC:
  - total qty
  - total taxable value
  - IGST/CGST/SGST/cess

### 5.4 ITC report (Input Tax Credit)

Compute ITC from purchases:

- Eligible ITC: IGST/CGST/SGST/cess
- Ineligible ITC: explicitly tracked reason codes (to be added)

Important: ITC typically needs supplier invoice details, GSTIN, and purchase tax breakdown.

---

## 6) Exports & formats

### 6.1 Export job model

- Reuse `ExportJob` but extend:
  - `type`: `gstr1|gstr3b|hsn|itc|gstr1_portal_json|...`
  - `params`: { from, to, format, schema_version }
  - `result`: { file_path, checksum?, row_count?, generated_at, schema_version }

### 6.2 Formats

- **Portal JSON** (primary) aligned to `docs/GST_PORTAL_MAPPINGS.md`.
- **CSV** (human friendly) may remain.
- **Excel** export: optional but requested in docs; can be implemented by generating XLSX from the same data snapshot.

### 6.3 Snapshotting & audit

Exports must be reproducible:

- Either store a snapshot of the computed payload (JSON) or store a deterministic engine version + all referenced values.
- Track `gst_portal_schema_version` and `engine_version`.

---

## 7) API requirements

### 7.1 Align API surface

We should converge towards **one export pipeline**:

- `POST /api/companies/:companyId/gst/export` queues exports for any report type & format.
- `GET /api/companies/:companyId/gst/exports/:jobId` returns job status + metadata.
- `GET /api/companies/:companyId/gst/exports/:jobId/download` downloads the produced file.

This should either:

- replace `POST /exports/gstr1` (Phase 05 MVP), or
- `POST /exports/gstr1` becomes a thin wrapper calling the new GST export service.

### 7.2 Read-only report endpoints

If we maintain synchronous report endpoints:

- `GET /api/companies/:companyId/gst/gstr1` returns JSON (portal shape) for smaller datasets.
- Same for `gstr3b`, `hsn-summary`, `itc`.

But for large periods, recommend queued export with pagination limits.

---

## 8) Validation & reconciliation

- Validate GSTIN format (checksum validation optional) for GST reports.
- Reconciliation checks:
  - GSTR-1 outward totals should match invoice totals for the period.
  - HSN summary totals should match outward taxable totals.
  - 3B outward should reconcile with 1.

Return warnings in export metadata when mismatches detected.

---

## 9) Edge cases

- Cancelled invoices/purchases excluded.
- Partial refunds / credit notes after filing window.
- Mixed intra/inter supplies in same period.
- Missing POS state -> must error or classify as “needs review”, never silently assume.
- Rounding differences: line vs invoice vs report.
- Negative quantities (returns) in notes.

---

## 10) Testing requirements

- Unit tests for intra vs inter state split.
- Golden-file fixtures for portal payload shapes (validate against OpenAPI schemas).
- E2E:
  - create invoices in two states, verify CGST/SGST vs IGST.
  - create purchases with tax, verify ITC report.
  - create credit note, verify CDNR/CDNUR inclusion.

---

## 11) Documentation requirements

- Update `docs/API_OPENAPI.yaml` to:
  - clearly label which GST endpoints are **not implemented yet** vs make them optional.
  - for Phase 05 MVP, document that `POST /exports/gstr1` returns a CSV export job.
- Update `docs/API_SPEC.md` to match actual implemented endpoints:
  - business reports are under `/reports/*`
  - export jobs are under `/exports/*`

---

## 12) Implementation milestones (suggested)

- Milestone A: Tax engine + store CGST/SGST/IGST per invoice item.
- Milestone B: GSTR-1 portal JSON payload generation + queued export.
- Milestone C: HSN summary + GSTR-3B + ITC.
- Milestone D: Credit/debit notes sections + reconciliation warnings.
