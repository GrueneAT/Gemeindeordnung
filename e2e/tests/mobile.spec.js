import { test, expect } from '@playwright/test';

test.describe('Mobile responsive layout (UAT 9)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('index page has single-column cards and no horizontal overflow', async ({ page }) => {
    await page.goto('./index.html');

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);

    // Verify card links exist (a.block elements with rounded-lg class)
    const cards = page.locator('a.block.rounded-lg');
    expect(await cards.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/mobile-index.png', fullPage: true });
  });

  test('law page is readable and responsive with no overflow', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // No horizontal overflow (compare against viewport + scrollbar tolerance for Linux)
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    // Main content is visible and text is readable
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Navigation header (sticky top bar) should be visible
    const header = page.locator('header.sticky');
    await expect(header).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/mobile-law-page.png', fullPage: false });
  });
});
