import type { Product } from "@/lib/masters/types";

export const COMMON_PRODUCT_UNITS = [
  "pcs",
  "pack",
  "packet",
  "box",
  "bottle",
  "bag",
  "strip",
  "dozen",
  "pair",
  "g",
  "kg",
  "ml",
  "l",
  "m",
] as const;

export function formatUnitLabel(unit?: string | null) {
  return unit?.trim() ? unit.trim() : "No unit";
}

export function formatProductOptionLabel(product: Pick<Product, "name" | "sku" | "unit">) {
  const unit = product.unit?.trim();
  const sku = product.sku?.trim();
  if (unit && sku) return `${product.name} (${unit}) • ${sku}`;
  if (unit) return `${product.name} (${unit})`;
  if (sku) return `${product.name} • ${sku}`;
  return product.name;
}

export function formatQuantityWithUnit(
  quantity: string | number | null | undefined,
  unit?: string | null,
) {
  const qty = quantity ?? "0";
  return unit?.trim() ? `${qty} ${unit.trim()}` : String(qty);
}
