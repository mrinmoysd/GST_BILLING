"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export type SalesTerritory = {
  id: string;
  code: string;
  name: string;
  status: string;
  manager?: { id: string; name?: string | null; email?: string | null } | null;
  _count?: { routes?: number; coverages?: number; visits?: number };
};

export type SalesRoute = {
  id: string;
  code: string;
  name: string;
  status: string;
  territory?: { id: string; code: string; name: string } | null;
  manager?: { id: string; name?: string | null; email?: string | null } | null;
  defaultWarehouse?: { id: string; name: string; code: string } | null;
  _count?: { beats?: number; coverages?: number; visits?: number };
};

export type SalesBeat = {
  id: string;
  code: string;
  name: string;
  status: string;
  dayOfWeek?: string | null;
  day_of_week?: string | null;
  sequenceNo?: number | null;
  sequence_no?: number | null;
  territory?: { id: string; code: string; name: string } | null;
  route?: { id: string; code: string; name: string } | null;
  _count?: { coverages?: number; visits?: number };
};

export type CustomerCoverage = {
  id: string;
  visitFrequency?: string | null;
  visit_frequency?: string | null;
  preferredVisitDay?: string | null;
  preferred_visit_day?: string | null;
  priority?: string | null;
  isActive?: boolean;
  is_active?: boolean;
  notes?: string | null;
  customer?: { id: string; name: string; phone?: string | null };
  salesperson?: { id: string; name?: string | null; email?: string | null; role?: string | null } | null;
  territory?: { id: string; code: string; name: string } | null;
  route?: { id: string; code: string; name: string } | null;
  beat?: { id: string; code: string; name: string; dayOfWeek?: string | null; day_of_week?: string | null } | null;
};

export type SalespersonRouteAssignment = {
  id: string;
  isPrimary?: boolean;
  is_primary?: boolean;
  salesperson?: { id: string; name?: string | null; email?: string | null; role?: string | null } | null;
  territory?: { id: string; code: string; name: string } | null;
  route?: { id: string; code: string; name: string } | null;
  beat?: { id: string; code: string; name: string; dayOfWeek?: string | null; day_of_week?: string | null } | null;
};

export type SalesVisitPlan = {
  id: string;
  status: string;
  priority?: string | null;
  sequenceNo?: number | null;
  sequence_no?: number | null;
  notes?: string | null;
  customer?: { id: string; name: string; phone?: string | null };
  salesperson?: { id: string; name?: string | null; email?: string | null; role?: string | null } | null;
  territory?: { id: string; code: string; name: string } | null;
  route?: { id: string; code: string; name: string } | null;
  beat?: { id: string; code: string; name: string; dayOfWeek?: string | null; day_of_week?: string | null } | null;
  visit?: SalesVisit | null;
};

export type SalesVisit = {
  id: string;
  status: string;
  primaryOutcome?: string | null;
  primary_outcome?: string | null;
  productiveFlag?: boolean;
  productive_flag?: boolean;
  notes?: string | null;
  visitDate?: string | null;
  visit_date?: string | null;
  checkInAt?: string | null;
  check_in_at?: string | null;
  checkOutAt?: string | null;
  check_out_at?: string | null;
  nextFollowUpDate?: string | null;
  next_follow_up_date?: string | null;
  customer?: { id: string; name: string; phone?: string | null };
  salesperson?: { id: string; name?: string | null; email?: string | null; role?: string | null } | null;
  territory?: { id: string; code: string; name: string } | null;
  route?: { id: string; code: string; name: string } | null;
  beat?: { id: string; code: string; name: string; dayOfWeek?: string | null; day_of_week?: string | null } | null;
  outcomes?: Array<{
    id: string;
    outcomeType?: string;
    outcome_type?: string;
    referenceType?: string | null;
    reference_type?: string | null;
    remarks?: string | null;
    amount?: string | number | null;
    createdAt?: string;
    created_at?: string;
  }>;
  quotations?: Array<{ id: string; quoteNumber?: string | null; quote_number?: string | null; status?: string | null; total?: string | number | null }>;
  salesOrders?: Array<{ id: string; orderNumber?: string | null; order_number?: string | null; status?: string | null; total?: string | number | null }>;
  collectionTasks?: Array<{ id: string; status: string; promiseToPayAmount?: string | number | null; promise_to_pay_amount?: string | number | null; promiseToPayDate?: string | null; promise_to_pay_date?: string | null; notes?: string | null }>;
};

