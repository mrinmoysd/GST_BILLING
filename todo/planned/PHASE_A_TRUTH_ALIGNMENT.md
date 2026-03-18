# Phase A — Truth Alignment

**Status**: Planned
**Priority**: P0

## Goal

Make planning, docs, route structure, and scope definitions match the actual implementation so future work is sequenced from current truth instead of stale assumptions.

## Why this phase exists

Current planning artifacts have drifted.

- Some docs still mark implemented features as blocked
- Some route maps do not match the frontend
- Some implemented MVP behavior differs from the originally planned API contracts
- Some critical architectural decisions are still not formally locked

Without this cleanup, later phases will create rework and confusion.

## Scope

### Documentation alignment

- Update outdated docs in `docs/` and `todo/`
- Mark older deferred items that are now implemented as closed or superseded
- Reconcile route docs with actual frontend information architecture
- Publish a canonical “current state” summary for backend and frontend coverage

### Architectural decisions

- Finalize SQL vs Prisma parity policy
- Lock route-structure decision for frontend
- Lock inventory valuation-method decision
- Lock rounding and precision policy
- Lock POS MVP scope and non-goals

### Planning hygiene

- Adopt `docs/GAP_ANALYSIS_AND_EXECUTION_PLAN.md` and `todo/EXECUTION_MASTER_PLAN.md` as the current planning baseline
- Define naming conventions for new phase docs and future completion docs

## Deliverables

- Updated and non-conflicting planning docs
- Canonical route map
- Canonical architectural decision notes
- A clear list of superseded legacy docs

## Definition of done

- No critical planning doc contradicts implemented features without explicitly saying so
- There is one canonical route structure
- Major pending design/architecture decisions are explicitly documented
- Future phases can be planned without ambiguity about current state

## Dependencies

- None

## Risks

- If skipped, later phases will create duplicate work and planning drift

## Suggested output artifacts

- Updated `docs/UI_UX_ROUTE_MAP.md`
- Updated stale deferred docs
- New ADR-style note if needed for schema parity and valuation policy

