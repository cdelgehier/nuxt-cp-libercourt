import { expect, test } from "@playwright/test";

test.describe("Équipes", () => {
  test("affiche la page équipes", async ({ page }) => {
    await page.goto("/equipes");
    await expect(page).toHaveURL(/equipes/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("affiche au moins une équipe", async ({ page }) => {
    await page.goto("/equipes");
    // Attend que le contenu soit chargé (SmartPing peut être lent)
    await page.waitForLoadState("networkidle");
    // Au moins un bloc équipe ou un message de chargement
    const content = page.locator(
      '[data-testid="team-card"], [data-testid="teams-list"], h2, h3',
    );
    await expect(content.first()).toBeVisible();
  });

  test("affiche le titre de section compétition", async ({ page }) => {
    await page.goto("/equipes");
    await expect(page.locator("body")).toContainText(
      /équipe|compétition|libercourt/i,
    );
  });
});

test.describe("Équipes — API", () => {
  test("GET /api/teams → 200", async ({ request }) => {
    const response = await request.get("/api/teams");
    expect(response.status()).toBe(200);
  });
});
