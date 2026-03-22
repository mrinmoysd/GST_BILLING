# Phase G — GST Engine and Compliance Exports

**Status**: Completed
**Priority**: P0

## Goal

Implement the GST engine and compliance reporting/export subsystem required for a production-grade GST billing application.

## Scope

- Deterministic tax engine
- Place-of-supply logic
- CGST/SGST/IGST storage
- HSN summary
- GSTR-3B
- ITC reporting
- Credit/debit note reporting sections
- Exempt/nil/non-GST classification hooks
- Unified GST export pipeline
- Portal-aligned JSON and Excel formats
- Audit snapshots and reconciliation

## Deliverables

- Tax computation engine
- Updated schema and document models
- Compliance-grade GST endpoints
- Matching GST frontend/reporting UX

## Definition of done

- GST reports are reproducible, auditable, and materially aligned with planned compliance expectations

## Completion notes

- Added deterministic GST tax-split storage on invoices, purchases, credit notes, and purchase returns
- Added GST identity fields for customers and suppliers
- Added GST reporting endpoints for GSTR-1, GSTR-3B, HSN summary, and ITC
- Added a unified GST export pipeline with JSON, CSV, and Excel-compatible output
- Updated the frontend GST reporting page into a compliance workspace with report switching and export-job tracking
- Preserved backward compatibility for legacy GSTR-1 export flow through the new GST export service

## Dependencies

- Phase A architectural decisions
- Coordination with Phase F and Phase H
