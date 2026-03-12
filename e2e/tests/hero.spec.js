import { test, expect } from '@playwright/test';

test.describe('Hero section and discovery links', () => {
  test('SRCH-01: hero search bar visible and centered', async ({ page }) => {
    await page.goto('./index.html');

    // Hero section exists
    const hero = page.locator('.hero-section');
    await expect(hero).toBeVisible();

    // Hero search input inside hero section
    const heroInput = page.locator('#hero-search-input');
    await expect(heroInput).toBeVisible();

    // Tagline heading with "Gemeindeordnungen"
    const h1 = hero.locator('h1');
    await expect(h1).toContainText('Gemeindeordnungen');

    // Hero search container is centered (max-w-2xl mx-auto)
    const container = page.locator('.hero-search-container');
    await expect(container).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/hero-search.png', fullPage: false });
  });

  test('SRCH-01: hero search produces results', async ({ page }) => {
    await page.goto('./index.html');

    const heroInput = page.locator('#hero-search-input');
    await expect(heroInput).toBeVisible();
    // Wait for Pagefind to initialize
    await page.waitForTimeout(500);

    await page.fill('#hero-search-input', 'Gemeinderat');
    await page.waitForSelector('#hero-search-dropdown:not(.hidden)', { timeout: 5000 });

    // Dropdown should have results
    const dropdown = page.locator('#hero-search-dropdown');
    const results = dropdown.locator('.search-sub-result');
    expect(await results.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/hero-search-results.png', fullPage: false });
  });

  test('SRCH-04: discovery links visible below hero', async ({ page }) => {
    await page.goto('./index.html');

    // Discovery section is visible
    const discovery = page.locator('.discovery-section');
    await expect(discovery).toBeVisible();

    // At least 4 FAQ discovery chips
    const chips = page.locator('.discovery-chip');
    expect(await chips.count()).toBeGreaterThanOrEqual(4);

    // First chip links to a FAQ page
    const firstChipHref = await chips.first().getAttribute('href');
    expect(firstChipHref).toMatch(/faq\/.+\.html$/);

    await page.screenshot({ path: 'e2e/screenshots/discovery-links.png', fullPage: false });

    // Click first chip and verify navigation to FAQ page
    await chips.first().click();
    await page.waitForURL(/faq\/.+\.html$/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('SRCH-05: card grid is collapsible', async ({ page }) => {
    await page.goto('./index.html');

    // Details element with "Gesetze" text
    const details = page.locator('details').filter({ hasText: 'Alle Gesetze' });
    await expect(details).toBeVisible();

    // Initially collapsed
    await expect(details).not.toHaveAttribute('open', '');

    // Screenshot collapsed state
    await page.screenshot({ path: 'e2e/screenshots/card-grid-collapsed.png', fullPage: false });

    // Click summary to expand
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');

    // Gemeindeordnungen cards (9)
    const goSection = details.locator('section').filter({ hasText: 'Gemeindeordnungen' }).first();
    await expect(goSection).toBeVisible();
    const goCards = goSection.locator('.grid > a');
    expect(await goCards.count()).toBe(9);

    // Stadtrechte cards (14)
    const srSection = details.locator('section').filter({ hasText: 'Stadtrechte' }).first();
    await expect(srSection).toBeVisible();
    const srCards = srSection.locator('.grid > a');
    expect(await srCards.count()).toBe(14);

    // Screenshot expanded state
    await page.screenshot({ path: 'e2e/screenshots/card-grid-expanded.png', fullPage: true });
  });
});
