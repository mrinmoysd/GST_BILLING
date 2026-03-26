"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";
import type { Customer, Paginated, Product, Supplier } from "@/lib/masters/types";

type Category = {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Warehouse = {
  id: string;
  name: string;
  code: string;
  locationLabel?: string | null;
  location_label?: string | null;
  isDefault?: boolean;
  is_default?: boolean;
  isActive?: boolean;
  is_active?: boolean;
};

export type StockTransfer = {
  id: string;
  transferNumber?: string | null;
  transfer_number?: string | null;
  status?: string | null;
  transferDate?: string | null;
  transfer_date?: string | null;
  fromWarehouse?: Warehouse | null;
  from_warehouse?: Warehouse | null;
  toWarehouse?: Warehouse | null;
  to_warehouse?: Warehouse | null;
  items?: Array<{
    id: string;
    quantity: string | number;
    product?: { id: string; name?: string | null; sku?: string | null };
  }>;
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
    mutationFn: async (body: {
      name: string;
      email?: string;
      phone?: string;
      salesperson_user_id?: string;
      pricing_tier?: string;
      credit_limit?: string;
      credit_days?: number;
      credit_control_mode?: string;
      credit_warning_percent?: string;
      credit_block_percent?: string;
      credit_hold?: boolean;
      credit_hold_reason?: string;
      credit_override_until?: string;
      credit_override_reason?: string;
    }) => {
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
    mutationFn: async (body: {
      name?: string;
      email?: string | null;
      phone?: string | null;
      salesperson_user_id?: string | null;
      pricing_tier?: string | null;
      credit_limit?: string | null;
      credit_days?: number | null;
      credit_control_mode?: string | null;
      credit_warning_percent?: string | null;
      credit_block_percent?: string | null;
      credit_hold?: boolean;
      credit_hold_reason?: string | null;
      credit_override_until?: string | null;
      credit_override_reason?: string | null;
    }) => {
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
      costPrice?: string | number;
  gstRate?: number;
  taxRate?: number;
  reorderLevel?: string | number | null;
      batchTrackingEnabled?: boolean;
      expiryTrackingEnabled?: boolean;
      batchIssuePolicy?: "NONE" | "FIFO" | "FEFO";
      nearExpiryDays?: number | null;
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
      costPrice?: string | number | null;
  gstRate?: number | null;
  taxRate?: number | null;
      reorderLevel?: number | null;
      batchTrackingEnabled?: boolean;
      expiryTrackingEnabled?: boolean;
      batchIssuePolicy?: "NONE" | "FIFO" | "FEFO";
      nearExpiryDays?: number | null;
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
        {
          change_qty: body.changeQty,
          reason: body.note,
        },
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

export function useInventoryAdjustment(args: { companyId: string }) {
  const qc = useQueryClient();
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "inventory", "stock-adjustment"],
    mutationFn: async (body: {
      productId: string;
      changeQty: number;
      note?: string;
      warehouseId?: string;
    }) => {
      const res = await apiClient.post<{ ok: true }>(
        companyPath(companyId, `/products/${body.productId}/stock-adjustment`),
        {
          change_qty: body.changeQty,
          reason: body.note,
          warehouse_id: body.warehouseId,
        },
      );
      return res;
    },
    onSuccess: async (_res, vars) => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "products"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "products", vars.productId] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "stock-movements"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "inventory"] });
    },
  });
}

export function useStockMovements(args: {
  companyId: string;
  productId?: string;
  warehouseId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) {
  const { companyId, productId, warehouseId, from, to, page = 1, limit = 20 } = args;
  return useQuery({
    queryKey: ["companies", companyId, "stock-movements", { productId, warehouseId, from, to, page, limit }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (productId) qs.set("product_id", productId);
      if (warehouseId) qs.set("warehouse_id", warehouseId);
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const res = await apiClient.get<{
        data: Array<{
          id: string;
          productId: string;
          warehouseId?: string | null;
          changeQty: string;
          balanceQty: string;
          sourceType: string;
          sourceId: string | null;
          note: string | null;
          createdAt: string;
          product?: { id: string; name?: string | null; sku?: string | null };
          warehouse?: { id: string; name?: string | null; code?: string | null } | null;
        }>;
        meta: { total: number; page: number; limit: number };
      }>(companyPath(companyId, `/stock-movements?${qs.toString()}`));
      return res;
    },
  });
}

export function useLowStock(args: { companyId: string; threshold?: number; page?: number; limit?: number; enabled?: boolean }) {
  const { companyId, threshold, page = 1, limit = 20, enabled = true } = args;
  return useQuery({
    enabled,
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
      const res = await apiClient.get<{ ok?: true; data?: Category[] } | Category[]>(
        companyPath(companyId, `/categories`),
      );

      const payload = res.data as { ok?: true; data?: Category[] } | Category[];
      if (Array.isArray(payload)) return payload;
      return Array.isArray(payload?.data) ? payload.data : [];
    },
  });
}

export function useWarehouses(args: {
  companyId: string;
  page?: number;
  limit?: number;
  q?: string;
  activeOnly?: boolean;
}) {
  const { companyId, page = 1, limit = 50, q, activeOnly = false } = args;
  return useQuery({
    queryKey: ["companies", companyId, "warehouses", { page, limit, q, activeOnly }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (q) qs.set("q", q);
      if (activeOnly) qs.set("active_only", "true");
      return apiClient.get<Paginated<Warehouse>>(
        companyPath(companyId, `/warehouses?${qs.toString()}`),
      );
    },
  });
}

