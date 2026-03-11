import { test, expect } from '@playwright/test';

test.describe('Mobile search overlay', () => {
  test('mobile overlay opens via keyboard shortcut, shows results, and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('./index.html');
    await page.waitForSelector('#search-input', { state: 'visible' });
    await page.waitForTimeout(500);

    // On mobile (< 640px), pressing / should open the overlay
    await page.keyboard.press('/');

    // Wait for mobile overlay to appear
    const overlay = page.locator('#search-overlay');
    await expect(overlay).toBeVisible({ timeout: 3000 });

    // Type in the mobile search input
    const mobileInput = page.locator('#search-input-mobile');
    await expect(mobileInput).toBeVisible();
    await mobileInput.fill('Gemeinderat');

    // Wait for results to appear in mobile dropdown
    const mobileDropdown = page.locator('#search-dropdown-mobile');
    await page.waitForTimeout(1000);
    const mobileResults = mobileDropdown.locator('.search-result-item');
    expect(await mobileResults.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/search-mobile-overlay.png', fullPage: false });

    // Close overlay via Escape
    await page.keyboard.press('Escape');
    await expect(overlay).toBeHidden({ timeout: 3000 });
  });
});
