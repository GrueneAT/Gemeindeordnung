import { test, expect } from '@playwright/test';

test.describe('Mobile responsive layout (UAT 9)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test('index page has hero search, discovery chips, and no horizontal overflow', async ({ page }) => {
    await page.goto('./index.html');

    // Verify no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(375);

    // Verify hero search input is visible
    const heroInput = page.locator('#hero-search-input');
    await expect(heroInput).toBeVisible();

    // Verify discovery chips exist
    const chips = page.locator('.discovery-chip');
    expect(await chips.count()).toBeGreaterThan(0);

    // Verify collapsible card grid summary is present
    const summary = page.locator('details summary');
    await expect(summary).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/mobile-index.png', fullPage: true });
  });

  test('law page is readable and responsive with no overflow', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // No element should extend beyond the viewport width
    const overflowingEl = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      for (const el of document.querySelectorAll('body *')) {
        const rect = el.getBoundingClientRect();
        if (rect.right > vw + 1) {
          return { tag: el.tagName, id: el.id, class: el.className, right: rect.right, vw };
        }
      }
      return null;
    });
    expect(overflowingEl, `Element overflows viewport: ${JSON.stringify(overflowingEl)}`).toBeNull();

    // Main content is visible and text is readable
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Navigation header should be visible
    const header = page.locator('header[data-pagefind-ignore]');
    await expect(header).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/mobile-law-page.png', fullPage: false });
  });

  test('header fits on one line at 375px viewport (compact)', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    const header = page.locator('header[data-pagefind-ignore]');
    const headerBox = await header.boundingBox();
    // Header should be compact -- single line should be under 60px height
    expect(headerBox.height).toBeLessThan(60);
  });

  test('inline search is hidden on mobile law page', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    // Inline search container should NOT be visible at 375px
    const inlineSearch = page.locator('.inline-search-container');
    await expect(inlineSearch).toBeHidden();
  });

  test('search modal trigger button is visible on mobile', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    const searchBtn = page.locator('#search-modal-trigger');
    await expect(searchBtn).toBeVisible();
  });

  test('BL header select is visible on mobile law page', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    const blSelect = page.locator('select.bl-header-select');
    await expect(blSelect).toBeVisible();
  });

  test('header nav links visible on mobile', async ({ page }) => {
    await page.goto('./gemeindeordnungen/wien.html');

    const faqLink = page.locator('header nav a[href*="faq"]');
    await expect(faqLink).toBeVisible();

    const glossarLink = page.locator('header nav a[href*="glossar"]');
    await expect(glossarLink).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/mobile-nav-links.png' });
  });
});
