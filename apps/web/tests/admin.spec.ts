import { expect, test } from "@playwright/test";

async function loginAdmin(page: import("@playwright/test").Page) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  test.skip(!email || !password, "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD to run admin e2e tests.");

  await page.goto("/admin/login");

  const emailField = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
  const passwordField = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));

  await emailField.fill(email!);
  await passwordField.fill(password!);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.getByRole("button", { name: /sign in|login/i }).click(),
  ]);

  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

test("admin: dashboard and governance routes render", async ({ page }) => {
  await loginAdmin(page);

  await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /companies/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /internal users/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /audit logs/i })).toBeVisible();

  await page.goto("/admin/internal-users", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /internal users/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /operator directory/i })).toBeVisible();

  await page.goto("/admin/audit-logs", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /audit logs/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /privileged action history/i })).toBeVisible();
});

test("admin: company, subscription, support, and queue routes render", async ({ page }) => {
  await loginAdmin(page);

  await page.goto("/admin/companies", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /companies/i })).toBeVisible();

  await page.goto("/admin/subscriptions", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /subscriptions/i })).toBeVisible();

  await page.goto("/admin/support-tickets", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /support tickets/i })).toBeVisible();

  await page.goto("/admin/queues", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /^queues$/i })).toBeVisible();
});
