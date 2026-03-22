# Phase G — GST Engine and Compliance Exports

**Status**: Completed
**Completed on**: 2026-03-22

## Outcome

Phase G moved the application from MVP-style GST totals and CSV export behavior to a real GST computation and compliance-reporting layer.

## Delivered

- GST state and GSTIN identity storage on customers and suppliers
- Place-of-supply and interstate/intrastate tax split computation
- Persisted GST fields on invoice items, purchase items, credit-note items, and purchase-return items
- Invoice and purchase document headers now store GST context such as counterparty GSTIN and place of supply
- GST API module with:
  - `GET /gst/gstr1`
  - `GET /gst/gstr3b`
  - `GET /gst/hsn-summary`
  - `GET /gst/itc`
  - `POST /gst/export`
  - export job status and download endpoints
- Unified GST export generation in JSON, CSV, and Excel-compatible SpreadsheetML
- Frontend GST compliance center for report viewing, warnings, export creation, polling, and download
- Legacy export service compatibility routed through the new GST engine

## Notes

- This phase establishes the GST reporting engine and storage model needed for later accounting correctness work in Phase H.
- Filing-grade parity with every external GST portal nuance may still need further iteration, but the planned system gap for GST computation, reporting, and export infrastructure is now closed at the phase level.

## Verification

- `npm run prisma:generate` in `apps/api`
- `npx tsc -p tsconfig.json --noEmit --incremental false` in `apps/api`
- `npm run build` in `apps/api`
- `npm run lint` in `apps/web`
- `npx next build --webpack` in `apps/web`
