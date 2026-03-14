import { test, expect } from '@playwright/test';

test.describe('Search Bundesland filter (SUCH-04, SUCH-05)', () => {
  // On the index page, hero search is the primary input
  const SEARCH_INPUT = '#hero-search-input';
  const SEARCH_DROPDOWN = '#hero-search-dropdown';

  test.beforeEach(async ({ page }) => {
    // Clear any saved Bundesland from previous tests
    await page.goto('./index.html');
    await page.evaluate(() => localStorage.removeItem('selectedBundesland'));
    await page.reload();
    await page.waitForSelector(SEARCH_INPUT, { state: 'visible' });
    await page.waitForTimeout(500);
  });

  test('SUCH-04: Bundesland selection persists across pages', async ({ page }) => {
    // Select Wien from the hero BL select dropdown
    const heroSelect = page.locator('#hero-bl-select');
    await heroSelect.selectOption('Wien');
    await expect(heroSelect).toHaveValue('Wien');

    await page.screenshot({ path: 'e2e/screenshots/search-filter-active.png', fullPage: false });

    // Navigate to a law page
    await page.goto('./gemeindeordnungen/wien.html');
    await page.waitForSelector('#search-modal-trigger', { state: 'visible' });
    await page.waitForTimeout(500);

    // Verify Wien is still saved in LocalStorage
    const savedBL = await page.evaluate(() => localStorage.getItem('selectedBundesland'));
    expect(savedBL).toBe('Wien');
  });

  test('SUCH-05: search defaults to BL, toggle to all', async ({ page }) => {
    // Select Wien from hero BL select
    const heroSelect = page.locator('#hero-bl-select');
    await heroSelect.selectOption('Wien');

    // Search with Wien active
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });

    const countEl = page.locator('.search-count');
    await expect(countEl).toBeVisible();
    const wienCountText = await countEl.textContent();
    expect(wienCountText).toContain('in Wien');

    // Extract Wien result count
    const wienCount = parseInt(wienCountText.match(/(\d+)/)[1], 10);

    // Reset to "Alle Bundeslaender"
    await heroSelect.selectOption('');

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
