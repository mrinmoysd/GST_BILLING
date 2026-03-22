# Phase F — Sales and Purchase Lifecycle Completion

**Status**: Completed
**Priority**: P1

## Goal

Close the remaining business-document lifecycle gaps so the application can handle realistic operational scenarios.

## Scope

- Credit notes
- Sales returns
- Purchase returns
- Invoice send/share flow
- Better lifecycle auditing
- Better cancellation and reversal transparency

## Deliverables

- Missing document lifecycle APIs
- Matching frontend flows
- Better lifecycle traceability

## Definition of done

- Common post-issue and post-purchase corrections are supported without manual workarounds

## Dependencies

- Phase E
- Phase G and H should be coordinated where tax and accounting impact lifecycle behavior

## Progress note

Completed in the current slice:
- added persisted credit note, sales return, purchase return, share-log, and document lifecycle event models
- added invoice credit note and share APIs
- added purchase return API
- extended invoice and purchase detail APIs with lifecycle history and related corrective documents
- added lifecycle-event logging for issue, cancel, receive, bill upload, payments, credit notes, returns, and shares
- upgraded invoice detail UI for credit notes, sales returns, share history, and lifecycle history
- upgraded purchase detail UI for purchase returns and lifecycle history
