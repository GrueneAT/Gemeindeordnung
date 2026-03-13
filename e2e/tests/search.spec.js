import { test, expect } from '@playwright/test';

test.describe('Search core functionality', () => {
  // On the index page, hero search is the primary input
  const SEARCH_INPUT = '#hero-search-input';
  const SEARCH_DROPDOWN = '#hero-search-dropdown';

  test.beforeEach(async ({ page }) => {
    await page.goto('./index.html');
    // Wait for hero search input to be ready (primary on index page)
    await page.waitForSelector(SEARCH_INPUT, { state: 'visible' });
    // Give Pagefind WASM a moment to initialize
    await page.waitForTimeout(500);
  });

  test('SUCH-01: full-text search returns results', async ({ page }) => {
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });

    // Sub-results should appear (paragraph-level matches)
    const subResults = page.locator('.search-sub-result');
    expect(await subResults.count()).toBeGreaterThan(0);

    // Law headings should be visible (results grouped by law)
    const lawHeadings = page.locator('.search-law-heading');
    expect(await lawHeadings.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/search-results.png', fullPage: false });
  });

  test('SUCH-02: search terms highlighted in results', async ({ page }) => {
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });

    // Pagefind wraps matches in <mark> tags within sub-result excerpts
    const marks = page.locator('.search-sub-result mark');
    expect(await marks.count()).toBeGreaterThan(0);
  });

  test('SUCH-03: contextual snippets shown in results', async ({ page }) => {
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });

    const excerpts = page.locator('.search-sub-result .search-result-excerpt');
    expect(await excerpts.count()).toBeGreaterThan(0);

    // Each excerpt should contain text beyond just the search term
    const firstExcerpt = await excerpts.first().textContent();
    expect(firstExcerpt.trim().length).toBeGreaterThan(15);
  });

  test('SUCH-06: result count displayed', async ({ page }) => {
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });

    const countEl = page.locator('.search-count');
    await expect(countEl).toBeVisible();
    const countText = await countEl.textContent();
    expect(countText).toMatch(/\d+ Treffer/);

    await page.screenshot({ path: 'e2e/screenshots/search-count.png', fullPage: false });
  });

  test('SUCH-07: empty state shown for non-matching query', async ({ page }) => {
    // Use a term that Pagefind's fuzzy matching won't find in German legal text
    await page.fill(SEARCH_INPUT, 'zxjkwpqy');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });
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
    await page.fill(SEARCH_INPUT, 'ab');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });

    const hint = page.locator('.search-hint');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText('3 Zeichen');

    // Type one more character -- should trigger search
    await page.fill(SEARCH_INPUT, 'abc');
    await page.waitForTimeout(500);
    const hint2 = page.locator('.search-hint');
    // Hint should be gone (replaced by results or empty state)
    await expect(hint2).toBeHidden({ timeout: 5000 });
  });

  test('SUCH-10: results grouped by law with paragraph sub-results', async ({ page }) => {
    await page.fill(SEARCH_INPUT, 'Initiativantrag');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });

    // Law headings should be visible
    const lawHeadings = page.locator('.search-law-heading');
    expect(await lawHeadings.count()).toBeGreaterThan(0);

    // Law headings should contain Treffer count
    const firstHeading = await lawHeadings.first().textContent();
    expect(firstHeading).toMatch(/\(\d+ Treffer\)/);

    // Sub-result items should exist with paragraph titles containing section symbol
    const subResults = page.locator('.search-sub-result');
    expect(await subResults.count()).toBeGreaterThan(0);

    const firstSubTitle = await subResults.first().locator('.search-result-title').textContent();
    expect(firstSubTitle).toContain('\u00A7');

    await page.screenshot({ path: 'e2e/screenshots/search-results.png', fullPage: false });
  });

  test('search results update when typing beyond initial 3-char trigger', async ({ page }) => {
    // Type "wer" to trigger initial search
    await page.fill(SEARCH_INPUT, 'wer');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });
    await page.waitForSelector('.search-sub-result', { timeout: 5000 });

    // Record the result count text for "wer"
    const oldCount = await page.locator('.search-count').textContent();

    // Now type "Sitzung" -- a real term that returns different results
    await page.fill(SEARCH_INPUT, 'Sitzung');
    // Wait for debounce + search
    await page.waitForTimeout(600);

    // Results should have changed (different query = different results)
    const countLocator = page.locator('.search-count');
    const hasCount = await countLocator.count() > 0;
    const hasEmptyState = await page.locator('.search-empty-state').count() > 0;

    // Must have either new results or empty state
    expect(hasCount || hasEmptyState).toBeTruthy();
    if (hasCount) {
      const newCount = await countLocator.textContent();
      expect(newCount).not.toBe(oldCount);
    }
  });

  test('search results reflect final query, not intermediate', async ({ page }) => {
    // Type "Gemeinderat" character by character with realistic typing speed
    await page.locator(SEARCH_INPUT).pressSequentially('Gemeinderat', { delay: 50 });

    // Wait for final debounce to settle
    await page.waitForTimeout(1000);
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });

    // Results should contain the full word "Gemeinderat" in mark tags
    const marks = page.locator('.search-sub-result mark');
    const markCount = await marks.count();
    expect(markCount).toBeGreaterThan(0);

    // At least one mark should contain "Gemeinderat" (not just "Gem" or "Gemei")
    let foundFullWord = false;
    for (let i = 0; i < Math.min(markCount, 10); i++) {
      const text = await marks.nth(i).textContent();
      if (text.toLowerCase().includes('gemeinderat')) {
        foundFullWord = true;
        break;
      }
    }
    // Pagefind may stem or split marks, so also check excerpt text
    if (!foundFullWord) {
      const excerpts = page.locator('.search-sub-result .search-result-excerpt');
      const excerptCount = await excerpts.count();
      for (let i = 0; i < Math.min(excerptCount, 5); i++) {
        const text = await excerpts.nth(i).textContent();
        if (text.toLowerCase().includes('gemeinderat')) {
          foundFullWord = true;
          break;
        }
      }
    }
    expect(foundFullWord).toBeTruthy();
  });

  test('clearing and retyping produces fresh results', async ({ page }) => {
    // Type "Gemeinderat", wait for results
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });
    await page.waitForSelector('.search-sub-result', { timeout: 5000 });

    // Clear input
    await page.fill(SEARCH_INPUT, '');
    const dropdown = page.locator(SEARCH_DROPDOWN);
    await expect(dropdown).toHaveClass(/hidden/, { timeout: 3000 });

    // Type "Initiativantrag", wait for results
    await page.fill(SEARCH_INPUT, 'Initiativantrag');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });
    await page.waitForSelector('.search-sub-result', { timeout: 5000 });

    // Results should contain "Initiativantrag", not leftover "Gemeinderat"
    const excerpts = page.locator('.search-sub-result .search-result-excerpt');
    const excerptCount = await excerpts.count();
    expect(excerptCount).toBeGreaterThan(0);

    // Check that at least one excerpt or mark contains the new query term
    let foundNewTerm = false;
    const marks = page.locator('.search-sub-result mark');
    const markCount = await marks.count();
    for (let i = 0; i < Math.min(markCount, 10); i++) {
      const text = await marks.nth(i).textContent();
      if (text.toLowerCase().includes('initiativantrag')) {
        foundNewTerm = true;
        break;
      }
    }
    if (!foundNewTerm) {
      for (let i = 0; i < Math.min(excerptCount, 5); i++) {
        const text = await excerpts.nth(i).textContent();
        if (text.toLowerCase().includes('initiativantrag')) {
          foundNewTerm = true;
          break;
        }
      }
    }
    expect(foundNewTerm).toBeTruthy();
  });

  test('stemming filter removes false positives for non-corpus terms', async ({ page }) => {
    // "werbung" is not in the corpus -- stemmer would match "wer" without the filter
    await page.fill(SEARCH_INPUT, 'werbung');
    await page.waitForTimeout(600);

    const dropdown = page.locator(SEARCH_DROPDOWN);
    await expect(dropdown).not.toHaveClass(/hidden/);

    // Should show empty state, not false "wer" matches
    const hasEmptyState = await dropdown.locator('.search-empty-state').count() > 0;
    const hasResults = await dropdown.locator('.search-result-item, .search-sub-result').count();
    expect(hasEmptyState).toBeTruthy();
    expect(hasResults).toBe(0);
  });

  test('stemming filter preserves valid morphological matches', async ({ page }) => {
    // "Ausschuss" should still match "Ausschüsse" (valid German morphology)
    await page.fill(SEARCH_INPUT, 'Ausschuss');
    await page.waitForSelector('.search-sub-result, .search-result-item', { timeout: 5000 });

    const count = await page.locator('.search-count').textContent();
    expect(count).toContain('Treffer');
  });

  test('keyboard shortcut Ctrl+K focuses search and Escape closes', async ({ page, browserName }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Ctrl+K not applicable on mobile');
    // Click on a non-input element to ensure search is not focused
    await page.locator('h1').first().click();
    await page.waitForTimeout(200);

    // Press Ctrl+K to focus hero search on index page
    await page.keyboard.press('Control+k');
    const heroSearchInput = page.locator(SEARCH_INPUT);
    await expect(heroSearchInput).toBeFocused({ timeout: 3000 });

    // Type something to open dropdown
    await page.fill(SEARCH_INPUT, 'Gemeinderat');
    await page.waitForSelector(`${SEARCH_DROPDOWN}:not(.hidden)`, { timeout: 5000 });

    // Press Escape to close
    await page.keyboard.press('Escape');
    const dropdown = page.locator(SEARCH_DROPDOWN);
    await expect(dropdown).toHaveClass(/hidden/);
  });
});
