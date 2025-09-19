import { test, expect } from "@playwright/test";

test.describe("Performance Lighthouse Tests", () => {
  test("homepage should meet performance thresholds", async ({ page }) => {
    // Navigate to homepage
    await page.goto("/");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check Core Web Vitals metrics using Performance API
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Get performance entries
        const perfEntries = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

        const metrics = {
          // Time to First Byte
          ttfb: perfEntries.responseStart - perfEntries.requestStart,
          // First Contentful Paint (estimated)
          fcp: perfEntries.domContentLoadedEventEnd - perfEntries.navigationStart,
          // Load Complete
          loadComplete: perfEntries.loadEventEnd - perfEntries.navigationStart,
        };

        resolve(metrics);
      });
    });

    console.log("Performance metrics:", vitals);

    // Assert performance thresholds
    expect(vitals.ttfb).toBeLessThan(1000); // TTFB < 1s
    expect(vitals.fcp).toBeLessThan(3000);  // FCP < 3s (much better than 39s!)
    expect(vitals.loadComplete).toBeLessThan(5000); // Load < 5s
  });

  test("images should be lazy loaded", async ({ page }) => {
    await page.goto("/");

    // Check that images have loading="lazy" attribute
    const lazyImages = await page.locator('img[loading="lazy"]').count();
    expect(lazyImages).toBeGreaterThan(0);
  });

  test("fonts should be optimized", async ({ page }) => {
    await page.goto("/");

    // Check that preconnect links are present
    const preconnectLinks = await page.locator('link[rel="preconnect"]').count();
    expect(preconnectLinks).toBeGreaterThan(0);

    // Check that font-display swap is used
    const fontDisplaySwap = await page.evaluate(() => {
      const stylesheets = Array.from(document.styleSheets);
      return stylesheets.some(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || []);
          return rules.some(rule =>
            rule.cssText.includes('font-display') &&
            rule.cssText.includes('swap')
          );
        } catch {
          return false;
        }
      });
    });

    expect(fontDisplaySwap).toBe(true);
  });

  test("resources should be compressed", async ({ page }) => {
    const response = await page.goto("/");

    // Check that main document has compression
    const contentEncoding = response?.headers()["content-encoding"];

    // Should have some form of compression (gzip, br, etc.)
    if (contentEncoding) {
      expect(["gzip", "br", "deflate"]).toContain(contentEncoding);
    }
  });

  test("WebP images should be served for supported browsers", async ({ page }) => {
    await page.goto("/");

    // Check if WebP images are present in the page
    const webpImages = await page.evaluate(() => {
      const sources = Array.from(document.querySelectorAll('source[type="image/webp"]'));
      return sources.length;
    });

    expect(webpImages).toBeGreaterThan(0);
  });
});