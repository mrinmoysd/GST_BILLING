# Phase D — RBAC and Settings Completeness

**Status**: Completed
**Priority**: P1

## Goal

Replace the MVP role model with production-grade permissions and complete tenant administration workflows.

## Scope

- Permission inventory
- Role create/update/delete APIs
- User-role assignment APIs
- Permissions UI and roles page
- Permission-aware frontend nav and action gating
- Auditability for admin changes
- Settings completion across company, invoice, users, roles, subscription

## Deliverables

- RBAC domain model and APIs
- Roles management UI
- Permission-aware app behavior

## Definition of done

- Tenant admins can configure roles and the UI/API enforce those permissions consistently

## Dependencies

- Phase A
- Phase C for company setup assumptions

## Progress note

Completed in the current slice:
- activated the existing RBAC schema with a company permission catalog
- added custom role create, update, delete, and list APIs
- added user invite/update flows with built-in primary role plus custom role assignment
- added effective permission computation to login, onboarding, and `/auth/me`
- enforced permission checks across tenant settings APIs
- added settings roles UI, improved users access editor, and permission-aware settings/navigation
- added lightweight admin activity logging for role and user administration changes
