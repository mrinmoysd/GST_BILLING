"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";
import type { Customer, Product, Supplier } from "@/lib/masters/types";

type Category = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function useCustomers(args: {
  companyId: string;
  page?: number;
  limit?: number;
  q?: string;
}) {
  const { companyId, page = 1, limit = 20, q } = args;
  return useQuery({
    queryKey: ["companies", companyId, "customers", { page, limit, q }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (q) qs.set("q", q);
  const res = await apiClient.get<Customer[]>(
        companyPath(companyId, `/customers?${qs.toString()}`),
      );
      return res;
    },
  });
}

export function useCustomer(args: { companyId: string; customerId: string }) {
  const { companyId, customerId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "customers", customerId],
    queryFn: async () => {
      const res = await apiClient.get<Customer>(
        companyPath(companyId, `/customers/${customerId}`),
      );
      return res;
    },
  });
}

export function useCreateCustomer(args: { companyId: string }) {
  const qc = useQueryClient();
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "customers", "create"],
    mutationFn: async (body: { name: string; email?: string; phone?: string }) => {
      const res = await apiClient.post<Customer>(companyPath(companyId, `/customers`), body);
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "customers"] });
    },
  });
}

export function useUpdateCustomer(args: { companyId: string; customerId: string }) {
  const qc = useQueryClient();
  const { companyId, customerId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "customers", customerId, "update"],
    mutationFn: async (body: { name?: string; email?: string | null; phone?: string | null }) => {
  const res = await apiClient.patch<Customer>(
        companyPath(companyId, `/customers/${customerId}`),
        body,
      );
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "customers"] });
    },
  });
}

export function useDeleteCustomer(args: { companyId: string; customerId: string }) {
  const qc = useQueryClient();
  const { companyId, customerId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "customers", customerId, "delete"],
    mutationFn: async () => {
  const res = await apiClient.del<{ id: string }>(companyPath(companyId, `/customers/${customerId}`));
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "customers"] });
    },
  });
}

export function useSuppliers(args: {
  companyId: string;
  page?: number;
  limit?: number;
  q?: string;
}) {
  const { companyId, page = 1, limit = 20, q } = args;
  return useQuery({
    queryKey: ["companies", companyId, "suppliers", { page, limit, q }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (q) qs.set("q", q);
  const res = await apiClient.get<Supplier[]>(
        companyPath(companyId, `/suppliers?${qs.toString()}`),
      );
      return res;
    },
  });
}

export function useSupplier(args: { companyId: string; supplierId: string }) {
  const { companyId, supplierId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "suppliers", supplierId],
    queryFn: async () => {
      const res = await apiClient.get<Supplier>(
        companyPath(companyId, `/suppliers/${supplierId}`),
      );
      return res;
    },
  });
}

export function useCreateSupplier(args: { companyId: string }) {
  const qc = useQueryClient();
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "suppliers", "create"],
    mutationFn: async (body: { name: string; email?: string; phone?: string }) => {
      const res = await apiClient.post<Supplier>(companyPath(companyId, `/suppliers`), body);
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "suppliers"] });
    },
  });
}

export function useUpdateSupplier(args: { companyId: string; supplierId: string }) {
  const qc = useQueryClient();
  const { companyId, supplierId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "suppliers", supplierId, "update"],
    mutationFn: async (body: { name?: string; email?: string | null; phone?: string | null }) => {
      const res = await apiClient.patch<Supplier>(
        companyPath(companyId, `/suppliers/${supplierId}`),
        body,
      );
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "suppliers"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "suppliers", supplierId] });
    },
  });
}

export function useDeleteSupplier(args: { companyId: string; supplierId: string }) {
  const qc = useQueryClient();
  const { companyId, supplierId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "suppliers", supplierId, "delete"],
    mutationFn: async () => {
      const res = await apiClient.del<{ id: string }>(companyPath(companyId, `/suppliers/${supplierId}`));
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "suppliers"] });
    },
  });
}

