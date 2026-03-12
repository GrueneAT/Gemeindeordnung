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
    // Click the Wien pill in the hero BL selector
    const wienPill = page.locator('#hero-search-chips .bl-selector-pill', { hasText: 'Wien' });
    await expect(wienPill).toBeVisible();
    await wienPill.click();

    // Verify pill is active
    await expect(wienPill).toHaveClass(/bl-pill-active/);

    await page.screenshot({ path: 'e2e/screenshots/search-filter-active.png', fullPage: false });

    // Navigate to a law page
    await page.goto('./gemeindeordnungen/wien.html');
    await page.waitForSelector('#search-input', { state: 'visible' });
    await page.waitForTimeout(500);

    // Verify Wien is still saved in LocalStorage
    const savedBL = await page.evaluate(() => localStorage.getItem('selectedBundesland'));
    expect(savedBL).toBe('Wien');

    // Verify Wien pill is rendered in header and active
    const wienPillOnLawPage = page.locator('#search-chips .bl-selector-pill', { hasText: 'Wien' });
    await expect(wienPillOnLawPage).toBeVisible();
  });

  test('SUCH-05: search defaults to BL, toggle to all', async ({ page }) => {
    // Click Wien pill to activate it
    const wienPill = page.locator('#hero-search-chips .bl-selector-pill', { hasText: 'Wien' });
    await wienPill.click();

    // Search with Wien active
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });

    const countEl = page.locator('.search-count');
    await expect(countEl).toBeVisible();
    const wienCountText = await countEl.textContent();
    expect(wienCountText).toContain('in Wien');

    // Extract Wien result count
    const wienCount = parseInt(wienCountText.match(/(\d+)/)[1], 10);

    // Click "Alle" pill
    const allPill = page.locator('#hero-search-chips .bl-selector-pill', { hasText: 'Alle' }).first();
    await allPill.click();

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
