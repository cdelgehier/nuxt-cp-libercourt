import { expect, test } from "@playwright/test";

// ---------------------------------------------------------------------------
// Safety guard
// ---------------------------------------------------------------------------

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
if (
  process.env.E2E_ADMIN_PASSWORD &&
  !baseURL.includes("localhost") &&
  !baseURL.includes("127.0.0.1")
) {
  throw new Error(
    `CRUD tests with E2E_ADMIN_PASSWORD must not run against a remote URL (${baseURL}).`,
  );
}

const adminUser = process.env.E2E_ADMIN_USER ?? "admin";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "";

function basicAuthHeader(user: string, pass: string) {
  return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
}

// ---------------------------------------------------------------------------
// API — accès non authentifié
// ---------------------------------------------------------------------------

test.describe("Tournois — API protection", () => {
  test("GET /api/admin/tournois → 401 sans auth", async ({ request }) => {
    const response = await request.get("/api/admin/tournois");
    expect(response.status()).toBe(401);
  });

  test("POST /api/admin/tournois → 401 sans auth", async ({ request }) => {
    const response = await request.post("/api/admin/tournois", {
      data: { name: "Test", date: "2025-06-15" },
    });
    expect(response.status()).toBe(401);
  });

  test("PATCH /api/admin/tournois/inexistant → 401 sans auth", async ({
    request,
  }) => {
    const response = await request.patch("/api/admin/tournois/inexistant", {
      data: { name: "Test" },
    });
    expect(response.status()).toBe(401);
  });

  test("DELETE /api/admin/tournois/inexistant → 401 sans auth", async ({
    request,
  }) => {
    const response = await request.delete("/api/admin/tournois/inexistant");
    expect(response.status()).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// API — accès public
// ---------------------------------------------------------------------------

test.describe("Tournois — API publique", () => {
  test("GET /api/tournois → 200 et tableau", async ({ request }) => {
    const response = await request.get("/api/tournois");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Page publique
// ---------------------------------------------------------------------------

test.describe("Tournois — page publique", () => {
  test("affiche la page /tournois", async ({ page }) => {
    await page.goto("/tournois");
    await expect(page.locator("h1")).toContainText(/tournois/i);
  });
});

// ---------------------------------------------------------------------------
// CRUD Tournois via API (Basic Auth) — nécessite E2E_ADMIN_PASSWORD
// ---------------------------------------------------------------------------

test.describe.serial("Tournois — CRUD via API", () => {
  test.skip(!adminPassword, "Définir E2E_ADMIN_PASSWORD pour lancer ces tests");
  test.beforeEach(({ browserName }) => {
    test.skip(browserName !== "chromium", "CRUD tests run only in Chromium");
  });

  const authHeaders = () => ({
    Authorization: basicAuthHeader(adminUser, adminPassword),
  });

  let createdSlug: string;
  let createdSeriesId: number;

  test.afterAll(async ({ request }) => {
    if (createdSlug) {
      await request
        .delete(`/api/admin/tournois/${createdSlug}`, {
          headers: authHeaders(),
        })
        .catch(() => {});
    }
  });

  // --- Tournoi ---

  test("lister les tournois → 200", async ({ request }) => {
    const response = await request.get("/api/admin/tournois", {
      headers: authHeaders(),
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test("créer un tournoi → 200/201", async ({ request }) => {
    const response = await request.post("/api/admin/tournois", {
      headers: authHeaders(),
      data: {
        name: "[E2E TEST] Tournoi e2e",
        date: "2025-06-15",
        location: "Salle e2e",
        tableCount: 4,
        isPublished: false,
      },
    });
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty("slug");
    expect(body.name).toBe("[E2E TEST] Tournoi e2e");
    createdSlug = body.slug;
  });

  test("le tournoi créé apparaît dans la liste", async ({ request }) => {
    test.skip(!createdSlug, "Tournoi non créé");
    const response = await request.get("/api/admin/tournois", {
      headers: authHeaders(),
    });
    const body = await response.json();
    const found = body.find((t: { slug: string }) => t.slug === createdSlug);
    expect(found).toBeDefined();
    expect(found.tableCount).toBe(4);
  });

  test("lire le détail du tournoi → 200", async ({ request }) => {
    test.skip(!createdSlug, "Tournoi non créé");
    const response = await request.get(`/api/admin/tournois/${createdSlug}`, {
      headers: authHeaders(),
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.slug).toBe(createdSlug);
    expect(body).toHaveProperty("series");
  });

  test("modifier le tournoi → 200", async ({ request }) => {
    test.skip(!createdSlug, "Tournoi non créé");
    const response = await request.patch(`/api/admin/tournois/${createdSlug}`, {
      headers: authHeaders(),
      data: { tableCount: 8, isPublished: false },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.tableCount).toBe(8);
  });

  test("modifier avec dateEnd (multi-jours) → 200", async ({ request }) => {
    test.skip(!createdSlug, "Tournoi non créé");
    const response = await request.patch(`/api/admin/tournois/${createdSlug}`, {
      headers: authHeaders(),
      data: { dateEnd: "2025-06-16" },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.dateEnd).toBe("2025-06-16");
  });

  // --- Séries ---

  test("créer une série → 200/201", async ({ request }) => {
    test.skip(!createdSlug, "Tournoi non créé");
    const response = await request.post(
      `/api/admin/tournois/${createdSlug}/series`,
      {
        headers: authHeaders(),
        data: {
          name: "[E2E] Simple Hommes",
          seriesFormat: "singles",
          seriesType: "standard",
          setsToWin: 3,
          pointsPerSet: 11,
        },
      },
    );
    expect([200, 201]).toContain(response.status());
    const body = await response.json();
    expect(body).toHaveProperty("id");
    expect(body.name).toBe("[E2E] Simple Hommes");
    createdSeriesId = body.id;
  });

  test("la série apparaît dans le détail du tournoi", async ({ request }) => {
    test.skip(!createdSlug || !createdSeriesId, "Tournoi/série non créés");
    const response = await request.get(`/api/admin/tournois/${createdSlug}`, {
      headers: authHeaders(),
    });
    const body = await response.json();
    const found = body.series.find(
      (s: { id: number }) => s.id === createdSeriesId,
    );
    expect(found).toBeDefined();
  });

  test("modifier la série avec seriesDate et startTime → 200", async ({
    request,
  }) => {
    test.skip(!createdSlug || !createdSeriesId, "Tournoi/série non créés");
    const response = await request.patch(
      `/api/admin/tournois/${createdSlug}/series/${createdSeriesId}`,
      {
        headers: authHeaders(),
        data: { seriesDate: "2025-06-15", startTime: "09:00" },
      },
    );
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.seriesDate).toBe("2025-06-15");
    expect(body.startTime).toBe("09:00");
  });

  test("supprimer la série → 200", async ({ request }) => {
    test.skip(!createdSlug || !createdSeriesId, "Tournoi/série non créés");
    const response = await request.delete(
      `/api/admin/tournois/${createdSlug}/series/${createdSeriesId}`,
      { headers: authHeaders() },
    );
    expect(response.status()).toBe(200);
  });

  test("supprimer le tournoi → 200", async ({ request }) => {
    test.skip(!createdSlug, "Tournoi non créé");
    const response = await request.delete(
      `/api/admin/tournois/${createdSlug}`,
      { headers: authHeaders() },
    );
    expect(response.status()).toBe(200);
    createdSlug = "";
  });

  test("le tournoi supprimé n'apparaît plus dans la liste", async ({
    request,
  }) => {
    const response = await request.get("/api/admin/tournois", {
      headers: authHeaders(),
    });
    const body = await response.json();
    const found = body.find(
      (t: { name: string }) => t.name === "[E2E TEST] Tournoi e2e",
    );
    expect(found).toBeUndefined();
  });
});