export function useProducts(args: {
  companyId: string;
  page?: number;
  limit?: number;
  q?: string;
}) {
  const { companyId, page = 1, limit = 20, q } = args;
  return useQuery({
    queryKey: ["companies", companyId, "products", { page, limit, q }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (q) qs.set("q", q);
  const res = await apiClient.get<Product[]>(
        companyPath(companyId, `/products?${qs.toString()}`),
      );
      return res;
    },
  });
}

export function useProduct(args: { companyId: string; productId: string }) {
  const { companyId, productId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "products", productId],
    queryFn: async () => {
      const res = await apiClient.get<Product>(companyPath(companyId, `/products/${productId}`));
      return res;
    },
  });
}

export function useCreateProduct(args: { companyId: string }) {
  const qc = useQueryClient();
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "products", "create"],
    mutationFn: async (body: {
      name: string;
      sku?: string;
      hsn?: string;
  categoryId?: string | null;
      price?: string | number;
  taxRate?: number;
    }) => {
      const res = await apiClient.post<Product>(companyPath(companyId, `/products`), body);
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "products"] });
    },
  });
}

export function useUpdateProduct(args: { companyId: string; productId: string }) {
  const qc = useQueryClient();
  const { companyId, productId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "products", productId, "update"],
    mutationFn: async (body: {
      name?: string;
      sku?: string | null;
      hsn?: string | null;
  categoryId?: string | null;
      price?: string | number | null;
  taxRate?: number | null;
      reorderLevel?: number | null;
    }) => {
      const res = await apiClient.patch<Product>(companyPath(companyId, `/products/${productId}`), body);
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "products"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "products", productId] });
    },
  });
}

export function useDeleteProduct(args: { companyId: string; productId: string }) {
  const qc = useQueryClient();
  const { companyId, productId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "products", productId, "delete"],
    mutationFn: async () => {
      const res = await apiClient.del<{ id: string }>(companyPath(companyId, `/products/${productId}`));
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "products"] });
    },
  });
}

export function useStockAdjustment(args: { companyId: string; productId: string }) {
  const qc = useQueryClient();
  const { companyId, productId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "products", productId, "stock-adjustment"],
    mutationFn: async (body: { changeQty: number; note?: string }) => {
      const res = await apiClient.post<{ ok: true }>(
        companyPath(companyId, `/products/${productId}/stock-adjustment`),
        body,
      );
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "products", productId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "products"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "stock-movements"] });
    },
  });
}

export function useStockMovements(args: {
  companyId: string;
  productId?: string;
  page?: number;
  limit?: number;
}) {
  const { companyId, productId, page = 1, limit = 20 } = args;
  return useQuery({
    queryKey: ["companies", companyId, "stock-movements", { productId, page, limit }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (productId) qs.set("product_id", productId);
      const res = await apiClient.get<{
        data: Array<{
          id: string;
          productId: string;
          changeQty: string;
          balanceQty: string;
          sourceType: string;
          sourceId: string | null;
          note: string | null;
          createdAt: string;
        }>;
        meta: { total: number; page: number; limit: number };
      }>(companyPath(companyId, `/stock-movements?${qs.toString()}`));
      return res;
    },
  });
}

export function useLowStock(args: { companyId: string; threshold?: number; page?: number; limit?: number }) {
  const { companyId, threshold, page = 1, limit = 20 } = args;
  return useQuery({
    queryKey: ["companies", companyId, "inventory", "low-stock", { threshold, page, limit }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (threshold !== undefined) qs.set("threshold", String(threshold));
      const res = await apiClient.get<Product[]>(
        companyPath(companyId, `/inventory/low-stock?${qs.toString()}`),
      );
      return res;
    },
  });
}

export function useCategories(args: { companyId: string }) {
  const { companyId } = args;
  return useQuery({
    queryKey: ["companies", companyId, "categories"],
    queryFn: async () => {
      // Categories API is a slightly different envelope: { ok: true, data: Category[] }
      const res = await apiClient.get<{ ok: true; data: Category[] }>(
        companyPath(companyId, `/categories`),
      );
      return res;
    },
  });
}
