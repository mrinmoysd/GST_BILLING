# D11 Provider Integration And Credentials Specification

**Date**: 2026-03-27  
**Purpose**: Define the implementation and onboarding plan to replace the current `sandbox_local` D11 compliance mode with a live GST-compliance provider for e-invoice and e-way bill operations.  
**Implementation status**: Planned after provider credentials are available

Source references used for this spec:

- [D11_EINVOICE_AND_EWAY_BILL_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D11_EINVOICE_AND_EWAY_BILL_SPEC.md)
- [API User Onboarding - IRIS IRP](https://einvoice6.gst.gov.in/content/kb/api-user-onboarding/)
- [API Credentials - IRIS IRP](https://einvoice6.gst.gov.in/content/kb/api-credentials/)
- [Access to Sandbox - IRIS IRP](https://einvoice6.gst.gov.in/content/kb/access-to-sandbox/)
- [E-Invoice System Process PDF - NIC / GST official distribution](https://docs.ewaybillgst.gov.in/Documents/eInvoice_process.pdf)
- [E-Way Bill API Interface PDF](https://docs.ewaybillgst.gov.in/Documents/EWB_API.pdf)
- [E-Way Bill User Manual PDF](https://docs.ewaybillgst.gov.in/Documents/usermanual_ewb.pdf)
- [E-Invoice API Details of all 6 IRPs](https://tutorial.gst.gov.in/downloads/news/e-invoice_api_integration_guide_irps.pdf)
- [GST advisory on 30-day e-invoice reporting restriction](https://services.gst.gov.in/services/advisoryandreleases/read/543)

This spec is intentionally practical:

- it assumes the current product already has D11 internal workflows
- it assumes the missing part is the live provider connection
- it separates provider onboarding from code changes
- it is written so we can resume later without re-discovering the integration path

---

## 1. Current state

Today the product supports D11 through an internal provider-neutral model and a `sandbox_local` execution path.

That means the product already has:

- invoice-linked compliance records
- e-invoice and e-way bill status models
- generate / cancel / sync UI and API actions
- exception queue
- audit events
- company-level compliance configuration

What it does **not** have yet:

- live IRP / EWB authentication
- provider token lifecycle
- production IP whitelist handling
- real provider request signing / encryption requirements
- live response mapping from provider into our compliance tables

So this next phase is a **provider integration phase**, not a fresh D11 feature-design phase.

---

## 2. Goal

Replace `sandbox_local` with a real provider-backed execution path that can:

- generate real IRN
- fetch and store actual acknowledgement details
- generate real e-way bill numbers
- update vehicle details on the real system
- cancel IRN / EWB where permitted
- sync remote state back into our D11 compliance records

without changing the internal invoice-facing D11 product model.

---

## 3. Recommended provider strategy

### Recommended first live path

Use **one official IRP provider path first**, and keep our internal adapter provider-neutral.

Recommended implementation order:

1. **IRIS IRP direct integration**
2. **optional NIC / existing e-way bill credential reuse path**
3. **optional GSP / ASP provider path later**

### Why IRIS first

IRIS currently exposes a clearer sandbox/onboarding knowledge base for direct API onboarding, credentials, sandbox registration, and production approval. That makes it the safest first-provider path for this codebase.

### Why keep adapter-neutral design

Even if IRIS is the first provider, the code should still treat provider execution behind an interface because:

- official IRP options can change
- different customers may already have GSP relationships
- some taxpayers may reuse existing e-way bill / NIC credentials
- future migration cost should stay low

---

## 4. Provider options we should support conceptually

### Option A: Direct integration with an official IRP

Recommended first implementation.

Typical fit:

- company has its own GSTINs
- company wants direct control
- company can manage API onboarding and IP whitelisting

### Option B: Reuse existing e-way bill API credentials for e-invoice where allowed

Official NIC process guidance indicates that if the taxpayer has already integrated with e-way bill APIs, the same API credentials can be used for e-invoice in some cases, with the e-way bill whitelisted IPs.

This is a good secondary path for customers who already have EWB integration.

### Option C: GSP / ASP / intermediary path

Useful when:

- customer already works with a GST intermediary
- direct onboarding is too heavy for the customer
- support/compliance outsourcing is preferred

This should be designed as a later adapter, not the first implementation.

---

## 5. External onboarding and credential requirements

This section is the main “what do we need from the provider / customer?” checklist.

### 5.1 Minimum business-side prerequisites

Before we attempt live provider onboarding, confirm:

- production GSTIN exists and is active
- GSTIN is eligible for e-invoicing where applicable
- company PAN is available
- authorised signatory contact details are current
- public static outbound IPs are known
- company has a website or company-information page
- privacy policy and terms-of-use pages exist if provider onboarding asks for them

### 5.2 Credentials and artifacts we will need

For the recommended IRIS-style direct API path, we should expect to collect:

- API user email
- API user portal username
- API user portal password
- MFA setup for portal login
- sandbox portal ID
- sandbox client ID
- sandbox client secret
- production portal ID
- production client ID
- production client secret
- registered GSTIN list
- whitelisted public IP addresses
- authorised signatory email and mobile
- technical SPOC name, email, mobile

### 5.3 Supporting documents typically needed for production access

The IRIS onboarding guidance explicitly calls out:

- organisation PAN
- certificate of incorporation, for companies
- GST certificate
- website / company information
- privacy policy
- terms of use

Additional documents may be requested by the provider.

### 5.4 Network / infrastructure prerequisites

We should be ready with:

- minimum 1 and maximum 4 Indian public IPs for whitelisting
- stable outbound egress from production environment
- separate staging and production network plan
- operational plan for IP changes, failover, and provider re-whitelisting

---

## 6. Official onboarding flow to get credentials

This is the concrete “how to get credentials” sequence we should follow later.

### Path 1: IRIS-style direct API onboarding

#### Step 1: Create taxpayer and API-integrator users

Per the IRIS API integration guidance:

- taxpayer user and API integrator are distinct users
- separate email IDs are recommended

Use separate inboxes that the team can actually monitor.

#### Step 2: Get sandbox access

Per the IRIS sandbox guidance:

1. open the IRP sandbox
2. select the correct user type:
   - `Taxpayer` for direct integration of own GSTIN
   - `Intermediary` for client GSTINs
   - `E-commerce Operator` if applicable
3. register the GSTIN
4. provide authorised signatory email and mobile
5. complete OTP verification
6. after successful OTP verification, sandbox credentials become visible in the sandbox credentials area

Important note from the same guidance:

- sandbox registration of GSTIN is a prerequisite before production approval

#### Step 3: Add test GSTINs

Use:

- dummy GSTINs for integration testing where allowed
- live GSTIN testing only when explicitly required

IRIS onboarding guidance says dummy GSTINs can be used for testing, and live GSTIN testing needs authorised-signatory OTP.

#### Step 4: Complete sandbox integration and test cases

Per both IRIS onboarding guidance and NIC process guidance:

- complete API integration in sandbox first
- run the prescribed test cases
- prepare the provider-required test summary report

#### Step 5: Submit for production access

Production approval usually requires:

- test summary report
- KYC documents
- whitelisted Indian IPs
- SPOC details

#### Step 6: Receive production credentials

For the IRIS path, the provider documentation indicates API integrators receive:

- production portal ID
- production client ID
- production client secret

along with portal login credentials.

#### Step 7: Complete MFA and operational login readiness

IRIS documentation also notes MFA is mandatory on the portal.

As of **July 10, 2025**, MFA setup was made mandatory on IRIS IRP.  
As of **March 31, 2025**, a 30-day reporting restriction applies for taxpayers with AATO of Rs 10 crore and above.

So production-readiness needs:

- MFA enrolled on the portal account
- shared operational ownership of recovery path
- process for password expiry / rotation

### Path 2: Existing e-way bill API credentials reuse

NIC guidance indicates:

- if a taxpayer already has e-way bill API integration, the same credentials may be usable for e-invoice
- the e-way bill purpose-whitelisted IPs may also be reused for e-invoice access

This path is attractive if the customer already has:

- EWB API setup
- whitelisted IPs
- valid credentials

In that case, the onboarding task becomes:

1. confirm existing EWB credentials are active
2. confirm the same path is accepted for e-invoice
3. confirm production IPs remain the same
4. test e-invoice sandbox and submit required test summary if the provider still requires it

### Path 3: GSP / ASP path

NIC guidance also describes GSP-based usage:

- taxpayer logs into the e-invoice portal
- under API registration, selects create API user
- selects the GSP being used for IRN / EWB generation
- creates API user credentials

If we later support this path, we must separately document:

- who owns client ID / secret
- who owns rate limits
- who receives provider alerts
- who handles production support and incident response

---

## 7. Credentials checklist to request from the customer later

When the customer says “we are ready”, ask for this exact pack:

### Required now

- company GSTIN
- company PAN
- authorised signatory full name
- authorised signatory mobile
- authorised signatory email
- technical SPOC name
- technical SPOC mobile
- technical SPOC email
- production public IPs to whitelist
- provider route chosen:
  - direct IRP
  - existing EWB credentials reuse
  - GSP / intermediary

### Required before final cutover

- sandbox credentials
- production credentials
- portal IDs
- client IDs
- client secrets
- API user login details
- MFA enrollment confirmation
- provider support email / escalation channel
- production approval confirmation from provider

### Required if provider asks

- GST certificate
- incorporation certificate
- privacy policy URL
- terms URL
- company website URL

---

## 8. Product changes required in the codebase

This is the implementation plan for replacing `sandbox_local`.

## 8.1 Keep the current D11 storage model

Do not redesign the invoice-facing model.

Keep:

- `EInvoiceDocument`
- `EWayBillDocument`
- `InvoiceComplianceEvent`

Those already solve the internal product problem correctly.

## 8.2 Add a provider adapter boundary

Create a formal adapter contract such as:

```ts
interface ComplianceProviderAdapter {
  generateEInvoice(input): Promise<GenerateEInvoiceResult>;
  cancelEInvoice(input): Promise<CancelEInvoiceResult>;
  syncEInvoice(input): Promise<SyncEInvoiceResult>;
  generateEWayBill(input): Promise<GenerateEWayBillResult>;
  updateEWayBillVehicle(input): Promise<UpdateVehicleResult>;
  cancelEWayBill(input): Promise<CancelEWayBillResult>;
  syncEWayBill(input): Promise<SyncEWayBillResult>;
}
```

Then provide implementations:

- `sandboxLocalComplianceProvider`
- `irisComplianceProvider`
- later `nicComplianceProvider` or `gspComplianceProvider`

## 8.3 Split configuration from secrets

Keep non-secret tenant preferences in `company.invoiceSettings.compliance`, such as:

- provider name
- e-invoice enabled
- e-way bill enabled
- auto-generate-on-issue
- default distance
- default transport mode

Do **not** store provider client secrets inside `invoiceSettings`.

Secrets should live in secure server-side configuration or a secrets manager.

### Suggested secret keys

For a first live provider implementation, use environment variables or a secrets manager entry set like:

- `D11_PROVIDER=iris`
- `D11_IRIS_SANDBOX_BASE_URL=...`
- `D11_IRIS_PRODUCTION_BASE_URL=...`
- `D11_IRIS_SANDBOX_PORTAL_ID=...`
- `D11_IRIS_SANDBOX_CLIENT_ID=...`
- `D11_IRIS_SANDBOX_CLIENT_SECRET=...`
- `D11_IRIS_PRODUCTION_PORTAL_ID=...`
- `D11_IRIS_PRODUCTION_CLIENT_ID=...`
- `D11_IRIS_PRODUCTION_CLIENT_SECRET=...`
- `D11_IRIS_API_USERNAME=...`
- `D11_IRIS_API_PASSWORD=...`

If credentials differ by tenant, use a secure per-tenant credential store, not raw env vars.

## 8.4 Add environment selection

The provider layer must explicitly support:

- `sandbox`
- `production`

This must not be inferred from arbitrary hostnames.

It should be configured deliberately at tenant or deployment level.

## 8.5 Add token management

Provider token handling must include:

- login / token fetch
- token caching
- expiry-aware refresh
- clock skew tolerance
- retry on auth failure where safe

The EWB API interface guidance states access tokens expire after **360 minutes** and re-authentication is required after expiry.

## 8.6 Add request / response normalization

For each operation we need:

- provider request builder
- provider response parser
- error normalization layer

Normalize all provider-specific outcomes into our internal status set:

- `not_started`
- `generated`
- `failed`
- `cancelled`
- `synced`
- `blocked`

## 8.7 Add idempotency protection

D11 already expects idempotent behavior.

Provider integration must add:

- request hash or logical idempotency key
- duplicate request protection at service layer
- safe “already generated” handling
- safe retry handling when provider timeout is ambiguous

## 8.8 Add request logging and redaction

Store:

- summary payloads
- identifiers
- timestamps
- normalized errors

Do not expose secrets in logs or events.

Sensitive raw provider responses should be redacted before operational logging if they contain credentials or session material.

## 8.9 Add compliance job / retry strategy

Recommended behavior:

- operator-triggered first
- background retries only for safe sync operations
- no hidden retry storm on generate / cancel

Generation and cancellation must be visible and controlled.

## 8.10 Add rate-limit and resilience controls

Implement:

- timeouts
- circuit-breaker or backoff policy
- bounded retries
- provider-unavailable classification

Because compliance failures are operationally sensitive, user feedback should distinguish:

- blocked due to missing invoice data
- blocked due to provider config
- provider unavailable
- provider rejected request

---

## 9. Suggested implementation sequence

### Phase 1: Provider adapter scaffold

Deliver:

- adapter interface
- adapter registry
- environment config
- secure secret loading
- keep `sandbox_local` as fallback

### Phase 2: E-invoice live integration

Deliver:

- auth/token flow
- generate IRN
- cancel IRN
- sync IRN status
- signed payload / QR mapping

### Phase 3: E-way bill live integration

Deliver:

- generate EWB
- update vehicle
- cancel EWB
- sync EWB status

### Phase 4: Production controls

Deliver:

- observability
- alerting
- rate-limit handling
- support runbook
- credential rotation procedure

---

## 10. Data mapping requirements

Before live go-live, verify these internal fields are sufficient for provider payloads:

- seller GSTIN
- seller state code
- buyer GSTIN
- place of supply state code
- invoice number
- invoice date
- invoice totals
- HSN
- tax rate
- taxable value
- transporter name
- transporter ID, if required
- vehicle number
- transport document number
- transport document date
- distance in KM

The current codebase already stores most of this.  
The biggest operational risk is not missing schema, it is missing or dirty master data at runtime.

---

## 11. Security requirements

### Must-haves

- secrets must never be returned to the browser
- secrets must never be stored in `invoiceSettings`
- logs must redact credentials and tokens
- provider credentials must be rotatable without schema changes
- outbound calls must use HTTPS only

### Operational controls

- define who owns password expiry / MFA maintenance
- define who can rotate provider secrets
- define emergency disable switch by tenant

---

## 12. Staging and go-live checklist

Before production go-live, complete:

### Provider readiness

- sandbox access approved
- production access approved
- production IPs whitelisted
- MFA complete
- credentials securely stored

### App readiness

- adapter integration merged
- invoice compliance actions work in staging
- exception queue reflects real provider failures
- sync actions verified
- cancellation flows verified

### Test flows

1. eligible invoice -> generate IRN
2. sync IRN -> same IRN retained
3. cancel IRN within allowed conditions
4. eligible invoice -> generate EWB
5. update vehicle details
6. cancel EWB
7. provider failure -> exception queue entry
8. retry after corrected data -> success
9. invoice cancel blocked while active IRN / EWB exists

### Evidence pack

- sample success payloads
- sample rejection payloads
- sample sync output
- screenshots of invoice compliance panel
- screenshots of exception queue

---

## 13. Definition of done

D11 provider integration is complete only when:

- the app uses a real provider adapter instead of `sandbox_local`
- credentials are stored securely
- sandbox and production environments are selectable
- e-invoice generate / cancel / sync work with real provider responses
- e-way bill generate / vehicle update / cancel / sync work with real provider responses
- exception queue reflects actual provider failures
- invoice cancellation correctly blocks when active compliance docs exist
- staging validation is completed with evidence
- support runbook exists for credential rotation, MFA issues, and provider outage handling

---

## 14. Recommended decision for later execution

When we resume this work, make this decision first:

### Recommended

Start with:

1. **IRIS direct API path**
2. **single-tenant staging test**
3. **operator-triggered actions only**

This keeps the first live cutover smaller and easier to debug.

### Avoid for the first live cut

- multiple providers at once
- hidden auto-generation on issue
- tenant-specific custom payload logic
- background retries on all provider actions

---

## 15. Plain-English summary

The product-side D11 work is already done.  
What remains is the real provider connection.

To finish that later, we will need:

- provider choice
- sandbox onboarding
- test-case submission
- production approval
- whitelisted IPs
- API credentials
- secure secret storage
- adapter implementation
- staging proof

The cleanest first live route is IRIS direct API integration, while keeping the code provider-neutral so we can support NIC / existing EWB credentials or a GSP path later if needed.
