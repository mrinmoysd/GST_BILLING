# D12 Field Sales and Route Operations Specification

**Date**: 2026-03-26  
**Purpose**: Define the implementation-ready scope for route-led field-sales execution, assisted order capture, visit logging, and manager visibility on top of the current salesperson attribution foundation.  
**Implementation status**: Planned

Source:

- [MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/MARG_DISTRIBUTION_PARITY_MASTER_SPEC.md)
- [MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/todo/MARG_DISTRIBUTION_EXECUTION_MASTER_PLAN.md)
- [CURRENT_IMPLEMENTATION_STATE.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/CURRENT_IMPLEMENTATION_STATE.md)
- [D4_SALES_STAFF_MODEL_IMPLEMENTATION_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D4_SALES_STAFF_MODEL_IMPLEMENTATION_SPEC.md)
- [D5_DISTRIBUTOR_ANALYTICS_IMPLEMENTATION_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D5_DISTRIBUTOR_ANALYTICS_IMPLEMENTATION_SPEC.md)
- [D9_COLLECTIONS_BANKING_AND_CREDIT_CONTROL_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D9_COLLECTIONS_BANKING_AND_CREDIT_CONTROL_SPEC.md)
- [D10_DISPATCH_DELIVERY_AND_CHALLAN_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/D10_DISPATCH_DELIVERY_AND_CHALLAN_SPEC.md)
- [API_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/API_SPEC.md)
- [V2_DISTRIBUTOR_USER_FLOW_SPEC.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_USER_FLOW_SPEC.md)
- [V2_DISTRIBUTOR_USER_STORIES.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_USER_STORIES.md)
- [V2_DISTRIBUTOR_WHOLESALER_READINESS_PLAN.md](/Users/tanmoybhadra/Documents/Mrinmoy_Work/GST_BILLING_SOFTWARE/docs/V2_DISTRIBUTOR_WHOLESALER_READINESS_PLAN.md)

External product-definition references:

