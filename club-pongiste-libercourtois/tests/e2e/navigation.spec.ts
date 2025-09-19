import { test, expect } from "@playwright/test";

test.describe("Site Navigation", () => {
  test("should navigate through all main pages", async ({ page }) => {
    // Start at homepage
    await page.goto("/");
    await expect(page).toHaveTitle(/Club Pongiste Libercourtois/);

    // Navigate to club page
    await page.getByRole("link", { name: /club|découvrir/i }).first().click();
    await expect(page).toHaveURL(/.*\/club/);
    await expect(page.locator("h1")).toBeVisible();

    // Navigate to contact page
    await page.getByRole("link", { name: /contact/i }).first().click();
    await expect(page).toHaveURL(/.*\/contact/);
    await expect(page.locator("h1")).toBeVisible();

    // Navigate to schedules/pricing
    await page.getByRole("link", { name: /horaires|tarifs/i }).first().click();
    await expect(page).toHaveURL(/.*\/horaires-tarifs/);
    await expect(page.locator("h1")).toBeVisible();

    // Navigate to calendar
    await page.getByRole("link", { name: /calendrier/i }).first().click();
    await expect(page).toHaveURL(/.*\/calendrier/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("should have working header navigation", async ({ page }) => {
    await page.goto("/");

    // Check that main navigation links are present and clickable
    const navLinks = [
      { text: /accueil/i, url: "/" },
      { text: /club/i, url: "/club" },
      { text: /horaires/i, url: "/horaires-tarifs" },
      { text: /contact/i, url: "/contact" },
    ];

    for (const link of navLinks) {
      const linkElement = page.getByRole("link", { name: link.text }).first();
      await expect(linkElement).toBeVisible();

      await linkElement.click();
      await expect(page).toHaveURL(new RegExp(`.*${link.url.replace("/", "\\/")}$`));

      // Go back to test next link
      if (link.url !== "/") {
        await page.goto("/");
      }
    }
  });

  test("should have accessible footer links", async ({ page }) => {
    await page.goto("/");

    // Scroll to footer
    await page.locator("footer").scrollIntoViewIfNeeded();

    // Check footer links
    const footerLinks = [
      /mentions légales/i,
      /politique de confidentialité/i,
    ];

    for (const linkText of footerLinks) {
      const link = page.getByRole("link", { name: linkText });
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href");
    }
  });

  test("should handle 404 pages gracefully", async ({ page }) => {
    await page.goto("/non-existent-page");

    // Should show 404 page or redirect to home
    const currentUrl = page.url();
    const isNotFound = currentUrl.includes("404") || currentUrl.endsWith("/");

    expect(isNotFound).toBe(true);
  });

  test("mobile navigation should work", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");

    // Look for mobile menu button (hamburger)
    const mobileMenuButton = page.locator('[aria-label*="menu"], [data-testid="mobile-menu"], button:has-text("☰")').first();

    if (await mobileMenuButton.isVisible()) {
      await mobileMenuButton.click();

      // Check that mobile menu opens
      const mobileMenu = page.locator('[role="dialog"], .mobile-menu, [data-testid="mobile-navigation"]').first();
      await expect(mobileMenu).toBeVisible();
    }
  });
});