import { test, expect } from '@playwright/test';

test.describe('Homepage hero section and discovery links', () => {
  test('hero section has search input, tagline, and discovery chips', async ({ page }) => {
    await page.goto('./index.html');

    // Hero section is visible
    const hero = page.locator('.hero-section');
    await expect(hero).toBeVisible();

    // Tagline heading
    const h1 = hero.locator('h1');
    await expect(h1).toContainText('Gemeindeordnungen');

    // Hero search input
    const heroInput = page.locator('#hero-search-input');
    await expect(heroInput).toBeVisible();
    await expect(heroInput).toHaveAttribute('placeholder', /suchen/i);

    // Discovery section with FAQ chips
    const discovery = page.locator('.discovery-section');
    await expect(discovery).toBeVisible();

    const faqChips = discovery.locator('.discovery-chip');
    expect(await faqChips.count()).toBeGreaterThanOrEqual(6);

    // Chips link to FAQ pages
    const firstChipHref = await faqChips.first().getAttribute('href');
    expect(firstChipHref).toMatch(/faq\/.+\.html$/);

    // Screenshot
    await page.screenshot({ path: 'e2e/screenshots/hero-section-index.png', fullPage: false });
  });

  test('collapsible card grid expands on click', async ({ page }) => {
    await page.goto('./index.html');

    const details = page.locator('details').filter({ hasText: 'Alle Gesetze' });
    await expect(details).toBeVisible();

    // Details should be collapsed initially (no open attribute)
    await expect(details).not.toHaveAttribute('open', '');

    // Click to expand
    await details.locator('summary').click();

    // Details should now be open
    await expect(details).toHaveAttribute('open', '');

    // Cards should be visible
    const goCards = details.locator('section').filter({ hasText: 'Gemeindeordnungen' }).locator('.grid > a');
    expect(await goCards.count()).toBe(9);

    await page.screenshot({ path: 'e2e/screenshots/card-grid-expanded.png', fullPage: false });
  });

  test('header shows FAQ and Glossar links on desktop', async ({ page }) => {
    await page.goto('./index.html');

    const header = page.locator('header');
    const faqLink = header.locator('a', { hasText: 'FAQ' });
    const glossarLink = header.locator('a', { hasText: 'Glossar' });

    await expect(faqLink).toBeVisible();
    await expect(glossarLink).toBeVisible();
  });

  test('header shows FAQ and Glossar links on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('./index.html');

    const header = page.locator('header');
    const faqLink = header.locator('a', { hasText: 'FAQ' });
    const glossarLink = header.locator('a', { hasText: 'Glossar' });

    await expect(faqLink).toBeVisible();
    await expect(glossarLink).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/hero-section-mobile.png', fullPage: false });
  });

  test('BL select dropdown is visible with Bundeslaender options', async ({ page }) => {
    await page.goto('./index.html');

    const heroSelect = page.locator('#hero-bl-select');
    await expect(heroSelect).toBeVisible();

    // Default value should be "Alle Bundeslaender" (empty value)
    await expect(heroSelect).toHaveValue('');

    // Verify it has optgroups with BL names
    const options = heroSelect.locator('option');
    const optionTexts = await options.allTextContents();
    expect(optionTexts).toContain('Wien');
    expect(optionTexts).toContain('Burgenland');
    expect(optionTexts).toContain('Tirol');

    await page.screenshot({ path: 'e2e/screenshots/hero-bl-select.png', fullPage: false });
  });

  test('selecting a BL in dropdown changes filter value', async ({ page }) => {
    await page.goto('./index.html');

    const heroSelect = page.locator('#hero-bl-select');

    // Select Wien
    await heroSelect.selectOption('Wien');
    await expect(heroSelect).toHaveValue('Wien');

    // Reset to Alle
    await heroSelect.selectOption('');
    await expect(heroSelect).toHaveValue('');
  });

  test('discovery section uses compact inline flow layout', async ({ page }) => {
    await page.goto('./index.html');

    const discovery = page.locator('.discovery-section');
    await expect(discovery).toBeVisible();

    // Should have discovery-label elements
    const labels = discovery.locator('.discovery-label');
    expect(await labels.count()).toBeGreaterThanOrEqual(1);

    // Should use flex wrap container, not grid
    const compactContainer = discovery.locator('.discovery-section-compact');
    await expect(compactContainer).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/discovery-links.png', fullPage: false });
  });
});