export type MyWorklistResponse = {
  date: string;
  salesperson_user_id: string;
  counts: {
    planned: number;
    completed: number;
    missed: number;
    productive: number;
  };
  visits: Array<{
    visit_plan_id: string;
    visit_id?: string | null;
    customer_id: string;
    customer_name: string;
    route_name?: string | null;
    beat_name?: string | null;
    priority?: string | null;
    sequence_no?: number | null;
    outstanding_amount: number;
    last_ordered_at?: string | null;
    status: string;
  }>;
};

export type MyCustomerRow = {
  coverage_id: string;
  customer: { id: string; name: string; phone?: string | null };
  route?: { id: string; code: string; name: string } | null;
  beat?: { id: string; code: string; name: string } | null;
  visit_frequency?: string | null;
  preferred_visit_day?: string | null;
  priority?: string | null;
  outstanding_amount: number;
  last_ordered_at?: string | null;
  next_follow_up_date?: string | null;
};

export type DcrResponse = {
  report_date: string;
  salesperson_user_id: string;
  snapshot: {
    planned_visits_count: number;
    completed_visits_count: number;
    missed_visits_count: number;
    productive_visits_count: number;
    quotations_count: number;
    sales_orders_count: number;
    sales_order_value: number;
    collection_updates_count: number;
  };
  report?: {
    id: string;
    status: string;
    closingNotes?: string | null;
    closing_notes?: string | null;
    issues?: string[] | null;
    submittedAt?: string | null;
    submitted_at?: string | null;
    reviewedAt?: string | null;
    reviewed_at?: string | null;
    reviewNotes?: string | null;
    review_notes?: string | null;
    salesperson?: { id: string; name?: string | null; email?: string | null } | null;
    reviewedBy?: { id: string; name?: string | null; email?: string | null } | null;
    reviewed_by?: { id: string; name?: string | null; email?: string | null } | null;
  } | null;
};

function invalidateFieldSales(qc: ReturnType<typeof useQueryClient>, companyId: string) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["companies", companyId, "field-sales"] }),
    qc.invalidateQueries({ queryKey: ["companies", companyId, "reports"] }),
    qc.invalidateQueries({ queryKey: ["companies", companyId, "sales-orders"] }),
    qc.invalidateQueries({ queryKey: ["companies", companyId, "quotations"] }),
    qc.invalidateQueries({ queryKey: ["companies", companyId, "collections"] }),
  ]);
}

export function useSalesTerritories(companyId: string) {
  return useQuery({
    queryKey: ["companies", companyId, "field-sales", "territories"],
    queryFn: async () => apiClient.get<{ data: SalesTerritory[] }>(companyPath(companyId, "/field-sales/territories")),
  });
}

