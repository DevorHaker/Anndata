import { test, expect } from "@playwright/test";

test.describe("SmartProcure Foundation Smoke Test", () => {
  test("frontend loads and displays system overview", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SmartProcure/i);
    await expect(
      page.getByText("SmartProcure — Farm Gate to Payment"),
    ).toBeVisible();
    await expect(page.getByText("End-to-End Product Journey")).toBeVisible();
  });

  test("health page displays backend readiness diagnostics", async ({
    page,
  }) => {
    await page.goto("/health");
    await expect(
      page.getByText("System Health & Dependency Readiness"),
    ).toBeVisible();
  });
});
