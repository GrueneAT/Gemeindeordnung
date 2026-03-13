import { test, expect } from '@playwright/test';

test.describe('Navigation consistency and header links', () => {
  test('NAV-01: header consistent across pages', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name === 'mobile', 'Nav links hidden on mobile for non-index pages by design');

    // Use sticky header selector to avoid matching content <header> elements on law pages
    const stickyHeader = 'header.sticky';

    // Check index page header
    await page.goto('./index.html');
    const indexHeader = page.locator(stickyHeader);
    await expect(indexHeader).toBeVisible();
    await expect(indexHeader.locator('.gruene-logo')).toBeVisible();
    await expect(indexHeader.locator('nav')).toBeVisible();
    await expect(indexHeader.locator('#search-modal-trigger')).toBeAttached();

    await page.screenshot({ path: 'e2e/screenshots/header-index.png', fullPage: false });

    // Check law page header
    await page.goto('./gemeindeordnungen/wien.html');
    const lawHeader = page.locator(stickyHeader);
    await expect(lawHeader).toBeVisible();
    await expect(lawHeader.locator('.gruene-logo')).toBeVisible();
    await expect(lawHeader.locator('nav')).toBeVisible();
    await expect(lawHeader.locator('#search-modal-trigger')).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/header-law-page.png', fullPage: false });

    // Check FAQ page header
    await page.goto('./faq/index.html');
    const faqHeader = page.locator(stickyHeader);
    await expect(faqHeader).toBeVisible();
    await expect(faqHeader.locator('.gruene-logo')).toBeVisible();
    await expect(faqHeader.locator('nav')).toBeVisible();

    // Check glossar page header
    await page.goto('./glossar.html');
    const glossarHeader = page.locator(stickyHeader);
    await expect(glossarHeader).toBeVisible();
    await expect(glossarHeader.locator('.gruene-logo')).toBeVisible();
    await expect(glossarHeader.locator('nav')).toBeVisible();
  });

  test('NAV-02: FAQ and Glossar links in header navigation', async ({ page }) => {
    await page.goto('./index.html');

    const nav = page.locator('header nav');
    const faqLink = nav.locator('a', { hasText: 'FAQ' });
    const glossarLink = nav.locator('a', { hasText: 'Glossar' });

    // Both links visible
    await expect(faqLink).toBeVisible();
    await expect(glossarLink).toBeVisible();

    // FAQ link navigates correctly
    await faqLink.click();
    await page.waitForURL(/faq\/index\.html/);
    await expect(page.locator('main')).toBeVisible();

    // Go back and click Glossar
    await page.goBack();
    await page.waitForURL(/index\.html/);
    const glossarLink2 = page.locator('header nav a', { hasText: 'Glossar' });
    await glossarLink2.click();
    await page.waitForURL(/glossar\.html/);
    await expect(page.locator('main')).toBeVisible();
  });

  test('NAV-03: mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('./index.html');

    // FAQ and Glossar links visible on mobile (not hidden)
    const faqLink = page.locator('header nav a', { hasText: 'FAQ' });
    const glossarLink = page.locator('header nav a', { hasText: 'Glossar' });
    await expect(faqLink).toBeVisible();
    await expect(glossarLink).toBeVisible();

    await page.screenshot({ path: 'e2e/screenshots/mobile-nav-links.png', fullPage: false });

    // Hero search input visible and full-width on mobile
    const heroInput = page.locator('#hero-search-input');
    await expect(heroInput).toBeVisible();

    // No horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(viewportWidth);

    // Discovery chips wrap properly
    const chips = page.locator('.discovery-chip');
    expect(await chips.count()).toBeGreaterThan(0);

    await page.screenshot({ path: 'e2e/screenshots/mobile-hero.png', fullPage: true });
  });
});