export function useCreateSalesTerritory(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "territories", "create"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post<{ data: SalesTerritory }>(companyPath(companyId, "/field-sales/territories"), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useSalesRoutes(args: { companyId: string; territory_id?: string }) {
  const { companyId, territory_id } = args;
  return useQuery({
    queryKey: ["companies", companyId, "field-sales", "routes", { territory_id }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (territory_id) qs.set("territory_id", territory_id);
      return apiClient.get<{ data: SalesRoute[] }>(companyPath(companyId, `/field-sales/routes?${qs.toString()}`));
    },
  });
}

export function useCreateSalesRoute(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "routes", "create"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post<{ data: SalesRoute }>(companyPath(companyId, "/field-sales/routes"), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useSalesBeats(args: { companyId: string; route_id?: string }) {
  const { companyId, route_id } = args;
  return useQuery({
    queryKey: ["companies", companyId, "field-sales", "beats", { route_id }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (route_id) qs.set("route_id", route_id);
      return apiClient.get<{ data: SalesBeat[] }>(companyPath(companyId, `/field-sales/beats?${qs.toString()}`));
    },
  });
}

export function useCreateSalesBeat(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "beats", "create"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post<{ data: SalesBeat }>(companyPath(companyId, "/field-sales/beats"), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useCustomerCoverage(args: {
  companyId: string;
  salesperson_user_id?: string;
  customer_id?: string;
  active_only?: boolean;
}) {
  const { companyId, salesperson_user_id, customer_id, active_only = true } = args;
  return useQuery({
    queryKey: ["companies", companyId, "field-sales", "coverage", { salesperson_user_id, customer_id, active_only }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (salesperson_user_id) qs.set("salesperson_user_id", salesperson_user_id);
      if (customer_id) qs.set("customer_id", customer_id);
      qs.set("active_only", active_only ? "true" : "false");
      return apiClient.get<{ data: CustomerCoverage[] }>(companyPath(companyId, `/field-sales/coverage?${qs.toString()}`));
    },
  });
}

export function useAssignCustomerCoverage(companyId: string, customerId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "coverage", "assign", customerId ?? "generic"],
    mutationFn: async (body: Record<string, unknown>) => {
      if (customerId) {
        return apiClient.post<{ data: CustomerCoverage }>(
          companyPath(companyId, `/field-sales/customers/${customerId}/assign-coverage`),
          body,
        );
      }
      return apiClient.post<{ data: CustomerCoverage }>(companyPath(companyId, "/field-sales/coverage"), body);
    },
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "customers"] });
    },
  });
}

export function useSalespersonAssignments(companyId: string, userId: string, enabled = true) {
  return useQuery({
    queryKey: ["companies", companyId, "field-sales", "salesperson-assignments", userId],
    enabled,
    queryFn: async () =>
      apiClient.get<{ data: SalespersonRouteAssignment[] }>(companyPath(companyId, `/field-sales/salespeople/${userId}/assignments`)),
  });
}

