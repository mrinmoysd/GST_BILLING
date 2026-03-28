import { expect, test } from "@playwright/test";

async function login(page: import("@playwright/test").Page) {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to run e2e tests.");

  await page.goto("/login");

  const emailField = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
  const passwordField = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));

  await emailField.fill(email!);
  await passwordField.fill(password!);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.getByRole("button", { name: /sign in|login/i }).click(),
  ]);

  await expect
    .poll(async () => {
      const cookies = await page.context().cookies();
      return Boolean(cookies.find((c) => c.name === "refresh_token"));
    })
    .toBe(true);
}

test("reports: hub and business report pages render", async ({ page }) => {
  const companyId = process.env.E2E_COMPANY_ID ?? "11111111-1111-4111-8111-111111111111";

  await login(page);

  await page.goto(`/c/${companyId}/reports`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /^reports$/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /sales summary/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /gst compliance center/i })).toBeVisible();

  await page.goto(`/c/${companyId}/reports/sales-summary`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /sales summary/i })).toBeVisible();
  await expect(page.getByText(/collection performance/i)).toBeVisible();

  await page.goto(`/c/${companyId}/reports/top-products`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /top products/i })).toBeVisible();
});

test("reports: gst and accounting report pages render", async ({ page }) => {
  const companyId = process.env.E2E_COMPANY_ID ?? "11111111-1111-4111-8111-111111111111";

  await login(page);

  await page.goto(`/c/${companyId}/reports/gst/gstr1`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /gst compliance center/i })).toBeVisible();
  await expect(page.getByText(/current view summary/i)).toBeVisible();

  await page.goto(`/c/${companyId}/accounting/reports/trial-balance`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /trial balance/i })).toBeVisible();

  await page.goto(`/c/${companyId}/accounting/reports/profit-loss`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /profit & loss/i })).toBeVisible();

  await page.goto(`/c/${companyId}/accounting/reports/balance-sheet`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /balance sheet/i })).toBeVisible();
});
