import { test, expect } from '@playwright/test';

test.describe('Search Bundesland filter (SUCH-04, SUCH-05)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any saved Bundesland from previous tests
    await page.goto('./index.html');
    await page.evaluate(() => localStorage.removeItem('selectedBundesland'));
    await page.reload();
    await page.waitForSelector('#search-input', { state: 'visible' });
    await page.waitForTimeout(500);
  });

  test('SUCH-04: Bundesland selection persists across pages', async ({ page }) => {
    // Search to populate results, then we need a BL chip to click
    // First, set a Bundesland in localStorage to make a chip appear
    await page.evaluate(() => localStorage.setItem('selectedBundesland', 'Wien'));
    await page.reload();
    await page.waitForSelector('#search-input', { state: 'visible' });
    await page.waitForTimeout(500);

    // Click the Wien chip to make it active
    const wienChip = page.locator('.search-chip', { hasText: 'Wien' });
    await expect(wienChip).toBeVisible();
    await wienChip.click();

    // Verify chip is active
    await expect(wienChip).toHaveClass(/search-chip-active/);

    await page.screenshot({ path: 'e2e/screenshots/search-filter-active.png', fullPage: false });

    // Navigate to a law page
    await page.goto('./gemeindeordnungen/wien.html');
    await page.waitForSelector('#search-input', { state: 'visible' });
    await page.waitForTimeout(500);

    // Verify Wien is still saved in LocalStorage
    const savedBL = await page.evaluate(() => localStorage.getItem('selectedBundesland'));
    expect(savedBL).toBe('Wien');

    // Verify Wien chip is rendered
    const wienChipOnLawPage = page.locator('.search-chip', { hasText: 'Wien' });
    await expect(wienChipOnLawPage).toBeVisible();
  });

  test('SUCH-05: search defaults to BL, toggle to all', async ({ page }) => {
    // Set Wien as saved Bundesland
    await page.evaluate(() => localStorage.setItem('selectedBundesland', 'Wien'));
    await page.reload();
    await page.waitForSelector('#search-input', { state: 'visible' });
    await page.waitForTimeout(500);

    // Click Wien chip to activate it
    const wienChip = page.locator('.search-chip', { hasText: 'Wien' });
    await wienChip.click();

    // Search with Wien active
    await page.fill('#search-input', 'Gemeinderat');
    await page.waitForSelector('#search-dropdown:not(.hidden)', { timeout: 5000 });

    const countEl = page.locator('.search-count');
    await expect(countEl).toBeVisible();
    const wienCountText = await countEl.textContent();
    expect(wienCountText).toContain('in Wien');

    // Extract Wien result count
    const wienCount = parseInt(wienCountText.match(/(\d+)/)[1], 10);

    // Click "Alle Bundesländer" chip
    const allChip = page.locator('.search-chip', { hasText: 'Alle Bundesländer' });
    await allChip.click();

    // Wait for results to update (count text should no longer say "in Wien")
    await expect(countEl).not.toContainText('in Wien', { timeout: 5000 });
    const allCountText = await countEl.textContent();
    expect(allCountText).toMatch(/\d+ Treffer/);

    // All results should be >= Wien results
    const allCount = parseInt(allCountText.match(/(\d+)/)[1], 10);
    expect(allCount).toBeGreaterThanOrEqual(wienCount);

    await page.screenshot({ path: 'e2e/screenshots/search-filter-all.png', fullPage: false });
  });
});
