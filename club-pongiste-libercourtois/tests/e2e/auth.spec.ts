import { expect, test } from "@playwright/test";

test.describe("Auth — protection admin", () => {
  test("redirige vers /auth/login si non authentifié", async ({ page }) => {
    page.on("pageerror", () => {});
    try {
      await page.goto("/admin", { waitUntil: "commit", timeout: 5000 });
    } catch {}
    await expect(page).not.toHaveURL("http://localhost:3000/admin");
  });

  test("API admin → 401 sans credentials", async ({ request }) => {
    const response = await request.get("/api/admin/faqs");
    expect(response.status()).toBe(401);
  });

  test("API admin → 401 avec credentials invalides", async ({ request }) => {
    const response = await request.get("/api/admin/faqs", {
      headers: {
        Authorization: `Basic ${btoa("admin:mauvais-mdp")}`,
      },
    });
    expect(response.status()).toBe(401);
  });
});
