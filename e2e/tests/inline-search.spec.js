import { test, expect } from '@playwright/test';

test.describe('Inline scoped search on law pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');
    await page.waitForSelector('.inline-search-input', { state: 'visible' });
    await page.waitForTimeout(500);
  });

  test('inline search on law page shows scoped results', async ({ page }) => {
    const input = page.locator('.inline-search-input');
    await input.fill('Gemeinderat');

    // Wait for dropdown to appear
    const dropdown = page.locator('.inline-search-dropdown:not(.hidden)');
    await expect(dropdown).toBeVisible({ timeout: 8000 });

    // Should have result items
    const results = dropdown.locator('.search-result-item, .search-sub-result, .search-law-heading');
    expect(await results.count()).toBeGreaterThan(0);

    // Verify dropdown is full-width (not constrained to 24rem/384px)
    const dropdownBox = await dropdown.boundingBox();
    expect(dropdownBox.width).toBeGreaterThan(500);

    await page.screenshot({ path: 'e2e/screenshots/inline-search-law.png' });
  });

  test('inline search input spans full container width on desktop', async ({ page }) => {
    const container = page.locator('.inline-search-container');
    const containerBox = await container.boundingBox();

    // The container's parent is max-w-5xl (~1024px) with px-4 padding
    // Container should use at least 80% of parent width
    const parent = page.locator('.inline-search-container').locator('..');
    const parentBox = await parent.boundingBox();
    expect(containerBox.width).toBeGreaterThan(parentBox.width * 0.8);
  });

  test('inline search dropdown closes on click outside', async ({ page }) => {
    const input = page.locator('.inline-search-input');
    await input.fill('Gemeinderat');

    const dropdown = page.locator('.inline-search-dropdown:not(.hidden)');
    await expect(dropdown).toBeVisible({ timeout: 8000 });

    // Click outside the container
    await page.click('h1');
    await page.waitForTimeout(300);

    // Dropdown should be hidden
    await expect(page.locator('.inline-search-dropdown')).toHaveClass(/hidden/);
  });
});

test.describe('Inline scoped search on FAQ pages', () => {
  test('inline search on FAQ page shows FAQ results', async ({ page }) => {
    await page.goto('./faq/index.html');
    await page.waitForSelector('.inline-search-input', { state: 'visible' });
    await page.waitForTimeout(500);

    const input = page.locator('.inline-search-input');
    await input.fill('Gemeinderat');

    const dropdown = page.locator('.inline-search-dropdown:not(.hidden)');
    await expect(dropdown).toBeVisible({ timeout: 8000 });

    // Should have result items
    const results = dropdown.locator('.search-result-item');
    expect(await results.count()).toBeGreaterThan(0);

    // Verify dropdown is full-width (not constrained to 24rem/384px)
    const dropdownBox = await dropdown.boundingBox();
    expect(dropdownBox.width).toBeGreaterThan(500);

    await page.screenshot({ path: 'e2e/screenshots/inline-search-faq.png' });
  });
});
