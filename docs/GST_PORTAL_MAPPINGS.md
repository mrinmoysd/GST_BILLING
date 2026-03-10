# GST Portal JSON Mappings (versioned)

**Status**: Draft (spec addendum)

This document defines *portal-ready* JSON structures for GST exports. These schemas are intended to be used by:
- `docs/API_OPENAPI.yaml` (strict `oneOf` response schemas)
- export workers (JSON generation)
- contract tests (fixture validation)

> Note: GST portal schemas can change. We version our mapping as `gst_portal_schema_version`.

## Global rules

- **Amounts**: always rounded to 2 decimals using the platform rounding policy (see `ACCOUNTING_RULES.md`).
- **Filters**:
  - include only `status=issued` invoices
  - exclude `status=cancelled`
  - credit notes/sales returns reduce outward tax liability for the period
- **Date window**: inclusive `from` and `to`.

## Version

- `gst_portal_schema_version`: `2026.03`

## GSTR-1 (Outward Supplies)

### Payload shape (portal export)

```json
{
  "gst_portal_schema_version": "2026.03",
  "company_gstin": "22AAAAA0000A1Z5",
  "period": {"from": "2026-02-01", "to": "2026-02-28"},
  "b2b": [
    {
      "ctin": "29AAAAA0000A1Z5",
      "inv": [
        {
          "inum": "INV/2026/0001",
          "idt": "2026-02-05",
          "val": 1180.00,
          "pos": "29",
          "rchrg": "N",
          "itms": [
            {
              "num": 1,
              "itm_det": {
                "txval": 1000.00,
                "rt": 18.0,
                "iamt": 0.00,
                "camt": 90.00,
                "samt": 90.00,
                "csamt": 0.00
              }
            }
          ]
        }
      ]
    }
  ],
  "b2c": [],
  "cdnr": [],
  "hsn": {
    "data": [
      {
        "num": 1,
        "hsn_sc": "8517",
        "desc": "Mobile",
        "uqc": "NOS",
        "qty": 1.000,
        "val": 1180.00,
        "txval": 1000.00,
        "iamt": 0.00,
        "camt": 90.00,
        "samt": 90.00,
        "csamt": 0.00
      }
    ]
  }
}
```

### Mapping notes
- `pos` = place of supply = customer state code.
- `rt` = GST rate percent.
- `txval` = taxable value.
- `camt/samt/iamt` derived by intra vs inter-state logic.

## GSTR-3B (Summary return)

### Payload shape

```json
{
  "gst_portal_schema_version": "2026.03",
  "company_gstin": "22AAAAA0000A1Z5",
  "period": {"from": "2026-02-01", "to": "2026-02-28"},
  "outward": {
    "taxable_value": 1000.00,
    "igst": 0.00,
    "cgst": 90.00,
    "sgst": 90.00,
    "cess": 0.00
  },
  "itc": {
    "igst": 0.00,
    "cgst": 0.00,
    "sgst": 0.00,
    "cess": 0.00
  }
}
```

## HSN Summary

```json
{
  "gst_portal_schema_version": "2026.03",
  "company_gstin": "22AAAAA0000A1Z5",
  "period": {"from": "2026-02-01", "to": "2026-02-28"},
  "items": [
    {
      "hsn": "8517",
      "description": "Mobile",
      "uqc": "NOS",
      "qty": 1.000,
      "taxable_value": 1000.00,
      "igst": 0.00,
      "cgst": 90.00,
      "sgst": 90.00,
      "cess": 0.00
    }
  ]
}
```

## ITC (Input tax credit)

```json
{
  "gst_portal_schema_version": "2026.03",
  "company_gstin": "22AAAAA0000A1Z5",
  "period": {"from": "2026-02-01", "to": "2026-02-28"},
  "eligible_itc": {
    "igst": 0.00,
    "cgst": 0.00,
    "sgst": 0.00,
    "cess": 0.00
  },
  "ineligible_itc": {
    "igst": 0.00,
    "cgst": 0.00,
    "sgst": 0.00,
    "cess": 0.00
  }
}
```

## How OpenAPI should use this

- For each GST report endpoint response, use a strict schema referencing:
  - `Gstr1PortalPayload`
  - `Gstr3bPortalPayload`
  - `HsnPortalPayload`
  - `ItcPortalPayload`

Next step: encode these JSON structures as OpenAPI schemas and return them under `data.json` (or alongside `file_url`).
