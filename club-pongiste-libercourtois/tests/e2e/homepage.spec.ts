import { expect, test } from "@playwright/test";

test.describe("Homepage", () => {
  test("affiche le titre du club", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Club Pongiste Libercourtois/i);
  });

  test("affiche la section héro", async ({ page }) => {
    await page.goto("/");
    const hero = page
      .locator('[data-testid="hero-section"]')
      .or(page.locator("h1"));
    await expect(hero.first()).toBeVisible();
  });

  test("navigation principale visible", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("nav")).toBeVisible();
  });

  test("lien vers les équipes fonctionne", async ({ page }) => {
    await page.goto("/");
    const teamsLink = page.getByRole("link", { name: /équipes/i });
    if ((await teamsLink.count()) > 0) {
      await teamsLink.first().click();
      await expect(page).toHaveURL(/equipes/);
    }
  });
});
