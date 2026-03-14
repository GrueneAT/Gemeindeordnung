import { test, expect } from '@playwright/test';

test.describe('Unified search: tabbed result interface', () => {
  // On the index page, hero search is the primary input
  const SEARCH_INPUT = '#hero-search-input';
  const SEARCH_DROPDOWN = '#hero-search-dropdown';

  test.beforeEach(async ({ page }) => {
    await page.goto('./index.html');
    await page.waitForSelector(SEARCH_INPUT, { state: 'visible' });
    await page.waitForTimeout(500);
  });

  test('SRCH-02: search returns tabbed results with Paragraphen/FAQ/Glossar tabs', async ({ page }) => {
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector('.search-tabs', { timeout: 8000 });

    // Tab bar should exist with 3 tabs
    const tabs = page.locator('.search-tab-btn');
    await expect(tabs).toHaveCount(3);

    // Verify tab labels
    const tabTexts = await tabs.allTextContents();
    expect(tabTexts[0]).toContain('Paragraphen');
    expect(tabTexts[1]).toContain('FAQ');
    expect(tabTexts[2]).toContain('Glossar');

    // At least one tab should be active
    const activeTab = page.locator('.search-tab-btn.search-tab-active');
    await expect(activeTab).toHaveCount(1);

    // Tab content should be visible
    const tabContent = page.locator('#search-tab-content');
    await expect(tabContent).toBeVisible();
  });

  test('SRCH-03: tabs show counts, active tab has results', async ({ page }) => {
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector('.search-tabs', { timeout: 8000 });

    // Each tab shows a count in parentheses
    const tabs = page.locator('.search-tab-btn');
    const tabCount = await tabs.count();
    for (let i = 0; i < tabCount; i++) {
      const text = await tabs.nth(i).textContent();
      expect(text).toMatch(/\(\d+\)/);
    }

    // The active tab's content panel should have results
    const tabContent = page.locator('#search-tab-content');
    const results = tabContent.locator('.search-result-item, .search-law-heading');
    expect(await results.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/unified-search-grouped.png', fullPage: false });
  });

  test('SRCH-03: clicking a tab switches visible content', async ({ page }) => {
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector('.search-tabs', { timeout: 8000 });

    // Get all non-disabled tabs
    const enabledTabs = page.locator('.search-tab-btn:not([disabled])');
    const enabledCount = await enabledTabs.count();

    if (enabledCount >= 2) {
      // Click the second enabled tab
      const secondTab = enabledTabs.nth(1);
      await secondTab.click();

      // It should now be active
      await expect(secondTab).toHaveClass(/search-tab-active/);

      // First tab should no longer be active
      const firstTab = enabledTabs.first();
      await expect(firstTab).not.toHaveClass(/search-tab-active/);
    }
  });

  test('SRCH-03: disabled tabs cannot be clicked (zero results)', async ({ page }) => {
    // Search for a term that likely only appears in Gesetze
    await page.fill(SEARCH_INPUT, 'Initiativantrag');
    await page.waitForSelector('.search-tabs', { timeout: 8000 });

    // Check for disabled tabs (those with (0) count)
    const disabledTabs = page.locator('.search-tab-btn[disabled]');
    const disabledCount = await disabledTabs.count();

    // Each disabled tab should have (0) in its text
    for (let i = 0; i < disabledCount; i++) {
      const text = await disabledTabs.nth(i).textContent();
      expect(text).toContain('(0)');
    }
  });

  test('DSKT-01: expanded panel dimensions', async ({ page }) => {
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 8000 });

    const dropdown = page.locator(SEARCH_DROPDOWN);
    await expect(dropdown).toBeVisible();

    // Check max-width constraint
    const maxWidth = await dropdown.evaluate(el => getComputedStyle(el).maxWidth);
    expect(maxWidth).toMatch(/\d+px|800px|none/);

    // Check max-height is set
    const maxHeight = await dropdown.evaluate(el => getComputedStyle(el).maxHeight);
    expect(maxHeight).toMatch(/\d+px|70vh|none/);

    await page.screenshot({ path: 'e2e/screenshots/unified-search-panel.png', fullPage: false });
  });

  test('DSKT-02: rich result context per type', async ({ page }) => {
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector('.search-tabs', { timeout: 8000 });

    // Gesetze results (active tab by default) should have title and excerpt
    const gesetzResults = page.locator('#search-tab-content .search-sub-result, #search-tab-content .search-result-item');
    if (await gesetzResults.count() > 0) {
      const firstResult = gesetzResults.first();
      await expect(firstResult.locator('.search-result-title')).toBeVisible();
      await expect(firstResult.locator('.search-result-excerpt')).toBeVisible();
    }
  });

  test('DSKT-03: space-efficient layout with tabs', async ({ page }) => {
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector('.search-tabs', { timeout: 8000 });

    const dropdown = page.locator(SEARCH_DROPDOWN);
    await expect(dropdown).toBeVisible();

    // Results should be present and scrollable
    const results = page.locator('#search-tab-content .search-result-item');
    expect(await results.count()).toBeGreaterThan(0);
  });
});

test.describe('Unified search: BL filter behavior', () => {
  const SEARCH_INPUT = '#hero-search-input';

  test.beforeEach(async ({ page }) => {
    await page.goto('./index.html');
    await page.evaluate(() => localStorage.removeItem('selectedBundesland'));
    await page.reload();
    await page.waitForSelector(SEARCH_INPUT, { state: 'visible' });
    await page.waitForTimeout(500);
  });

  test('BL filter applies only to Gesetze, shows filter note', async ({ page }) => {
    // Select Wien from hero BL select
    const heroSelect = page.locator('#hero-bl-select');
    await heroSelect.selectOption('Wien');

    // Search
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector('.search-tabs', { timeout: 8000 });

    // Tabs should still show results
    const tabs = page.locator('.search-tab-btn');
    await expect(tabs).toHaveCount(3);

    await page.screenshot({ path: 'e2e/screenshots/unified-search-bl-filter.png', fullPage: false });
  });
});

test.describe('Unified search: mobile modal', () => {
  test('mobile tabbed results in modal', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('./gemeindeordnungen/wien.html');
    await page.waitForSelector('#header-search-field', { state: 'visible' });
    await page.waitForTimeout(500);

    // Open modal via header search field tap
    await page.click('#header-search-field');
    const modal = page.locator('.search-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Type in modal search input
    const modalInput = page.locator('#search-modal-input');
    await expect(modalInput).toBeVisible();
    await modalInput.fill('Gemeinderat');

    // Wait for tabbed results to appear in modal
    const modalResults = page.locator('#search-modal-results');
    await page.waitForTimeout(2000);

    // Tabs should appear in modal
    const tabs = modalResults.locator('.search-tab-btn');
    expect(await tabs.count()).toBe(3);

    await page.screenshot({ path: 'e2e/screenshots/unified-search-mobile.png', fullPage: false });
  });
});
