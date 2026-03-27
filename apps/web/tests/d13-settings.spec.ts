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

test("d13 settings surfaces render for migrations, print templates, and integrations", async ({ page }) => {
  const companyId =
    process.env.E2E_COMPANY_ID ?? "00000000-0000-0000-0000-000000000001";

  await login(page);

  await page.goto(`/c/${companyId}/settings/migrations`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /migrations/i })).toBeVisible();
  await expect(page.getByText(/create migration project/i)).toBeVisible();

  await page.goto(`/c/${companyId}/settings/print-templates`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /print templates/i })).toBeVisible();
  await expect(page.getByText(/template library/i)).toBeVisible();

  await page.goto(`/c/${companyId}/settings/integrations`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /integrations/i })).toBeVisible();
  await expect(page.getByText(/create webhook endpoint/i)).toBeVisible();
  await expect(page.getByText(/api key list/i)).toBeVisible();
});
