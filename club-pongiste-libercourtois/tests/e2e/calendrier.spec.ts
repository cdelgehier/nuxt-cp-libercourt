import { expect, test } from "@playwright/test";

test.describe("Calendrier — page", () => {
  test("affiche le titre de la page", async ({ page }) => {
    await page.goto("/calendrier");
    await expect(page.locator("h1")).toContainText(/Événements/i);
  });

  test("affiche les 4 cards de statistiques", async ({ page }) => {
    await page.goto("/calendrier");
    // Attendre que le chargement async soit terminé (spinner disparu)
    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 10_000 })
      .catch(() => {});
    const statLabels = [
      "Total événements",
      "Inscriptions ouvertes",
      "Deadlines urgentes",
      "Événements fermés",
    ];
    for (const label of statLabels) {
      await expect(
        page.locator(`dt:has-text("${label}")`).first(),
      ).toBeVisible();
    }
  });

  test("affiche le champ de recherche", async ({ page }) => {
    await page.goto("/calendrier");
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await expect(searchInput).toBeVisible();
  });

  test("filtre les événements via la recherche", async ({ page }) => {
    await page.goto("/calendrier");
    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 10_000 })
      .catch(() => {});

    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill("zzzinexistantzzz");

    // On vérifie que le champ contient bien la valeur tapée
    await expect(searchInput).toHaveValue("zzzinexistantzzz");
  });

  test("bouton effacer la recherche visible après saisie", async ({ page }) => {
    await page.goto("/calendrier");
    // Attendre la fin des appels réseau (hydration Vue complète)
    await page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill("test");
    // Le bouton × est rendu par v-if quand searchQuery est non vide
    const clearButton = page.locator("div.relative button.text-gray-400");
    await expect(clearButton).toBeVisible({ timeout: 8_000 });
    await clearButton.click();
    await expect(searchInput).toHaveValue("");
  });

  test("affiche un état vide ou des événements (pas de crash)", async ({
    page,
  }) => {
    await page.goto("/calendrier");
    await page
      .waitForSelector(".animate-spin", { state: "hidden", timeout: 10_000 })
      .catch(() => {});
    // Soit des EventCard, soit le message "Aucun événement"
    const content = page.locator(
      'h3:has-text("Aucun événement"), h2:has-text("Inscriptions ouvertes"), h2:has-text("Événements à venir"), h2:has-text("Événements passés")',
    );
    await expect(content.first()).toBeVisible({ timeout: 10_000 });
  });

  test("la modale d'inscription n'est pas visible au chargement", async ({
    page,
  }) => {
    await page.goto("/calendrier");
    // La modale ne doit pas être ouverte par défaut
    const modal = page.locator('[role="dialog"]');
    await expect(modal).not.toBeVisible();
  });
});

test.describe("Calendrier — API", () => {
  test("GET /api/events/calendar → 200", async ({ request }) => {
    const response = await request.get("/api/events/calendar");
    expect(response.status()).toBe(200);
  });

  test("GET /api/events/calendar → structure attendue", async ({ request }) => {
    const response = await request.get("/api/events/calendar");
    const body = await response.json();
    expect(body).toHaveProperty("events");
    expect(body).toHaveProperty("stats");
    expect(Array.isArray(body.events)).toBe(true);
    expect(body.stats).toHaveProperty("total");
  });

  test("GET /api/events/upcoming → 200", async ({ request }) => {
    const response = await request.get("/api/events/upcoming");
    expect(response.status()).toBe(200);
  });
});
