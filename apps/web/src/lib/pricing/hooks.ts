"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";

export type PriceList = {
  id: string;
  code: string;
  name: string;
  pricingTier?: string | null;
  pricing_tier?: string | null;
  priority?: number;
  isActive?: boolean;
  is_active?: boolean;
  items: Array<{
    id: string;
    fixedPrice?: string | number | null;
    fixed_price?: string | number | null;
    discountPercent?: string | number | null;
    discount_percent?: string | number | null;
    product?: { id: string; name: string; sku?: string | null; price?: string | number | null };
  }>;
};

export type CustomerProductPrice = {
  id: string;
  fixedPrice?: string | number | null;
  fixed_price?: string | number | null;
  discountPercent?: string | number | null;
  discount_percent?: string | number | null;
  customer?: { id: string; name: string; pricingTier?: string | null; pricing_tier?: string | null };
  product?: { id: string; name: string; sku?: string | null; price?: string | number | null };
};

export type PricingPreviewRow = {
  product_id: string;
  quantity: string;
  resolved_unit_price: string;
  resolved_discount?: string;
  free_quantity?: string;
  base_product_price: string;
  source: string;
  source_id?: string | null;
  source_label?: string | null;
  applied_schemes?: Array<{
    id: string;
    code: string;
    name: string;
    scheme_type: string;
    discount_amount: string;
    free_quantity: string;
    is_exclusive: boolean;
  }>;
  snapshot?: Record<string, unknown> | null;
};

export type CommercialScheme = {
  id: string;
  code: string;
  name: string;
  schemeType?: string;
  scheme_type?: string;
  documentType?: string | null;
  document_type?: string | null;
  pricingTier?: string | null;
  pricing_tier?: string | null;
  priority?: number;
  isExclusive?: boolean;
  is_exclusive?: boolean;
  customer?: { id: string; name: string; pricingTier?: string | null } | null;
  product?: { id: string; name: string; sku?: string | null; price?: string | number | null } | null;
  percentDiscount?: string | number | null;
  percent_discount?: string | number | null;
  flatDiscountAmount?: string | number | null;
  flat_discount_amount?: string | number | null;
  freeQuantity?: string | number | null;
  free_quantity?: string | number | null;
};

export type CommercialAuditLog = {
  id: string;
  documentType?: string;
  document_type?: string;
  documentId?: string;
  document_id?: string;
  action: string;
  pricingSource?: string | null;
  pricing_source?: string | null;
  overrideReason?: string | null;
  override_reason?: string | null;
  createdAt?: string;
  created_at?: string;
  actor?: { id?: string; name?: string | null; email?: string | null } | null;
  customer?: { id: string; name: string } | null;
  product?: { id: string; name: string; sku?: string | null } | null;
  warnings?: unknown;
  snapshot?: Record<string, unknown> | null;
};

export function usePriceLists(args: { companyId: string }) {
  const { companyId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "pricing", "price-lists"],
    queryFn: async () =>
      apiClient.get<PriceList[]>(companyPath(companyId, "/pricing/price-lists")),
  });
}

export function useCreatePriceList(args: { companyId: string }) {
  const { companyId } = args;
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "pricing", "price-lists", "create"],
    mutationFn: async (body: {
      code: string;
      name: string;
      pricing_tier?: string;
      priority?: number;
      items: Array<{ product_id: string; fixed_price?: string; discount_percent?: string }>;
    }) => apiClient.post<PriceList>(companyPath(companyId, "/pricing/price-lists"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "pricing", "price-lists"] });
    },
  });
}

export function useCustomerProductPrices(args: { companyId: string }) {
  const { companyId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "pricing", "customer-rates"],
    queryFn: async () =>
      apiClient.get<CustomerProductPrice[]>(companyPath(companyId, "/pricing/customer-rates")),
  });
}

export function useCreateCustomerProductPrice(args: { companyId: string }) {
  const { companyId } = args;
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "pricing", "customer-rates", "create"],
    mutationFn: async (body: {
      customer_id: string;
      product_id: string;
      fixed_price?: string;
      discount_percent?: string;
    }) => apiClient.post<CustomerProductPrice>(companyPath(companyId, "/pricing/customer-rates"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "pricing", "customer-rates"] });
    },
  });
}

export function usePricingPreview(args: { companyId: string }) {
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "pricing", "preview"],
    mutationFn: async (body: {
      customer_id: string;
      document_date?: string;
      document_type?: string;
      items: Array<{ product_id: string; quantity: string }>;
    }) => apiClient.post<PricingPreviewRow[]>(companyPath(companyId, "/pricing/preview"), body),
  });
}

export function useCommercialSchemes(args: { companyId: string }) {
  const { companyId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "pricing", "schemes"],
    queryFn: async () =>
      apiClient.get<CommercialScheme[]>(companyPath(companyId, "/pricing/schemes")),
  });
}

export function useCreateCommercialScheme(args: { companyId: string }) {
  const { companyId } = args;
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["companies", companyId, "pricing", "schemes", "create"],
    mutationFn: async (body: {
      code: string;
      name: string;
      scheme_type: string;
      document_type?: string;
      customer_id?: string;
      pricing_tier?: string;
      product_id?: string;
      min_quantity?: string;
      min_amount?: string;
      percent_discount?: string;
      flat_discount_amount?: string;
      free_quantity?: string;
      priority?: number;
      is_exclusive?: boolean;
      starts_at?: string;
      ends_at?: string;
    }) => apiClient.post<CommercialScheme>(companyPath(companyId, "/pricing/schemes"), body),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "pricing", "schemes"] });
    },
  });
}

export function useCommercialAuditLogs(args: { companyId: string; limit?: number; action?: string }) {
  const { companyId, limit = 50, action } = args;
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));
  if (action) qs.set("action", action);
  return useQuery({
    queryKey: ["companies", companyId, "pricing", "audit-logs", { limit, action }],
    queryFn: async () =>
      apiClient.get<CommercialAuditLog[]>(
        companyPath(companyId, `/pricing/audit-logs?${qs.toString()}`),
      ),
  });
}
