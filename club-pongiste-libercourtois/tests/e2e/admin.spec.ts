import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// Safety guard — CRUD tests must never run against production
// ---------------------------------------------------------------------------

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
if (
  process.env.E2E_ADMIN_PASSWORD &&
  !baseURL.includes("localhost") &&
  !baseURL.includes("127.0.0.1")
) {
  throw new Error(
    `CRUD tests with E2E_ADMIN_PASSWORD must not run against a remote URL (${baseURL}). ` +
      "Use PLAYWRIGHT_BASE_URL=http://localhost:... or unset E2E_ADMIN_PASSWORD.",
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const adminUser = process.env.E2E_ADMIN_USER ?? "admin";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "";

function basicAuthHeader(user: string, pass: string) {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

// ---------------------------------------------------------------------------
// Protection des routes (sans auth)
// ---------------------------------------------------------------------------

test.describe("Admin — protection des routes", () => {
  test("redirige /admin hors de la page admin si non authentifié", async ({
    page,
  }) => {
    // Ignore les erreurs de redirect vers Authentik (non disponible en test)
    page.on("pageerror", () => {});
    try {
      await page.goto("/admin", { waitUntil: "commit", timeout: 5000 });
    } catch {
      // navigation error intentionally ignored — redirect to Authentik SSO
    }
    await expect(page).not.toHaveURL(/^http:\/\/localhost:\d+\/admin$/);
  });

  test("redirige /admin/faq hors de la page admin si non authentifié", async ({
    page,
  }) => {
    page.on("pageerror", () => {});
    try {
      await page.goto("/admin/faq", { waitUntil: "commit", timeout: 5000 });
    } catch {
      // navigation error intentionally ignored — redirect to Authentik SSO
    }
    // La page doit être redirigée vers le login (pas rester sur /admin/faq)
    const url = page.url();
    const pathname = new URL(url).pathname;
    expect(pathname).not.toBe("/admin/faq");
  });
});

// ---------------------------------------------------------------------------
// API — accès non authentifié
// ---------------------------------------------------------------------------

test.describe("Admin — API protection", () => {
  test("GET /api/admin/faqs → 401 sans auth", async ({ request }) => {
    const response = await request.get("/api/admin/faqs");
    expect(response.status()).toBe(401);
  });

  test("POST /api/admin/faqs → 401 sans auth", async ({ request }) => {
    const response = await request.post("/api/admin/faqs", {
      data: { question: "test", answer: "test", category: "general", order: 1 },
    });
    expect(response.status()).toBe(401);
  });

  test("GET /api/admin/events → 401 sans auth", async ({ request }) => {
    const response = await request.get("/api/admin/events");
    expect(response.status()).toBe(401);
  });

  test("GET /api/admin/config → 401 sans auth", async ({ request }) => {
    const response = await request.get("/api/admin/config");
    expect(response.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// API — accès public
// ---------------------------------------------------------------------------

test.describe("Admin — API publique accessible", () => {
  test("GET /api/club/faq → 200", async ({ request }) => {
    const response = await request.get("/api/club/faq");
    expect(response.status()).toBe(200);
  });

  test("GET /api/events/upcoming → 200", async ({ request }) => {
    const response = await request.get("/api/events/upcoming");
    expect(response.status()).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Page de connexion
// ---------------------------------------------------------------------------

test.describe("Admin — page login", () => {
  test("affiche la page de connexion", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator("h1")).toContainText(/Accès administration/i);
  });

  test("affiche le bouton SSO Authentik", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(
      page.getByRole("button", { name: /Authentik/i }),
    ).toBeVisible();
  });

  test("affiche le champ mot de passe fallback", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test("mot de passe incorrect → message d'erreur", async ({ page }) => {
    test.setTimeout(20_000);
    await page.goto("/admin/login");
    await page.waitForLoadState("networkidle");
    await page.locator('input[type="password"]').fill("mauvais-mot-de-passe");
    await page.locator('button[type="submit"]').click();
    // Un message d'erreur doit apparaître (Nuxt UI v4: UFormField error → <div data-slot="error">)
    await expect(
      page
        .locator("[data-slot='error'], p")
        .filter({ hasText: /incorrect|invalide|erreur|configuré|requis/i }),
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ---------------------------------------------------------------------------
// CRUD FAQ via API (Basic Auth) — nécessite E2E_ADMIN_PASSWORD
// ---------------------------------------------------------------------------

// CRUD tests run serially and only in chromium to avoid cross-browser data races
test.describe.serial("Admin — CRUD FAQ via API", () => {
  test.skip(!adminPassword, "Définir E2E_ADMIN_PASSWORD pour lancer ces tests");
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "chromium", "CRUD tests run only in Chromium");
  });

  const authHeaders = () => ({
    Authorization: basicAuthHeader(adminUser, adminPassword),
  });

  let createdFaqId: number;

  // Cleanup garanti même si les tests échouent
  test.afterAll(async ({ request }) => {
    if (createdFaqId) {
      await request
        .delete(`/api/admin/faqs/${createdFaqId}`, { headers: authHeaders() })
        .catch(() => {});
    }
  });

  test("authentification Basic Auth → 200", async ({ request }) => {
    const response = await request.get("/api/admin/faqs", {
      headers: authHeaders(),
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("créer une FAQ → 201", async ({ request }) => {
    const response = await request.post("/api/admin/faqs", {
      headers: authHeaders(),
      data: {
        question: "[E2E TEST] Comment s'inscrire au club ?",
        answer: "Contactez-nous via le formulaire de contact sur le site.",
        category: "e2e-test",
        isPopular: false,
        order: 999,
      },
    });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty("id");
    createdFaqId = body.id;
  });

  test("la FAQ créée apparaît dans la liste", async ({ request }) => {
    test.skip(!createdFaqId, "FAQ non créée dans le test précédent");
    const response = await request.get("/api/admin/faqs", {
      headers: authHeaders(),
    });
    const body = await response.json();
    const found = body.data.find((f: { id: number }) => f.id === createdFaqId);
    expect(found).toBeDefined();
    expect(found.category).toBe("e2e-test");
  });

  test("modifier la FAQ → 200", async ({ request }) => {
    test.skip(!createdFaqId, "FAQ non créée dans le test précédent");
    const response = await request.patch(`/api/admin/faqs/${createdFaqId}`, {
      headers: authHeaders(),
      data: {
        question: "[E2E TEST] Question modifiée",
        answer: "Réponse modifiée.",
        category: "e2e-test",
        isPopular: false,
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.question).toBe("[E2E TEST] Question modifiée");
  });

  test("supprimer la FAQ → 200", async ({ request }) => {
    test.skip(!createdFaqId, "FAQ non créée dans le test précédent");
    const response = await request.delete(`/api/admin/faqs/${createdFaqId}`, {
      headers: authHeaders(),
    });
    expect(response.status()).toBe(200);
  });

  test("la FAQ supprimée n'est plus dans la liste", async ({ request }) => {
    test.skip(!createdFaqId, "FAQ non créée dans le test précédent");
    const response = await request.get("/api/admin/faqs", {
      headers: authHeaders(),
    });
    const body = await response.json();
    const found = body.data.find((f: { id: number }) => f.id === createdFaqId);
    expect(found).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// CRUD Events via API (Basic Auth) — nécessite E2E_ADMIN_PASSWORD
// ---------------------------------------------------------------------------

test.describe.serial("Admin — CRUD Events via API", () => {
  test.skip(!adminPassword, "Définir E2E_ADMIN_PASSWORD pour lancer ces tests");
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "chromium", "CRUD tests run only in Chromium");
  });

  const authHeaders = () => ({
    Authorization: basicAuthHeader(adminUser, adminPassword),
  });

  let createdEventId: number;

  // Cleanup garanti même si les tests échouent
  test.afterAll(async ({ request }) => {
    if (createdEventId) {
      await request
        .delete(`/api/admin/events/${createdEventId}`, {
          headers: authHeaders(),
        })
        .catch(() => {});
    }
  });

  test("lister les événements → 200", async ({ request }) => {
    const response = await request.get("/api/admin/events", {
      headers: authHeaders(),
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
  });

  test("créer un événement → 200/201", async ({ request }) => {
    const startDate = new Date(Date.now() + 7 * 24 * 3600_000).toISOString();
    const response = await request.post("/api/admin/events", {
      headers: authHeaders(),
      data: {
        title: "[E2E TEST] Tournoi de test",
        slug: `e2e-test-tournoi-${Date.now()}`,
        type: "tournament",
        startDate,
        isRegistrationOpen: false,
      },
    });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty("id");
    createdEventId = body.id;
  });

  test("l'événement créé apparaît dans la liste", async ({ request }) => {
    test.skip(!createdEventId, "Événement non créé dans le test précédent");
    const response = await request.get("/api/admin/events", {
      headers: authHeaders(),
    });
    const body = await response.json();
    const found = body.data.find(
      (e: { id: number }) => e.id === createdEventId,
    );
    expect(found).toBeDefined();
    expect(found.title).toBe("[E2E TEST] Tournoi de test");
  });

  test("supprimer l'événement → 200", async ({ request }) => {
    test.skip(!createdEventId, "Événement non créé dans le test précédent");
    const response = await request.delete(
      `/api/admin/events/${createdEventId}`,
      { headers: authHeaders() },
    );
    expect(response.status()).toBe(200);
  });
});