export function useCreateSalespersonAssignment(companyId: string, userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "salesperson-assignments", userId, "create"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post<{ data: SalespersonRouteAssignment }>(companyPath(companyId, `/field-sales/salespeople/${userId}/assignments`), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useGenerateVisitPlans(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "visit-plans", "generate"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post<{ data: SalesVisitPlan[]; meta: { created: number; mode: string; date: string } }>(
        companyPath(companyId, "/field-sales/visit-plans/generate"),
        body,
      ),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useVisitPlans(args: { companyId: string; date: string; salesperson_user_id?: string; enabled?: boolean }) {
  const { companyId, date, salesperson_user_id, enabled = true } = args;
  return useQuery({
    queryKey: ["companies", companyId, "field-sales", "visit-plans", { date, salesperson_user_id }],
    enabled: enabled && Boolean(date),
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("date", date);
      if (salesperson_user_id) qs.set("salesperson_user_id", salesperson_user_id);
      return apiClient.get<{ data: SalesVisitPlan[] }>(companyPath(companyId, `/field-sales/visit-plans?${qs.toString()}`));
    },
  });
}

export function useCreateVisit(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "visits", "create"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post<{ data: SalesVisit }>(companyPath(companyId, "/field-sales/visits"), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useVisit(args: { companyId: string; visitId: string; enabled?: boolean }) {
  const { companyId, visitId, enabled = true } = args;
  return useQuery({
    queryKey: ["companies", companyId, "field-sales", "visits", visitId],
    enabled: enabled && Boolean(visitId),
    queryFn: async () => apiClient.get<SalesVisit>(companyPath(companyId, `/field-sales/visits/${visitId}`)),
  });
}

function useVisitAction(companyId: string, visitId: string, action: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "visits", visitId, action],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post<{ data: SalesVisit }>(companyPath(companyId, `/field-sales/visits/${visitId}/${action}`), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useCheckInVisit(companyId: string, visitId: string) {
  return useVisitAction(companyId, visitId, "check-in");
}

export function useCheckOutVisit(companyId: string, visitId: string) {
  return useVisitAction(companyId, visitId, "check-out");
}

export function useMarkMissedVisit(companyId: string, visitId: string) {
  return useVisitAction(companyId, visitId, "mark-missed");
}

export function useUpdateVisit(companyId: string, visitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "visits", visitId, "update"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.patch<{ data: SalesVisit }>(companyPath(companyId, `/field-sales/visits/${visitId}`), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useAddVisitOutcome(companyId: string, visitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "visits", visitId, "outcomes"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post(companyPath(companyId, `/field-sales/visits/${visitId}/outcomes`), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useCreateFieldSalesOrder(companyId: string, visitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "visits", visitId, "create-sales-order"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post(companyPath(companyId, `/field-sales/visits/${visitId}/create-sales-order`), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useCreateFieldQuotation(companyId: string, visitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "visits", visitId, "create-quotation"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post(companyPath(companyId, `/field-sales/visits/${visitId}/create-quotation`), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useCreateFieldCollectionUpdate(companyId: string, visitId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "visits", visitId, "collection-updates"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post(companyPath(companyId, `/field-sales/visits/${visitId}/collection-updates`), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useMyWorklist(args: { companyId: string; date: string; enabled?: boolean }) {
  const { companyId, date, enabled = true } = args;
  return useQuery({
    queryKey: ["companies", companyId, "field-sales", "my", "worklist", { date }],
    enabled: enabled && Boolean(date),
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("date", date);
      return apiClient.get<MyWorklistResponse>(companyPath(companyId, `/field-sales/my/worklist?${qs.toString()}`));
    },
  });
}

export function useMyCustomers(companyId: string, enabled = true) {
  return useQuery({
    queryKey: ["companies", companyId, "field-sales", "my", "customers"],
    enabled,
    queryFn: async () => apiClient.get<{ data: MyCustomerRow[] }>(companyPath(companyId, "/field-sales/my/customers")),
  });
}

export function useMySummary(args: { companyId: string; date: string; enabled?: boolean }) {
  const { companyId, date, enabled = true } = args;
  return useQuery({
    queryKey: ["companies", companyId, "field-sales", "my", "summary", { date }],
    enabled: enabled && Boolean(date),
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("date", date);
      return apiClient.get<MyWorklistResponse & { open_collection_tasks: number }>(
        companyPath(companyId, `/field-sales/my/summary?${qs.toString()}`),
      );
    },
  });
}

export function useDcr(args: { companyId: string; date: string; salesperson_user_id: string; enabled?: boolean }) {
  const { companyId, date, salesperson_user_id, enabled = true } = args;
  return useQuery({
    queryKey: ["companies", companyId, "field-sales", "dcr", { date, salesperson_user_id }],
    enabled: enabled && Boolean(date) && Boolean(salesperson_user_id),
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("date", date);
      qs.set("salesperson_user_id", salesperson_user_id);
      return apiClient.get<DcrResponse>(companyPath(companyId, `/field-sales/dcr?${qs.toString()}`));
    },
  });
}

export function useSubmitDcr(companyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "dcr", "submit"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post(companyPath(companyId, "/field-sales/dcr/submit"), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useReopenDcr(companyId: string, dcrId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "dcr", dcrId, "reopen"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post(companyPath(companyId, `/field-sales/dcr/${dcrId}/reopen`), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}

export function useApproveDcr(companyId: string, dcrId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "field-sales", "dcr", dcrId, "approve"],
    mutationFn: async (body: Record<string, unknown>) =>
      apiClient.post(companyPath(companyId, `/field-sales/dcr/${dcrId}/approve`), body),
    onSuccess: async () => {
      await invalidateFieldSales(qc, companyId);
    },
  });
}
