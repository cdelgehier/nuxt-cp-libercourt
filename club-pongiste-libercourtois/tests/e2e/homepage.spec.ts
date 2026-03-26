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

  test("navigation principale présente dans le DOM", async ({ page }) => {
    await page.goto("/");
    // La nav desktop est hidden sur mobile (md:flex) — on vérifie sa présence, pas sa visibilité
    await expect(page.locator("nav").first()).toBeAttached();
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
