import { test, expect } from '@playwright/test';

test.describe('On-page highlighting after search click-through', () => {
  test('search result click navigates with highlight param and marks text', async ({ page }) => {
    await page.goto('./index.html');
    await page.waitForSelector('#search-input', { state: 'visible' });
    await page.waitForTimeout(500);

    // Search for a term
    await page.fill('#search-input', 'Gemeinderat');
    await page.waitForSelector('#search-dropdown:not(.hidden)', { timeout: 5000 });

    // Click the first result
    const firstResult = page.locator('.search-result-item').first();
    await expect(firstResult).toBeVisible();
    const href = await firstResult.getAttribute('href');
    expect(href.toLowerCase()).toContain('highlight=gemeinderat');

    await firstResult.click();

    // Wait for navigation to complete
    await page.waitForLoadState('networkidle');

    // Verify URL contains highlight parameter
    expect(page.url().toLowerCase()).toContain('highlight=');

    // Wait for pagefind-highlight to load and apply marks
    await page.waitForFunction(() => {
      return document.querySelectorAll('.pagefind-highlight').length > 0;
    }, { timeout: 10000 });

    // Check for pagefind highlight marks on the target page
    const highlights = page.locator('.pagefind-highlight');
    expect(await highlights.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/search-highlight-target.png', fullPage: false });
  });

  test('page scrolls to first highlighted match after search click-through', async ({ page }) => {
    await page.goto('./index.html');
    await page.waitForSelector('#search-input', { state: 'visible' });
    await page.waitForTimeout(500);

    // Search for a term that appears deep in a law page (not in the header)
    await page.fill('#search-input', 'Gemeinderat');
    await page.waitForSelector('#search-dropdown:not(.hidden)', { timeout: 5000 });

    // Click the first result
    const firstResult = page.locator('.search-result-item').first();
    await expect(firstResult).toBeVisible();
    await firstResult.click();

    // Wait for navigation and highlights
    await page.waitForLoadState('networkidle');
    await page.waitForFunction(() => {
      return document.querySelectorAll('.pagefind-highlight').length > 0;
    }, { timeout: 10000 });

    // Wait for scroll to complete (smooth scrolling takes time)
    await page.waitForTimeout(1000);

    // Verify the first highlight is in the viewport
    const firstHighlight = page.locator('.pagefind-highlight').first();
    await expect(firstHighlight).toBeInViewport({ timeout: 5000 });
  });
});
