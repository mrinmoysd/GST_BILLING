"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiClient } from "@/lib/api/client";
import { companyPath } from "@/lib/api/companyRoutes";
import { createIdempotencyKey, idempotencyHeaders } from "@/lib/api/idempotency";
import { useCustomers, useProducts } from "@/lib/masters/hooks";
import type { Customer, Product } from "@/lib/masters/types";
import { InlineError, LoadingBlock, PageHeader } from "@/lib/ui/state";
import { PrimaryButton, SecondaryButton, TextField } from "@/lib/ui/form";

type Props = { params: Promise<{ companyId: string }> };

type CartLine = {
  productId: string;
  name: string;
  sku: string | null;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discount: number;
  stock: number | null;
};

function getErrorMessage(err: unknown, fallback: string) {
  if (err && typeof err === "object" && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return fallback;
}

function toNumber(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

export default function PosBillingPage({ params }: Props) {
  const { companyId } = React.use(params);
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [customerId, setCustomerId] = React.useState("");
  const [cart, setCart] = React.useState<CartLine[]>([]);
  const [paymentMethod, setPaymentMethod] = React.useState("cash");
  const [amountReceived, setAmountReceived] = React.useState("");
  const [reference, setReference] = React.useState("");
  const [notes, setNotes] = React.useState("POS sale");
  const [error, setError] = React.useState<string | null>(null);
  const [ok, setOk] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const customersQuery = useCustomers({ companyId, limit: 50 });
  const productsQuery = useProducts({ companyId, limit: 20, q: search.trim() || undefined });
  const popularProductsQuery = useProducts({ companyId, limit: 12 });

  const customers = React.useMemo(() => ((customersQuery.data?.data ?? []) as Customer[]), [customersQuery.data?.data]);
  const searchResults = React.useMemo(() => ((productsQuery.data?.data ?? []) as Product[]), [productsQuery.data?.data]);
  const popularProducts = React.useMemo(
    () => ((popularProductsQuery.data?.data ?? []) as Product[]),
    [popularProductsQuery.data?.data],
  );

  React.useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (!customerId && customers.length > 0) {
      setCustomerId(customers[0]?.id ?? "");
    }
  }, [customerId, customers]);

  const addProduct = React.useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        return prev.map((line) =>
          line.productId === product.id
            ? {
                ...line,
                quantity: line.quantity + 1,
              }
            : line,
        );
      }

      return [
        {
          productId: product.id,
          name: product.name,
          sku: product.sku ?? null,
          quantity: 1,
          unitPrice: toNumber(product.price),
          taxRate: toNumber(product.taxRate),
          discount: 0,
          stock: product.stock === undefined || product.stock === null ? null : toNumber(product.stock),
        },
        ...prev,
      ];
    });
    setSearch("");
    requestAnimationFrame(() => searchInputRef.current?.focus());
  }, []);

  const handleSearchSubmit = React.useCallback(() => {
    const term = search.trim().toLowerCase();
    if (!term) return;

    const exact =
      searchResults.find((product) => (product.sku ?? "").toLowerCase() === term) ??
      searchResults.find((product) => product.name.toLowerCase() === term);

    if (exact) {
      addProduct(exact);
      return;
    }

    if (searchResults.length === 1) {
      addProduct(searchResults[0]!);
      return;
    }

    setError("No exact product match found. Select an item from the results list.");
  }, [addProduct, search, searchResults]);

  const subtotal = React.useMemo(
    () => cart.reduce((sum, line) => sum + Math.max(0, line.quantity * line.unitPrice - line.discount), 0),
    [cart],
  );

  const taxTotal = React.useMemo(
    () =>
      cart.reduce((sum, line) => {
        const taxable = Math.max(0, line.quantity * line.unitPrice - line.discount);
        return sum + (taxable * line.taxRate) / 100;
      }, 0),
    [cart],
  );

  const grandTotal = subtotal + taxTotal;
  const received = Number(amountReceived || grandTotal || 0);
  const balance = Math.max(0, grandTotal - received);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="POS"
        title="Retail billing"
        subtitle="Use a scan-first cart, complete the sale in one pass, and jump straight into a printable receipt."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/c/${companyId}/pos`}>
              <SecondaryButton type="button">POS home</SecondaryButton>
            </Link>
            <Link href={`/c/${companyId}/sales/invoices`}>
              <SecondaryButton type="button">Invoices</SecondaryButton>
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,248,251,0.96))]">
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Search first</Badge>
                <Badge variant="outline">Enter to add</Badge>
              </div>
              <CardTitle>Product lookup</CardTitle>
              <CardDescription>Use SKU or product name. Barcode scanners can be treated as keyboard input targeting this field.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Scan or search</label>
                  <input
                    ref={searchInputRef}
                    className="mt-2 h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-base shadow-sm"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearchSubmit();
                      }
                    }}
                    placeholder="SKU, barcode, or product name"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Customer</label>
                  <select
                    className="mt-2 h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm shadow-sm"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                  >
                    <option value="">Select customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {customersQuery.isLoading || productsQuery.isLoading ? <LoadingBlock label="Loading POS data…" /> : null}
              {error ? <InlineError message={error} /> : null}
              {ok ? <div className="text-sm text-green-700">{ok}</div> : null}

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Search results</div>
                  <div className="space-y-2">
                    {search.trim().length === 0 ? (
                      <div className="text-sm text-[var(--muted)]">Start typing to search products by SKU or name.</div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-sm text-[var(--muted)]">No products matched this search.</div>
                    ) : (
                      searchResults.map((product) => (
                        <button
                          key={product.id}
                          type="button"
                          className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3 text-left hover:bg-[var(--surface)]"
                          onClick={() => addProduct(product)}
                        >
                          <div>
                            <div className="text-sm font-medium text-[var(--foreground)]">{product.name}</div>
                            <div className="text-xs text-[var(--muted)]">{product.sku ?? "No SKU"} · Stock {toNumber(product.stock).toFixed(2)}</div>
                          </div>
                          <div className="text-right text-sm">
                            <div className="font-semibold">{toNumber(product.price).toFixed(2)}</div>
                            <div className="text-xs text-[var(--muted)]">GST {toNumber(product.taxRate).toFixed(0)}%</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Popular products</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {popularProducts.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3 text-left hover:bg-[var(--surface)]"
                        onClick={() => addProduct(product)}
                      >
                        <div className="text-sm font-medium text-[var(--foreground)]">{product.name}</div>
                        <div className="mt-1 text-xs text-[var(--muted)]">{product.sku ?? "No SKU"}</div>
                        <div className="mt-2 text-sm font-semibold">{toNumber(product.price).toFixed(2)}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cart</CardTitle>
              <CardDescription>Adjust quantities, prices, and discounts before completing the sale.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-8 text-sm text-[var(--muted)]">
                  No items in cart. Scan a barcode or pick a product from the lists above.
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((line) => {
                    const taxable = Math.max(0, line.quantity * line.unitPrice - line.discount);
                    const lineTax = (taxable * line.taxRate) / 100;
                    const lineTotal = taxable + lineTax;

                    return (
                      <div key={line.productId} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-[var(--foreground)]">{line.name}</div>
                            <div className="text-xs text-[var(--muted)]">{line.sku ?? "No SKU"}{line.stock !== null ? ` · Stock ${line.stock.toFixed(2)}` : ""}</div>
                          </div>
                          <button
                            type="button"
                            className="text-sm font-medium text-[var(--danger)] underline"
                            onClick={() => setCart((prev) => prev.filter((item) => item.productId !== line.productId))}
                          >
                            Remove
                          </button>
                        </div>

                        <div className="mt-4 grid gap-3 md:grid-cols-4">
                          <TextField
                            label="Qty"
                            value={String(line.quantity)}
                            onChange={(value) =>
                              setCart((prev) =>
                                prev.map((item) =>
                                  item.productId === line.productId
                                    ? { ...item, quantity: Math.max(1, Number(value || 1)) }
                                    : item,
                                ),
                              )
                            }
                          />
                          <TextField
                            label="Unit price"
                            value={String(line.unitPrice)}
                            onChange={(value) =>
                              setCart((prev) =>
                                prev.map((item) =>
                                  item.productId === line.productId
                                    ? { ...item, unitPrice: Math.max(0, Number(value || 0)) }
                                    : item,
                                ),
                              )
                            }
                          />
                          <TextField
                            label="Discount"
                            value={String(line.discount)}
                            onChange={(value) =>
                              setCart((prev) =>
                                prev.map((item) =>
                                  item.productId === line.productId
                                    ? { ...item, discount: Math.max(0, Number(value || 0)) }
                                    : item,
                                ),
                              )
                            }
                          />
                          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Line total</div>
                            <div className="mt-2 text-lg font-semibold text-[var(--foreground)]">{lineTotal.toFixed(2)}</div>
                            <div className="mt-1 text-xs text-[var(--muted)]">GST {lineTax.toFixed(2)}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-24">
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{cart.length} items</Badge>
                <Badge variant="outline">{paymentMethod.toUpperCase()}</Badge>
              </div>
              <CardTitle>Sale summary</CardTitle>
              <CardDescription>Complete the transaction, post the payment, and open the receipt immediately.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Sub-total</div>
                  <div className="mt-2 text-2xl font-semibold">{subtotal.toFixed(2)}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">GST</div>
                  <div className="mt-2 text-2xl font-semibold">{taxTotal.toFixed(2)}</div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">Grand total</div>
                  <div className="mt-2 text-3xl font-semibold">{grandTotal.toFixed(2)}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[13px] font-semibold text-[var(--muted-strong)]">Payment method</label>
                  <select
                    className="mt-2 h-11 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm shadow-sm"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank</option>
                  </select>
                </div>
                <TextField
                  label="Amount received"
                  value={amountReceived}
                  onChange={setAmountReceived}
                  placeholder={grandTotal ? grandTotal.toFixed(2) : "0.00"}
                />
                <TextField label="Reference" value={reference} onChange={setReference} placeholder="Optional" />
                <TextField label="Notes" value={notes} onChange={setNotes} placeholder="Optional" />
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[var(--muted)]">Outstanding after payment</span>
                    <span className="font-semibold text-[var(--foreground)]">{balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <PrimaryButton
                  type="button"
                  className="w-full"
                  disabled={submitting || cart.length === 0}
                  onClick={async () => {
                    setError(null);
                    setOk(null);

                    if (!customerId) {
                      setError("Select a customer before completing the sale.");
                      return;
                    }

                    if (cart.length === 0) {
                      setError("Add at least one product to the cart.");
                      return;
                    }

                    try {
                      setSubmitting(true);
                      const issueDate = new Date().toISOString().slice(0, 10);
                      const createRes = await apiClient.post<{ id: string }>(
                        companyPath(companyId, "/invoices"),
                        {
                          customer_id: customerId,
                          issue_date: issueDate,
                          notes: notes.trim() || "POS sale",
                          items: cart.map((line) => ({
                            product_id: line.productId,
                            quantity: String(line.quantity),
                            unit_price: String(line.unitPrice),
                            discount: line.discount ? String(line.discount) : undefined,
                          })),
                        },
                        idempotencyHeaders(createIdempotencyKey("pos_sale")),
                      );

                      const invoiceId = createRes.data.id;

                      await apiClient.post(companyPath(companyId, `/invoices/${invoiceId}/issue`), {
                        series_code: "DEFAULT",
                      });

                      const paymentAmount = received > 0 ? Math.min(received, grandTotal) : grandTotal;
                      if (paymentAmount > 0) {
                        await apiClient.post(companyPath(companyId, "/payments"), {
                          invoice_id: invoiceId,
                          amount: String(paymentAmount.toFixed(2)),
                          method: paymentMethod,
                          reference: reference.trim() || undefined,
                          payment_date: issueDate,
                        });
                      }

                      setOk("Sale completed.");
                      router.replace(`/c/${companyId}/pos/receipt/${invoiceId}?print=1`);
                    } catch (e: unknown) {
                      setError(getErrorMessage(e, "Failed to complete sale"));
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                >
                  {submitting ? "Completing sale…" : "Complete sale"}
                </PrimaryButton>
                <SecondaryButton
                  type="button"
                  className="w-full"
                  onClick={() => {
                    setCart([]);
                    setSearch("");
                    setAmountReceived("");
                    setReference("");
                    setNotes("POS sale");
                    setError(null);
                    setOk(null);
                    requestAnimationFrame(() => searchInputRef.current?.focus());
                  }}
                >
                  Clear cart
                </SecondaryButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
