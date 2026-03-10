import { expect, test } from "@playwright/test";

test("smoke: login → dashboard loads", async ({ page }) => {
  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;
  const companyId = process.env.E2E_COMPANY_ID ?? "00000000-0000-0000-0000-000000000001";

  test.skip(!email || !password, "Set E2E_EMAIL and E2E_PASSWORD to run this smoke test.");

  await page.goto("/login");

  // These are the common label/placeholder patterns used in our basic auth pages.
  const emailField = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i));
  const passwordField = page.getByLabel(/password/i).or(page.getByPlaceholder(/password/i));

  await emailField.fill(email!);
  await passwordField.fill(password!);

  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded" }),
    page.getByRole("button", { name: /sign in|login/i }).click(),
  ]);

  // If auth fails, we stay on /login with a next= param.
  // We allow a brief moment for the refresh session cookie to be set.
  await expect
    .poll(async () => {
      const cookies = await page.context().cookies();
      return Boolean(cookies.find((c) => c.name === "refresh_token"));
    })
    .toBe(true);

  // Explicitly navigate to a company dashboard page to validate session cookies.
  await page.goto(`/c/${companyId}/dashboard`, { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveURL(/\/login(\?|$)/);
  await expect(page).toHaveURL(new RegExp(`/c/${companyId}/dashboard`));
  await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible();
});