export function useCreateWarehouse(args: { companyId: string }) {
  const qc = useQueryClient();
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "warehouses", "create"],
    mutationFn: async (body: {
      name: string;
      code: string;
      location_label?: string;
      is_default?: boolean;
    }) => {
      return apiClient.post<Warehouse>(companyPath(companyId, "/warehouses"), body);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "warehouses"] });
    },
  });
}

export function useUpdateWarehouse(args: { companyId: string; warehouseId: string }) {
  const qc = useQueryClient();
  const { companyId, warehouseId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "warehouses", warehouseId, "update"],
    mutationFn: async (body: {
      name?: string;
      code?: string;
      location_label?: string | null;
      is_default?: boolean;
      is_active?: boolean;
    }) => {
      return apiClient.patch<Warehouse>(
        companyPath(companyId, `/warehouses/${warehouseId}`),
        body,
      );
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "warehouses"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "warehouse-stock", warehouseId] });
    },
  });
}

export function useWarehouseStock(args: {
  companyId: string;
  warehouseId: string;
  q?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const { companyId, warehouseId, q, page = 1, limit = 50, enabled = true } = args;
  return useQuery({
    enabled: enabled && Boolean(warehouseId),
    queryKey: ["companies", companyId, "warehouse-stock", warehouseId, { q, page, limit }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (q) qs.set("q", q);
      return apiClient.get<{
        data: Array<{
          quantity: string | number;
          product: Product;
        }>;
        warehouse: Warehouse;
        meta: { total: number; page: number; limit: number };
      }>(companyPath(companyId, `/warehouses/${warehouseId}/stock?${qs.toString()}`));
    },
  });
}

export function useBatchStock(args: {
  companyId: string;
  warehouseId?: string;
  productId?: string;
  nearExpiryDays?: number;
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const {
    companyId,
    warehouseId,
    productId,
    nearExpiryDays,
    page = 1,
    limit = 50,
    enabled = true,
  } = args;
  return useQuery({
    enabled,
    queryKey: [
      "companies",
      companyId,
      "inventory",
      "batches",
      { warehouseId, productId, nearExpiryDays, page, limit },
    ],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (warehouseId) qs.set("warehouse_id", warehouseId);
      if (productId) qs.set("product_id", productId);
      if (nearExpiryDays !== undefined) qs.set("near_expiry_days", String(nearExpiryDays));
      return apiClient.get<{
        data: Array<{
          quantity: string | number;
          reservedQuantity?: string | number;
          warehouse?: Warehouse | null;
          productBatch?: {
            id: string;
            batchNumber?: string | null;
            batch_number?: string | null;
            expiryDate?: string | null;
            expiry_date?: string | null;
            manufacturingDate?: string | null;
            manufacturing_date?: string | null;
            product?: Product | null;
          } | null;
        }>;
        meta: { total: number; page: number; limit: number };
      }>(companyPath(companyId, `/inventory/batches?${qs.toString()}`));
    },
  });
}

export function useStockTransfers(args: {
  companyId: string;
  page?: number;
  limit?: number;
  status?: string;
}) {
  const { companyId, page = 1, limit = 50, status } = args;
  return useQuery({
    queryKey: ["companies", companyId, "stock-transfers", { page, limit, status }],
    queryFn: async () => {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", String(limit));
      if (status) qs.set("status", status);
      return apiClient.get<Paginated<StockTransfer>>(
        companyPath(companyId, `/stock-transfers?${qs.toString()}`),
      );
    },
  });
}

export function useCreateStockTransfer(args: { companyId: string }) {
  const qc = useQueryClient();
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "stock-transfers", "create"],
    mutationFn: async (body: {
      from_warehouse_id: string;
      to_warehouse_id: string;
      transfer_date?: string;
      notes?: string;
      items: Array<{ product_id: string; quantity: string }>;
    }) => {
      return apiClient.post<StockTransfer>(
        companyPath(companyId, "/stock-transfers"),
        body,
      );
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "stock-transfers"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "stock-movements"] });
    },
  });
}

function useStockTransferAction(args: {
  companyId: string;
  transferId: string;
  action: "dispatch" | "receive" | "cancel";
}) {
  const qc = useQueryClient();
  const { companyId, transferId, action } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "stock-transfers", transferId, action],
    mutationFn: async () => {
      return apiClient.post<StockTransfer>(
        companyPath(companyId, `/stock-transfers/${transferId}/${action}`),
        {},
      );
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "stock-transfers"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "stock-movements"] });
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "warehouses"] });
    },
  });
}

export function useDispatchStockTransfer(args: { companyId: string; transferId: string }) {
  return useStockTransferAction({ ...args, action: "dispatch" });
}

export function useReceiveStockTransfer(args: { companyId: string; transferId: string }) {
  return useStockTransferAction({ ...args, action: "receive" });
}

export function useCancelStockTransfer(args: { companyId: string; transferId: string }) {
  return useStockTransferAction({ ...args, action: "cancel" });
}

export function useCreateCategory(args: { companyId: string }) {
  const qc = useQueryClient();
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "categories", "create"],
    mutationFn: async (body: { name: string; is_active?: boolean }) => {
      const res = await apiClient.post<{ ok: true; data: Category }>(
        companyPath(companyId, `/categories`),
        body,
      );
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "categories"] });
    },
  });
}

export function useDeleteCategory(args: { companyId: string }) {
  const qc = useQueryClient();
  const { companyId } = args;
  return useMutation({
    mutationKey: ["companies", companyId, "categories", "delete"],
    mutationFn: async (categoryId: string) => {
      const res = await apiClient.del<{ ok: true; data: { id: string } }>(
        companyPath(companyId, `/categories/${categoryId}`),
      );
      return res;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["companies", companyId, "categories"] });
    },
  });
}
