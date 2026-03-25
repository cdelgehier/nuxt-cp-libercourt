import { expect, test } from "@playwright/test";

test.describe("Admin — protection des routes", () => {
  test("redirige /admin hors de la page admin si non authentifié", async ({
    page,
  }) => {
    // Ignore les erreurs de redirect vers Authentik (non disponible en test)
    page.on("pageerror", () => {});
    try {
      await page.goto("/admin", { waitUntil: "commit", timeout: 5000 });
    } catch {}
    await expect(page).not.toHaveURL(/^http:\/\/localhost:3000\/admin$/);
  });

  test("redirige /admin/faq hors de la page admin si non authentifié", async ({
    page,
  }) => {
    page.on("pageerror", () => {});
    try {
      await page.goto("/admin/faq", { waitUntil: "commit", timeout: 5000 });
    } catch {}
    await expect(page).not.toHaveURL("http://localhost:3000/admin/faq");
  });
});

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
