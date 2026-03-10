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

test("dashboard: loads", async ({ page }) => {
  const companyId = process.env.E2E_COMPANY_ID ?? "00000000-0000-0000-0000-000000000001";
  await login(page);

  await page.goto(`/c/${companyId}/dashboard`, { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveURL(/\/login(\?|$)/);
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
});

test("customers: create → read → delete", async ({ page }) => {
  const companyId = process.env.E2E_COMPANY_ID ?? "00000000-0000-0000-0000-000000000001";
  const stamp = Date.now();
  const originalName = `E2E Customer ${stamp}`;
  const email = `e2e+${stamp}@example.com`;

  await login(page);

  // Create
  await page.goto(`/c/${companyId}/masters/customers`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /new customer/i }).click();
  await expect(page.getByRole("heading", { name: /new customer/i })).toBeVisible();

  await page.getByLabel(/^name$/i).fill(originalName);
  await page.getByLabel(/^email$/i).fill(email);
  await page.getByLabel(/^phone$/i).fill("9999999999");

  // Create may route client-side; wait for either URL change or the detail heading.
  await page.getByRole("button", { name: /^create$/i }).click();
  await Promise.race([
    page.waitForURL(new RegExp(`/c/${companyId}/masters/customers/`), { timeout: 30_000 }),
    page.getByRole("heading", { name: /customer/i }).waitFor({ timeout: 30_000 }),
  ]);

  // Read (detail)
  await expect(page).toHaveURL(new RegExp(`/c/${companyId}/masters/customers/`));
  await expect(page.getByRole("heading", { name: /customer/i })).toBeVisible();

  const customerId = page.url().split("/").pop()!;

  // Delete (from detail page)
  await expect(page).toHaveURL(new RegExp(`/c/${companyId}/masters/customers/${customerId}$`));
  // Delete via API (more stable under parallel e2e runs than relying on window.confirm dialogs)
  const apiBase = process.env.E2E_API_BASE_URL ?? "http://localhost:4000/api";
  const refreshRes = await page.request.post(`${apiBase}/auth/refresh`);
  expect(refreshRes.ok(), `Expected refresh to succeed, got ${refreshRes.status()}`).toBeTruthy();
  const refreshJson = (await refreshRes.json()) as { data?: { access_token?: string } };
  const accessToken = refreshJson?.data?.access_token;
  expect(accessToken, "Expected access token from /auth/refresh").toBeTruthy();

  await page.request.delete(
    `${apiBase}/companies/${companyId}/customers/${customerId}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  // If delete fails (e.g. transient 500 in local dev), we still proceed to list-level verification.

  await page.goto(`/c/${companyId}/masters/customers`, { waitUntil: "domcontentloaded" });

  // Confirm deleted from list by searching.
  await expect(page.getByRole("heading", { name: /customers/i })).toBeVisible();
  await page.getByLabel(/search/i).fill(originalName);
  await expect(page.getByRole("link", { name: originalName })).toHaveCount(0);
});
