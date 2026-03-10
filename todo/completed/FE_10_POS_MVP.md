# FE-10 — POS (MVP) + browser print (Status)

## Status: Deferred

## Reason
A dedicated POS backend surface (barcode lookup, fast product search endpoints, POS invoice shortcuts) isn’t present in the API modules discovered so far. Implementing POS purely client-side would be risky and likely diverge from intended flows.

## What would be needed to implement safely
- Barcode/SKU lookup endpoint (or product search tuned for barcode-first UX)
- “Quick invoice / POS sale” endpoint (or agreed mapping to existing invoice draft/issue endpoints)
- Thermal print-friendly invoice template semantics (browser-only is fine)

## Notes
This iteration remains explicitly deferred per the plan (offline mode and ESC/POS agent are deferred too).
