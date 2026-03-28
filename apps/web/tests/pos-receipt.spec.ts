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
}

test("pos: landing and billing workspace load", async ({ page }) => {
  const companyId = process.env.E2E_COMPANY_ID ?? "11111111-1111-4111-8111-111111111111";

  await login(page);

  await page.goto(`/c/${companyId}/pos`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /point of sale/i })).toBeVisible();
  await page.getByRole("button", { name: /start billing/i }).click();

  await expect(page).toHaveURL(new RegExp(`/c/${companyId}/pos/billing`));
  await expect(page.getByRole("heading", { name: /retail billing/i })).toBeVisible();
  await expect(page.getByLabel(/scan or search/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /sale summary/i })).toBeVisible();
});

test("receipt: direct receipt page renders when invoice id is provided", async ({ page }) => {
  const companyId = process.env.E2E_COMPANY_ID ?? "11111111-1111-4111-8111-111111111111";
  const invoiceId = process.env.E2E_POS_INVOICE_ID;

  test.skip(!invoiceId, "Set E2E_POS_INVOICE_ID to validate the receipt page.");

  await login(page);

  await page.goto(`/c/${companyId}/pos/receipt/${invoiceId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /receipt/i })).toBeVisible();
  await expect(page.getByText(/tax invoice/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /print receipt/i })).toBeVisible();
});
