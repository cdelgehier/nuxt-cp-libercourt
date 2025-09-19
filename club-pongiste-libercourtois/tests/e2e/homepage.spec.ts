import { test, expect } from "@playwright/test";

test("homepage loads and displays key elements", async ({ page }) => {
  // Navigate to homepage
  await page.goto("/");

  // Check that the page loads properly
  await expect(page).toHaveTitle(/Club Pongiste Libercourtois/);

  // Check hero section is visible
  await expect(page.locator("h1")).toContainText("Club Pongiste");
  await expect(page.locator("h1")).toContainText("Libercourtois");

  // Check main call-to-action buttons are present
  await expect(
    page.getByRole("link", { name: /nous rejoindre/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /découvrir le club/i }),
  ).toBeVisible();

  // Check activities section
  await expect(page.locator("h2")).toContainText("Nos Activités");

  // Check upcoming events section
  await expect(page.locator("h2")).toContainText("Prochains Événements");
});

test("navigation works correctly", async ({ page }) => {
  await page.goto("/");

  // Test navigation to club page
  await page.getByRole("link", { name: /découvrir le club/i }).click();
  await expect(page).toHaveURL(/.*\/club/);

  // Go back and test contact navigation
  await page.goto("/");
  await page.getByRole("link", { name: /nous rejoindre/i }).click();
  await expect(page).toHaveURL(/.*\/contact/);
});
