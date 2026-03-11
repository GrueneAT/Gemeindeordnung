import { test, expect } from '@playwright/test';

test.describe('Search core functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./index.html');
    // Wait for search input to be ready
    await page.waitForSelector('#search-input', { state: 'visible' });
    // Give Pagefind WASM a moment to initialize
    await page.waitForTimeout(500);
  });

  test('SUCH-01: full-text search returns results', async ({ page }) => {
    await page.fill('#search-input', 'Gemeinderat');
    await page.waitForSelector('#search-dropdown:not(.hidden)', { timeout: 5000 });

    const results = page.locator('.search-result-item');
    expect(await results.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/search-results.png', fullPage: false });
  });

  test('SUCH-02: search terms highlighted in results', async ({ page }) => {
    await page.fill('#search-input', 'Gemeinderat');
    await page.waitForSelector('#search-dropdown:not(.hidden)', { timeout: 5000 });

    // Pagefind wraps matches in <mark> tags within result excerpts
    const marks = page.locator('.search-result-item mark');
    expect(await marks.count()).toBeGreaterThan(0);
  });

  test('SUCH-03: contextual snippets shown in results', async ({ page }) => {
    await page.fill('#search-input', 'Gemeinderat');
    await page.waitForSelector('#search-dropdown:not(.hidden)', { timeout: 5000 });

    const excerpts = page.locator('.search-result-excerpt');
    expect(await excerpts.count()).toBeGreaterThan(0);

    // Each excerpt should contain text beyond just the search term
    const firstExcerpt = await excerpts.first().textContent();
    expect(firstExcerpt.trim().length).toBeGreaterThan(15);
  });

  test('SUCH-06: result count displayed', async ({ page }) => {
    await page.fill('#search-input', 'Gemeinderat');
    await page.waitForSelector('#search-dropdown:not(.hidden)', { timeout: 5000 });

    const countEl = page.locator('.search-count');
    await expect(countEl).toBeVisible();
    const countText = await countEl.textContent();
    expect(countText).toMatch(/\d+ Treffer/);

    await page.screenshot({ path: 'e2e/screenshots/search-count.png', fullPage: false });
  });

  test('SUCH-07: empty state shown for non-matching query', async ({ page }) => {
    // Use a term that Pagefind's fuzzy matching won't find in German legal text
    await page.fill('#search-input', 'zxjkwpqy');
    await page.waitForSelector('#search-dropdown:not(.hidden)', { timeout: 5000 });
    // Wait for debounced search to complete
    await page.waitForTimeout(800);

    // Check what appeared - if results exist, empty state won't show
    const emptyState = page.locator('.search-empty-state');
    await expect(emptyState).toBeVisible({ timeout: 5000 });
    await expect(emptyState).toContainText('Keine Treffer');
    await expect(emptyState).toContainText('Versuchen Sie einen anderen Suchbegriff');

    await page.screenshot({ path: 'e2e/screenshots/search-empty.png', fullPage: false });
  });

  test('minimum 3 characters hint shown for short queries', async ({ page }) => {
    await page.fill('#search-input', 'ab');
    await page.waitForSelector('#search-dropdown:not(.hidden)', { timeout: 5000 });

    const hint = page.locator('.search-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('3 Zeichen');

    // Type one more character -- should trigger search
    await page.fill('#search-input', 'abc');
    await page.waitForTimeout(500);
    const hint2 = page.locator('.search-hint');
    // Hint should be gone (replaced by results or empty state)
    await expect(hint2).toBeHidden({ timeout: 5000 });
  });

  test('keyboard shortcut Ctrl+K focuses search and Escape closes', async ({ page, browserName }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Ctrl+K not applicable on mobile');
    // Click on a non-input element to ensure search is not focused
    await page.locator('h1').first().click();
    await page.waitForTimeout(200);

    // Press Ctrl+K to focus search
    await page.keyboard.press('Control+k');
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeFocused({ timeout: 3000 });

    // Type something to open dropdown
    await page.fill('#search-input', 'Gemeinderat');
    await page.waitForSelector('#search-dropdown:not(.hidden)', { timeout: 5000 });

    // Press Escape to close
    await page.keyboard.press('Escape');
    const dropdown = page.locator('#search-dropdown');
    await expect(dropdown).toHaveClass(/hidden/);
  });
});