- [Marg eOrder App](https://margcompusoft.com/eorder_salesman_order_app.html)
- [Marg eDelivery App](https://margcompusoft.com/edelivery_delivery_app.html)
- [Marg Retail Supply Chain page](https://margcompusoft.com/retail/retail_chain_management_software.html)
- [Marg care: collection through eOrder](https://care.margcompusoft.com/ebusiness-app/eorder-app/3486/5/how-can-a-salesmen-receive-collection-through-the-eorder-app)
- [Marg care: order list in eOrder](https://care.margcompusoft.com/ebusiness-app/eorder-app/59077/5/how-to-view-order-list-in-eorder-app)

Current implementation anchors:

- built-in `salesperson` role exists
- customers can be assigned a primary salesperson
- quotations, sales orders, invoices, and payments support salesperson attribution
- distributor sales, collections, and outstanding reports by salesperson exist
- the customer detail page already supports salesperson assignment
- there is no route, beat, territory, visit, or DCR subsystem yet

---

## D12 goal

Add a real operational field-sales layer so the product can support:

- route and beat planning
- salesperson worklists
- daily visit execution
- assisted order capture from the field
- collection follow-up updates from the field
- manager and owner visibility into field execution quality

D12 should convert the current salesperson model from a reporting-only ownership layer into an execution layer that a distributor can actually run daily.

---

## Why D12 matters

The current product already knows:

- who owns the customer
- who booked the order
- who booked the invoice
- who collected the payment

But it still does not know:

- where the rep is supposed to go today
- which outlets were planned vs visited
- which visit created an order
- which visit was non-productive
- which parties asked for follow-up or collection recovery
- whether a route was covered well or poorly

Without D12, the product works well for office-driven distribution teams, but it still falls short for rep-led and beat-driven businesses.

---

## Scope

Included in D12:

- territory, route, and beat master data
- customer coverage assignment by salesperson and route context
- daily worklist generation
- planned vs ad-hoc visit tracking
- visit check-in and check-out
- visit outcome capture
- quick field order creation
- quote or sales-order capture from visit context
- collection follow-up updates from visit context
- promise-to-pay and remarks capture integrated with D9 where available
- DCR-style daily summary and closeout
- manager dashboards for route coverage and rep productivity
- mobile-first web workflow for reps

Included operating outputs:

- today worklist
- pending customer visits
- missed visit list
- productive vs non-productive visits
- order conversion by rep and route
- route coverage and outstanding by route
- DCR register

Not included in D12 first release:

- native Android or iOS app
- full offline sync engine
- continuous GPS tracking
- biometric attendance
- advanced CRM opportunity pipeline
- AI route optimization
- retailer self-ordering app
- delivery-person app

Optional later additions after D12 core:

- geotagged check-in enforcement
- location trail and map replay
- attendance and leave integration
- photo-based visit proof
- retailer-facing appointment slots
- rep incentive engine

Planned result after D12:

- a field rep can run the day from the product
- a manager can measure route discipline and outlet coverage
- customer orders and collection follow-ups can be tied back to actual visits

---

## Business outcomes

After D12, the product should let a business:

- assign customers to sales coverage structures in a disciplined way
- create a route and beat plan for each salesperson
- give each rep a clear day plan
- track who was visited and what happened
- create an order while standing at the customer outlet
- record collection recovery updates and follow-up commitments
- review route productivity and execution gaps

---

## Design principles

1. Extend the current D4 model instead of replacing it.
   Customer-to-salesperson assignment remains the primary ownership anchor.

2. Reuse existing commercial documents.
   Field order capture should create normal quotations or sales orders, not separate shadow documents.

3. Visits are the new operational anchor.
   Field activity should attach to visit records so later analysis is trustworthy.

4. Mobile-first does not mean mobile-only.
   The first release should fit the current Next.js tenant app and work well on phones.

5. Planning should be structured but lightweight.
   The system should not require complex scheduling before any field work can happen.

6. Productive and non-productive visits both matter.
   A visit without order is still useful information if reason and follow-up are captured.

7. First release should support assisted execution, not surveillance.
   Make geolocation optional at first and avoid blocking operations on perfect GPS data.

8. Manager visibility must be clear without becoming row-level hard lock by default.
   Strong row-level restriction can come later after real usage patterns are understood.

---

## Terms and concepts

### Territory

A broad sales coverage area such as city zone, district, or channel segment.

### Route

A repeatable operational path or grouping of customers typically assigned to one or more reps.

### Beat

A smaller recurring visit cluster or schedule unit within a route, often used for day-of-week planning.

### Coverage assignment

The mapping that links a customer to the responsible salesperson, route, beat, and visit frequency.

### Visit plan

The generated or manually prepared list of customers a rep is expected to cover on a date.

### Visit

The actual execution event when a rep interacts with a customer outlet.

### Productive visit

A visit that resulted in a useful commercial outcome such as order, collection, commitment, or issue resolution.

### Non-productive visit

A visit with no order or collection, but still recorded with reason such as outlet closed, no stock need, owner absent, or payment pending.

### DCR

Daily call report or daily closeout summary submitted by the salesperson for the day.

---

## Actors and operating roles

### Salesperson

Needs:

- a simple today screen
- quick customer lookup
- route-aware worklist
- fast visit logging
- quick order capture
- follow-up and promise capture
- day closeout

### Sales manager

Needs:

- team plan view
- route coverage view
- non-productive visit reasons
- rep-wise order and recovery outcomes
- missed-visit visibility

### Owner / admin

Needs:

- overall route performance
- coverage gaps
- outlet productivity
- route outstanding and collection recovery
- confidence that field activity is real and traceable

### Back office / telesales

Needs:

- ability to see rep activity when coordinating orders
- ability to continue document flow from field-created order
- no duplicate order entry when rep already captured one

---

## D12 capability set

## 1. Coverage masters

The system should support:

- territory master
- route master
- beat master
- salesperson-to-route assignment
- customer coverage assignment
- coverage frequency and preferred visit day

## 2. Daily planning

The system should support:

- generate worklist for a date
- planned customer sequence by route or beat
- manual addition of ad-hoc visits
- missed visit carry-forward suggestion

## 3. Visit execution

The system should support:

- start visit
- end visit
- capture visit outcome
- capture notes
- optional geotag or location snapshot
- next follow-up date

## 4. Assisted order capture

The system should support:

- create quotation from visit
- create sales order from visit
- optionally create invoice later only through normal office workflow unless permissions allow direct invoicing
- inherit customer, salesperson, route, beat, and visit references

Recommended first release:

- visit -> sales order is the main path
- visit -> quotation is optional for negotiated or future orders

## 5. Collection and recovery updates

The system should support:

- capture collection status
- capture promise-to-pay
- record issue such as cheque pending or payment blocked
- create follow-up task linked to D9 credit-control workflow where available

## 6. DCR and closeout

The system should support:

- daily summary draft
- total planned visits
- completed visits
- productive visits
- order count and value
- collection follow-ups
- non-productive visit reasons
- manager review later if enabled

## 7. Manager and owner visibility

The system should support:

- route dashboard
- beat coverage dashboard
- rep activity summary
- missed visits
- order conversion
- outstanding by route / beat / salesperson
- repeat non-productive outlet trends

---

## Phase breakdown inside D12

### D12.1 Coverage foundation

Deliver:

- territory, route, and beat masters
- customer coverage assignment model
- salesperson route assignment
- route-aware customer detail enhancements

### D12.2 Rep workspace and visit execution

Deliver:

- today worklist
- visit start and end
- visit outcome capture
- basic notes and follow-up scheduling

### D12.3 Assisted field order and collection workflow

Deliver:

- create sales order from visit context
- optional quotation capture
- D9-linked collection promise and follow-up updates

### D12.4 DCR and manager dashboards

Deliver:

- daily closeout
- route and rep dashboards
- missed-visit and coverage reporting

### D12.5 Optional hardening

Deliver later if needed:

- geotagged visit validation
- attendance events
- map view and route replay

---

## Core business rules

## 1. Coverage assignment model

Recommended first-release hierarchy:

- customer has one primary salesperson
- customer may also have one primary territory
- customer may also have one primary route
- customer may also have one primary beat

Rules:

- route and beat must belong to the selected territory where territory is used
- beat must belong to the selected route
- a customer may remain route-unassigned while still being salesperson-assigned
- the current D4 `salesperson_user_id` remains mandatory only when the business wants field ownership

Implementation note:

- do not force every customer into a territory model on day one
- allow gradual rollout and cleanup

## 2. Visit planning rules

The system should support two planning modes:

- generated worklist from customer coverage setup
- manual ad-hoc additions by salesperson or manager

Suggested planning inputs:

- visit frequency
- day-of-week preference
- route / beat
- priority
- overdue follow-up
- outstanding recovery need

Suggested first-release generation behavior:

- generate visit plans for the selected date using beat schedule and overdue carry-forward
- avoid generating duplicate planned visits for the same customer on the same date unless explicitly allowed

## 3. Visit lifecycle

Recommended statuses:

- planned
- in_progress
- completed
- missed
- cancelled

Recommended outcome values:

- order_booked
- quotation_shared
- collection_followup_done
- payment_received
- promise_received
- outlet_closed
- no_requirement
- stock_issue
- dispute_or_complaint
- reschedule_required

Rules:

- a visit can start from a planned worklist entry or from a directly created ad-hoc visit
- a visit can complete only from `in_progress`
- a completed visit should require at least one outcome and optional note
- a missed visit should require a reason
- a non-productive visit is still valid if outcome and note are recorded

## 4. Productive visit logic

A visit should be marked productive if any of the following occur:

- quotation created
- sales order created
- payment recorded
- promise-to-pay or follow-up created with meaningful commitment

The system should still store the exact activity type rather than only a boolean productive flag.

## 5. Field order capture rules

First-release recommendation:

- rep creates a standard sales order from the visit
- the order inherits:
  - customer
  - salesperson
  - route
  - beat
  - visit id
  - source channel = `field_sales`
  - captured by user id
- downstream dispatch and invoice flow should continue through D10 and the normal sales pipeline

Do not create a separate `field order` commercial document in first release unless later offline sync requires it.

## 6. Collection follow-up rules

D12 should not replace D9 receivables and banking workflows.

Instead D12 should let a rep:

- view customer outstanding summary
- record recovery remarks
- capture promised amount and promised date
- mark that customer refused or deferred payment
- optionally record cheque expected details without final ledger posting unless actual receipt is entered through approved payment workflow

Where D9 is available:

- rep actions should create or update the relevant collection task, promise, or instrument follow-up records

## 7. DCR rules

Each salesperson should be able to submit one DCR per date, with optional amendment by manager or admin.

DCR should summarize:

- planned visits
- completed visits
- missed visits
- productive visits
- orders booked
- quoted value
- order value
- collection updates
- key issues
- next-day carry-forward

Rules:

- DCR may be auto-drafted from visit records
- DCR submission should not create duplicate visit data
- a manager may reopen a DCR if edits are needed

## 8. Visibility rules

Recommended first release:

- owners and admins see all field-sales data
- managers see team or assigned-route data
- salespersons see their own plans and visits by default
- strict row-level document enforcement remains optional and out of scope for first release

This keeps D12 valuable without forcing a risky authorization redesign across all modules.

## 9. Geolocation rules

Recommended first release:

- location capture is optional and informative
- absence of location should not block order capture

Possible later policy options:

- soft warning when check-in is far from outlet geo-point
- mandatory geo capture for certain teams
- photo or signature proof

---

## Suggested data model

## New masters

### `sales_territories`

Purpose:

- broad field-sales coverage grouping

Suggested fields:

- `id`
- `company_id`
- `code`
- `name`
- `description`
- `status`
- `manager_user_id` nullable
- `created_at`
- `updated_at`

### `sales_routes`

Purpose:

- route-level operational grouping

Suggested fields:

- `id`
- `company_id`
- `territory_id` nullable
- `code`
- `name`
- `description`
- `status`
- `default_warehouse_id` nullable
- `manager_user_id` nullable
- `created_at`
- `updated_at`

### `sales_beats`

Purpose:

- repeatable visit cluster and schedule unit

Suggested fields:

- `id`
- `company_id`
- `territory_id` nullable
- `route_id`
- `code`
- `name`
- `day_of_week` nullable
- `sequence_no` nullable
- `status`
- `created_at`
- `updated_at`

## Coverage mapping

### `customer_sales_coverages`

Purpose:

- connect customer to the field execution model

Suggested fields:

- `id`
- `company_id`
- `customer_id`
- `salesperson_user_id`
- `territory_id` nullable
- `route_id` nullable
- `beat_id` nullable
- `visit_frequency` nullable
- `preferred_visit_day` nullable
- `priority` nullable
- `is_active`
- `effective_from`
- `effective_to` nullable
- `notes` nullable
- `created_at`
- `updated_at`

Implementation note:

- this table should coexist with `customers.salesperson_user_id`
- the customer master may still mirror the primary salesperson for convenience

### `salesperson_route_assignments`

Purpose:

- assign a rep to territory / route / beat responsibility

Suggested fields:

- `id`
- `company_id`
- `salesperson_user_id`
- `territory_id` nullable
- `route_id` nullable
- `beat_id` nullable
- `is_primary`
- `effective_from`
- `effective_to` nullable
- `created_at`
- `updated_at`

## Planning and execution

### `sales_visit_plans`

Purpose:

- store planned visits for a date

Suggested fields:

- `id`
- `company_id`
- `visit_date`
- `salesperson_user_id`
- `customer_id`
- `territory_id` nullable
- `route_id` nullable
- `beat_id` nullable
- `plan_source`
- `priority`
- `sequence_no` nullable
- `status`
- `generated_by_user_id` nullable
- `notes` nullable
- `created_at`
- `updated_at`

Suggested `plan_source` values:

- `generated`
- `manual`
- `carry_forward`
- `manager_assigned`

Suggested `status` values:

- `planned`
- `started`
- `completed`
- `missed`
- `cancelled`

### `sales_visits`

Purpose:

- actual visit execution and outcome capture

Suggested fields:

- `id`
- `company_id`
- `visit_plan_id` nullable
- `salesperson_user_id`
- `customer_id`
- `territory_id` nullable
- `route_id` nullable
- `beat_id` nullable
- `visit_date`
- `check_in_at` nullable
- `check_out_at` nullable
- `check_in_latitude` nullable
- `check_in_longitude` nullable
- `check_out_latitude` nullable
- `check_out_longitude` nullable
- `status`
- `primary_outcome`
- `productive_flag`
- `notes` nullable
- `next_follow_up_date` nullable
- `created_at`
- `updated_at`

### `sales_visit_outcomes`

Purpose:

- optional detailed event breakdown when one visit has multiple outcomes

Suggested fields:

- `id`
- `company_id`
- `visit_id`
- `outcome_type`
- `reference_type` nullable
- `reference_id` nullable
- `amount` nullable
- `remarks` nullable
- `created_at`

Suggested `reference_type` examples:

- `quotation`
- `sales_order`
- `payment`
- `collection_task`
- `promise`

### `rep_daily_reports`

Purpose:

- store daily closeout and manager review

Suggested fields:

- `id`
- `company_id`
- `salesperson_user_id`
- `report_date`
- `planned_visits_count`
- `completed_visits_count`
- `missed_visits_count`
- `productive_visits_count`
- `quotations_count`
- `sales_orders_count`
- `sales_order_value`
- `collection_updates_count`
- `closing_notes` nullable
- `status`
- `submitted_at` nullable
- `reviewed_by_user_id` nullable
- `reviewed_at` nullable
- `review_notes` nullable
- `created_at`
- `updated_at`

Suggested `status` values:

- `draft`
- `submitted`
- `reopened`
- `approved`

## Suggested changes to existing tables

### `customers`

Suggested additions:

- `territory_id` nullable
- `route_id` nullable
- `beat_id` nullable
- `outlet_latitude` nullable
- `outlet_longitude` nullable
- `visit_frequency` nullable
- `preferred_visit_day` nullable

### `sales_orders`

Suggested additions:

- `source_channel` nullable
- `captured_by_user_id` nullable
- `sales_visit_id` nullable
- `territory_id` nullable
- `route_id` nullable
- `beat_id` nullable

Suggested `source_channel` values:

- `web`
- `office`
- `field_sales`
- `import`
- `retailer_app` later

### `quotations`

Suggested additions:

- `source_channel` nullable
- `captured_by_user_id` nullable
- `sales_visit_id` nullable
- `territory_id` nullable
- `route_id` nullable
- `beat_id` nullable

### `payments` or D9-linked collection entities

Suggested additions where useful:

- `sales_visit_id` nullable
- `source_channel` nullable
- `captured_by_user_id` nullable

### `users_companies` or equivalent company-user role metadata

Optional additions:

- `manager_user_id` nullable
- `field_sales_enabled` boolean default false

Implementation note:

- use the exact existing tenancy and membership model already present in the codebase
- do not duplicate company-user storage just for D12

---

## API surface target

All routes should follow the current company-scoped API style:

- `/api/companies/:companyId/...`

## Coverage masters

- `GET /api/companies/:companyId/field-sales/territories`
- `POST /api/companies/:companyId/field-sales/territories`
- `PATCH /api/companies/:companyId/field-sales/territories/:territoryId`
- `GET /api/companies/:companyId/field-sales/routes`
- `POST /api/companies/:companyId/field-sales/routes`
- `PATCH /api/companies/:companyId/field-sales/routes/:routeId`
- `GET /api/companies/:companyId/field-sales/beats`
- `POST /api/companies/:companyId/field-sales/beats`
- `PATCH /api/companies/:companyId/field-sales/beats/:beatId`

## Coverage assignment

- `GET /api/companies/:companyId/field-sales/coverage`
- `POST /api/companies/:companyId/field-sales/coverage`
- `PATCH /api/companies/:companyId/field-sales/coverage/:coverageId`
- `POST /api/companies/:companyId/field-sales/customers/:customerId/assign-coverage`
- `GET /api/companies/:companyId/field-sales/salespeople/:userId/assignments`
- `POST /api/companies/:companyId/field-sales/salespeople/:userId/assignments`

Recommended request body for customer coverage assignment:

```json
{
  "salesperson_user_id": "usr_123",
  "territory_id": "ter_001",
  "route_id": "route_001",
  "beat_id": "beat_mon_a",
  "visit_frequency": "weekly",
  "preferred_visit_day": "monday",
  "priority": "high",
  "notes": "Key FMCG outlet with weekly recovery follow-up"
}
```

## Planning

- `POST /api/companies/:companyId/field-sales/visit-plans/generate`
- `GET /api/companies/:companyId/field-sales/visit-plans?date=2026-03-26&salesperson_user_id=...`
- `POST /api/companies/:companyId/field-sales/visit-plans`
- `PATCH /api/companies/:companyId/field-sales/visit-plans/:visitPlanId`
- `POST /api/companies/:companyId/field-sales/visit-plans/:visitPlanId/carry-forward`

Recommended generation request body:

```json
{
  "date": "2026-03-26",
  "salesperson_user_ids": ["usr_123"],
  "mode": "replace_missing_only"
}
```

Suggested `mode` values:

- `replace_all`
- `replace_missing_only`
- `carry_forward_only`

## Rep workspace

- `GET /api/companies/:companyId/field-sales/my/worklist?date=2026-03-26`
- `GET /api/companies/:companyId/field-sales/my/customers`
- `GET /api/companies/:companyId/field-sales/my/summary?date=2026-03-26`

Recommended worklist response shape:

```json
{
  "date": "2026-03-26",
  "salesperson_user_id": "usr_123",
  "counts": {
    "planned": 18,
    "completed": 9,
    "missed": 1,
    "productive": 5
  },
  "visits": [
    {
      "visit_plan_id": "svp_001",
      "customer_id": "cust_001",
      "customer_name": "Sharma Traders",
      "route_name": "North Route",
      "beat_name": "Monday A",
      "priority": "high",
      "sequence_no": 1,
      "outstanding_amount": 18450,
      "last_ordered_at": "2026-03-20T10:30:00.000Z",
      "status": "planned"
    }
  ]
}
```

## Visit execution

- `POST /api/companies/:companyId/field-sales/visits`
- `POST /api/companies/:companyId/field-sales/visits/:visitId/check-in`
- `POST /api/companies/:companyId/field-sales/visits/:visitId/check-out`
- `PATCH /api/companies/:companyId/field-sales/visits/:visitId`
- `POST /api/companies/:companyId/field-sales/visits/:visitId/outcomes`
- `POST /api/companies/:companyId/field-sales/visits/:visitId/mark-missed`

Recommended check-in request body:

```json
{
  "captured_at": "2026-03-26T10:15:00.000Z",
  "latitude": 22.5726,
  "longitude": 88.3639,
  "remarks": "Reached outlet"
}
```

Recommended visit completion body:

```json
{
  "primary_outcome": "order_booked",
  "notes": "Booked mixed FMCG order for Friday supply",
  "next_follow_up_date": "2026-03-29",
  "productive_flag": true
}
```

## Assisted order and quotation capture

- `POST /api/companies/:companyId/field-sales/visits/:visitId/create-sales-order`
- `POST /api/companies/:companyId/field-sales/visits/:visitId/create-quotation`

Recommended behavior:

- these endpoints should internally call or reuse the same service path as normal `sales-orders` or `quotations`
- the created document should be normal and fully visible in existing sales modules

Recommended request body for field sales order:

```json
{
  "warehouse_id": "wh_001",
  "expected_dispatch_date": "2026-03-27",
  "notes": "Urgent mixed order captured on route visit",
  "lines": [
    {
      "product_id": "prod_001",
      "quantity": 12,
      "unit_price": 102.5
    }
  ]
}
```

## Collection follow-up actions

- `POST /api/companies/:companyId/field-sales/visits/:visitId/collection-updates`
- `POST /api/companies/:companyId/field-sales/visits/:visitId/promises`

Recommended body:

```json
{
  "outstanding_amount_seen": 18450,
  "promised_amount": 10000,
  "promised_date": "2026-03-30",
  "remarks": "Retailer requested two-day extension",
  "status": "promise_received"
}
```

Integration expectation:

- these should create or update D9 follow-up records instead of inventing a separate receivables subsystem

## DCR

- `GET /api/companies/:companyId/field-sales/dcr?date=2026-03-26&salesperson_user_id=...`
- `POST /api/companies/:companyId/field-sales/dcr/submit`
- `POST /api/companies/:companyId/field-sales/dcr/:dcrId/reopen`
- `POST /api/companies/:companyId/field-sales/dcr/:dcrId/approve`

Recommended submit body:

```json
{
  "report_date": "2026-03-26",
  "salesperson_user_id": "usr_123",
  "closing_notes": "Route completed except two closed outlets",
  "issues": [
    "Two parties requested credit extension",
    "One key SKU not available in sufficient quantity"
  ]
}
```

## Reporting

- `GET /api/companies/:companyId/reports/distributor/route-coverage?from=&to=&route_id=`
- `GET /api/companies/:companyId/reports/distributor/beat-performance?from=&to=&beat_id=`
- `GET /api/companies/:companyId/reports/distributor/rep-visit-productivity?from=&to=&salesperson_user_id=`
- `GET /api/companies/:companyId/reports/distributor/missed-visits?date=`
- `GET /api/companies/:companyId/reports/distributor/route-outstanding?as_of=`
- `GET /api/companies/:companyId/reports/distributor/dcr-register?from=&to=`

---

## Service and implementation design

Recommended backend modules:

- `field-sales`
- `field-sales-planning`
- `field-sales-reports`

Recommended service ownership:

- route and beat master logic lives in a field-sales domain service
- customer assignment updates should coordinate with the existing customers service
- document creation should delegate to existing quotations and sales-orders services
- collection follow-up actions should delegate to D9 collections service where implemented

Do not:

- create a parallel order engine
- create a separate customer directory for field reps
- duplicate outstanding calculations already available in reports or accounting services

---

## Frontend routes and screens

Recommended route additions:

- `/c/[companyId]/sales/field`
- `/c/[companyId]/sales/field/today`
- `/c/[companyId]/sales/field/customers`
- `/c/[companyId]/sales/field/visits/[visitId]`
- `/c/[companyId]/sales/field/orders/new`
- `/c/[companyId]/sales/field/dcr`
- `/c/[companyId]/reports/distributor/routes`
- `/c/[companyId]/reports/distributor/dcr`

Recommended settings or master routes:

- `/c/[companyId]/settings/sales/territories`
- `/c/[companyId]/settings/sales/routes`
- `/c/[companyId]/settings/sales/beats`
- `/c/[companyId]/settings/sales/assignments`

Current-route extensions:

- customer create and detail screens gain route / beat / territory assignment controls
- sales order and quotation create screens can optionally surface route / beat context when created manually
- dashboard can later show route coverage summary cards for owners and managers
- existing `/c/[companyId]/reports/distributor/sales-team` can remain and be complemented by route and visit reports

## Rep workspace screen design

### Today screen

Should show:

- current date
- visit progress counts
- route or beat filter
- top-priority outlets
- outstanding amount warnings
- missed follow-ups

Primary actions:

- start visit
- search customer
- add ad-hoc visit
- create quick order
- open DCR

### Customer list for field rep

Should show:

- assigned customers
- route and beat tags
- last order date
- current outstanding
- next follow-up date

### Visit detail screen

Should show:

- customer summary
- outstanding summary
- recent order history
- quick note box
- start / end visit
- create quotation
- create order
- add collection promise
- mark missed / rescheduled

### DCR screen

Should show:

- auto-generated counters from visit records
- editable day notes
- issue list
- pending incomplete visits before submission

Implementation note:

- mobile viewport usability is critical
- large tap targets, compact forms, and low-friction customer search matter more than dashboard decoration

---

## Reports and manager analytics

The system should support at least the following report families.

## 1. Route coverage

Metrics:

- planned visits
- completed visits
- missed visits
- completion percentage
- route-wise productive visits

## 2. Rep productivity

Metrics:

- visits per day
- productive vs non-productive visits
- orders booked
- order value
- average lines per order
- promise-to-pay count

## 3. Outlet execution quality

Metrics:

- last visit date
- last order date
- repeated missed visits
- repeated non-productive outcomes
- coverage gap days

## 4. Recovery and outstanding by route

Metrics:

- outstanding by route
- recovery commitments by route
- broken promises by route or rep

## 5. DCR register

Metrics:

- DCR submitted / pending
- late submissions
- review status

Recommended future enhancement:

- map-based sales and route visualizations after the first release proves useful data quality

---

## Permissions model

Recommended new permissions:

- `field_sales.manage_territories`
- `field_sales.manage_routes`
- `field_sales.manage_beats`
- `field_sales.manage_assignments`
- `field_sales.generate_visit_plans`
- `field_sales.view_team_worklists`
- `field_sales.view_own_worklist`
- `field_sales.log_visits`
- `field_sales.create_orders`
- `field_sales.create_quotations`
- `field_sales.record_collection_followups`
- `field_sales.submit_dcr`
- `field_sales.review_dcr`
- `field_sales.view_route_reports`

Recommended role mapping:

- salesperson:
  - view own worklist
  - log visits
  - create field order
  - create field quotation
  - record follow-ups
  - submit DCR
- manager:
  - all salesperson permissions for assigned team
  - generate visit plans
  - view team worklists
  - review DCR
  - view route reports
- owner/admin:
  - full field-sales permissions

First-release caution:

- do not attempt hard row-level enforcement across all sales records unless the wider authorization model is ready for it

---

## Validation and testing plan

## Unit tests

Add coverage for:

- route / beat hierarchy validation
- worklist generation rules
- duplicate visit-plan prevention
- productive visit classification
- DCR summarization
- route assignment conflict handling

## Integration tests

Add API coverage for:

- create route and beat
- assign customer coverage
- generate plan for a rep
- start and complete visit
- create sales order from visit
- create collection promise from visit
- submit DCR

## Browser tests

Add Playwright coverage for:

- manager creates route and beat
- manager assigns customer coverage
- salesperson opens today screen on mobile viewport
- salesperson completes visit and creates sales order
- salesperson submits DCR
- manager reviews route coverage report

## Seed scenarios

Create demo data for:

- one city with two territories
- three routes
- six beats
- three salespeople
- fifty customers with mixed coverage
- planned visits for one week
- a mix of productive, non-productive, and missed visits

---

## Rollout and migration strategy

## 1. Backfill from current D4 model

Starting point:

- existing `customers.salesperson_user_id`

Recommended migration behavior:

- create default coverage rows for customers that already have a salesperson
- leave route / beat null if business has not configured them yet

## 2. Progressive adoption

Recommended rollout sequence:

1. enable masters and customer coverage assignment
2. enable worklist and visits for a small rep cohort
3. enable field order capture
4. enable DCR and manager reports
5. enable optional geo policies later

## 3. Safe coexistence with office workflow

During rollout:

- office teams can continue creating quotations and sales orders normally
- field-created orders are just standard commercial documents with richer source metadata

## 4. Dependency caution

Because the current product still needs full staging validation:

- D12 spec and implementation can proceed
- but release should be gated on a stable baseline for customer, order, invoice, payment, warehouse, and report flows

This avoids mixing pre-existing core issues with new field-sales complexity during rollout.

---

## Risks and failure modes

## 1. Overbuilding too early

Risk:

- the team may drift into a full SFA or CRM platform

Mitigation:

- keep first release focused on route coverage, visits, assisted ordering, and DCR

## 2. Poor master-data quality

Risk:

- weak route and beat assignments will make reports untrustworthy

Mitigation:

- make coverage setup reviewable
- show unassigned customers clearly

## 3. Rep adoption friction

Risk:

- too many mandatory steps will reduce daily usage

Mitigation:

- keep visit logging fast
- auto-fill customer context
- make location optional in first release

## 4. Duplicate order entry

Risk:

- rep enters order in field and office re-enters same order

Mitigation:

- field orders must create normal sales orders immediately
- office dashboard should show new field-origin orders clearly

## 5. Authorization creep

Risk:

- enforcing strict row-level visibility may destabilize unrelated modules

Mitigation:

- defer hard row-level restrictions until the team is ready to harden the authorization model

---

## Acceptance criteria

D12 is complete for first release when:

- territory, route, and beat masters exist and are usable
- customers can be assigned coverage beyond just salesperson
- a manager can generate a rep worklist for a date
- a salesperson can see a mobile-friendly today screen
- a salesperson can start and complete visits
- a salesperson can record productive and non-productive outcomes
- a salesperson can create a normal sales order from visit context
- collection promises or follow-ups can be captured from visits and linked into D9 workflow
- a salesperson can submit DCR
- managers can see route coverage, missed visits, and rep productivity reports
- all core flows are covered by API and browser tests

---

## Recommended implementation order inside D12

1. coverage masters and customer assignment
2. worklist generation and today screen
3. visit lifecycle and outcome capture
4. sales-order creation from visit
5. D9 collection follow-up linkage
6. DCR
7. route and rep analytics
8. optional geo and attendance hardening

---

## Definition of done

Field-sales operations are considered distributor-ready when:

- a rep can follow a planned route from the app
- visit execution is captured with useful outcome data
- orders and recovery follow-ups are tied to visits
- managers can see whether routes are covered and whether coverage is producing business results
- the feature works inside the current tenant web app without requiring a separate mobile platform to get value
