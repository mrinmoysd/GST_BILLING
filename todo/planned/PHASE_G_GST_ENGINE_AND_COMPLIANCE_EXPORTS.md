# Phase G — GST Engine and Compliance Exports

**Status**: Planned
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

## Dependencies

- Phase A architectural decisions
- Coordination with Phase F and Phase H

