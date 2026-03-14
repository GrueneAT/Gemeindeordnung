import { test, expect } from '@playwright/test';

test.describe('Mobile search modal', () => {
  test('mobile modal opens via header search field, shows results, and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('./gemeindeordnungen/wien.html');
    await page.waitForSelector('#header-search-field', { state: 'visible' });
    await page.waitForTimeout(500);

    // On mobile, tapping the header search field should open the search modal
    await page.click('#header-search-field');

    // Wait for modal to appear
    const modal = page.locator('.search-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Type in the modal search input
    const modalInput = page.locator('#search-modal-input');
    await expect(modalInput).toBeVisible();
    await modalInput.fill('Gemeinderat');

    // Wait for results to appear in modal results
    const modalResults = page.locator('#search-modal-results');
    await page.waitForTimeout(2000);
    const results = modalResults.locator('.search-result-item');
    expect(await results.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/search-mobile-overlay.png', fullPage: false });

    // Close modal via Escape
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden({ timeout: 3000 });
  });
});
