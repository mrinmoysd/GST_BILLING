import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to run e2e tests.");

  await page.goto("/login");
  await page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).fill(email!);
  await page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i)).fill(password!);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.getByRole("button", { name: /sign in|login/i }).click(),
  ]);
}

test("distributor v2: operational routes render with seeded surfaces", async ({ page }) => {
  const companyId =
    process.env.E2E_COMPANY_ID ?? "11111111-1111-4111-8111-111111111111";

  await login(page);

  await page.goto(`/c/${companyId}/sales/quotations`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /quotations/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /new quotation/i })).toBeVisible();

  await page.goto(`/c/${companyId}/sales/orders`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /sales orders/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /new sales order/i })).toBeVisible();

  await page.goto(`/c/${companyId}/inventory/warehouses`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /warehouses/i })).toBeVisible();
  await expect(page.getByText(/warehouse stock view/i)).toBeVisible();

  await page.goto(`/c/${companyId}/inventory/transfers`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /stock transfers/i })).toBeVisible();
  await expect(page.getByText(/create stock transfer/i)).toBeVisible();

  await page.goto(`/c/${companyId}/reports/distributor/sales-team`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /sales team performance/i })).toBeVisible();
  await expect(page.getByText(/sales ownership/i)).toBeVisible();

  await page.goto(`/c/${companyId}/reports/distributor/analytics`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /operational distributor analytics/i })).toBeVisible();
  await expect(page.getByText(/warehouse stock snapshot/i)).toBeVisible();
});
